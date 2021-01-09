"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoginService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
require("dotenv/config");
const ua_1 = require("./ua");
const fs = require("fs");
const utils_1 = require("./utils");
const shell = require("shelljs");
const path = require("path");
const cookiePath = path.resolve(__dirname, '../', 'maotai.cookie');
const qrcodePath = path.resolve(__dirname, '../', 'qrcode.png');
console.log(__dirname);
console.log(qrcodePath);
let LoginService = LoginService_1 = class LoginService {
    constructor() {
        this.logger = new common_1.Logger(LoginService_1.name);
        this.ua = ua_1.defaultUa;
    }
    async init() {
        const isExist = fs.existsSync(cookiePath);
        if (isExist) {
            const data = this.getCookieFromLocal();
            this.cookies = data.cookie;
        }
        else {
            this.logger.log('未找到cookie文件');
        }
        const sign = await this.validate();
        if (!sign) {
            this.cookies = [];
            const fn = async () => {
                return new Promise(async (resolve) => {
                    const s = await this.main();
                    if (!s) {
                        setTimeout(() => {
                            fn();
                        }, 2000);
                    }
                    else {
                        resolve('');
                    }
                });
            };
            await fn();
        }
        this.logger.log('已在登录状态');
        return;
    }
    storeCookieTolocal() {
        const writeData = {
            cookie: this.cookies,
            ua: this.ua,
        };
        fs.writeFileSync(cookiePath, JSON.stringify(writeData));
        return;
    }
    getCookieFromLocal() {
        const cookie = fs.readFileSync(cookiePath).toString();
        const data = JSON.parse(cookie);
        return data;
    }
    cookieResolve(cookie) {
        if (Array.isArray(cookie)) {
            return cookie.reduce((prev, next) => {
                const ls = next.split(';');
                prev.push(ls[0]);
                return prev;
            }, []);
        }
        else {
            return [];
        }
    }
    cookieStore(headers) {
        const cookie = headers['set-cookie'];
        const rescookie = this.cookieResolve(cookie);
        Array.isArray(this.cookies)
            ? (this.cookies = this.cookies.concat(rescookie))
            : (this.cookies = rescookie);
    }
    cookieToHeader() {
        if (this.cookies && this.cookies.length > 0) {
            return this.cookies.join('; ');
        }
        return '';
    }
    getHeaders() {
        return {
            'User-Agent': this.ua,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            Connection: 'keep-alive',
        };
    }
    async main() {
        this.logger.log('进行登录流程');
        const res = await axios_1.default.get('https://passport.jd.com/new/login.aspx', {
            headers: this.getHeaders(),
        });
        this.cookieStore(res.headers);
        const sign = await this.getQrcode();
        if (!sign) {
            this.logger.log('未获取到登录二维码');
            return false;
        }
        this.logger.log(`二维码文件位于${qrcodePath}`);
        this.openQrcode();
        const ticket = await this.qrcodeScan();
        const result = await this.validateTicket(ticket);
        if (!result) {
            this.logger.log('登录票据有误');
            return false;
        }
        return await this.validate();
    }
    async openQrcode() {
        shell.exec(`open ${qrcodePath}`);
        return;
    }
    async getQrcode() {
        const url = 'https://qr.m.jd.com/show';
        const cookie = this.cookieToHeader();
        return new Promise(resolve => {
            axios_1.default
                .get(url, {
                headers: {
                    'User-Agent': this.ua,
                    Referer: 'https://passport.jd.com/new/login.aspx',
                    cookie,
                },
                responseType: 'arraybuffer',
                params: {
                    appid: 133,
                    size: 147,
                    t: Date.now(),
                },
            })
                .then(res => {
                if (res.status === 200) {
                    this.cookieStore(res.headers);
                    fs.writeFile(qrcodePath, res.data, err => {
                        if (err)
                            throw err;
                        resolve(true);
                    });
                }
            })
                .catch(e => {
                this.logger.log(e);
                resolve(false);
            });
        });
    }
    async qrcodeScan() {
        const reg = /(?<=wlfstk_smdl=)(.*)/;
        let stk;
        this.cookies.some(v => {
            const res = reg.exec(v);
            if (res) {
                stk = res[0];
                return true;
            }
            return false;
        });
        const randomInt = utils_1.randomRange(1000000, 9999999);
        const params = {
            callback: `jQuery${randomInt}`,
            appid: '133',
            token: stk,
            _: Date.now(),
        };
        const headers = {
            'User-Agent': this.ua,
            Referer: 'https://passport.jd.com/new/login.aspx',
            cookie: this.cookieToHeader(),
        };
        const msgReg = /(?<="msg" : ")(.+)(?=")/;
        const codeReg = /(?<="code" : )(.+)(?=,)/;
        const ticketReg = /(?<="ticket" : ")(.+)(?=")/;
        return new Promise(resolve => {
            const fn = () => {
                axios_1.default
                    .get('https://qr.m.jd.com/check', {
                    headers,
                    params,
                })
                    .then(res => {
                    const code = codeReg.exec(res.data)[0];
                    if (code !== '200') {
                        const msg = msgReg.exec(res.data)[0];
                        this.logger.log(msg);
                        if (code !== '203') {
                            setTimeout(() => {
                                fn();
                            }, 2000);
                        }
                        else {
                            resolve('');
                        }
                    }
                    else {
                        const ticket = ticketReg.exec(res.data)[0];
                        resolve(ticket);
                    }
                })
                    .catch(e => {
                    console.log(e);
                    this.logger.log('京东更新了登录逻辑，请联系作者yehuozhili');
                });
            };
            fn();
        });
    }
    async validateTicket(ticket) {
        const url = 'https://passport.jd.com/uc/qrCodeTicketValidation';
        const headers = {
            'User-Agent': this.ua,
            Referer: 'https://passport.jd.com/uc/login?ltype=logout',
            cookie: this.cookieToHeader(),
        };
        const res = await axios_1.default.get(url, {
            headers,
            params: {
                t: ticket,
            },
        });
        if (res.data.returnCode === 0) {
            this.cookieStore(res.headers);
            return true;
        }
        return false;
    }
    async validate() {
        const url = 'https://order.jd.com/center/list.action';
        try {
            await axios_1.default.get(url, {
                headers: {
                    'User-Agent': this.ua,
                    cookie: this.cookieToHeader(),
                },
                params: {
                    rid: Date.now(),
                },
                maxRedirects: 0,
            });
            this.storeCookieTolocal();
            this.logger.log('验证成功');
            this.islogin = true;
            return true;
        }
        catch (_a) {
            this.logger.log('验证失败');
            this.islogin = false;
            return false;
        }
    }
};
LoginService = LoginService_1 = __decorate([
    common_1.Injectable()
], LoginService);
exports.LoginService = LoginService;
//# sourceMappingURL=login.service.js.map
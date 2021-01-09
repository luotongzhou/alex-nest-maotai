"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProductService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
require("dotenv/config");
const login_service_1 = require("./login.service");
const axios_1 = require("axios");
const cheerio = require("cheerio");
const utils_1 = require("./utils");
const productId = process.env.PRODUCTID;
const byNum = process.env.BYNUM;
const password = process.env.PAYPASSWORD;
const eid = process.env.EID;
const fp = process.env.FP;
let ProductService = ProductService_1 = class ProductService {
    constructor(loginService) {
        this.loginService = loginService;
        this.logger = new common_1.Logger(ProductService_1.name);
    }
    async getProduct() {
        const url = `https://item.jd.com/${productId}.html`;
        const res = await axios_1.default.get(url, {
            headers: {
                'User-Agent': this.loginService.ua,
                cookie: this.loginService.cookieToHeader(),
            },
        });
        this.loginService.cookieStore(res.headers);
        const $ = cheerio.load(res.data);
        const title = $('title').text();
        this.logger.log(`您设定的抢购商品为：${title}`);
        return;
    }
    async getSeckillUrl() {
        const url = 'https://itemko.jd.com/itemShowBtn';
        const params = {
            callback: `jQuery${utils_1.randomRange(1000000, 9999999)}`,
            skuId: productId,
            from: 'pc',
            _: Date.now(),
        };
        const headers = {
            'User-Agent': this.loginService.ua,
            Host: 'itemko.jd.com',
            Referer: `https://item.jd.com/${productId}.html`,
            cookie: this.loginService.cookieToHeader(),
        };
        const reg = /(?<="url":")(.*)(?=")/;
        return new Promise(resolve => {
            const fn = () => {
                axios_1.default
                    .get(url, {
                    params,
                    headers,
                })
                    .then(res => {
                    const path = reg.exec(res.data)[0];
                    console.log(res.data);
                    if (path === '') {
                        this.logger.error('获取抢购地址失败，请检查是否有权限或者是否处于时间内，2秒后重试');
                        setTimeout(() => {
                            fn();
                        }, 2000);
                    }
                    else {
                        this.loginService.cookieStore(res.headers);
                        this.logger.log(`获取抢购原始地址${path}`);
                        resolve(path);
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
    resolvePath(path) {
        const full = 'https:' + path;
        return full
            .replace('divide', 'marathon')
            .replace('user_routing', 'captcha.html');
    }
    async goToKillUrl(path) {
        this.logger.log('正在访问生成的链接');
        const headers = {
            'User-Agent': this.loginService.ua,
            Host: 'marathon.jd.com',
            Referer: `https://item.jd.com/${productId}.html`,
            cookie: this.loginService.cookieToHeader(),
        };
        return await axios_1.default.get(path, {
            headers,
            maxRedirects: 0,
        });
    }
    async toCheckOut() {
        this.logger.log('正在访问订单结算页面');
        const url = 'https://marathon.jd.com/seckill/seckill.action';
        const params = {
            skuId: productId,
            num: byNum,
            rid: Date.now(),
        };
        const headers = {
            'User-Agent': this.loginService.ua,
            Host: 'marathon.jd.com',
            Referer: `https://item.jd.com/${productId}.html`,
            cookie: this.loginService.cookieToHeader(),
        };
        return await axios_1.default.get(url, {
            headers,
            params,
            maxRedirects: 0,
        });
    }
    async submitOrder(jsondata) {
        this.logger.log('正在提交订单');
        const defaultAddress = jsondata['addressList'][0];
        const invoice = jsondata['invoiceInfo'] || {};
        const token = jsondata['token'];
        const data = {
            skuId: productId,
            num: byNum,
            addressId: defaultAddress['id'],
            yuShou: 'true',
            isModifyAddress: 'false',
            name: defaultAddress['name'],
            provinceId: defaultAddress['provinceId'],
            cityId: defaultAddress['cityId'],
            countyId: defaultAddress['countyId'],
            townId: defaultAddress['townId'],
            addressDetail: defaultAddress['addressDetail'],
            mobile: defaultAddress['mobile'],
            mobileKey: defaultAddress['mobileKey'],
            email: defaultAddress['email'] || '',
            postCode: '',
            invoiceTitle: invoice['invoiceTitle'] || -1,
            invoiceCompanyName: '',
            invoiceContent: invoice['invoiceContentType'] || 1,
            invoiceTaxpayerNO: '',
            invoiceEmail: '',
            invoicePhone: invoice['invoicePhone'] || '',
            invoicePhoneKey: invoice['invoicePhoneKey'] || '',
            invoice: invoice ? 'true' : 'false',
            password: password,
            codTimeType: 3,
            paymentType: 4,
            areaCode: '',
            overseas: 0,
            phone: '',
            eid: eid,
            fp: fp,
            token: token,
            pru: '',
        };
        this.logger.log('提交抢购订单中');
        const url = 'https://marathon.jd.com/seckillnew/orderService/pc/submitOrder.action';
        const params = {
            skuId: productId,
        };
        const headers = {
            'User-Agent': this.loginService.ua,
            Host: 'marathon.jd.com',
            Referer: `https://marathon.jd.com/seckill/seckill.action?skuId=${productId}&num=${byNum}&rid=${Date.now()}`,
            cookie: this.loginService.cookieToHeader(),
        };
        return await axios_1.default.post(url, data, {
            params,
            headers,
        });
    }
    async killInfo() {
        this.logger.log('正在获取地址发票等信息');
        const url = 'https://marathon.jd.com/seckillnew/orderService/pc/init.action';
        const data = {
            sku: productId,
            num: byNum,
            isModifyAddress: 'false',
        };
        const headers = {
            'User-Agent': this.loginService.ua,
            Host: 'marathon.jd.com',
            cookie: this.loginService.cookieToHeader(),
        };
        return await axios_1.default.post(url, data, {
            headers,
        });
    }
};
ProductService = ProductService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [login_service_1.LoginService])
], ProductService);
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map
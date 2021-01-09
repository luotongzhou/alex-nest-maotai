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
var AppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const login_service_1 = require("./login.service");
const product_service_1 = require("./product.service");
let AppService = AppService_1 = class AppService {
    constructor(loginService, productService) {
        this.loginService = loginService;
        this.productService = productService;
        this.logger = new common_1.Logger(AppService_1.name);
    }
    async main() {
        await this.loginService.init();
        await this.productService.getProduct();
        const path = await this.productService.getSeckillUrl();
        console.log(path, 'path');
        const newpath = this.productService.resolvePath(path);
        this.logger.log(`抢购链接为${newpath}`);
        const gotokill = () => {
            return new Promise(resolve => {
                const fn = () => {
                    this.productService
                        .goToKillUrl(newpath)
                        .then(res => {
                        console.log(res.data, 'newpath数据');
                        this.loginService.cookieStore(res.headers);
                        resolve('');
                    })
                        .catch(e => {
                        console.log(e);
                        this.logger.error('发生跳转，1秒后重试');
                        setTimeout(() => {
                            fn();
                        }, 1000);
                    });
                };
                fn();
            });
        };
        await gotokill();
        const checkout = () => {
            return new Promise(resolve => {
                const fn = () => this.productService
                    .toCheckOut()
                    .then(checkRes => {
                    console.log(checkRes.data, 'checkres结果');
                    this.loginService.cookieStore(checkRes.headers);
                    resolve('');
                })
                    .catch(e => {
                    console.log(e);
                    this.logger.error('发生跳转，1秒后重试');
                    setTimeout(() => {
                        fn();
                    }, 1000);
                });
                fn();
            });
        };
        await checkout();
        const info = await this.productService.killInfo();
        console.log(info.data, 'info信息');
        const jsondata = JSON.parse(info.data);
        this.loginService.cookieStore(info.headers);
        const final = await this.productService.submitOrder(jsondata);
        console.log(final.data, '抢购结果');
        const result = JSON.parse(final.data);
        if (result.success) {
            this.logger.log(`抢购成功，电脑付款链接:https:${result.pcUrl}`);
        }
        return;
    }
};
AppService = AppService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [login_service_1.LoginService,
        product_service_1.ProductService])
], AppService);
exports.AppService = AppService;
//# sourceMappingURL=app.service.js.map
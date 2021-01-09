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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const axios_1 = require("axios");
const moment = require("moment");
require("dotenv/config");
const login_service_1 = require("./login.service");
const app_service_1 = require("./app.service");
const env = process.env;
let TasksService = TasksService_1 = class TasksService {
    constructor(schedulerRegistry, loginService, appSrv) {
        this.schedulerRegistry = schedulerRegistry;
        this.loginService = loginService;
        this.appSrv = appSrv;
        this.logger = new common_1.Logger(TasksService_1.name);
        this.handleTimeDiff();
    }
    async handleTimeDiff() {
        const url = 'https://a.jd.com//ajax/queryServerData.html';
        const res = await axios_1.default.get(url);
        const now = Date.now();
        const diff = (now - res.data.serverTime) / 1000;
        const differtime = moment.duration(Math.abs(diff), 'seconds');
        const origintime = moment(`${env.SEC}-${env.MINUTE}-${env.HOUR}-${env.DAY}-${env.MONTH}`, 's-m-H-D-M');
        this.logger.warn(`您设定时间为${origintime.format('M月D日H点m分s秒')}`);
        let fixStart;
        if (diff > 0) {
            this.logger.warn(`您电脑时间比京东快${diff}秒`);
            fixStart = origintime.add(differtime);
        }
        else {
            this.logger.warn(`您的电脑时间比京东慢${-diff}秒`);
            fixStart = origintime.subtract(differtime);
        }
        this.logger.warn(`已修正启动时间为${fixStart.format('M月D日H点m分s秒')}`);
        const month = fixStart.get('month');
        const fixCornTime = fixStart.format('s m H D ') + month + ' *';
        this.addCronJob('user', fixCornTime);
    }
    displayServerTime() {
        this.logger.debug(`${moment().format('YYYY年MM月DD日  HH时mm分ss秒')}`);
    }
    async addCronJob(name, coreTime) {
        const job = new cron_1.CronJob(coreTime, () => {
            this.logger.log(`执行脚本启动`);
            this.appSrv.main();
        });
        this.schedulerRegistry.addCronJob(name, job);
        job.start();
        this.logger.log(`任务coretime为${coreTime}`);
        this.logger.log('检查登录情况');
        this.loginService.init();
    }
};
__decorate([
    schedule_1.Cron('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TasksService.prototype, "displayServerTime", null);
TasksService = TasksService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [schedule_1.SchedulerRegistry,
        login_service_1.LoginService,
        app_service_1.AppService])
], TasksService);
exports.TasksService = TasksService;
//# sourceMappingURL=task.service.js.map
import { SchedulerRegistry } from '@nestjs/schedule';
import 'dotenv/config';
import { LoginService } from './login.service';
import { AppService } from './app.service';
export declare class TasksService {
    private schedulerRegistry;
    private readonly loginService;
    private readonly appSrv;
    private readonly logger;
    constructor(schedulerRegistry: SchedulerRegistry, loginService: LoginService, appSrv: AppService);
    handleTimeDiff(): Promise<void>;
    displayServerTime(): void;
    addCronJob(name: string, coreTime: string): Promise<void>;
}

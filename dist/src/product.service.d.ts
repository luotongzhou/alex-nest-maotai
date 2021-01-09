import 'dotenv/config';
import { LoginService } from './login.service';
export declare class ProductService {
    private readonly loginService;
    private readonly logger;
    constructor(loginService: LoginService);
    getProduct(): Promise<void>;
    getSeckillUrl(): Promise<string>;
    resolvePath(path: string): string;
    goToKillUrl(path: string): Promise<import("axios").AxiosResponse<any>>;
    toCheckOut(): Promise<import("axios").AxiosResponse<any>>;
    submitOrder(jsondata: any): Promise<import("axios").AxiosResponse<any>>;
    killInfo(): Promise<import("axios").AxiosResponse<any>>;
}

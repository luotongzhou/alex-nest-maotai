import 'dotenv/config';
interface CookieData {
    cookie: string[];
    ua: string;
}
export declare class LoginService {
    private readonly logger;
    cookies: string[];
    islogin: boolean;
    ua: string;
    init(): Promise<void>;
    storeCookieTolocal(): void;
    getCookieFromLocal(): CookieData;
    cookieResolve(cookie: string[]): any[];
    cookieStore(headers: any): void;
    cookieToHeader(): string;
    getHeaders(): {
        'User-Agent': string;
        Accept: string;
        Connection: string;
    };
    main(): Promise<boolean>;
    openQrcode(): Promise<void>;
    getQrcode(): Promise<boolean>;
    qrcodeScan(): Promise<string>;
    validateTicket(ticket: string): Promise<boolean>;
    validate(): Promise<boolean>;
}
export {};

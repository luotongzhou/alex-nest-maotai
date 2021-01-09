import { LoginService } from './login.service';
import { ProductService } from './product.service';
export declare class AppService {
    private readonly loginService;
    private readonly productService;
    private readonly logger;
    constructor(loginService: LoginService, productService: ProductService);
    main(): Promise<void>;
}

import type { Request, Response } from "express";
export declare const registerController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const loginController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const googleCallbackHandler: (req: any, res: Response) => void;
//# sourceMappingURL=authController.d.ts.map
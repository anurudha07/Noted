import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
export declare const getAllNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateNote: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteNote: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const setReminder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=notesController.d.ts.map
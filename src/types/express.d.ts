export interface AuthUser {
  id: number;
  email: string;
  role: string;
  name: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export {};

import { Request, Response, NextFunction } from "express";

// override res.json to call handlerFn then call original json
export function notificationMiddleware(
  handlerFn: (req: Request, res: Response, body: any) => void
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (body) {
      handlerFn(req, res, body);
      return originalJson.call(this, body);
    };
    next();
  };
}

export function handler1(req: Request, res: Response, body: any) {
  console.log("handler1: ");
}

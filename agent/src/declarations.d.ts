declare module 'express' {
  import { Request, Response, NextFunction } from 'express-serve-static-core';
  import * as core from 'express-serve-static-core';
  
  function express(): core.Express;
  namespace express {
    export type Request = core.Request;
    export type Response = core.Response;
    export type NextFunction = core.NextFunction;
    export type Express = core.Express;
    export type Router = core.Router;
    export const static: any;
    export const json: any;
    export const urlencoded: any;
  }
  export = express;
}

declare module 'x402-express' {
  import { RequestHandler } from 'express';
  export function paymentMiddleware(options: {
    amount: number;
    tokenAddress: string;
    recipient: `0x${string}`;
  }): RequestHandler;
}

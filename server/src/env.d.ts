declare namespace Express {
  export interface Request {
    context: import("./context").Context;
  }
}

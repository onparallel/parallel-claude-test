import express from "express";
export function handler<T extends {} | void>(
  handler: (req: express.Request, res: express.Response) => Promise<T>
): express.RequestHandler {
  return async (req, res, next) => {
    try {
      res.send(await handler(req, res));
    } catch (error) {
      console.log(error);
      res.status(500).send();
    }
  };
}

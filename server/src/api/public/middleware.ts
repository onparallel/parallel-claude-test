import { NextFunction, Request, RequestHandler, Response } from "express";
import { mkdir } from "fs/promises";
import multer from "multer";
import { callbackify } from "util";
import { random } from "../../util/token";

const multerUploadFile = multer({
  storage: multer.diskStorage({
    destination: callbackify(async function (req: any, file: any) {
      const path = `/tmp/${random(16)}`;
      await mkdir(path);
      return path;
    }),
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

export function singleFileUploadMiddleware(fieldName: string): RequestHandler[] {
  return [
    multerUploadFile.single(fieldName),
    ((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err?.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          code: "InvalidRequestBody",
          message: `Unknown field '${err.field}'. Expected field '${fieldName}' with a single file.`,
        });
      }
      next(err);
    }) as any,
  ];
}

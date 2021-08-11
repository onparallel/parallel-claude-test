import { Response } from "express";
import { isDefined } from "../../util/remedaExtensions";
import { ResponseWrapper } from "./core";

interface ErrorBody {
  code: string;
  message: string;
  originalError?: {
    message: string;
    stack?: string;
  };
}

export abstract class HttpError extends Error implements ResponseWrapper<ErrorBody> {
  constructor(public status: number, public code: string, public message: string) {
    super(message);
  }
  apply(res: Response<ErrorBody>) {
    res.status(this.status).json({
      code: this.code,
      message: this.message,
    });
  }
}

export class BadRequestError extends HttpError {
  static readonly code = "BadRequestError";
  constructor(public message: string) {
    super(400, BadRequestError.code, message);
  }
}

export class ConflictError extends HttpError {
  static readonly code = "Conflict";
  constructor(public message: string) {
    super(409, ConflictError.code, message);
  }
}

export class UnauthorizedError extends HttpError {
  static readonly code = "Unauthorized";
  constructor(public message: string) {
    super(401, UnauthorizedError.code, message);
  }
}

export class UnknownError extends HttpError {
  static readonly code = "Unknown";
  constructor(public originalError: Error) {
    super(
      500,
      UnknownError.code,
      process.env.NODE_ENV === "development" ? originalError.message : "An unknown error happened"
    );
  }
  apply(res: Response<ErrorBody>) {
    res.status(this.status).json({
      code: this.code,
      message: this.message,
      originalError:
        process.env.NODE_ENV === "development"
          ? this.originalError && {
              message: this.originalError.message,
              stack: this.originalError.stack,
            }
          : undefined,
    });
  }
}

export class InvalidParameterError extends HttpError {
  static readonly status = 422;
  static readonly code = "InvalidParameter";
  constructor(
    public name: string,
    public value: any,
    public location: "query" | "path",
    message: string
  ) {
    super(
      InvalidParameterError.status,
      InvalidParameterError.code,
      `Invalid ${location} parameter ${JSON.stringify(name)} with value ${
        isDefined(value) ? JSON.stringify(value) : "<missing parameter>"
      }: ${message}`
    );
  }
}

export class InvalidRequestBodyError extends HttpError {
  static readonly status = 422;
  static readonly code = "InvalidRequestBody";
  constructor(message: string) {
    super(
      InvalidRequestBodyError.status,
      InvalidRequestBodyError.code,
      `Invalid request body: ${message}`
    );
  }
}

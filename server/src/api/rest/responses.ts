import { Response } from "express";
import { ResponseWrapper, RestResponse } from "./core";
import { JsonSchemaFor } from "./schemas";

export class RestResponseWrapper<T> implements ResponseWrapper<T> {
  __type?: T;
  constructor(
    public readonly status: number,
    public readonly body: any,
    public readonly headers: Record<string, string> = {}
  ) {}
  apply(res: Response) {
    res.status(this.status);
    if (this.headers) {
      for (const [name, value] of Object.entries(this.headers)) {
        res.header(name, value);
      }
    }
    if (this.body !== undefined) {
      res.json(this.body);
    } else {
      res.send();
    }
  }
}

interface Redirect {
  __type?: "REDIRECT";
}
export class RedirectResponseWrapper implements ResponseWrapper<Redirect> {
  constructor(
    public readonly status: number,
    public readonly location: string
  ) {}
  apply(res: Response) {
    res.redirect(this.status, this.location);
  }
}

export function Redirect(location: string) {
  return new RedirectResponseWrapper(302, location);
}

export function Ok<T>(value: T): ResponseWrapper<T> {
  return new RestResponseWrapper(200, value);
}

export function Created<T>(value: T, location?: string): ResponseWrapper<T> {
  return new RestResponseWrapper(201, value, location ? { location } : {});
}

export function NoContent(): ResponseWrapper<void> {
  return new RestResponseWrapper(204, undefined);
}

export interface JsonResponseOptions<T> {
  description: string;
  schema?: JsonSchemaFor<T>;
}

export function JsonResponse<T = any>({
  description,
  schema,
}: JsonResponseOptions<T>): RestResponse<T> {
  return {
    description,
    content: {
      "application/json": {
        schema: schema as any,
      },
    },
  };
}

export interface ErrorResponseOptions {
  description: string;
}

export function ErrorResponse({
  description,
}: ErrorResponseOptions): JsonResponseOptions<never> {
  return {
    description,
  };
}

export interface NoContentResponseOptions {
  description: string;
}

export function NoContentResponse({
  description,
}: NoContentResponseOptions): RestResponse<void> {
  return {
    description,
  };
}

export function SuccessResponse<T = void>(
  schema?: JsonSchemaFor<T>
): RestResponse<T> {
  return schema
    ? JsonResponse({
        description: "Successful operation",
        schema,
      })
    : (NoContentResponse({
        description: "Successful operation",
      }) as RestResponse<T>);
}

export function RedirectResponse(description: string): RestResponse<Redirect> {
  return {
    description,
  };
}

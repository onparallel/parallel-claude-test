import Ajv from "ajv";
import addFormats from "ajv-formats";
import { Response } from "express";
import { ResponseWrapper, RestResponses } from "./core";

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
  validate(responses: RestResponses<any> | undefined): void | Promise<void> {
    const schema = responses?.[this.status]?.schema;
    if (schema) {
      const ajv = new Ajv({ strict: false });
      addFormats(ajv, ["date-time"]);
      const validate = ajv.compile(schema as any);
      const valid = validate(this.body);
      if (!valid) {
        const error = validate.errors![0];
        throw new Error(`${error.dataPath} ${error.message}`);
      }
    }
  }
}

export function OkResponse<T>(value: T): ResponseWrapper<T> {
  return new RestResponseWrapper(200, value);
}

export function CreatedResponse<T>(
  value: T,
  location?: string
): ResponseWrapper<T> {
  return new RestResponseWrapper(201, value, location ? { location } : {});
}

export function NoContentResponse(): ResponseWrapper<void> {
  return new RestResponseWrapper(204, undefined);
}

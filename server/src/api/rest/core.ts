import { Request, RequestHandler, Response, Router } from "express";
import { OpenAPIV3 } from "openapi-types";
import { ParseUrlParams } from "typed-url-params";
import { MaybePromise } from "../../util/types";
import {
  HttpError,
  InvalidParameterError,
  InvalidRequestBodyError,
  UnknownError,
} from "./errors";
import { ParseError } from "./params";
import { JSONSchemaFor } from "./schemas";
import Ajv, { ValidateFunction } from "ajv";
import { Memoize } from "typescript-memoize";
import { omit } from "remeda";
import addFormats from "ajv-formats";

export type RestMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

export type RestParameters<T> = {
  [K in keyof T]: RestParameter<T[K]>;
};

export interface RestParameter<T> {
  parse(value?: string): MaybePromise<T>;
  definition: OpenAPIV3.ParameterBaseObject;
}

type PathParameters<TPath extends string> = {
  [K in keyof ParseUrlParams<TPath>]: any;
};

export interface RestBody<T> {
  description?: string;
  schema?: JSONSchemaFor<T>;
}

export interface RestPathOptions {
  summary?: string;
  description?: string;
  excludeFromSpec?: boolean;
}

export interface RestPathOptionsWithParams<
  TPath extends string,
  TParams extends PathParameters<TPath>
> extends RestPathOptions {
  params: RestParameters<TParams>;
}

export interface RestOperationOptions<
  TQuery,
  TBody,
  TResponses extends RestResponses<any>
> {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  deprecated?: boolean;
  body?: RestBody<TBody>;
  query?: RestParameters<TQuery>;
  responses?: TResponses;
  excludeFromSpec?: boolean;
}

export type RestResponses<T> = {
  [status: number]: RestResponse<T>;
};

export interface RestResponse<T> {
  description?: string;
  schema?: JSONSchemaFor<T>;
}

export interface ResponseWrapper<T> {
  __type?: T;
  apply(res: Response<T>): void;
  validate?(responses: RestResponses<any> | undefined): void | Promise<void>;
}

export interface OperationHandler<TContext, TParams, TQuery, TReturn, TBody> {
  (context: RestApiContext<TContext, TParams, TQuery, TBody>): MaybePromise<
    ResponseWrapper<TReturn>
  >;
}

export type PathResolver<
  TContext,
  TPath extends string,
  TParams extends PathParameters<TPath>
> = {
  [Method in RestMethod]: OperationResolver<TContext, TPath, TParams>;
} & {
  path: string;
  spec: OpenAPIV3.PathItemObject;
  pathOptions: _RestPathOptions<TPath, TParams>;
};

export interface OperationResolver<
  TContext,
  TPath extends string,
  TParams extends PathParameters<TPath>
> {
  <TQuery, TBody, TResponses extends RestResponses<any>>(
    options: RestOperationOptions<TQuery, TBody, TResponses>,
    resolver: OperationHandler<
      TContext,
      {} extends TParams ? {} : TParams,
      TQuery,
      RestResponseReturnType<TResponses>,
      TBody
    >
  ): PathResolver<TContext, TPath, TParams>;
}

type RestResponseReturnType<
  TResponses extends RestResponses<any>
> = TResponses[keyof TResponses] extends {
  schema?: JSONSchemaFor<infer U>;
}
  ? U
  : never;

const methods: RestMethod[] = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

const _PathResolver: any = (function () {
  type PathResolver<
    TContext,
    TPath extends string,
    TParams extends PathParameters<TPath>
  > = {
    router: Router;
    apiOptions: RestApiOptions<TContext>;
    path: TPath;
    pathOptions: _RestPathOptions<TPath, TParams>;
    spec: OpenAPIV3.PathItemObject;
  };
  function PathResolver<
    TContext,
    TPath extends string,
    TParams extends PathParameters<TPath>
  >(
    this: PathResolver<TContext, TPath, TParams>,
    router: Router,
    apiOptions: RestApiOptions<TContext>,
    ...args: PathArguments<TPath, TParams>
  ) {
    this.router = router;
    this.apiOptions = apiOptions;
    [this.path, this.pathOptions] = args as any;
    if (this.pathOptions) {
      const { description, summary, params } = this.pathOptions;
      this.spec = { description, summary };
      this.spec.parameters = Object.entries<RestParameter<any>>(
        params ?? {}
      ).map(([name, parameter]) => ({
        name,
        in: "path",
        ...parameter.definition,
      }));
    } else {
      this.spec = {};
    }
  }
  for (const method of methods) {
    PathResolver.prototype[method] = function handler<
      TContext,
      TPath extends string,
      TParams extends PathParameters<TPath>,
      TQuery,
      TBody,
      TResponses extends RestResponses<any>
    >(
      this: PathResolver<TContext, TPath, TParams>,
      operationOptions: RestOperationOptions<TQuery, TBody, TResponses>,
      resolver: OperationHandler<
        TContext,
        TParams,
        TQuery,
        RestResponseReturnType<TResponses>,
        TBody
      >
    ) {
      const {
        description,
        summary,
        deprecated,
        tags,
        operationId,
        body,
        query,
        responses,
        excludeFromSpec,
      } = operationOptions;
      if (!excludeFromSpec) {
        this.spec[method] = {
          description,
          summary,
          deprecated,
          tags,
          operationId,
        };
        if (body) {
          const { description, schema } = body;
          this.spec[method]!.requestBody = {
            description,
            required: true,
            content: {
              "application/json": {
                schema: schema as any,
              },
            },
          };
        }
        this.spec[method]!.parameters = Object.entries<RestParameter<any>>(
          query ?? {}
        ).map(([name, parameter]) => ({
          name,
          in: "query",
          ...parameter.definition,
        }));
        this.spec[method]!.responses = Object.fromEntries(
          Object.entries<RestResponse<any>>(responses ?? {}).map(
            ([status, response]) => {
              const { description, schema } = response;
              return [
                status,
                {
                  description: description!,
                  content: {
                    "application/json": { schema: schema as any },
                  },
                },
              ];
            }
          )
        );
      }
      let validate: ValidateFunction<TBody> | null = null;
      if (operationOptions.body?.schema) {
        const ajv = new Ajv({ strict: false });
        addFormats(ajv, ["date-time"]);
        validate = ajv.compile<TBody>(operationOptions.body?.schema);
      }
      this.router[method](this.path, async (req, res, next) => {
        const response: ResponseWrapper<any> = await (async () => {
          try {
            const context: RestApiContext<
              TContext,
              any,
              any,
              any
            > = ((await this.apiOptions.context?.({ req, res })) ?? {}) as any;
            context.params = Object.fromEntries(
              await Promise.all(
                Object.entries<RestParameter<TParams>>(
                  (this.pathOptions as any)?.params ?? {}
                ).map(async ([name, parameter]) => {
                  const value = req.params[name as string];
                  try {
                    return [name, await parameter.parse(value)];
                  } catch (e) {
                    if (e instanceof ParseError) {
                      throw new InvalidParameterError(
                        name as string,
                        value,
                        "path",
                        e.message
                      );
                    }
                    throw e;
                  }
                })
              )
            );
            context.query = Object.fromEntries(
              await Promise.all(
                Object.entries<RestParameter<TParams>>(
                  operationOptions.query ?? ({} as any)
                ).map(async ([name, parameter]) => {
                  const value = req.query[name as string];
                  if (value !== undefined && typeof value !== "string") {
                    throw new InvalidParameterError(
                      name as string,
                      value,
                      "path",
                      "Array or Object params are not supported"
                    );
                  }
                  try {
                    return [name, await parameter.parse(value)];
                  } catch (e) {
                    if (e instanceof ParseError) {
                      throw new InvalidParameterError(
                        name as string,
                        value,
                        "path",
                        e.message
                      );
                    }
                    throw e;
                  }
                })
              )
            );
            context.body = req.body;
            if (validate) {
              if (!req.body) {
                throw new InvalidRequestBodyError(
                  "Body is missing but it is required"
                );
              }
              const valid = validate(req.body);
              if (!valid) {
                const error = validate.errors![0];
                throw new InvalidRequestBodyError(
                  `Property at ${error.dataPath} ${error.message}`
                );
              }
            }
            const response = await resolver(context);
            if (process.env.NODE_ENV === "development" && response.validate) {
              response.validate(operationOptions.responses);
            }
            return response;
          } catch (error) {
            console.log(error, error instanceof HttpError);
            if (error instanceof HttpError) {
              return error;
            } else if (this.apiOptions.errorHandler) {
              try {
                return await this.apiOptions.errorHandler(error);
              } catch (error) {
                return new UnknownError(error);
              }
            } else {
              return new UnknownError(error);
            }
          }
        })();
        response.apply(res);
      });
      return this;
    };
  }
  return PathResolver;
})();

type ContextFunction<TContext> = (
  express: ExpressContext
) => MaybePromise<TContext>;
interface ExpressContext {
  req: Request;
  res: Response;
}

type ErrorHandler = (error: Error) => MaybePromise<ResponseWrapper<any>>;

export interface RestApiOptions<TContext = {}>
  extends Pick<
    OpenAPIV3.Document,
    "openapi" | "info" | "security" | "components" | "tags" | "servers"
  > {
  context?: ContextFunction<TContext>;
  errorHandler?: ErrorHandler;
}

export type RestApiContext<TContext, TParams, TQuery, TBody> = TContext & {
  params: TParams;
  query: TQuery;
  body: TBody;
};

export class RestApi<TContext = {}> {
  private router: Router = Router();
  private paths: PathResolver<TContext, any, any>[] = [];
  private _spec: Omit<RestApiOptions, "middleware">;

  constructor(private apiOptions: RestApiOptions<TContext>) {
    this._spec = omit(apiOptions, ["context", "errorHandler"]);
  }

  path<TPath extends string, TParams extends PathParameters<TPath>>(
    ...args: PathArguments<TPath, TParams>
  ): PathResolver<TContext, TPath, TParams> {
    const _path = new _PathResolver(this.router, this.apiOptions, ...args);
    this.paths.push(_path);
    return _path;
  }

  handler(): RequestHandler {
    return this.router;
  }

  spec(): RequestHandler {
    return (req, res, next) => {
      res.status(200).json(this.generateSpec());
    };
  }

  @Memoize()
  private generateSpec(): OpenAPIV3.Document {
    return {
      ...this._spec,
      paths: Object.fromEntries(
        this.paths
          .filter((path) => !path.pathOptions?.excludeFromSpec)
          .map(({ path, spec }) => {
            // open api uses {} for path parameters
            const _path = path.replace(/(?<=\/):([^\/]+)/g, "{$1}");
            return [_path, spec];
          })
      ),
    };
  }
}

type PathArguments<
  TPath extends string,
  TParams extends PathParameters<TPath>
> = {} extends PathParameters<TPath>
  ? [path: TPath] | [path: TPath, pathOptions: RestPathOptions]
  : [path: TPath, pathOptions: RestPathOptionsWithParams<TPath, TParams>];

type _RestPathOptions<
  TPath extends string,
  TParams extends PathParameters<TPath>
> = RestPathOptions & {
  params?: RestParameters<TParams>;
};

import { Request, RequestHandler, Response, Router } from "express";
import { OpenAPIV3 } from "openapi-types";
import pProps from "p-props";
import { omit } from "remeda";
import { ParseUrlParams } from "typed-url-params";
import { Memoize } from "typescript-memoize";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray, MaybePromise } from "../../util/types";
import { HttpError, InvalidParameterError, UnknownError } from "./errors";
import { ParseError } from "./params";

export type File = Exclude<Request["file"], undefined>;

export type RestMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

export type RestParameters<T> = {
  [K in keyof T]: RestParameter<T[K]>;
};

export interface RestParameter<T> {
  parse(value?: string): MaybePromise<T>;
  spec: OpenAPIV3.ParameterBaseObject;
}

type PathParameters<TPath extends string> = {
  [K in keyof ParseUrlParams<TPath>]: any;
};

export interface RestBody<T> {
  _type?: T;
  spec: OpenAPIV3.RequestBodyObject;
  validate?: (req: Request, context: RestApiContext) => void;
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

export interface RestOperationOptions<TQuery, TBody, TResponses extends RestResponses<any>> {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  deprecated?: boolean;
  body?: RestBody<TBody>;
  query?: RestParameters<TQuery>;
  responses?: TResponses;
  middleware?: MaybeArray<RequestHandler>;
  excludeFromSpec?: boolean;
  [x: string]: unknown;
}

export type RestResponses<T> = {
  [status: number]: RestResponse<T>;
};

export interface RestResponse<T> extends OpenAPIV3.ResponseObject {
  _type?: T;
}

export interface ResponseWrapper<T> {
  __type?: T;
  apply(res: Response<T>): void;
}

export interface OperationHandler<TContext, TParams, TQuery, TReturn, TBody> {
  (context: RestApiContext<TContext, TParams, TQuery, TBody>): MaybePromise<
    ResponseWrapper<TReturn>
  >;
}

export type PathResolver<TContext, TPath extends string, TParams extends PathParameters<TPath>> = {
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

type RestResponseReturnType<TResponses extends RestResponses<any>> =
  TResponses[keyof TResponses] extends RestResponse<infer U> ? U : never;

const methods: RestMethod[] = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

const _PathResolver: any = (function () {
  type PathResolver<TContext, TPath extends string, TParams extends PathParameters<TPath>> = {
    router: Router;
    apiOptions: RestApiOptions<TContext>;
    path: TPath;
    pathOptions: _RestPathOptions<TPath, TParams>;
    spec: OpenAPIV3.PathItemObject;
  };
  function PathResolver<TContext, TPath extends string, TParams extends PathParameters<TPath>>(
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
      this.spec.parameters = Object.entries<RestParameter<any>>(params ?? {}).map(
        ([name, parameter]) => ({
          name,
          in: "path",
          ...parameter.spec,
        })
      );
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
        body,
        query,
        excludeFromSpec,
        responses = {},
        middleware = [],
        ...spec
      } = operationOptions;
      if (!excludeFromSpec) {
        this.spec[method] = { ...spec, responses };
        if (body?.spec) {
          this.spec[method]!.requestBody = body?.spec;
        }
        this.spec[method]!.parameters = Object.entries<RestParameter<any>>(query ?? {}).map(
          ([name, parameter]) => ({
            name,
            in: "query",
            ...parameter.spec,
          })
        );
      }
      this.router[method](this.path, ...unMaybeArray(middleware), async (req, res, next) => {
        const response: ResponseWrapper<any> = await (async () => {
          try {
            const context: RestApiContext<TContext> = ((await this.apiOptions.context?.({
              req,
              res,
            })) ?? {}) as any;
            context.params = await pProps(
              this.pathOptions?.params ?? ({} as RestParameters<any>),
              async (param, name) => {
                const value = req.params[name as keyof typeof req.params] as string;
                try {
                  return await param.parse(value);
                } catch (e: any) {
                  if (e instanceof ParseError) {
                    throw new InvalidParameterError(name as string, value, "path", e.message);
                  }
                  throw e;
                }
              }
            );
            context.query = await pProps(
              operationOptions.query ?? ({} as RestParameters<any>),
              async (param, name) => {
                const value = req.query[name as string];
                if (value !== undefined && typeof value !== "string") {
                  throw new InvalidParameterError(
                    name as string,
                    value,
                    "query",
                    "Array or Object params are not supported"
                  );
                }
                try {
                  return await param.parse(value);
                } catch (e: any) {
                  if (e instanceof ParseError) {
                    throw new InvalidParameterError(name as string, value, "query", e.message);
                  }
                  throw e;
                }
              }
            );
            body?.validate?.(req, context);
            return await resolver(context);
          } catch (error: any) {
            if (error instanceof HttpError) {
              return error;
            } else if (this.apiOptions.errorHandler) {
              try {
                return await this.apiOptions.errorHandler(error);
              } catch (error: any) {
                if (error instanceof HttpError) {
                  return error;
                }
                return new UnknownError(error);
              }
            } else {
              return new UnknownError(error);
            }
          }
        })();
        if (operationOptions.deprecated) {
          res.header("Warning", "Deprecated API");
        }
        response.apply(res);
      });
      return this;
    };
  }
  return PathResolver;
})();

type ContextFunction<TContext> = (express: ExpressContext) => MaybePromise<TContext>;
interface ExpressContext {
  req: Request;
  res: Response;
}

type ErrorHandler = (error: Error) => MaybePromise<ResponseWrapper<any>>;

export interface RestApiOptions<TContext = {}> {
  openapi: string;
  info: OpenAPIV3.InfoObject & {
    "x-logo": {
      /**
       * The URL pointing to the spec logo.
       * MUST be in the format of a URL.
       * It SHOULD be an absolute URL so your API definition is usable from any location
       */
      url?: string;
      /**
       * background color to be used.
       * MUST be RGB color in [hexadecimal format] (https://en.wikipedia.org/wiki/Web_colors#Hex_triplet)
       */
      backgroundColor?: string;
      /**
       * Text to use for alt tag on the logo. Defaults to 'logo' if nothing is provided.
       */
      altText?: string;
      /**
       * The URL pointing to the contact page. Default to 'info.contact.url' field of the OAS.
       */
      href?: string;
    };
  };
  servers?: OpenAPIV3.ServerObject[];
  security?: OpenAPIV3.SecurityRequirementObject[];
  tags?: OpenAPIV3.TagObject[];
  "x-tagGroups"?: { name: string; tags: string[] }[];
  components?: OpenAPIV3.ComponentsObject;
  context?: ContextFunction<TContext>;
  errorHandler?: ErrorHandler;
}

export type RestApiContext<TContext = {}, TParams = any, TQuery = any, TBody = any> = TContext & {
  params: TParams;
  query: TQuery;
  body: TBody;
  files: Record<string, File[]>;
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

  @(process.env.NODE_ENV === "production" ? Memoize() : () => {})
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

import { inject, injectable } from "inversify";
import { JwtPayload, sign, SignOptions, verify, VerifyOptions } from "jsonwebtoken";
import { promisify } from "util";
import { CONFIG, Config } from "../config";

export const JWT_SERVICE = Symbol.for("JWT_SERVICE");

export interface IJwtService {
  sign(
    payload: string | object | Buffer,
    options?: SignOptions & { secret?: string },
  ): Promise<string>;
  verify<TPayload = JwtPayload>(
    token: string,
    options?: VerifyOptions & { secret?: string },
  ): Promise<TPayload>;
}

@injectable()
export class JwtService implements IJwtService {
  constructor(@inject(CONFIG) private readonly config: Config) {}

  async sign(
    payload: string | object | Buffer,
    { secret, ...options }: SignOptions & { secret?: string } = {},
  ) {
    return promisify<string | object | Buffer, string, SignOptions, string>(sign)(
      payload,
      secret ?? this.config.security.jwtSecret,
      { issuer: "parallel-server", algorithm: "HS256", ...options },
    );
  }

  async verify<TPayload = JwtPayload>(
    token: string,
    { secret, ...options }: VerifyOptions & { secret?: string } = {},
  ) {
    return await promisify<string, string, VerifyOptions, TPayload>(verify)(
      token,
      secret ?? this.config.security.jwtSecret,
      { algorithms: ["HS256"], issuer: "parallel-server", ...options },
    );
  }
}

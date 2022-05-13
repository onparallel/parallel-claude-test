import {
  JwtPayload,
  Secret,
  sign as _sign,
  SignOptions,
  verify as _verify,
  VerifyOptions,
} from "jsonwebtoken";
import { promisify } from "util";

export async function sign<T extends string | object | Buffer>(
  payload: T,
  secret: string,
  opts?: SignOptions
) {
  return await promisify<T, Secret, SignOptions, string>(_sign)(payload, secret, {
    issuer: "parallel-server",
    algorithm: "HS256",
    ...opts,
  });
}

export async function verify<TPayload = JwtPayload>(
  token: string,
  secret: string,
  options: VerifyOptions = {
    algorithms: ["HS256"],
    issuer: "parallel-server",
  }
) {
  return await promisify<string, string, VerifyOptions, TPayload>(_verify)(token, secret, options);
}

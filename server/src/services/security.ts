import { inject, injectable } from "inversify";
import { sign, verify } from "jsonwebtoken";
import { CONFIG, Config } from "../config";

export interface ISecurityService {
  checkClientServerToken(token: string): Promise<boolean>;
}

export const SECURITY = Symbol.for("SECURITY");

@injectable()
export class SecurityService implements ISecurityService {
  constructor(@inject(CONFIG) private config: Config) {}
  async checkClientServerToken(token: string) {
    return token === this.config.misc.clientServerToken;
  }

  public generateAuthToken(payload: any) {
    return sign(payload, this.config.security.jwtSecret, {
      expiresIn: 30,
      issuer: "parallel-server",
      algorithm: "HS256",
    });
  }

  public verifyAuthToken(token: string) {
    try {
      verify(token, this.config.security.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "parallel-server",
      });
      return true;
    } catch {
      return false;
    }
  }
}

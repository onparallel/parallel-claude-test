import { inject, injectable } from "inversify";
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
}

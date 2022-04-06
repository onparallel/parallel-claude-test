import { GraphQLClient } from "graphql-request";
import { inject, injectable } from "inversify";
import { AUTH, IAuth } from "./auth";

export const API_CLIENT_SERVICE = Symbol.for("API_CLIENT_SERVICE");

export interface IApiClientService {
  createClient(userId: number): Promise<GraphQLClient>;
}
@injectable()
export class ApiClientService {
  constructor(@inject(AUTH) protected auth: IAuth) {}

  public async createClient(userId: number) {
    const token = await this.auth.generateTempAuthToken(userId);
    return new GraphQLClient("http://localhost/graphql", {
      headers: { authorization: `Bearer ${token}` },
    });
  }
}

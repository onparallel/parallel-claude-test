import AWS from "aws-sdk";
import { ContextDataType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { inject, injectable } from "inversify";
import { decode } from "jsonwebtoken";
import fetch from "node-fetch";
import { IncomingMessage } from "node:http";
import { getClientIp } from "request-ip";
import { Memoize } from "typescript-memoize";
import { URL } from "url";
import { CONFIG, Config } from "../config";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { random } from "../util/token";
import { REDIS, Redis } from "./redis";
import { parse as parseCookie } from "cookie";
import { User } from "../db/__types";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";

export interface IAuth {
  guessLogin: RequestHandler;
  callback: RequestHandler;
  login: RequestHandler;
  logout: RequestHandler;
  newPassword: RequestHandler;
  forgotPassword: RequestHandler;
  confirmForgotPassword: RequestHandler;
  validateSession(req: IncomingMessage): Promise<User | null>;
}

export const AUTH = Symbol.for("AUTH");

interface CognitoSession {
  IdToken: string;
  AccessToken: string;
  RefreshToken: string;
}
@injectable()
export class Auth implements IAuth {
  private readonly EXPIRY = 30 * 24 * 60 * 60;

  @Memoize()
  get cognito() {
    return new AWS.CognitoIdentityServiceProvider();
  }

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(REDIS) private redis: Redis,
    private orgs: OrganizationRepository,
    private integrations: IntegrationRepository,
    private users: UserRepository
  ) {}

  async guessLogin(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;
    const [, domain] = email.split("@");
    try {
      const sso = await this.integrations.loadSSOIntegrationByDomain(domain);
      if (sso) {
        const url = new URL(
          `https://${this.config.cognito.domain}/oauth2/authorize`
        );
        for (const [name, value] of Object.entries({
          identity_provider: (sso.settings as IntegrationSettings<"SSO">)
            .COGNITO_PROVIDER,
          redirect_uri: `${this.config.misc.parallelUrl}/api/auth/callback`,
          response_type: "code",
          client_id: this.config.cognito.clientId,
          scope: "aws.cognito.signin.user.admin email openid profile",
        })) {
          url.searchParams.append(name, value);
        }
        res.json({ type: "SSO", url: url.href });
      } else {
        res.json({ type: "PASSWORD" });
      }
    } catch (error) {
      next(error);
    }
  }

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const url = new URL(`https://${this.config.cognito.domain}/oauth2/token`);
      for (const [name, value] of Object.entries({
        grant_type: "authorization_code",
        client_id: this.config.cognito.clientId,
        redirect_uri: `${this.config.misc.parallelUrl}/api/auth/callback`,
        code: req.query.code as string,
      })) {
        url.searchParams.append(name, value);
      }
      const response = await fetch(url.href, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const tokens = await response.json();
      const payload = decode(tokens["id_token"]) as any;
      const cognitoId = payload["cognito:username"] as string;
      const firstName = payload["given_name"] as string;
      const lastName = payload["family_name"] as string;
      const email = payload["email"] as string;
      const externalId = payload["identities"][0].userId as string;
      const existing = await this.users.loadUserByEmail(email);
      const [, domain] = email.split("@");
      const orgId = existing
        ? existing.org_id
        : (await this.integrations.loadSSOIntegrationByDomain(domain))?.org_id;
      if (!orgId) {
        throw new Error(`can't find SSO integration for domain ${domain}`);
      }

      const org = await this.orgs.loadOrg(orgId);
      if (!org) {
        throw new Error(`can't find organization with id ${orgId}`);
      }

      if (!existing) {
        await this.users.createUser(
          {
            first_name: firstName,
            last_name: lastName,
            email: email,
            cognito_id: cognitoId,
            org_id: org.id,
            is_sso_user: true,
            external_id: externalId,
          },
          `OrganizationSSO:${org.id}`
        );
      } else {
        if (
          existing.first_name !== firstName ||
          existing.last_name !== lastName ||
          existing.cognito_id !== cognitoId ||
          existing.external_id !== externalId
        ) {
          await this.users.updateUserById(
            existing.id,
            {
              first_name: firstName,
              last_name: lastName,
              cognito_id: cognitoId,
              external_id: externalId,
              is_sso_user: true,
            },
            `OrganizationSSO:${org.id}`
          );
        }
      }
      const token = await this.storeSession({
        IdToken: tokens["id_token"],
        AccessToken: tokens["access_token"],
        RefreshToken: tokens["refresh_token"],
      });
      this.setSession(res, token);
      res.redirect(
        302,
        `${this.config.misc.parallelUrl}?url=${encodeURIComponent(
          "/app/petitions"
        )}`
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const auth = await this.initiateAuth(email, password, req);
      if (auth.AuthenticationResult) {
        const token = await this.storeSession(auth.AuthenticationResult as any);
        this.setSession(res, token);
        res.status(201).send({});
      } else if (auth.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        res.status(401).send({ error: "NewPasswordRequired" });
      } else {
        res.status(401).send({ error: "UnknownError" });
      }
    } catch (error) {
      switch (error.code) {
        case "PasswordResetRequiredException":
          res.status(401).send({ error: "PasswordResetRequired" });
          return;
        case "UserNotFoundException":
        case "NotAuthorizedException":
          res.status(401).send({ error: "InvalidUsernameOrPassword" });
          return;
      }
      next(error);
    }
  }

  async newPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, newPassword } = req.body;
      const auth = await this.initiateAuth(email, password, req);
      if (auth.ChallengeName !== "NEW_PASSWORD_REQUIRED") {
        return res.status(401).send({ error: "UnknownError" });
      }
      const challenge = await this.respondToNewPasswordRequiredChallenge(
        auth.Session!,
        email,
        newPassword,
        req
      );
      if (challenge.AuthenticationResult) {
        const token = await this.storeSession(
          challenge.AuthenticationResult as any
        );
        this.setSession(res, token);
        res.status(201).send({});
      } else {
        res.status(401).send({ error: "UnknownError" });
      }
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await this.cognito
        .forgotPassword({
          ClientId: this.config.cognito.clientId,
          Username: email,
        })
        .promise();
      res.status(204).send();
    } catch (error) {
      switch (error.code) {
        case "NotAuthorizedException":
          res.status(401).send({ error: "ExternalUser" });
          return;
        case "UserNotFoundException":
          // don't leak whether users exist or not
          res.status(204);
          return;
      }
      next(error);
    }
  }

  async confirmForgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, verificationCode, newPassword } = req.body;
      await this.cognito
        .confirmForgotPassword({
          ClientId: this.config.cognito.clientId,
          Username: email,
          Password: newPassword,
          ConfirmationCode: verificationCode,
        })
        .promise();
      res.status(204).send();
    } catch (error) {
      switch (error.code) {
        case "InvalidPasswordException":
          res.status(400).send({ error: "InvalidPassword" });
          return;
        case "ExpiredCodeException":
        case "CodeMismatchException":
        case "UserNotFoundException":
          res.status(400).send({ error: "InvalidVerificationCode" });
          return;
      }
      next(error);
    }
  }

  async logoutCallback(req: Request, res: Response, next: NextFunction) {
    res.redirect(302, `/?url=${encodeURIComponent("/login")}`);
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const url = new URL(`https://${this.config.cognito.domain}/logout`);
    for (const [name, value] of Object.entries({
      logout_uri: `${this.config.misc.parallelUrl}/api/auth/logout/callback`,
      client_id: this.config.cognito.clientId,
    })) {
      url.searchParams.append(name, value);
    }
    const cookie = req.cookies["parallel_session"];
    await this.deleteSession(cookie);
    res.clearCookie("parallel_session");
    res.redirect(302, url.href);
  }

  private setSession(res: Response, token: string) {
    res.cookie("parallel_session", token, {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  /** Delete session on Redis */
  private async deleteSession(token: string) {
    await this.redis.delete(
      `session:${token}:idToken`,
      `session:${token}:accessToken`,
      `session:${token}:refreshToken`
    );
  }

  /** Store session on Redis */
  private async storeSession(session: CognitoSession) {
    const token = random(48);
    await Promise.all([
      this.redis.set(`session:${token}:idToken`, session.IdToken, this.EXPIRY),
      this.redis.set(
        `session:${token}:accessToken`,
        session.AccessToken,
        this.EXPIRY
      ),
      this.redis.set(
        `session:${token}:refreshToken`,
        session.RefreshToken,
        this.EXPIRY
      ),
    ]);
    return token;
  }

  private async updateSession(token: string, session: CognitoSession) {
    await Promise.all([
      this.redis.set(`session:${token}:idToken`, session.IdToken, this.EXPIRY),
      this.redis.set(
        `session:${token}:accessToken`,
        session.AccessToken,
        this.EXPIRY
      ),
    ]);
  }

  private getContextData(req: IncomingMessage): ContextDataType {
    return {
      IpAddress: getClientIp(req)!,
      HttpHeaders: Object.entries(req.headers)
        .flatMap(([name, value]) =>
          value === undefined
            ? []
            : Array.isArray(value)
            ? value.map((v) => [name, v] as const)
            : [[name, value] as const]
        )
        .map(([name, value]) => ({ headerName: name, headerValue: value })),
      ServerName: this.config.misc.parallelUrl,
      ServerPath: req.url!,
    };
  }

  private async initiateAuth(
    email: string,
    password: string,
    req: IncomingMessage
  ) {
    return await this.cognito
      .adminInitiateAuth({
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
        ContextData: this.getContextData(req),
      })
      .promise();
  }

  private async respondToNewPasswordRequiredChallenge(
    session: string,
    email: string,
    newPassword: string,
    req: Request
  ) {
    return await this.cognito
      .adminRespondToAuthChallenge({
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          NEW_PASSWORD: newPassword,
        },
        ContextData: this.getContextData(req),
      })
      .promise();
  }

  private async refreshToken(refreshToken: string, req: IncomingMessage) {
    return this.cognito
      .adminInitiateAuth({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
        ContextData: this.getContextData(req),
      })
      .promise();
  }

  private getTokenFromRequest(req: IncomingMessage): string | null {
    const cookies = parseCookie(req.headers.cookie ?? "");
    return cookies["parallel_session"] ?? null;
  }

  async validateSession(req: IncomingMessage) {
    try {
      const token = this.getTokenFromRequest(req);
      if (!token) {
        return null;
      }
      const idToken = await this.redis.get(`session:${token}:idToken`);
      if (idToken === null) {
        return null;
      }
      const payload = decode(idToken) as any;
      const expiresAt = payload["exp"] as number;
      const cognitoId = payload["cognito:username"] as string;
      if (Date.now() > expiresAt * 1000) {
        const refreshToken = await this.redis.get(
          `session:${token}:refreshToken`
        );
        if (refreshToken === null) {
          return null;
        }
        const auth = await this.refreshToken(refreshToken, req);
        if (auth.AuthenticationResult) {
          await this.updateSession(token, auth.AuthenticationResult as any);
        } else {
          return null;
        }
      }
      return this.users.loadUserByCognitoId(cognitoId);
    } catch (error) {
      return null;
    }
  }

  async changePassword(
    req: IncomingMessage,
    password: string,
    newPassword: string
  ) {
    const token = this.getTokenFromRequest(req);
    const accessToken = await this.redis.get(`session:${token}:accessToken`);
    await this.cognito
      .changePassword({
        AccessToken: accessToken!,
        PreviousPassword: password,
        ProposedPassword: newPassword,
      })
      .promise();
  }
}

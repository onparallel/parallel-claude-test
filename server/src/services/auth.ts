import AWS from "aws-sdk";
import {
  AuthenticationResultType,
  ContextDataType,
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import { parse as parseCookie } from "cookie";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { IncomingMessage } from "http";
import { inject, injectable } from "inversify";
import { decode } from "jsonwebtoken";
import fetch from "node-fetch";
import { isDefined, pick } from "remeda";
import { getClientIp } from "request-ip";
import { Memoize } from "typescript-memoize";
import { URL, URLSearchParams } from "url";
import { CONFIG, Config } from "../config";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { SystemRepository } from "../db/repositories/SystemRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { User } from "../db/__types";
import { withError } from "../util/promises/withError";
import { random } from "../util/token";
import { Aws, AWS_SERVICE } from "./aws";
import { IRedis, REDIS } from "./redis";

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
    @inject(REDIS) private redis: IRedis,
    @inject(AWS_SERVICE) public readonly aws: Aws,
    private orgs: OrganizationRepository,
    private integrations: IntegrationRepository,
    private users: UserRepository,
    private system: SystemRepository
  ) {}

  async guessLogin(req: Request, res: Response, next: NextFunction) {
    const { email, locale, redirect } = req.body;
    const [, domain] = email.split("@");
    try {
      const sso = await this.integrations.loadSSOIntegrationByDomain(domain);
      if (sso) {
        const org = (await this.orgs.loadOrg(sso.org_id))!;
        const provider = (sso.settings as IntegrationSettings<"SSO">).COGNITO_PROVIDER;
        const url = `https://${this.config.cognito.domain}/oauth2/authorize?${new URLSearchParams({
          identity_provider: provider,
          redirect_uri: `${this.config.misc.parallelUrl}/api/auth/callback`,
          response_type: "code",
          client_id: this.config.cognito.clientId,
          scope: "aws.cognito.signin.user.admin email openid profile",
          state: Buffer.from(
            new URLSearchParams({
              orgId: org.id.toString(),
              ...(locale ? { locale: locale.toString() } : {}),
              ...(redirect ? { redirect: redirect.toString() } : {}),
            }).toString()
          ).toString("base64"),
        })}`;
        res.json({ type: "SSO", url });
      } else {
        res.json({ type: "PASSWORD" });
      }
    } catch (error: any) {
      next(error);
    }
  }

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const state = new URLSearchParams(
        Buffer.from(req.query.state as string, "base64").toString("ascii")
      );
      const orgId = state.has("orgId") ? parseInt(state.get("orgId")!) : null;
      if (!isDefined(orgId) || Number.isNaN(orgId)) {
        throw new Error("Invalid state");
      }
      const org = await this.orgs.loadOrg(orgId);
      if (!isDefined(org)) {
        throw new Error("Invalid state");
      }
      if (isDefined(org.custom_host) && org.custom_host !== req.hostname) {
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        return res.redirect(
          302,
          `${protocol}://${org.custom_host}/api/auth/callback?${new URLSearchParams({
            code: req.query.code as string,
            state: req.query.state as string,
          })}`
        );
      }
      const url = `https://${this.config.cognito.domain}/oauth2/token?${new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.cognito.clientId,
        redirect_uri: `${this.config.misc.parallelUrl}/api/auth/callback`,
        code: req.query.code as string,
      })}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const tokens = await response.json();
      const payload = decode(tokens["id_token"]) as any;
      const cognitoId = payload["cognito:username"] as string;
      const firstName = payload["given_name"] as string;
      const lastName = payload["family_name"] as string;
      const email = (payload["email"] as string).toLowerCase();
      const externalId = payload["identities"][0].userId as string;
      let user = await this.users.loadUserByEmail(email);
      if (isDefined(user) && user.org_id !== orgId) {
        throw new Error("Invalid user");
      }
      if (!isDefined(user)) {
        const [, domain] = email.split("@");
        const integration = await this.integrations.loadSSOIntegrationByDomain(domain);
        if (!isDefined(integration) || integration.org_id !== orgId) {
          throw new Error("Invalid user");
        }
        user = await this.users.createUser(
          {
            first_name: firstName,
            last_name: lastName,
            email: email,
            cognito_id: cognitoId,
            org_id: org.id,
            is_sso_user: true,
            external_id: externalId,
            details: { source: "SSO" },
          },
          `OrganizationSSO:${org.id}`
        );
      } else {
        if (
          user.first_name !== firstName ||
          user.last_name !== lastName ||
          user.cognito_id !== cognitoId ||
          user.external_id !== externalId
        ) {
          await this.users.updateUserById(
            user.id,
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
      await this.trackSessionLogin(user);
      const token = await this.storeSession({
        IdToken: tokens["id_token"],
        AccessToken: tokens["access_token"],
        RefreshToken: tokens["refresh_token"],
      });
      this.setSession(res, token);
      const prefix =
        user.details?.preferredLocale ?? state.has("locale") ? `/${state.get("locale")}` : "";
      const path =
        state.has("redirect") && state.get("redirect")!.startsWith("/")
          ? state.get("redirect")!
          : "/app";
      res.redirect(302, prefix + path);
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const auth = await this.initiateAuth(email, password, req);
      if (auth.AuthenticationResult) {
        const token = await this.storeSession(auth.AuthenticationResult as any);
        const user = await this.getUserFromAuthenticationResult(auth.AuthenticationResult);
        await this.trackSessionLogin(user);
        this.setSession(res, token);
        res.status(201).send({ preferredLocale: user.details?.preferredLocale });
      } else if (auth.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        res.status(401).send({ error: "NewPasswordRequired" });
      } else {
        res.status(401).send({ error: "UnknownError" });
      }
    } catch (error: any) {
      switch (error.code) {
        case "PasswordResetRequiredException":
          res.status(401).send({ error: "PasswordResetRequired" });
          return;
        case "UserNotConfirmedException":
          res.status(401).send({ error: "UserNotConfirmedException" });
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
        const user = await this.getUserFromAuthenticationResult(challenge.AuthenticationResult);
        await this.trackSessionLogin(user);
        const token = await this.storeSession(challenge.AuthenticationResult as any);
        this.setSession(res, token);
        res.status(201).send({});
      } else {
        res.status(401).send({ error: "UnknownError" });
      }
    } catch (error: any) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email, locale } = req.body;
    try {
      const user = await this.users.loadUserByEmail(email);
      if (user?.is_sso_user) {
        res.status(401).send({ error: "ExternalUser" });
        return;
      } else {
        await this.aws.forgotPassword(email, { locale });
        res.status(204).send();
      }
    } catch (error: any) {
      switch (error.code) {
        case "NotAuthorizedException":
          const [, data] = await withError(this.aws.getUser(email));
          if (data?.UserStatus === "FORCE_CHANGE_PASSWORD") {
            // cognito user is in status FORCE_CHANGE_PASSWORD, can't reset the password
            res.status(401).send({ error: "ForceChangePasswordException" });
          } else if (!data) {
            // if the user is SSO, adminGetUser will throw an UserNotFoundException
            res.status(401).send({ error: "ExternalUser" });
          }
          return;
        case "UserNotFoundException":
          // don't leak whether users exist or not
          res.status(204).send();
          return;
        case "InvalidParameterException":
          // email is not yet verified, cognito can't reset the password
          res.status(401).send({ error: "EmailNotVerifiedException" });
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
    } catch (error: any) {
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
    const state = new URLSearchParams(
      Buffer.from(req.cookies["parallel_logout"] ?? "", "base64").toString("ascii")
    );
    const path = state.has("locale") ? `/${state.get("locale")!}/login` : "/login";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = state.has("hostname")
      ? `${protocol}://${state.get("hostname")}`
      : this.config.misc.parallelUrl;
    res.redirect(302, host + path);
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const cookie = req.cookies["parallel_session"];
    await this.deleteSession(cookie);
    res.clearCookie("parallel_session");
    // if custom hostname pass hostname to canonical hostname for later redirect in logout/callback
    if (req.hostname !== new URL(this.config.misc.parallelUrl).hostname) {
      return res.redirect(
        302,
        `${this.config.misc.parallelUrl}/api/auth/logout?${new URLSearchParams({
          ...(req.query.locale ? { locale: req.query.locale as string } : {}),
          hostname: req.hostname,
        })}`
      );
    }
    const state = Buffer.from(
      new URLSearchParams(pick(req.query, ["locale", "hostname"]) as any).toString()
    ).toString("base64");
    res.cookie("parallel_logout", state, {
      maxAge: 30000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.redirect(
      302,
      `https://${this.config.cognito.domain}/logout?${new URLSearchParams({
        logout_uri: `${this.config.misc.parallelUrl}/api/auth/logout/callback`,
        client_id: this.config.cognito.clientId,
      })}`
    );
  }

  private async getUserFromAuthenticationResult(result: AuthenticationResultType) {
    const payload = decode(result.IdToken!) as any;
    const cognitoId = payload["cognito:username"] as string;
    return await this.users.loadUserByCognitoId(cognitoId);
  }

  private async trackSessionLogin(user: User) {
    await this.system.createEvent({
      type: "USER_LOGGED_IN",
      data: { user_id: user.id },
    });
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
    const { IdToken, AccessToken, RefreshToken } = session;
    const prefix = `session:${token}`;
    await Promise.all([
      this.redis.set(`${prefix}:idToken`, IdToken, this.EXPIRY),
      this.redis.set(`${prefix}:accessToken`, AccessToken, this.EXPIRY),
      this.redis.set(`${prefix}:refreshToken`, RefreshToken, this.EXPIRY),
    ]);
    return token;
  }

  private async updateSession(token: string, session: CognitoSession) {
    const { IdToken, AccessToken } = session;
    const prefix = `session:${token}`;
    await Promise.all([
      this.redis.set(`${prefix}:idToken`, IdToken, this.EXPIRY),
      this.redis.set(`${prefix}:accessToken`, AccessToken, this.EXPIRY),
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

  private async initiateAuth(email: string, password: string, req: IncomingMessage) {
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
        const refreshToken = await this.redis.get(`session:${token}:refreshToken`);
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
    } catch (error: any) {
      return null;
    }
  }

  async changePassword(req: IncomingMessage, password: string, newPassword: string) {
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

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { email, code, locale } = req.query as { email: string; code: string; locale: string };
    try {
      const user = await req.context.users.loadUserByEmail(email);
      if (user) {
        await this.cognito
          .confirmSignUp({
            ClientId: this.config.cognito.clientId,
            ConfirmationCode: code,
            Username: email,
          })
          .promise();
        await req.context.system.createEvent({
          type: "EMAIL_VERIFIED",
          data: {
            user_id: user.id,
          },
        });
      }
    } catch {}
    res.redirect(`${process.env.PARALLEL_URL}/${locale}/login`);
  }
}

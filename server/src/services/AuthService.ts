import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminRespondToAuthChallengeCommandOutput,
  AdminUpdateUserAttributesCommand,
  AuthenticationResultType,
  ChangePasswordCommand,
  CodeMismatchException,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ContextDataType,
  ExpiredCodeException,
  ForgotPasswordCommand,
  InvalidParameterException,
  InvalidPasswordException,
  LimitExceededException,
  NotAuthorizedException,
  PasswordResetRequiredException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  UserNotConfirmedException,
  UserNotFoundException,
} from "@aws-sdk/client-cognito-identity-provider";
import { parse as parseCookie } from "cookie";
import DataLoader from "dataloader";
import { differenceInMinutes } from "date-fns";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { IncomingMessage } from "http";
import { inject, injectable } from "inversify";
import { decode } from "jsonwebtoken";
import { isNonNullish, isNullish, pick } from "remeda";
import { getClientIp } from "request-ip";
import { assert } from "ts-essentials";
import { Memoize } from "typescript-memoize";
import { URL, URLSearchParams } from "url";
import { CONFIG, Config } from "../config";
import { User, UserLocale, UserLocaleValues } from "../db/__types";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { SystemRepository } from "../db/repositories/SystemRepository";
import { UserAuthenticationRepository } from "../db/repositories/UserAuthenticationRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { ApolloError, ForbiddenError } from "../graphql/helpers/errors";
import { awsLogger } from "../util/awsLogger";
import { fullName } from "../util/fullName";
import { withError } from "../util/promises/withError";
import { withForcedDelay } from "../util/promises/withForcedDelay";
import { random } from "../util/token";
import { Maybe, MaybePromise } from "../util/types";
import { ACCOUNT_SETUP_SERVICE, IAccountSetupService } from "./AccountSetupService";
import { EMAILS, IEmailsService } from "./EmailsService";
import { FETCH_SERVICE, IFetchService } from "./FetchService";
import { IJwtService, JWT_SERVICE } from "./JwtService";
import { ILogger, LOGGER } from "./Logger";
import { IRedis, REDIS } from "./Redis";

export interface IAuth {
  guessLogin: RequestHandler;
  callback: RequestHandler;
  login: RequestHandler;
  logout: RequestHandler;
  logoutCallback: RequestHandler;
  newPassword: RequestHandler;
  forgotPassword: RequestHandler;
  confirmForgotPassword: RequestHandler;
  verifyEmail: RequestHandler;
  validateRequestAuthentication(req: IncomingMessage): Promise<[User] | [User, User] | null>;
  generateTempAuthToken(userId: number): MaybePromise<string>;
  changePassword(req: IncomingMessage, password: string, newPassword: string): Promise<void>;
  updateSessionLogin(req: Request, userId: number, asUserId: number): Promise<void>;
  restoreSessionLogin(req: Request, userId: number): Promise<void>;
  resetTempPassword(email: string, locale: UserLocale): Promise<void>;
  verifyCaptcha(captcha: string, ip: string): Promise<boolean>;
  getOrCreateCognitoUser(
    email: string,
    password: string | null,
    firstName: string,
    lastName: string,
    clientMetadata: {
      organizationName: string;
      organizationUser: string;
      locale: UserLocale;
    },
    sendInviteEmail?: boolean,
  ): Promise<string>;
  signUpUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clientMetadata: {
      locale: UserLocale;
    },
  ): Promise<string>;
  resendVerificationCode(
    email: string,
    clientMetadata: {
      locale: UserLocale;
    },
  ): Promise<void>;

  resetUserPassword(
    email: string,
    clientMetadata: {
      organizationName: string;
      organizationUser: string;
      locale: UserLocale;
    },
  ): Promise<void>;
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

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(REDIS) private redis: IRedis,
    @inject(LOGGER) private logger: ILogger,
    @inject(ACCOUNT_SETUP_SERVICE) public readonly accountSetup: IAccountSetupService,
    @inject(JWT_SERVICE) private jwt: IJwtService,
    @inject(EMAILS) private emails: IEmailsService,
    @inject(OrganizationRepository) private orgs: OrganizationRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(UserAuthenticationRepository) private userAuthentication: UserAuthenticationRepository,
    @inject(SystemRepository) private system: SystemRepository,
    @inject(FETCH_SERVICE) private fetchService: IFetchService,
  ) {}

  @Memoize() private get cognitoIdP() {
    return new CognitoIdentityProviderClient({
      ...this.config.aws,
      logger: awsLogger(this.logger),
    });
  }

  /**
   * Creates a user in Cognito (or gets it if already exists) and returns the cognito Id
   */
  async getOrCreateCognitoUser(
    email: string,
    password: string | null,
    firstName: string,
    lastName: string,
    clientMetadata: {
      organizationName: string;
      organizationUser: string;
      locale: UserLocale;
    },
    sendInviteEmail?: boolean,
  ) {
    try {
      const user = await this.getUser(email);
      if (sendInviteEmail) {
        await this.emails.sendInvitationEmail(
          user.Username!,
          false,
          clientMetadata.locale,
          clientMetadata.organizationName,
          clientMetadata.organizationUser,
        );
      }
      return user.Username!;
    } catch (error: any) {
      if (error instanceof UserNotFoundException) {
        const res = await this.cognitoIdP.send(
          new AdminCreateUserCommand({
            UserPoolId: this.config.cognito.defaultPoolId,
            Username: email,
            TemporaryPassword: password ?? undefined,
            MessageAction: sendInviteEmail ? undefined : "SUPPRESS",
            UserAttributes: [
              { Name: "email", Value: email },
              { Name: "given_name", Value: firstName },
              { Name: "family_name", Value: lastName },
            ],
            ClientMetadata: clientMetadata,
          }),
        );
        return res.User!.Username!;
      }

      throw error;
    }
  }

  /**
    signs up a user in AWS Cognito, and returns the new user's cognito_id
  */
  async signUpUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clientMetadata: {
      locale: UserLocale;
    },
  ) {
    const res = await this.cognitoIdP.send(
      new SignUpCommand({
        Username: email,
        Password: password,
        ClientId: this.config.cognito.clientId,
        ClientMetadata: clientMetadata,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "given_name", Value: firstName },
          { Name: "family_name", Value: lastName },
        ],
      }),
    );

    return res.UserSub!;
  }

  async resendVerificationCode(
    email: string,
    clientMetadata: {
      locale: UserLocale;
    },
  ) {
    await this.cognitoIdP.send(
      new ResendConfirmationCodeCommand({
        ClientId: this.config.cognito.clientId,
        Username: email,
        ClientMetadata: clientMetadata,
      }),
    );
  }

  async verifyCaptcha(captcha: string, ip: string) {
    const url = `https://google.com/recaptcha/api/siteverify?${new URLSearchParams({
      secret: this.config.recaptcha.secretKey,
      response: captcha,
      remoteip: ip,
    })}`;
    const response = await this.fetchService.fetch(url);
    const body = await response.json();
    return body.success ?? false;
  }

  async guessLogin(req: Request, res: Response, _next: NextFunction) {
    const { email, locale, redirect } = req.body;
    assert(typeof email === "string", "Invalid body");
    const [, domain] = email.split("@");
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
          }).toString(),
        ).toString("base64"),
      })}`;
      res.json({ type: "SSO", url });
    } else {
      res.json({ type: "PASSWORD" });
    }
  }

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      if (typeof req.query.state !== "string" || typeof req.query.code !== "string") {
        throw new Error("Invalid state");
      }
      const state = new URLSearchParams(
        Buffer.from(req.query.state as string, "base64").toString("ascii"),
      );
      const orgId = state.has("orgId") ? parseInt(state.get("orgId")!) : null;
      if (isNullish(orgId) || Number.isNaN(orgId)) {
        throw new Error("Invalid state");
      }
      const org = await this.orgs.loadOrg(orgId);
      if (isNullish(org)) {
        throw new Error("Invalid state");
      }
      if (isNonNullish(org.custom_host) && org.custom_host !== req.hostname) {
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        return res.redirect(
          302,
          `${protocol}://${org.custom_host}/api/auth/callback?${new URLSearchParams({
            code: req.query.code as string,
            state: req.query.state as string,
          })}`,
        );
      }
      const url = `https://${this.config.cognito.domain}/oauth2/token?${new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.cognito.clientId,
        redirect_uri: `${this.config.misc.parallelUrl}/api/auth/callback`,
        code: req.query.code as string,
      })}`;
      const response = await this.fetchService.fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if ("error" in errorData && errorData.error === "invalid_grant") {
          throw new Error("Invalid state");
        }

        throw new Error(
          `Failed to get oauth tokens: ${response.status} ${response.statusText} ${errorData}`,
        );
      }

      const tokens = await response.json();
      const payload = decode(tokens["id_token"]) as any;
      const cognitoId = payload["cognito:username"] as string;
      const firstName = payload["given_name"] as string;
      const lastName = payload["family_name"] as string;
      const email = (payload["email"] as string).trim().toLowerCase();
      const externalId = payload["identities"][0].userId as string;
      const users = await this.users.loadUsersByEmail(email);
      let user = users.find((u) => u.org_id === orgId);
      const userData = user ? await this.users.loadUserData(user.user_data_id) : null;
      if (isNullish(user)) {
        const [, domain] = email.split("@");
        const integration = await this.integrations.loadSSOIntegrationByDomain(domain);
        if (isNullish(integration) || integration.org_id !== orgId) {
          throw new Error("Invalid user");
        }
        // before creating a new user, check if already exists one with the same cognito_id or external_id
        // if so, update its user_data.email
        user =
          (await this.users.loadUsersByCognitoId(cognitoId)).find((u) => u.org_id === orgId) ??
          (await this.users.loadUserByExternalId({ externalId, orgId })) ??
          undefined;

        if (isNullish(user)) {
          const preferredLocale = this.asUserLocale(state.get("locale"));
          user = await this.accountSetup.createUser(
            {
              org_id: org.id,
              external_id: externalId,
            },
            {
              first_name: firstName,
              last_name: lastName,
              email: email,
              cognito_id: cognitoId,
              is_sso_user: true,
              details: {
                source: "SSO",
              },
              preferred_locale: preferredLocale,
            },
            `OrganizationSSO:${org.id}`,
          );
        } else {
          await this.users.updateUserData(
            user.user_data_id,
            {
              email,
              first_name: firstName,
              last_name: lastName,
              cognito_id: cognitoId,
              is_sso_user: true,
            },
            `OrganizationSSO:${org.id}`,
          );
          if (user.external_id !== externalId) {
            await this.users.updateUserById(
              user.id,
              { external_id: externalId },
              `OrganizationSSO:${org.id}`,
            );
          }
        }
      } else {
        if (userData) {
          if (
            userData.first_name !== firstName ||
            userData.last_name !== lastName ||
            userData.cognito_id !== cognitoId
          ) {
            await this.users.updateUserData(
              userData.id,
              {
                first_name: firstName,
                last_name: lastName,
                cognito_id: cognitoId,
                is_sso_user: true,
              },
              `OrganizationSSO:${org.id}`,
            );
          }
          if (user.external_id !== externalId) {
            await this.users.updateUserById(
              user.id,
              { external_id: externalId },
              `OrganizationSSO:${org.id}`,
            );
          }
        }
      }
      await this.trackSessionLogin(req, user);
      const token = await this.storeSessionInRedis({
        IdToken: tokens["id_token"],
        AccessToken: tokens["access_token"],
        RefreshToken: tokens["refresh_token"],
      });
      this.setSession(res, token);
      const prefix =
        (userData?.preferred_locale ?? state.has("locale")) ? `/${state.get("locale")}` : "";
      const path =
        state.has("redirect") && state.get("redirect")!.startsWith("/")
          ? state.get("redirect")!
          : "/app";
      res.redirect(302, prefix + path);
    } catch (e) {
      if (e instanceof Error && e.message === "Invalid state") {
        return res.redirect(302, "/login");
      }
      next(e);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      assert(typeof email === "string" && typeof password === "string", "Invalid body");
      req.context.logger.info(`Login attempt for ${email}`);
      const auth = await this.initiateAuth(email, password, this.getContextData(req));
      if (auth.AuthenticationResult) {
        const token = await this.storeSessionInRedis(auth.AuthenticationResult as any);
        const user = await this.getUserFromAuthenticationResult(auth.AuthenticationResult);
        if (!user) {
          const inactiveUser = await this.getInactiveUserFromAuthenticationResult(
            auth.AuthenticationResult,
          );
          if (inactiveUser) {
            res.status(401).send({ error: "InactiveUser" });
            return;
          }
          // there is no ACTIVE nor INACTIVE user in any ACTIVE organization,
          // so, all user organizations should be INACTIVE or CHURNED
          res.status(401).send({ error: "InactiveOrganization" });
          return;
        }
        const userData = await this.users.loadUserData(user.user_data_id);
        await this.trackSessionLogin(req, user);
        this.setSession(res, token);
        res.status(201).send({ preferredLocale: userData!.preferred_locale });
      } else if (auth.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        res.status(401).send({ error: "NewPasswordRequired" });
      } else {
        res.status(401).send({ error: "UnknownError" });
      }
    } catch (error) {
      if (error instanceof PasswordResetRequiredException) {
        res.status(401).send({ error: "PasswordResetRequired" });
        return;
      } else if (error instanceof UserNotConfirmedException) {
        res.status(401).send({ error: "UserNotConfirmedException" });
        return;
      } else if (
        error instanceof UserNotFoundException ||
        error instanceof NotAuthorizedException
      ) {
        res.status(401).send({ error: "InvalidUsernameOrPassword" });
        return;
      }

      if (error instanceof Error) {
        req.context.logger.error(error.message, {
          stack: error.stack,
          body: { email: req.body.email }, // be careful not to expose the password!
        });
      }
      res.status(401).send({ error: "InvalidUsernameOrPassword" });
    }
  }

  async newPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, newPassword } = req.body;
      assert(
        typeof email === "string" &&
          typeof password === "string" &&
          typeof newPassword === "string",
        "Invalid body",
      );
      const auth = await this.initiateAuth(email, password, this.getContextData(req));
      if (auth.ChallengeName !== "NEW_PASSWORD_REQUIRED") {
        return res.status(401).send({ error: "UnknownError" });
      }
      const challenge = await this.respondToNewPasswordRequiredChallenge(
        auth.Session!,
        email,
        newPassword,
        this.getContextData(req),
      );
      if (challenge.AuthenticationResult) {
        const user = await this.getUserFromAuthenticationResult(challenge.AuthenticationResult);
        if (!user) {
          res.status(401).send({ error: "UnknownError" });
          return;
        }
        await this.cognitoIdP.send(
          new AdminUpdateUserAttributesCommand({
            Username: email,
            UserPoolId: this.config.cognito.defaultPoolId,
            UserAttributes: [{ Name: "email_verified", Value: "true" }],
          }),
        );
        await this.trackSessionLogin(req, user);
        const token = await this.storeSessionInRedis(challenge.AuthenticationResult as any);
        this.setSession(res, token);
        res.status(201).send({});
      } else {
        res.status(401).send({ error: "UnknownError" });
      }
    } catch (error) {
      if (error instanceof InvalidPasswordException || error instanceof NotAuthorizedException) {
        res.status(403).send({ error: "InvalidPasswordException" });
      } else {
        next(error);
      }
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email, locale } = req.body;
    assert(typeof email === "string", "Invalid body");
    const [, cognitoUser] = await withError(this.getUser(email));
    try {
      if (cognitoUser?.UserStatus === "FORCE_CHANGE_PASSWORD") {
        // cognito user is in status FORCE_CHANGE_PASSWORD, can't reset the password
        res.status(401).send({ error: "ForceChangePasswordException" });
        return;
      }
      const [user] = await this.users.loadUsersByEmail(email.trim().toLowerCase());
      const userData = user ? await this.users.loadUserData(user.user_data_id) : null;
      if (userData?.is_sso_user) {
        res.status(401).send({ error: "ExternalUser" });
        return;
      } else {
        await this.cognitoIdP.send(
          new ForgotPasswordCommand({
            ClientId: this.config.cognito.clientId,
            Username: email,
            ClientMetadata: { locale },
          }),
        );
        res.status(204).send();
      }
    } catch (error) {
      if (error instanceof LimitExceededException) {
        res.status(429).send({ error: "LimitExceededException" });
        return;
      } else if (error instanceof NotAuthorizedException) {
        if (!cognitoUser) {
          // if the user is SSO, adminGetUser will throw a UserNotFoundException
          res.status(401).send({ error: "ExternalUser" });
        }
        return;
      } else if (error instanceof UserNotFoundException) {
        // don't leak whether users exist or not
        res.status(204).send();
        return;
      } else if (error instanceof InvalidParameterException) {
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
      assert(
        typeof email === "string" &&
          typeof verificationCode === "string" &&
          typeof newPassword === "string",
        "Invalid body",
      );
      this.logger.info(`Confirming forgot password for ${email}`);
      await withForcedDelay(
        async () =>
          await this.cognitoIdP.send(
            new ConfirmForgotPasswordCommand({
              ClientId: this.config.cognito.clientId,
              Username: email,
              Password: newPassword,
              ConfirmationCode: verificationCode,
            }),
          ),
        { minDelay: 2000, maxDelay: 3000 },
      );
      res.status(204).send();
    } catch (error: any) {
      if (error instanceof InvalidPasswordException) {
        res.status(400).send({ error: "InvalidPassword" });
        return;
      } else if (error instanceof LimitExceededException) {
        res.status(429).send({ error: "LimitExceededException" });
      } else if (
        error instanceof ExpiredCodeException ||
        error instanceof CodeMismatchException ||
        error instanceof UserNotFoundException
      ) {
        res.status(400).send({ error: "InvalidVerificationCode" });
        return;
      }

      next(error);
    }
  }

  async logoutCallback(req: Request, res: Response, next: NextFunction) {
    const state = new URLSearchParams(
      Buffer.from(req.cookies["parallel_logout"] ?? "", "base64").toString("ascii"),
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
    await this.deleteSessionFromRedis(cookie);
    res.clearCookie("parallel_session");
    // if custom hostname pass hostname to canonical hostname for later redirect in logout/callback
    if (req.hostname !== new URL(this.config.misc.parallelUrl).hostname) {
      return res.redirect(
        302,
        `${this.config.misc.parallelUrl}/api/auth/logout?${new URLSearchParams({
          ...(req.query.locale ? { locale: req.query.locale as string } : {}),
          hostname: req.hostname,
        })}`,
      );
    }
    const state = Buffer.from(
      new URLSearchParams(pick(req.query, ["locale", "hostname"]) as any).toString(),
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
      })}`,
    );
  }

  private async findFirstUserWithActiveOrganization(users: User[]) {
    if (users.length === 0) {
      return null;
    }

    const orgs = (await this.orgs.loadOrg(users.map((u) => u.org_id))).filter(isNonNullish);
    // return first user with an active organization
    return (
      users.find((u) => {
        const org = orgs.find((o) => o.id === u.org_id);
        return org && !["INACTIVE", "CHURNED"].includes(org.status);
      }) ?? null
    );
  }

  /**
   * returns first ACTIVE user on an ACTIVE organization by a cognitoId
   */
  private async getUserFromAuthenticationResult(result: AuthenticationResultType) {
    if (result.IdToken) {
      const payload = decode(result.IdToken) as any;
      const cognitoId = payload["cognito:username"] as string;
      const users = await this.users.loadUsersByCognitoId(cognitoId);
      return await this.findFirstUserWithActiveOrganization(users);
    } else {
      return null;
    }
  }

  /**
   * returns first INACTIVE user on an ACTIVE organization by a cognitoId
   */
  private async getInactiveUserFromAuthenticationResult(result: AuthenticationResultType) {
    try {
      if (result.IdToken) {
        const payload = decode(result.IdToken) as any;
        const cognitoId = payload["cognito:username"] as string;
        const users = await this.users.loadInactiveUsersByCognitoId(cognitoId);
        return await this.findFirstUserWithActiveOrganization(users);
      } else {
        return null;
      }
    } catch {}
    return null;
  }

  private async trackSessionLogin(request: IncomingMessage, user: User) {
    await this.system.createEvent({
      type: "USER_LOGGED_IN",
      data: {
        user_id: user.id,
        ip_address: getClientIp(request),
        user_agent: request.headers["user-agent"] ?? null,
      },
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

  private async deleteSessionFromRedis(token: string) {
    await Promise.all([
      this.redis.delete(`session:${token}:idToken`),
      this.redis.delete(`session:${token}:accessToken`),
      this.redis.delete(`session:${token}:refreshToken`),
      this.redis.delete(`session:${token}:meta`),
    ]);
  }

  private async storeSessionInRedis(session: CognitoSession) {
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
              : [[name, value] as const],
        )
        .map(([name, value]) => ({ headerName: name, headerValue: value })),
      ServerName: this.config.misc.parallelUrl,
      ServerPath: req.url!,
    };
  }

  async validateRequestAuthentication(req: IncomingMessage): Promise<[User] | [User, User] | null> {
    return (
      (await this.validateSession(req)) ??
      (await this.validateTempAuthToken(req)) ??
      (await this.validateUserAuthToken(req))
    );
  }

  private getSessionToken(req: IncomingMessage): string | null {
    const cookies = parseCookie(req.headers.cookie ?? "");
    return cookies["parallel_session"] ?? null;
  }

  private getBearerToken(req: IncomingMessage): string | null {
    const authorization = req.headers.authorization;
    if (authorization?.startsWith("Bearer ")) {
      return authorization.replace(/^Bearer /, "");
    }
    return null;
  }

  /**
   * session users must have status ACTIVE to be valid
   * and their organization must have a status different from INACTIVE or CHURNED
   */
  private async validateSession(req: IncomingMessage) {
    const token = this.getSessionToken(req);
    if (!token) {
      return null;
    }
    const result = await this.getUserFromToken.load({ token, req });
    this.getUserFromToken.clearAll();
    if (isNonNullish(result)) {
      const [user, realUser] = result;
      if (user.status !== "ACTIVE" || (isNonNullish(realUser) && realUser.status !== "ACTIVE")) {
        return null;
      }

      const org = await this.orgs.loadOrg(user.org_id);
      const realOrg = isNonNullish(realUser) ? await this.orgs.loadOrg(realUser.org_id) : null;
      if (
        isNullish(org) ||
        org.status === "INACTIVE" ||
        org.status === "CHURNED" ||
        realOrg?.status === "INACTIVE" ||
        realOrg?.status === "CHURNED"
      ) {
        return null;
      }
    }

    return result;
  }

  // When the same query contains different fields at the Query level, the authorizers will be
  // called for each one of them. This will in turn call validateSession many times. To avoid executing
  // the logic more than once we use a DataLoader to process all requests happening within the same
  // Node tick. The DataLoader is cleared right after.
  private getUserFromToken = new DataLoader<
    { token: string; req: IncomingMessage },
    [User] | [User, User] | null,
    string
  >(
    async (payloads) => {
      // It will always be called with the same token so we just use the first element
      const { token, req } = payloads[0];
      const result = await (async () => {
        try {
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
            const auth = await this.refreshToken(refreshToken, this.getContextData(req));
            if (auth.AuthenticationResult) {
              await this.updateSession(token, auth.AuthenticationResult as any);
            } else {
              return null;
            }
          }
          const meta = await this.redis.get(`session:${token}:meta`);
          const users = await this.users.loadUsersByCognitoId(cognitoId);
          if (isNonNullish(meta)) {
            const { userId, asUserId } = JSON.parse(meta) as {
              userId: number;
              asUserId?: number;
            };
            const user = users.find((u) => u.id === userId);
            if (isNullish(user)) {
              // who dis
              return null;
            }
            if (isNonNullish(asUserId) && asUserId !== user.id) {
              const userPermissions = await this.users.loadUserPermissions(user.id);
              // make sure user can ghost login
              if (
                !userPermissions.includes("USERS:GHOST_LOGIN") &&
                !userPermissions.includes("SUPERADMIN")
              ) {
                return null;
              }
              const org = (await this.orgs.loadOrg(user.org_id))!;
              const asUser = await this.users.loadUser(asUserId);
              if (isNullish(asUser)) {
                // who dis
                return null;
              }
              if (org.status === "ROOT" || user.org_id === asUser.org_id) {
                return [asUser, user] as [User, User];
              } else {
                return null;
              }
            } else {
              return [user] as [User];
            }
          }
          const user = await this.findFirstUserWithActiveOrganization(users);
          if (user) {
            return [user] as [User];
          }
          return null;
        } catch (error) {
          this.logger.error(error);
          return null;
        }
      })();
      return payloads.map(() => result);
    },
    { cacheKeyFn: (payload) => payload.token },
  );

  /**
   * users from auth token must have status ACTIVE to be valid
   * and their organization must have a status different from INACTIVE or CHURNED
   */
  private async validateUserAuthToken(req: IncomingMessage): Promise<[User] | null> {
    const token = this.getBearerToken(req);
    if (!token) {
      return null;
    }
    const user = await this.userAuthentication.getUserFromUat(token);
    if (isNullish(user) || user.status !== "ACTIVE") {
      return null;
    }
    const org = await this.orgs.loadOrg(user.org_id);
    if (isNullish(org) || org.status === "INACTIVE" || org.status === "CHURNED") {
      return null;
    }

    return [user];
  }

  /**
   * users from temp auth token can have ACTIVE or ON_HOLD status to be valid
   * and their organization must have a status different from INACTIVE or CHURNED
   */
  private async validateTempAuthToken(req: IncomingMessage): Promise<[User] | null> {
    const token = this.getBearerToken(req);
    if (!token || !token.includes(".")) {
      return null;
    }
    try {
      const { userId } = await this.jwt.verify(token);
      const user = await this.users.loadUser(userId);
      if (isNullish(user) || !["ACTIVE", "ON_HOLD"].includes(user.status)) {
        return null;
      }
      const org = await this.orgs.loadOrg(user.org_id);
      if (isNullish(org) || org.status === "INACTIVE" || org.status === "CHURNED") {
        return null;
      }

      return [user];
    } catch {
      return null;
    }
  }

  async generateTempAuthToken(userId: number) {
    return await this.jwt.sign({ userId }, { expiresIn: 30 });
  }

  async changePassword(req: IncomingMessage, password: string, newPassword: string) {
    const token = this.getSessionToken(req);
    const accessToken = await this.redis.get(`session:${token}:accessToken`);
    await this.cognitoIdP.send(
      new ChangePasswordCommand({
        AccessToken: accessToken!,
        PreviousPassword: password,
        ProposedPassword: newPassword,
      }),
    );
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { email, code, locale } = req.query as {
      email: string;
      code: string;
      locale: UserLocale;
    };
    try {
      const [user] = await req.context.users.loadUsersByEmail(email.trim().toLowerCase());
      if (user) {
        await this.cognitoIdP.send(
          new ConfirmSignUpCommand({
            ClientId: this.config.cognito.clientId,
            ConfirmationCode: code,
            Username: email,
          }),
        );
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

  async updateSessionLogin(req: Request, userId: number, asUserId: number) {
    const asUser = await this.users.loadUser(asUserId);
    if (process.env.ENV === "production" && asUser!.org_id === 43791) {
      throw new Error(`Can't login as ${asUserId}`);
    }
    const token = this.getSessionToken(req);
    if (isNullish(token)) {
      throw new Error("Missing session token");
    }
    await this.redis.set(
      `session:${token}:meta`,
      JSON.stringify({ userId, asUserId }),
      this.EXPIRY,
    );
  }

  async restoreSessionLogin(req: Request, userId: number) {
    const token = this.getSessionToken(req);
    if (isNullish(token)) {
      throw new Error("Missing session token");
    }
    await this.redis.set(`session:${token}:meta`, JSON.stringify({ userId }), this.EXPIRY);
  }

  async resetTempPassword(email: string, locale: UserLocale) {
    const [users, cognitoUser] = await Promise.all([
      this.users.loadUsersByEmail(email.trim().toLowerCase()),
      this.getUser(email),
    ]);
    const definedUsers = users.filter(isNonNullish);
    const user = await this.findFirstUserWithActiveOrganization(definedUsers);
    if (!user) {
      throw new ForbiddenError("Not authorized");
    }

    if (user.status === "INACTIVE") {
      throw new ApolloError(`Wrong user status`, "RESET_USER_PASSWORD_INACTIVE_ERROR");
    }

    const [organization, userData] = await Promise.all([
      user ? await this.orgs.loadOrg(user.org_id) : null,
      user ? await this.users.loadUserData(user.user_data_id) : null,
    ]);

    if (
      cognitoUser.UserLastModifiedDate &&
      // allow 1 reset every hour
      differenceInMinutes(new Date(), cognitoUser.UserLastModifiedDate) < 60
    ) {
      throw new ApolloError(
        `An invitation has been sent to this user in the last hour`,
        "RESET_USER_PASSWORD_TIME_RESTRICTION",
      );
    }

    // user already changed their tmp password
    if (cognitoUser.UserStatus !== "FORCE_CHANGE_PASSWORD" || isNonNullish(user.last_active_at)) {
      throw new ApolloError(`Wrong user status`, "RESET_USER_PASSWORD_STATUS_ERROR");
    }

    if (user && organization && userData && !userData.is_sso_user) {
      const orgOwner = await this.orgs.getOrganizationOwner(organization.id);
      const orgOwnerData = await this.users.loadUserData(orgOwner.user_data_id);
      if (!orgOwnerData) {
        throw new ApolloError(`UserData not found`, "USER_DATA_NOT_FOUND");
      }

      await this.resetUserPassword(email, {
        locale,
        organizationName: organization.name,
        organizationUser: fullName(orgOwnerData.first_name, orgOwnerData.last_name),
      });
    } else {
      throw new ApolloError(`User has SSO configured`, "RESET_USER_PASSWORD_SSO_ERROR");
    }
  }

  async resetUserPassword(
    email: string,
    clientMetadata: {
      organizationName: string;
      organizationUser: string;
      locale: UserLocale;
    },
  ): Promise<void> {
    await this.cognitoIdP.send(
      new AdminCreateUserCommand({
        UserPoolId: this.config.cognito.defaultPoolId,
        Username: email,
        MessageAction: "RESEND",
        ClientMetadata: clientMetadata,
      }),
    );
  }

  private async initiateAuth(email: string, password: string, contextData: ContextDataType) {
    return await this.cognitoIdP.send(
      new AdminInitiateAuthCommand({
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
        ContextData: contextData,
      }),
    );
  }

  private async respondToNewPasswordRequiredChallenge(
    session: string,
    email: string,
    password: string,
    contextData: ContextDataType,
  ): Promise<AdminRespondToAuthChallengeCommandOutput> {
    return await this.cognitoIdP.send(
      new AdminRespondToAuthChallengeCommand({
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          NEW_PASSWORD: password,
        },
        ContextData: contextData,
      }),
    );
  }

  private async getUser(email: string) {
    return await this.cognitoIdP.send(
      new AdminGetUserCommand({
        Username: email,
        UserPoolId: this.config.cognito.defaultPoolId,
      }),
    );
  }

  private async refreshToken(refreshToken: string, contextData: ContextDataType) {
    return await this.cognitoIdP.send(
      new AdminInitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
        ContextData: contextData,
      }),
    );
  }

  private asUserLocale(locale: Maybe<string>): UserLocale {
    if (UserLocaleValues.some((value) => value === locale)) {
      return locale as UserLocale;
    }
    return "en";
  }
}

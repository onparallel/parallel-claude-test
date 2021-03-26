import AWS from "aws-sdk";
import DataLoader from "dataloader";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { inject, injectable } from "inversify";
import { decode } from "jsonwebtoken";
import fetch from "node-fetch";
import pMap from "p-map";
import { Memoize } from "typescript-memoize";
import { URL } from "url";
import { CONFIG, Config } from "../config";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { fromDataLoader } from "../util/fromDataLoader";
import { random } from "../util/token";
import { REDIS, Redis } from "./redis";

export interface IAuth {
  guessLogin: RequestHandler;
  callback: RequestHandler;
  login: RequestHandler;
  logout: RequestHandler;
  newPassword: RequestHandler;
  forgotPassword: RequestHandler;
  confirmForgotPassword: RequestHandler;
  validateSession: (session: string) => Promise<string | null>;
}

export const AUTH = Symbol.for("AUTH");

interface CognitoSession {
  IdToken: string;
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
    private users: UserRepository
  ) {}

  async guessLogin(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;
    const [, domain] = email.split("@");
    try {
      const org = await this.orgs.loadOrgByDomain(domain);
      if (org && org.sso_provider) {
        const url = new URL(
          `https://${this.config.cognito.domain}/oauth2/authorize`
        );
        for (const [name, value] of Object.entries({
          identity_provider: org.sso_provider,
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
      const existing = await this.users.loadUserByEmail(email);
      const org = existing
        ? await this.orgs.loadOrg(existing.org_id)
        : await this.orgs.loadOrgByDomain(email.split("@")[1]);
      if (!org) {
        throw new Error("missing org for domain");
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
          },
          `OrganizationSSO:${org.id}`
        );
      } else {
        if (
          existing.first_name !== firstName ||
          existing.last_name !== lastName ||
          existing.cognito_id !== cognitoId
        ) {
          await this.users.updateUserById(
            existing.id,
            {
              first_name: firstName,
              last_name: lastName,
              cognito_id: cognitoId,
              is_sso_user: true,
            },
            `OrganizationSSO:${org.id}`
          );
        }
      }
      const token = await this.storeSession({
        IdToken: tokens["id_token"],
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
      const auth = await this.initiateAuth(email, password);
      if (auth.AuthenticationResult) {
        const token = await this.storeSession(auth.AuthenticationResult as any);
        this.setSession(res, token);
        res.status(201).send({});
      } else if (auth.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        res.status(401).send({ error: "NewPasswordRequired" });
      } else {
        console.log(auth);
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
      const auth = await this.initiateAuth(email, password);
      if (auth.ChallengeName !== "NEW_PASSWORD_REQUIRED") {
        console.log(auth);
        return res.status(401).send({ error: "wtf" });
      }
      const challenge = await this.respondToNewPasswordRequiredChallenge(
        auth.Session!,
        email,
        newPassword
      );
      if (challenge.AuthenticationResult) {
        const token = await this.storeSession(
          challenge.AuthenticationResult as any
        );
        this.setSession(res, token);
        res.status(201).send({});
      } else {
        console.log(auth);
        res.status(401).send({ error: "UnknownError" });
      }
    } catch (error) {
      console.log(error);
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
        case "ExpiredCodeException":
        case "CodeMismatchException":
        case "UserNotFoundException":
          res.status(400).send({ error: "InvalidVerificationCode" });
          return;
      }
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const cookie = req.cookies["parallel_session"];
    await this.deleteSession(cookie);
    res.clearCookie("parallel_session");
    res.status(204).send();
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
      `session:${token}:refreshToken`
    );
  }

  /** Store session on Redis */
  private async storeSession(session: CognitoSession) {
    const token = random(48);
    await Promise.all([
      this.redis.set(`session:${token}:idToken`, session.IdToken, this.EXPIRY),
      this.redis.set(
        `session:${token}:refreshToken`,
        session.RefreshToken,
        this.EXPIRY
      ),
    ]);
    return token;
  }

  private async updateSession(token: string, session: CognitoSession) {
    await this.redis.set(
      `session:${token}:idToken`,
      session.IdToken,
      this.EXPIRY
    );
  }

  private async initiateAuth(email: string, password: string) {
    return await this.cognito
      .adminInitiateAuth({
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
      .promise();
  }

  private async respondToNewPasswordRequiredChallenge(
    session: string,
    email: string,
    newPassword: string
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
      })
      .promise();
  }

  private async refreshToken(refreshToken: string) {
    return this.cognito
      .adminInitiateAuth({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: this.config.cognito.clientId,
        UserPoolId: this.config.cognito.defaultPoolId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      })
      .promise();
  }

  validateSession = fromDataLoader(
    new DataLoader<string, string | null>(async (tokens) => {
      return await pMap(tokens as string[], async (token) => {
        try {
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
            const auth = await this.refreshToken(refreshToken);
            if (auth.AuthenticationResult) {
              await this.updateSession(token, auth.AuthenticationResult as any);
            } else {
              console.log(auth);
              return null;
            }
          }
          return cognitoId;
        } catch (error) {
          return null;
        }
      });
    })
  );
}

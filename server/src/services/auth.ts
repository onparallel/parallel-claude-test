import AWS from "aws-sdk";
import DataLoader from "dataloader";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { inject, injectable } from "inversify";
import { decode } from "jsonwebtoken";
import pMap from "p-map";
import { Memoize } from "typescript-memoize";
import { CONFIG, Config } from "../config";
import { fromDataLoader } from "../util/fromDataLoader";
import { random } from "../util/token";
import { REDIS, Redis } from "./redis";

export interface IAuth {
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
    @inject(REDIS) private redis: Redis
  ) {}

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const auth = await this.initiateAuth(email, password);
      if (auth.AuthenticationResult) {
        const token = await this.storeSession(auth.AuthenticationResult as any);
        this.setSession(res, token);
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
    res.status(201).send({});
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

import { NextFunction, Request, Response } from "express";
import { injectable } from "inversify";
import { Cognito } from "./cognito";
import { Redis } from "./redis";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { randomBytes } from "crypto";
import { promisify } from "util";
import jwtDecode from "jwt-decode";
import { fromDataLoader } from "../util/fromDataLoader";
import DataLoader from "dataloader";
import async from "async";

@injectable()
export class Auth {
  private readonly EXPIRY = 30 * 24 * 60 * 60;

  constructor(private cognito: Cognito, private redis: Redis) {}

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const session = await this.cognito.login(email, password);
      const token = await this.storeSession(session);
      this.setSession(res, token);
    } catch (error) {
      switch (error.code) {
        case "NewPasswordRequired":
          res.status(401).send({ error: "NewPasswordRequired" });
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
      const session = await this.cognito.completeNewPasword(
        email,
        password,
        newPassword
      );
      const token = await this.storeSession(session);
      this.setSession(res, token);
      return;
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await this.cognito.forgotPassword(email);
      res.status(204).send();
    } catch (error) {
      switch (error.code) {
        case "UserNotFoundException":
          // don't leak wether users exist or not
          res.status(204);
          return;
      }
      next(error);
    }
  }

  async confirmForgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, verificationCode, newPassword } = req.body;
      await this.cognito.confirmPassword(email, verificationCode, newPassword);
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
      sameSite: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    res.status(201).send({ token });
  }

  private async deleteSession(token: string) {
    await this.redis.delete(
      `session:${token}:idToken`,
      `session:${token}:refreshToken`
    );
  }

  private async storeSession(session: CognitoUserSession, token?: string) {
    if (!token) {
      const buffer = await promisify(randomBytes)(48);
      token = buffer.toString("hex");
    }
    const idToken = session.getIdToken().getJwtToken();
    const refreshToken = session.getRefreshToken().getToken();
    await this.redis.set(`session:${token}:idToken`, idToken, this.EXPIRY);
    await this.redis.set(
      `session:${token}:refreshToken`,
      refreshToken,
      this.EXPIRY
    );
    return token;
  }

  validateSession = fromDataLoader(
    new DataLoader<string, string>(async tokens => {
      return await async.map(tokens as string[], async token => {
        try {
          const idToken = await this.redis.get(`session:${token}:idToken`);
          if (idToken === null) {
            return null;
          }
          const {
            exp: expiresAt,
            "cognito:username": cognitoId,
            email
          } = jwtDecode(idToken);
          if (Date.now() > expiresAt * 1000) {
            const refreshToken = await this.redis.get(
              `session:${token}:refreshToken`
            );
            if (refreshToken === null) {
              return null;
            }
            const session = await this.cognito.refreshSession(
              email,
              refreshToken
            );
            await this.storeSession(session, token);
          }
          return cognitoId;
        } catch (error) {
          return null;
        }
      });
    })
  );
}

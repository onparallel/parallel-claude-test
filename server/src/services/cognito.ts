import {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { inject, injectable } from "inversify";
import { promisify } from "util";
import { Config, CONFIG } from "../config";

@injectable()
export class Cognito {
  constructor(@inject(CONFIG) private config: Config) {}

  private getPool() {
    return new CognitoUserPool({
      ClientId: this.config.cognito.clientId,
      UserPoolId: this.config.cognito.defaultPoolId,
    });
  }

  private getUser(email: string) {
    return new CognitoUser({
      Username: email,
      Pool: this.getPool(),
    });
  }

  async login(email: string, password: string) {
    const user = this.getUser(email);
    return await new Promise<CognitoUserSession>((resolve, reject) =>
      user.authenticateUser(
        new AuthenticationDetails({
          Username: email,
          Password: password,
        }),
        {
          onSuccess: resolve,
          onFailure: reject,
          newPasswordRequired: () => reject({ code: "NewPasswordRequired" }),
        }
      )
    );
  }

  async forgotPassword(email: string) {
    return await new Promise<any>((resolve, reject) =>
      this.getUser(email).forgotPassword({
        onSuccess: reject, // it should always go through inputVerificationCode
        onFailure: reject,
        inputVerificationCode: resolve,
      })
    );
  }

  async confirmPassword(
    email: string,
    verificationCode: string,
    newPasword: string
  ) {
    return await new Promise<any>((resolve, reject) =>
      this.getUser(email).confirmPassword(verificationCode, newPasword, {
        onSuccess: resolve,
        onFailure: reject,
      })
    );
  }

  async completeNewPasword(
    email: string,
    password: string,
    newPassword: string
  ) {
    const user = this.getUser(email);
    return await new Promise<CognitoUserSession>((resolve, reject) =>
      user.authenticateUser(
        new AuthenticationDetails({
          Username: email,
          Password: password,
        }),
        {
          onSuccess: resolve,
          onFailure: reject,
          newPasswordRequired: () =>
            user.completeNewPasswordChallenge(newPassword, [], {
              onSuccess: resolve,
              onFailure: reject,
            }),
        }
      )
    );
  }

  async changePassword(email: string, password: string, newPassword: string) {
    const user = this.getUser(email);
    await new Promise((resolve, reject) =>
      user.authenticateUser(
        new AuthenticationDetails({
          Username: email,
          Password: password,
        }),
        {
          onSuccess: resolve,
          onFailure: reject,
        }
      )
    );
    return await promisify(user.changePassword.bind(user))(
      password,
      newPassword
    );
  }

  async refreshSession(email: string, refreshToken: string) {
    const user = this.getUser(email);
    return new Promise<CognitoUserSession>((resolve, reject) => {
      user.refreshSession(
        new CognitoRefreshToken({
          RefreshToken: refreshToken,
        }),
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
  }
}

import { ClientMetadataType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { Handler, json, Router } from "express";
import { Config } from "../config";
import { buildEmail } from "../emails/buildEmail";
import AccountVerification from "../emails/emails/AccountVerification";
import ForgotPassword from "../emails/emails/ForgotPassword";
import Invitation from "../emails/emails/Invitation";
import { fullName } from "../util/fullName";

interface CustomMessageRequest {
  userAttributes: {
    email: string;
    given_name?: string;
    family_name?: string;
  };
  codeParameter: string;
  usernameParameter: string | null;
  clientMetadata: ClientMetadataType;
}

function layoutProps(config: Config["misc"]) {
  return {
    assetsUrl: config.assetsUrl,
    parallelUrl: config.parallelUrl,
    logoUrl: `${config.assetsUrl}/static/emails/logo.png`,
    logoAlt: "Parallel",
  };
}

function authenticateLambdaRequest(): Handler {
  return (req, res, next) => {
    if (req.headers.authorization !== `Bearer ${process.env.AWS_LAMBDA_PARALLEL_SECRET}`) {
      res.sendStatus(401).end();
    } else {
      next();
    }
  };
}

function customMessageAccountVerificationResponse(): Handler {
  return async (req, res) => {
    try {
      const {
        userAttributes: { given_name: firstName, family_name: lastName, email },
        clientMetadata: { locale },
        codeParameter,
      } = req.body;

      const { subject, html } = await buildEmail(
        AccountVerification,
        {
          userName: fullName(firstName, lastName) || email,
          activationUrl: `${
            process.env.PARALLEL_URL
          }/api/auth/verify-email?email=${encodeURIComponent(
            email
          )}&code=${codeParameter}&locale=${locale}`,
          ...layoutProps(req.context.config.misc),
        },
        { locale }
      );

      res.json({
        emailSubject: subject,
        emailMessage: html,
      });
    } catch (error: any) {
      req.context.logger.error(error?.message, { stack: error?.stack });
      res.sendStatus(500).end();
    }
  };
}

function customMessageUserInviteResponse(): Handler {
  return async (req, res) => {
    try {
      const {
        userAttributes: { given_name: firstName },
        clientMetadata: { organizationName, organizationUser, locale },
        usernameParameter,
        codeParameter,
      } = req.body as CustomMessageRequest;

      const { subject, html } = await buildEmail(
        Invitation,
        {
          email: usernameParameter!,
          password: codeParameter,
          userName: firstName!,
          organizationName: organizationName!,
          organizationUser: organizationUser!,
          isNewUser: true, // invites sent by aws cognito will always be on new users
          ...layoutProps(req.context.config.misc),
        },
        { locale }
      );

      res.json({
        emailSubject: subject,
        emailMessage: html,
      });
    } catch (error: any) {
      req.context.logger.error(error?.message, { stack: error?.stack });
      res.sendStatus(500).end();
    }
  };
}

function customMessageForgotPasswordResponse(): Handler {
  return async (req, res) => {
    try {
      const {
        userAttributes: { given_name: firstName },
        clientMetadata: { locale },
        codeParameter,
      } = req.body as CustomMessageRequest;

      const { subject, html } = await buildEmail(
        ForgotPassword,
        {
          name: firstName!,
          verificationCode: codeParameter,
          ...layoutProps(req.context.config.misc),
        },
        { locale }
      );

      res.json({
        emailSubject: subject,
        emailMessage: html,
      });
    } catch (error: any) {
      req.context.logger.error(error?.message, { stack: error?.stack });
      res.sendStatus(500).end();
    }
  };
}

export const lambdas = Router()
  .use(authenticateLambdaRequest())
  .use(json())
  .post("/CustomMessage_SignUp", customMessageAccountVerificationResponse())
  .post("/CustomMessage_ResendCode", customMessageAccountVerificationResponse())
  .post("/CustomMessage_AdminCreateUser", customMessageUserInviteResponse())
  .post("/CustomMessage_ForgotPassword", customMessageForgotPasswordResponse());

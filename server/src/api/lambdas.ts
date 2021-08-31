import { ClientMetadataType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { Handler, json, Router } from "express";
import { Config } from "../config";
import { buildEmail } from "../emails/buildEmail";
import AccountVerification from "../emails/components/AccountVerification";
import Invitation from "../emails/components/Invitation";
import ForgotPassword from "../emails/components/ForgotPassword";
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
  };
}

function customMessageUserInviteResponse(): Handler {
  return async (req, res) => {
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
        ...layoutProps(req.context.config.misc),
      },
      { locale }
    );

    res.json({
      emailSubject: subject,
      emailMessage: html,
    });
  };
}

function customMessageForgotPasswordResponse(): Handler {
  return async (req, res) => {
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
  };
}

export const lambdas = Router()
  .use(authenticateLambdaRequest())
  .use(json())
  .post("/CustomMessage_SignUp", customMessageAccountVerificationResponse())
  .post("/CustomMessage_ResendCode", customMessageAccountVerificationResponse())
  .post("/CustomMessage_AdminCreateUser", customMessageUserInviteResponse())
  .post("/CustomMessage_ForgotPassword", customMessageForgotPasswordResponse());

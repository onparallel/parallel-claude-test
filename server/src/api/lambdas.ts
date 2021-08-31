import { ClientMetadataType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { Handler, json, Router } from "express";
import { Config } from "../config";
import { buildEmail } from "../emails/buildEmail";
import AccountVerification from "../emails/components/AccountVerification";
import Invitation from "../emails/components/Invitation";
import { fullName } from "../util/fullName";

interface CustomMessageRequest {
  userAttributes: {
    sub: string;
    email_verified: "True" | "false";
    "cognito:user_status": "CONFIRMED" | "UNCONFIRMED" | "FORCE_CHANGE_PASSWORD";
    email: string;
    given_name?: string;
    family_name?: string;
  };
  codeParameter: string;
  linkParameter: string;
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

export const lambdas = Router()
  .use(json())
  .use(authenticateLambdaRequest())
  .post("/CustomMessage_SignUp", async (req, res, next) => {
    const {
      userAttributes: { given_name: firstName, family_name: lastName, email },
      clientMetadata: { locale },
      codeParameter,
    } = req.body as CustomMessageRequest;

    const { subject, html } = await buildEmail(
      AccountVerification,
      {
        userName: fullName(firstName, lastName) || email,
        activationUrl: `${
          process.env.PARALLEL_URL
        }/api/auth/verify-email?email=${encodeURIComponent(email)}&code=${codeParameter}&locale=${
          locale || "en"
        }`,
        ...layoutProps(req.context.config.misc),
      },
      { locale: locale ?? "en" }
    );

    res.json({
      emailSubject: subject,
      emailMessage: html,
    });
  })
  .post("/CustomMessage_AdminCreateUser", async (req, res) => {
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
      { locale: locale ?? "en" }
    );

    res.json({
      emailSubject: subject,
      emailMessage: html,
    });
  })
  .post("/CustomMessage_ResendCode", async (req, res) => {
    res.json({ emailSubject: "CustomMessage_ResendCode", emailMessage: req.body });
  })
  .post("/CustomMessage_ForgotPassword", async (req, res) => {
    res.json({ emailSubject: "CustomMessage_ForgotPassword", emailMessage: req.body });
  });

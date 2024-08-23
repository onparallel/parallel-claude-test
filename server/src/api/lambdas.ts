import Ajv, { JSONSchemaType, Schema } from "ajv";
import { Handler, RequestHandler, Router, json } from "express";
import { Config } from "../config";
import { UserLocale, UserLocaleValues } from "../db/__types";
import { buildEmail } from "../emails/buildEmail";
import AccountVerification from "../emails/emails/app/AccountVerification";
import ForgotPassword from "../emails/emails/app/ForgotPassword";
import Invitation from "../emails/emails/app/Invitation";
import { defaultBrandTheme } from "../util/BrandTheme";
import { fullName } from "../util/fullName";

interface CustomMessageRequest<TMetadata> {
  userAttributes: {
    given_name: string;
    family_name: string;
    email: string;
  };
  codeParameter: string;
  usernameParameter: string | null;
  clientMetadata: TMetadata;
}

function customMessageSchema<TMetadata>(clientMetadata: JSONSchemaType<TMetadata>) {
  return {
    type: "object",
    required: ["userAttributes", "codeParameter", "clientMetadata"],
    properties: {
      userAttributes: {
        type: "object",
        required: [],
        properties: {
          given_name: { type: "string" },
          family_name: { type: "string" },
          email: { type: "string" },
        },
      },
      usernameParameter: { type: ["string", "null"] },
      codeParameter: { type: "string" },
      clientMetadata,
    },
  } as JSONSchemaType<CustomMessageRequest<TMetadata>>;
}

interface LocaleMetadata {
  locale: UserLocale;
}

interface UserInviteMetadata {
  organizationName: string;
  organizationUser: string;
  locale: UserLocale;
}

const LocaleMetadataSchema = {
  type: "object",
  required: ["locale"],
  properties: {
    locale: { type: "string", enum: UserLocaleValues },
  },
} as JSONSchemaType<LocaleMetadata>;

const UserInviteMetadataSchema = {
  type: "object",
  required: ["locale", "organizationName", "organizationUser"],
  properties: {
    locale: { type: "string", enum: UserLocaleValues },
    organizationName: { type: "string" },
    organizationUser: { type: "string" },
  },
} as JSONSchemaType<UserInviteMetadata>;

interface CustomMessageResponse {
  emailSubject: string;
  emailMessage: string;
}

type CustomMessageRequestHandler<TMetadata> = RequestHandler<
  any,
  CustomMessageResponse,
  CustomMessageRequest<TMetadata>
>;

function layoutProps(config: Config["misc"]) {
  return {
    assetsUrl: config.assetsUrl,
    parallelUrl: config.parallelUrl,
    logoUrl: `${config.assetsUrl}/static/emails/logo.png`,
    logoAlt: "Parallel",
    theme: defaultBrandTheme,
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

function customMessageAccountVerificationResponse(): CustomMessageRequestHandler<LocaleMetadata> {
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
            email,
          )}&code=${codeParameter}&locale=${locale}`,
          ...layoutProps(req.context.config.misc),
        },
        { locale },
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

function customMessageUserInviteResponse(): CustomMessageRequestHandler<UserInviteMetadata> {
  return async (req, res) => {
    try {
      const {
        userAttributes: { given_name: firstName },
        clientMetadata: { organizationName, organizationUser, locale },
        usernameParameter,
        codeParameter,
      } = req.body;

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
        { locale },
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

function customMessageForgotPasswordResponse(): CustomMessageRequestHandler<LocaleMetadata> {
  return async (req, res) => {
    try {
      const {
        userAttributes: { given_name: firstName },
        clientMetadata: { locale },
        codeParameter,
      } = req.body;

      const { subject, html } = await buildEmail(
        ForgotPassword,
        {
          name: firstName!,
          verificationCode: codeParameter,
          ...layoutProps(req.context.config.misc),
        },
        { locale },
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

function verifyRequestPayload(schema: Schema): RequestHandler {
  return (req, res, next) => {
    const ajv = new Ajv();
    const valid = ajv.validate(schema, req.body);
    if (valid) {
      next();
    } else {
      res.status(422).json({
        code: "InvalidRequestBody",
        messge: ajv.errorsText(),
      });
    }
  };
}

export const lambdas = Router()
  .use(authenticateLambdaRequest())
  .use(json())
  .post(
    "/CustomMessage_SignUp",
    verifyRequestPayload(customMessageSchema(LocaleMetadataSchema)),
    customMessageAccountVerificationResponse(),
  )
  .post(
    "/CustomMessage_ResendCode",
    verifyRequestPayload(customMessageSchema(LocaleMetadataSchema)),
    customMessageAccountVerificationResponse(),
  )
  .post(
    "/CustomMessage_AdminCreateUser",
    verifyRequestPayload(customMessageSchema(UserInviteMetadataSchema)),
    customMessageUserInviteResponse(),
  )
  .post(
    "/CustomMessage_ForgotPassword",
    verifyRequestPayload(customMessageSchema(LocaleMetadataSchema)),
    customMessageForgotPasswordResponse(),
  );

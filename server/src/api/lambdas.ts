import { Router } from "express";
import { buildEmail } from "../emails/buildEmail";
import AccountVerification from "../emails/components/AccountVerification";
import { fullName } from "../util/fullName";
import { getLayoutProps } from "../workers/helpers/getLayoutProps";

interface CustomMessageRequest {
  userAttributes: {
    sub: string;
    email_verified: "True" | "false";
    "cognito:user_status": "CONFIRMED" | "UNCONFIRMED" | "FORCE_CHANGE_PASSWORD";
    email: string;
    locale?: string;
    given_name?: string;
    family_name?: string;
  };
  codeParameter: string;
  linkParameter: string;
  usernameParameter: string | null;
}

export const lambdas = Router()
  .post("/CustomMessage_SignUp", async (req, res) => {
    const {
      userAttributes: {
        sub: cognitoId,
        given_name: firstName,
        family_name: lastName,
        email,
        locale,
      },
      codeParameter,
    } = req.body as CustomMessageRequest;
    const user = await req.context.users.loadUserByCognitoId(cognitoId);
    const layoutProps = await getLayoutProps(user!.org_id, req.context);

    const { subject, html } = await buildEmail(
      AccountVerification,
      {
        userName: fullName(firstName, lastName) || email,
        activationUrl: `${
          process.env.PARALLEL_URL
        }/api/auth/verify-email?email=${encodeURIComponent(email)}&code=${codeParameter}&locale=${
          locale || "en"
        }`,
        ...layoutProps,
      },
      { locale: locale ?? "en" }
    );

    res.json({ emailSubject: subject, emailMessage: html });
  })
  .post("CustomMessage_AdminCreateUser", async (req, res) => {
    res.json({ emailSubject: "CustomMessage_AdminCreateUser", emailMessage: req.body });
  })
  .post("CustomMessage_ResendCode", async (req, res) => {
    res.json({ emailSubject: "CustomMessage_ResendCode", emailMessage: req.body });
  })
  .post("CustomMessage_ForgotPassword", async (req, res) => {
    res.json({ emailSubject: "CustomMessage_ForgotPassword", emailMessage: req.body });
  });

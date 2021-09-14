import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer } from "../common/texts";
import { UserMessageBox } from "../common/UserMessageBox";
import { FORMATS } from "../utils/dates";

export type AccessDelegatedEmailProps = {
  senderName: string;
  senderEmail: string;
  petitionOwnerFullName: string;
  petitionOwnerEmail: string;
  emailSubject: string | null;
  bodyHtml: string;
  bodyPlainText: string;
  deadline: Date | null;
  keycode: string;
} & LayoutProps;

const email: Email<AccessDelegatedEmailProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ senderName, emailSubject }, intl) {
    return intl.formatMessage(
      {
        id: "access-delegated-email.subject",
        defaultMessage:
          "{senderName} has invited you to collaborate on {subject, select, null{a petition} other{{subject}}}",
      },
      {
        senderName,
        subject: emailSubject,
      }
    );
  },
  text(
    {
      senderName,
      senderEmail,
      petitionOwnerFullName,
      petitionOwnerEmail,
      bodyPlainText,
      deadline,
      keycode,
      parallelUrl,
    },
    intl
  ) {
    return outdent`
      ${intl.formatMessage(
        {
          id: "access-delegated.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has asked you to complete the information requested by {petitionOwnerFullName} ({petitionOwnerEmail}):",
        },
        { senderName, senderEmail, petitionOwnerFullName, petitionOwnerEmail }
      )}

      ${bodyPlainText}
      ${
        deadline
          ? outdent`

            ${intl.formatMessage(
              {
                id: "generic.submit-text.with-deadline",
                defaultMessage:
                  "This information has been requested to be submitted before {deadline}.",
              },
              { deadline: intl.formatDate(deadline, FORMATS.LLL) }
            )}

          `
          : ""
      }
      ${intl.formatMessage({
        id: "generic.complete-information-click-link",
        defaultMessage: "Please click the link below to complete the information.",
      })}
      ${parallelUrl}/${intl.locale}/petition/${keycode}
      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    senderName,
    senderEmail,
    petitionOwnerFullName,
    petitionOwnerEmail,
    bodyHtml,
    deadline,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: AccessDelegatedEmailProps) {
    const { locale } = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection padding="0 0 16px 0">
          <MjmlText>
            <FormattedMessage
              id="access-delegated.text"
              defaultMessage="{senderName} ({senderEmail}) has asked you to complete the information requested by {petitionOwnerFullName} ({petitionOwnerEmail}):"
              values={{
                senderName: <b>{senderName}</b>,
                senderEmail: <b>{senderEmail}</b>,
                petitionOwnerFullName: <b>{petitionOwnerFullName}</b>,
                petitionOwnerEmail: <b>{petitionOwnerEmail}</b>,
              }}
            />
          </MjmlText>
        </MjmlSection>

        <UserMessageBox dangerouslySetInnerHTML={bodyHtml} />

        <MjmlSection paddingTop="10px">
          <MjmlColumn>
            {deadline ? (
              <MjmlText>
                <FormattedMessage
                  id="generic.submit-text.with-deadline"
                  defaultMessage="This information has been requested to be submitted before {deadline}."
                  values={{
                    deadline: (
                      <span style={{ textDecoration: "underline" }}>
                        <DateTime value={deadline} format={FORMATS.LLL} />
                      </span>
                    ),
                  }}
                />
              </MjmlText>
            ) : null}
            <MjmlSpacer height="10px" />
            <CompleteInfoButton href={`${parallelUrl}/${locale}/petition/${keycode}`} />
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

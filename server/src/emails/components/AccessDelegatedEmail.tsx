import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingFormal } from "../common/texts";
import { FORMATS } from "../utils/dates";

export type AccessDelegatedEmailProps = {
  fullName: string | null;
  senderName: string;
  senderEmail: string;
  petitionOwnerFullName: string;
  petitionOwnerEmail: string;
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
  subject({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "access-delegated-email.subject",
        defaultMessage: "You have a message from {senderName}",
      },
      {
        senderName,
      }
    );
  },
  text(
    {
      fullName,
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
      ${greetingFormal({ fullName }, intl)}
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
        defaultMessage:
          "Please click the link below to complete the information.",
      })}
      ${parallelUrl}/${intl.locale}/petition/${keycode}
      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    fullName,
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
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        showGdprDisclaimer
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <GreetingFormal fullName={fullName} />
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
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection padding="0 20px">
          <MjmlColumn
            backgroundColor="#f6f6f6"
            borderRadius="4px"
            padding="10px 0"
          >
            <MjmlText>
              <div dangerouslySetInnerHTML={{ __html: bodyHtml }}></div>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
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
            <CompleteInfoButton
              href={`${parallelUrl}/${locale}/petition/${keycode}`}
            />
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

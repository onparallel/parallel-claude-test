import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingFormal } from "../common/texts";

export type AccessDelegatedEmailProps = {
  fullName: string | null;
  senderName: string;
  senderEmail: string;
  petitionOwnerFullName: string;
  petitionOwnerEmail: string;
  bodyHtml: string;
  bodyPlainText: string;
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

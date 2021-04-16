import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingFormal } from "../common/texts";

export type PetitionMessageProps = {
  contactFullName: string;
  senderName: string;
  senderEmail: string;
  subject: string | null;
  bodyHtml: string;
  bodyPlainText: string;
  keycode: string;
} & LayoutProps;

const email: Email<PetitionMessageProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ subject }) {
    return subject || "";
  },
  text(
    {
      contactFullName,
      senderName,
      senderEmail,
      bodyPlainText,
      keycode,
      parallelUrl,
    },
    intl
  ) {
    return outdent`
      ${greetingFormal({ fullName: contactFullName }, intl)}
      ${intl.formatMessage(
        {
          id: "new-petition.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has sent you the following petition:",
        },
        { senderName, senderEmail }
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
    contactFullName,
    senderName,
    senderEmail,
    bodyHtml,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionMessageProps) {
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
            <GreetingFormal fullName={contactFullName} />
            <MjmlText>
              <FormattedMessage
                id="new-petition.text"
                defaultMessage="{senderName} ({senderEmail}) has sent you the following petition:"
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
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

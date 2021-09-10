import { MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage } from "react-intl";
import { Email } from "../buildEmail";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingFormal } from "../common/texts";
import { UserMessageBox } from "../common/UserMessageBox";

export type PetitionClosedNotificationProps = {
  contactFullName: string;
  senderName: string;
  senderEmail: string;
  bodyHtml: string;
  bodyPlainText: string;
} & LayoutProps;

const email: Email<PetitionClosedNotificationProps> = {
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
        id: "petition-closed-notification.subject",
        defaultMessage: "{senderName} confirmed receipt of the information.",
      },
      { senderName }
    );
  },
  text({ contactFullName, senderName, senderEmail, bodyPlainText }, intl) {
    return outdent`
      ${greetingFormal({ fullName: contactFullName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-closed-notification.text",
          defaultMessage: "{senderName} ({senderEmail}) has received the information.",
        },
        { senderName, senderEmail }
      )}

      ${bodyPlainText}
      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    contactFullName,
    senderName,
    senderEmail,
    bodyHtml,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionClosedNotificationProps) {
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0 0 16px 0">
          <GreetingFormal fullName={contactFullName} />
          <MjmlText>
            <FormattedMessage
              id="petition-closed-notification.text"
              defaultMessage="{senderName} ({senderEmail}) has received the information."
              values={{
                senderName: <b>{senderName}</b>,
                senderEmail: <b>{senderEmail}</b>,
              }}
            />
          </MjmlText>
        </MjmlSection>
        <UserMessageBox bodyHtml={bodyHtml} />
        <MjmlSection>
          <Disclaimer email={senderEmail} />
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

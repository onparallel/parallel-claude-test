import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage } from "react-intl";
import { Email } from "../buildEmail";
import { Disclaimer } from "../common/Disclaimer";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer } from "../common/texts";
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
  text({ senderName, senderEmail, bodyPlainText }, intl) {
    return outdent`
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
    senderName,
    senderEmail,
    bodyHtml,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionClosedNotificationProps) {
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
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
          </MjmlColumn>
        </MjmlSection>

        <UserMessageBox dangerouslySetInnerHTML={bodyHtml} />

        <MjmlSection>
          <MjmlColumn>
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

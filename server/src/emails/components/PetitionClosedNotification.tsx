import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage } from "react-intl";
import { fullName } from "../../util/fullName";
import { toHtml, toPlainText } from "../../util/slate";
import { Email } from "../buildEmail";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingFormal } from "../common/texts";

export type PetitionClosedNotificationProps = {
  contactFirstName: string | null;
  contactLastName: string | null;
  senderName: string;
  senderEmail: string;
  body: any | null;
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
  text(
    { contactFirstName, contactLastName, senderName, senderEmail, body },
    intl
  ) {
    return outdent`
      ${greetingFormal(
        { fullName: fullName(contactFirstName, contactLastName) },
        intl
      )}
      ${intl.formatMessage(
        {
          id: "petition-closed-notification.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has received the information.",
        },
        { senderName, senderEmail }
      )}

      ${toPlainText(body, {
        contactName: contactFirstName ?? "",
      })}
      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    contactFirstName,
    contactLastName,
    senderName,
    senderEmail,
    body,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionClosedNotificationProps) {
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
            <GreetingFormal
              fullName={fullName(contactFirstName, contactLastName)}
            />
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
        <MjmlSection padding="0 20px">
          <MjmlColumn
            backgroundColor="#f6f6f6"
            borderRadius="4px"
            padding="10px 0"
          >
            <MjmlText>
              <span
                dangerouslySetInnerHTML={{
                  __html: toHtml(body, { contactName: contactFirstName ?? "" }),
                }}
              ></span>
            </MjmlText>
            <MjmlSpacer height="10px" />
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <Disclaimer email={senderEmail} />
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

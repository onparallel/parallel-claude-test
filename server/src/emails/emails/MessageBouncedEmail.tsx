import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";
import { UserMessageBox } from "../components/UserMessageBox";

export type MessageBouncedEmailProps = {
  senderName: string | null;
  contactEmail: string;
  contactFullName: string;
  petitionId: string;
  petitionName: string | null;
  bodyHtml: string;
  bodyPlainText: string;
} & LayoutProps;

const email: Email<MessageBouncedEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "petition-message-bounced.subject",
      defaultMessage: "We couldn't deliver your message",
    });
  },
  text(
    {
      senderName,
      contactEmail,
      contactFullName,
      petitionId,
      petitionName,
      parallelUrl,
      bodyPlainText,
    }: MessageBouncedEmailProps,
    intl: IntlShape
  ) {
    return outdent`
      **${intl
        .formatMessage({
          id: "generic.action-required",
          defaultMessage: "Action required",
        })
        .toUpperCase()}**

      ${greetingUser({ name: senderName }, intl)}

      ${intl.formatMessage(
        {
          id: "petition-message-bounced.intro-text",
          defaultMessage: "We couldn't deliver the petition {petitionName} you sent to {contact}:",
        },
        {
          contact: `${contactFullName} (${contactEmail})`,
          petitionName:
            petitionName ??
            intl.formatMessage({
              id: "generic.unnamed-petition",
              defaultMessage: "Unnamed petition",
            }),
        }
      )}

      ${bodyPlainText}

      ${intl.formatMessage(
        {
          id: "petition-message-bounced.intro-text-2",
          defaultMessage: "Please, verify that the email {contactEmail} is correct and try again.",
        },
        { contactEmail }
      )}

      ${intl.formatMessage({
        id: "petition-message-bounced.access-click-link",
        defaultMessage: "Follow the link below to access the petition.",
      })}
      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/activity

      ${closing({}, intl)}
    `;
  },
  html({
    bodyHtml,
    senderName,
    contactEmail,
    contactFullName,
    petitionId,
    petitionName,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: MessageBouncedEmailProps) {
    const intl = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        contentHeading={
          <MjmlSection backgroundColor="#3182CE" borderRadius="5px" padding="10px 0">
            <MjmlColumn>
              <MjmlText align="center" color="white" fontWeight={600} textTransform="uppercase">
                <FormattedMessage id="generic.action-required" defaultMessage="Action required" />
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        }
      >
        <MjmlSection padding="10px 0 0 0">
          <MjmlColumn>
            <GreetingUser name={senderName} />
            <MjmlText>
              <FormattedMessage
                id="petition-message-bounced.intro-text"
                defaultMessage="We couldn't deliver the petition {petitionName} you sent to {contact}:"
                values={{
                  contact: (
                    <b>
                      {contactFullName} ({contactEmail})
                    </b>
                  ),
                  petitionName: petitionName ? (
                    <b>{petitionName}</b>
                  ) : (
                    <i>
                      {intl.formatMessage({
                        id: "generic.unnamed-petition",
                        defaultMessage: "Unnamed petition",
                      })}
                    </i>
                  ),
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <UserMessageBox dangerouslySetInnerHTML={bodyHtml} />

        <MjmlSection>
          <MjmlColumn>
            <Button href={`${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/activity`}>
              <FormattedMessage
                id="petition-sharing-notification.access-button"
                defaultMessage="Access the petition"
              />
            </Button>
            <ClosingParallelTeam />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

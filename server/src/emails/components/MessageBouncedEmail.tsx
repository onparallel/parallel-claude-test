import { MjmlColumn, MjmlSection, MjmlText, MjmlWrapper } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";

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
      defaultMessage: "Parallel team",
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
      ${intl
        .formatMessage({
          id: "generic.action-required",
          defaultMessage: "Action required",
        })
        .toUpperCase()}

      ${greeting({ name: senderName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-message-bounced.intro-text",
          defaultMessage:
            "We couldn't deliver the petition {petitionName} you sent to {contactFullName} ({contactEmail}):",
        },
        {
          contactFullName,
          contactEmail,
          petitionName:
            petitionName ??
            intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition",
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
          <MjmlWrapper backgroundColor="#6059f7" borderRadius="3px 3px 0 0">
            <MjmlText align="center" color="white" fontWeight={600} textTransform="uppercase">
              <FormattedMessage id="generic.action-required" defaultMessage="Action required" />
            </MjmlText>
          </MjmlWrapper>
        }
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <Greeting name={senderName} />
            <MjmlText>
              <FormattedMessage
                id="petition-message-bounced.intro-text"
                defaultMessage="We couldn't deliver the petition {petitionName} you sent to {contactFullName} ({contactEmail}):"
                values={{
                  contactFullName,
                  contactEmail,
                  petitionName: petitionName ? (
                    <b>{petitionName}</b>
                  ) : (
                    <i>
                      {intl.formatMessage({
                        id: "generic.untitled-petition",
                        defaultMessage: "Untitled petition",
                      })}
                    </i>
                  ),
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection padding="0 20px">
          <MjmlColumn backgroundColor="#f6f6f6" borderRadius="4px" padding="10px 0">
            <MjmlText>
              <div dangerouslySetInnerHTML={{ __html: bodyHtml }}></div>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection>
          <MjmlColumn>
            <MjmlText>
              <FormattedMessage
                id="petition-message-bounced.intro-text-2"
                defaultMessage="Please, verify that the email {contactEmail} is correct and try again."
                values={{ contactEmail: <b>{contactEmail}</b> }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection paddingTop="0px">
          <MjmlColumn>
            <Button href={`${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/activity`}>
              <FormattedMessage
                id="petition-sharing-notification.access-button"
                defaultMessage="Access the petition here"
              />
            </Button>
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

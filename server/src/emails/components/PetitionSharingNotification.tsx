import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";
import { BreakLines } from "../common/BreakLines";

export type PetitionSharingNotificationProps = {
  name: string | null;
  petitionId: string;
  petitionName: string | null;
  ownerEmail: string;
  ownerName: string;
  message: string | null;
} & LayoutProps;

const email: Email<PetitionSharingNotificationProps> = {
  from({ ownerName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName: ownerName }
    );
  },
  subject({ petitionName }: PetitionSharingNotificationProps, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-sharing-notification.subject",
        defaultMessage: '"{petitionName}" - Petition shared with you',
      },
      { petitionName }
    );
  },
  text(
    {
      name,
      petitionId,
      petitionName,
      ownerName,
      ownerEmail,
      message,
      parallelUrl,
    }: PetitionSharingNotificationProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-sharing-notification.text",
          defaultMessage: "{ownerName} ({ownerEmail}) has shared the following petition with you.",
        },
        { ownerName, ownerEmail }
      )}

      ${
        petitionName ||
        intl.formatMessage({
          id: "generic.untitled-petition",
          defaultMessage: "Untitled petition",
        })
      }

      ${message
        ?.split(/\n/)
        .map((line) => `> ${line}`)
        .join("\n")}

      ${intl.formatMessage({
        id: "petition-sharing-notification.access-click-link",
        defaultMessage: "Follow the link below link to access it.",
      })}
      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}

      ${closing({}, intl)}
    `;
  },
  html({
    name,
    petitionId,
    petitionName,
    ownerName,
    ownerEmail,
    message,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionSharingNotificationProps) {
    const { locale } = useIntl();
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection paddingBottom={0}>
          <MjmlColumn>
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="petition-sharing-notification.text"
                defaultMessage="{ownerName} ({ownerEmail}) has shared the following petition with you."
                values={{
                  ownerName: <b>{ownerName}</b>,
                  ownerEmail,
                }}
              />
            </MjmlText>
            <MjmlText fontSize="16px" align="center">
              {petitionName ? (
                <span style={{ textDecoration: "underline" }}>{petitionName}</span>
              ) : (
                <span style={{ color: "#A0AEC0", fontStyle: "italic" }}>
                  <FormattedMessage
                    id="generic.untitled-petition"
                    defaultMessage="Untitled petition"
                  />
                </span>
              )}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        {message ? (
          <MjmlSection padding="10px 20px 0">
            <MjmlColumn backgroundColor="#f6f6f6" borderRadius="4px" padding="8px 16px">
              <MjmlText padding="0" lineHeight="24px">
                <BreakLines>{message}</BreakLines>
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        ) : null}
        <MjmlSection padding="10px 0 20px">
          <MjmlColumn>
            <Button href={`${parallelUrl}/${locale}/app/petitions/${petitionId}`}>
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

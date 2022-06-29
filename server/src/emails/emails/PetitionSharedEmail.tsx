import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { BreakLines } from "../../util/BreakLines";
import { Button } from "../components/Button";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";
import { UserMessageBox } from "../components/UserMessageBox";

export type PetitionSharedEmailProps = {
  name: string | null;
  petitionId: string;
  petitionName: string | null;
  ownerEmail: string;
  ownerName: string;
  message: string | null;
  isTemplate: boolean;
} & LayoutProps;

const email: Email<PetitionSharedEmailProps> = {
  from({ ownerName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName: ownerName }
    );
  },
  subject({ petitionName, ownerName }: PetitionSharedEmailProps, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-shared-email.subject",
        defaultMessage: "{userName} has shared {petitionName} with you",
      },
      { petitionName, userName: ownerName }
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
      isTemplate,
    }: PetitionSharedEmailProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingUser({ name }, intl)}

      ${intl.formatMessage(
        {
          id: "petition-shared-email.text",
          defaultMessage:
            "{owner} has shared the following {isTemplate, select, true{template} other{petition}} with you.",
        },
        { owner: `${ownerName} (${ownerEmail})`, ownerEmail, isTemplate }
      )}

      ${
        petitionName ||
        intl.formatMessage({
          id: "generic.unnamed-parallel",
          defaultMessage: "Unnamed parallel",
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
    isTemplate,
  }: PetitionSharedEmailProps) {
    const { locale } = useIntl();
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={name} />
            <MjmlText>
              <FormattedMessage
                id="petition-shared-email.text"
                defaultMessage="{owner} has shared the following {isTemplate, select, true{template} other{petition}} with you."
                values={{
                  owner: (
                    <b>
                      {ownerName} ({ownerEmail})
                    </b>
                  ),

                  isTemplate,
                }}
              />
            </MjmlText>
            <MjmlText fontSize="16px">
              {petitionName ? (
                <li>{petitionName}</li>
              ) : (
                <li style={{ color: "#A0AEC0", fontStyle: "italic" }}>
                  <FormattedMessage
                    id="generic.unnamed-parallel"
                    defaultMessage="Unnamed parallel"
                  />
                </li>
              )}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        {message ? (
          <UserMessageBox>
            <BreakLines>{message}</BreakLines>
          </UserMessageBox>
        ) : null}

        <MjmlSection>
          <MjmlColumn>
            <Button href={`${parallelUrl}/${locale}/app/petitions/${petitionId}`}>
              <FormattedMessage
                id="petition-shared-email.access-button"
                defaultMessage="Access the {isTemplate, select, true{template} other{petition}}"
                values={{ isTemplate }}
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

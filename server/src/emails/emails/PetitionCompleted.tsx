import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";

export type PetitionCompletedProps = {
  isSigned: boolean;
  userName: string | null;
  petitionId: string;
  petitionName: string | null;
  contactName: string;
  contactEmail: string;
} & LayoutProps;

const email: Email<PetitionCompletedProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ petitionName }: PetitionCompletedProps, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-completed.subject",
        defaultMessage: 'Parallel "{petitionName}" completed!',
      },
      { petitionName }
    );
  },
  text(
    {
      isSigned,
      userName,
      petitionId,
      petitionName,
      contactName,
      contactEmail,
      parallelUrl,
    }: PetitionCompletedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingUser({ name: userName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-completed.text",
          defaultMessage:
            "{recipient} completed {signed, select, true{and signed } other{}}the parallel you sent to him.",
        },
        { recipient: `${contactName} (${contactEmail})`, signed: isSigned }
      )}

      ${
        petitionName ||
        intl.formatMessage({
          id: "generic.unnamed-parallel",
          defaultMessage: "Unnamed parallel",
        })
      }:

      ${intl.formatMessage({
        id: "petition-completed.access-click-link",
        defaultMessage: "Follow the link below link to access the information.",
      })}
      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies

      ${closing({}, intl)}
    `;
  },
  html({
    userName,
    petitionId,
    petitionName,
    contactName,
    contactEmail,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    isSigned,
    theme,
  }: PetitionCompletedProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="petition-completed.text"
                defaultMessage="{recipient} completed {signed, select, true{and signed } other{}}the parallel you sent to him."
                values={{
                  recipient: (
                    <b>
                      {contactName} ({contactEmail})
                    </b>
                  ),
                  signed: isSigned,
                }}
              />
            </MjmlText>

            <MjmlText fontSize="16px" fontWeight={400}>
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

        <MjmlSection>
          <MjmlColumn>
            <AccessInfoButton
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies`}
            />
            <ClosingParallelTeam />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

function AccessInfoButton({ href }: { href: string }) {
  return (
    <Button href={href} fontWeight={500}>
      <FormattedMessage
        id="petition-completed.access-button"
        defaultMessage="Access the information"
      />
    </Button>
  );
}

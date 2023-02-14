import {
  MjmlColumn,
  MjmlHtmlAttribute,
  MjmlHtmlAttributes,
  MjmlSection,
  MjmlSelector,
  MjmlText,
} from "@faire/mjml-react";
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
  isManualStartSignature: boolean;
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
      isManualStartSignature,
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

      ${
        isSigned
          ? intl.formatMessage(
              {
                id: "petition-completed-and-signed.text",
                defaultMessage: "{recipient} completed and signed the parallel you sent.",
              },
              { recipient: `${contactName} (${contactEmail})` }
            )
          : isManualStartSignature
          ? intl.formatMessage(
              {
                id: "petition-completed.signature-required.text",
                defaultMessage:
                  "{recipient} completed the parallel you sent. You can access the information and start the signature to complete the process.",
              },
              { recipient: `${contactName} (${contactEmail})` }
            )
          : intl.formatMessage(
              {
                id: "petition-completed.text",
                defaultMessage: "{recipient} completed the parallel you sent.",
              },
              { recipient: `${contactName} (${contactEmail})` }
            )
      }
      
      ${
        petitionName ||
        intl.formatMessage({
          id: "generic.unnamed-parallel",
          defaultMessage: "Unnamed parallel",
        })
      }

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
    isManualStartSignature,
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
        head={
          <MjmlHtmlAttributes>
            <MjmlSelector path=".access-information a">
              <MjmlHtmlAttribute name="data-testid">access-information-button</MjmlHtmlAttribute>
            </MjmlSelector>
          </MjmlHtmlAttributes>
        }
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              {isSigned ? (
                <FormattedMessage
                  id="petition-completed-and-signed.text"
                  defaultMessage="{recipient} completed and signed the parallel you sent."
                  values={{
                    recipient: (
                      <b>
                        {contactName} ({contactEmail})
                      </b>
                    ),
                  }}
                />
              ) : isManualStartSignature ? (
                <FormattedMessage
                  id="petition-completed.signature-required.text"
                  defaultMessage="{recipient} completed the parallel you sent. You can access the information and start the signature to complete the process."
                  values={{
                    recipient: (
                      <b>
                        {contactName} ({contactEmail})
                      </b>
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="petition-completed.text"
                  defaultMessage="{recipient} completed the parallel you sent."
                  values={{
                    recipient: (
                      <b>
                        {contactName} ({contactEmail})
                      </b>
                    ),
                  }}
                />
              )}
            </MjmlText>

            <MjmlText fontSize="16px" fontWeight="400">
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
            <Button
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies`}
              fontWeight="500"
              cssClass="access-information"
            >
              <FormattedMessage
                id="petition-completed.access-button"
                defaultMessage="Access the information"
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

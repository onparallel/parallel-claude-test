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
import { BreakLines } from "../../util/BreakLines";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";
import { UserMessageBox } from "../components/UserMessageBox";

export type PetitionSharedEmailProps = {
  name: string | null;
  petitions: { globalId: string; name: string | null }[];
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
        defaultMessage: "{senderName} via Parallel",
      },
      { senderName: ownerName }
    );
  },
  subject({ petitions, ownerName, isTemplate }: PetitionSharedEmailProps, intl: IntlShape) {
    if (petitions.length > 1) {
      return intl.formatMessage(
        {
          id: "petition-shared-email.subject-multiple",
          defaultMessage:
            "{userName} has shared {amount} {isTemplate, select, true{templates} other{parallels}} with you",
        },
        { amount: petitions.length, userName: ownerName, isTemplate }
      );
    } else {
      return intl.formatMessage(
        {
          id: "petition-shared-email.subject",
          defaultMessage: "{userName} has shared {petitionName} with you",
        },
        { petitionName: petitions[0].name, userName: ownerName }
      );
    }
  },
  text(
    {
      name,
      petitions,
      ownerName,
      ownerEmail,
      message,
      parallelUrl,
      isTemplate,
    }: PetitionSharedEmailProps,
    intl: IntlShape
  ) {
    let body = "";
    if (petitions.length > 1) {
      body = outdent`
        ${intl.formatMessage(
          {
            id: "petition-shared-email.text-multiple",
            defaultMessage:
              "{owner} has shared the following {isTemplate, select, true{templates} other{parallels}} with you:",
          },
          { owner: `${ownerName} (${ownerEmail})`, isTemplate }
        )}

        ${petitions
          .map(
            ({ name }) =>
              name ||
              intl.formatMessage({
                id: "generic.unnamed-parallel",
                defaultMessage: "Unnamed parallel",
              })
          )
          .join("\n")}

        ${message
          ?.split(/\n/)
          .map((line) => `> ${line}`)
          .join("\n")}

        ${intl.formatMessage({
          id: "petition-sharing-notification.access-click-link",
          defaultMessage: "Follow the link below link to access.",
        })}
        ${parallelUrl}/${intl.locale}/app/petitions
      `;
    } else {
      body = outdent`
        ${intl.formatMessage(
          {
            id: "petition-shared-email.text",
            defaultMessage:
              "{owner} has shared the following {isTemplate, select, true{template} other{parallel}} with you.",
          },
          { owner: `${ownerName} (${ownerEmail})`, isTemplate }
        )}

        ${
          petitions[0].name ||
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
          defaultMessage: "Follow the link below link to access.",
        })}
        ${parallelUrl}/${intl.locale}/app/petitions/${petitions[0].globalId}
      `;
    }

    return outdent`
      ${greetingUser({ name }, intl)}

      ${body}

      ${closing({}, intl)}
    `;
  },
  html({
    name,
    petitions,
    ownerName,
    ownerEmail,
    message,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    isTemplate,
    theme,
  }: PetitionSharedEmailProps) {
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
            <MjmlSelector path=".go-to-parallel a">
              <MjmlHtmlAttribute name="data-testid">go-to-parallel-button</MjmlHtmlAttribute>
            </MjmlSelector>
            <MjmlSelector path=".user-message-box div">
              <MjmlHtmlAttribute name="data-testid">shared-message</MjmlHtmlAttribute>
            </MjmlSelector>
          </MjmlHtmlAttributes>
        }
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={name} />
            {petitions.length > 1 ? (
              <>
                <MjmlText>
                  <FormattedMessage
                    id="petition-shared-email.text-multiple"
                    defaultMessage="{owner} has shared the following {isTemplate, select, true{templates} other{parallels}} with you:"
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
                  {petitions.map(({ name }, key) =>
                    name ? (
                      <li key={key}>{name}</li>
                    ) : (
                      <li style={{ color: "#A0AEC0", fontStyle: "italic" }} key={key}>
                        <FormattedMessage
                          id="generic.unnamed-parallel"
                          defaultMessage="Unnamed parallel"
                        />
                      </li>
                    )
                  )}
                </MjmlText>
              </>
            ) : (
              <>
                <MjmlText>
                  <FormattedMessage
                    id="petition-shared-email.text"
                    defaultMessage="{owner} has shared the following {isTemplate, select, true{template} other{parallel}} with you."
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
                  {petitions[0].name ? (
                    <li>{petitions[0].name}</li>
                  ) : (
                    <li style={{ color: "#A0AEC0", fontStyle: "italic" }}>
                      <FormattedMessage
                        id="generic.unnamed-parallel"
                        defaultMessage="Unnamed parallel"
                      />
                    </li>
                  )}
                </MjmlText>
              </>
            )}
          </MjmlColumn>
        </MjmlSection>

        {message ? (
          <UserMessageBox>
            <BreakLines>{message}</BreakLines>
          </UserMessageBox>
        ) : null}

        <MjmlSection>
          <MjmlColumn>
            {petitions.length > 1 ? (
              <Button cssClass="go-to-parallel" href={`${parallelUrl}/${locale}/app/petitions`}>
                <FormattedMessage
                  id="petition-shared-email.go-to-parallel"
                  defaultMessage="Go to Parallel"
                />
              </Button>
            ) : (
              <Button
                cssClass="go-to-parallel"
                href={`${parallelUrl}/${locale}/app/petitions/${petitions[0].globalId}`}
              >
                <FormattedMessage
                  id="petition-shared-email.access-button"
                  defaultMessage="Access the {isTemplate, select, true{template} other{parallel}}"
                  values={{ isTemplate }}
                />
              </Button>
            )}
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

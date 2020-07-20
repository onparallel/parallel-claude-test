import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import {
  PetitionFieldList,
  PetitionFieldListProps,
} from "../common/PetitionFieldList";
import { closing, greeting, petitionFieldList } from "../common/texts";

export type PetitionCompletedProps = {
  name: string | null;
  petitionId: string;
  petitionName: string | null;
  contactNameOrEmail: string;
  fields: PetitionFieldListProps["fields"];
} & LayoutProps;

const email: Email<PetitionCompletedProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({ petitionName }: PetitionCompletedProps, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-completed.subject",
        defaultMessage: 'Petition "{petitionName}" completed!',
      },
      { petitionName }
    );
  },
  text(
    {
      name,
      petitionId,
      petitionName,
      contactNameOrEmail: recipientNameOrEmail,
      fields,
      parallelUrl,
    }: PetitionCompletedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-completed.text",
          defaultMessage: "{recipient} completed the petition you sent to him.",
        },
        { recipient: recipientNameOrEmail }
      )}

      ${
        petitionName ||
        intl.formatMessage({
          id: "generic.untitled-petition",
          defaultMessage: "Untitled petition",
        })
      }:
      ${petitionFieldList({ fields }, intl)}

      ${intl.formatMessage({
        id: "petition-completed.access-click-link",
        defaultMessage: "Follow the link below link to access the information.",
      })}
      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies

      ${closing({}, intl)}
    `;
  },
  html({
    name,
    petitionId,
    petitionName,
    contactNameOrEmail: recipientNameOrEmail,
    fields,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionCompletedProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection>
          <MjmlColumn>
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="petition-completed.text"
                defaultMessage="{recipient} completed the petition you sent to him."
                values={{
                  recipient: <b>{recipientNameOrEmail}</b>,
                }}
              />
            </MjmlText>
            <MjmlText fontSize="16px">
              {petitionName ? (
                <span style={{ textDecoration: "underline" }}>
                  {petitionName}
                </span>
              ) : (
                <span style={{ color: "#A0AEC0", fontStyle: "italic" }}>
                  <FormattedMessage
                    id="generic.untitled-petition"
                    defaultMessage="Untitled petition"
                  />
                </span>
              )}
            </MjmlText>
            <PetitionFieldList fields={fields} />
            <Button
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies`}
            >
              <FormattedMessage
                id="petition-completed.access-button"
                defaultMessage="Access the information here"
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

export const props: PetitionCompletedProps = {
  name: "Derek",
  petitionId: "1234567890",
  petitionName: "Declaración de la renta",
  contactNameOrEmail: "Santi Albo",
  fields: [
    { position: 0, id: 123, title: "DNI" },
    { position: 1, id: 235, title: "Escrituras" },
    { position: 2, id: 345, title: "Certificado de rentas del trabajo" },
    { position: 3, id: 32, title: "Prueba" },
    { position: 4, id: 6905, title: null },
  ],
  parallelUrl: "http://localhost",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};

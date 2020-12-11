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
  isSigned: boolean;
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
      isSigned,
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
          defaultMessage:
            "{recipient} completed {signed, select, true{and signed } other{}}the petition you sent to him.",
        },
        { recipient: recipientNameOrEmail, signed: isSigned }
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
    isSigned,
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
                defaultMessage="{recipient} completed {signed, select, true{and signed } other{}}the petition you sent to him."
                values={{
                  recipient: <b>{recipientNameOrEmail}</b>,
                  signed: isSigned,
                }}
              />
            </MjmlText>
            {fields.length > 10 && (
              <AccessInfoButton
                href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies`}
              />
            )}
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
            <AccessInfoButton
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies`}
            />
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

function AccessInfoButton({ href }: { href: string }) {
  return (
    <Button href={href}>
      <FormattedMessage
        id="petition-completed.access-button"
        defaultMessage="Access the information here"
      />
    </Button>
  );
}

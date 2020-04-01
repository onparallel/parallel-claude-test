import { MjmlText, MjmlSection, MjmlColumn } from "mjml-react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Closing } from "../components/Closing";
import { Button } from "../components/common/Button";
import { Greeting } from "../components/Greeting";
import { Layout } from "../components/Layout";

export interface NewPetitionProps {
  name: string;
  petitionId: string;
  petitionName: string | null;
  recipientNameOrEmail: string;
  fields: { id: string; title: string | null }[];
  parallelUrl: string;
  assetsUrl: string;
}

export default function PetitionCompleted({
  name,
  petitionId,
  petitionName,
  recipientNameOrEmail,
  fields,
  parallelUrl,
  assetsUrl,
}: NewPetitionProps) {
  const { locale } = useIntl();
  return (
    <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl}>
      <MjmlSection>
        <MjmlColumn>
          <Greeting name={name} />
          <MjmlText>
            <FormattedMessage
              id="petition-completed"
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
          <MjmlText paddingTop={0}>
            <ol style={{ margin: 0 }}>
              {fields.map(({ id, title }) => (
                <li key={id} style={{ marginTop: "10px" }}>
                  {title ? (
                    <span style={{ fontWeight: "bold" }}>{title}</span>
                  ) : (
                    <span style={{ fontStyle: "italic" }}>
                      <FormattedMessage
                        id="generic.untitled-field"
                        defaultMessage="Untitled field"
                      />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </MjmlText>
          <Button
            href={`${parallelUrl}/${locale}/petitions/${petitionId}/review`}
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
}

export const props: NewPetitionProps = {
  name: "Derek",
  petitionId: "1234567890",
  petitionName: "Declaración de la renta",
  recipientNameOrEmail: "Santi Albo",
  fields: [
    { id: "1", title: "DNI" },
    { id: "2", title: "Escrituras" },
    { id: "3", title: "Certificado de rentas del trabajo" },
    { id: "4", title: "Prueba" },
    { id: "5", title: null },
  ],
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
};

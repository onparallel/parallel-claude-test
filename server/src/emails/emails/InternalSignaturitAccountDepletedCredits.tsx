import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { Email } from "../buildEmail";
import { Layout, LayoutProps } from "../components/Layout";

type InternalSignaturitAccountDepletedCreditsProps = {
  organizationName: string;
  petitionGID: string;
  apiKeyHint: string;
} & LayoutProps;

const email: Email<InternalSignaturitAccountDepletedCreditsProps> = {
  from() {
    return "El bot de Parallel";
  },
  subject() {
    return "¡Acción necesaria!";
  },
  text({
    organizationName,
    petitionGID,
    apiKeyHint,
  }: InternalSignaturitAccountDepletedCreditsProps) {
    return outdent`
      ¡Hola!

      La organización ${organizationName} acaba de enviar a firmar un parallel con Signaturit,
      pero se canceló automáticamente porque la APIKEY que está usando se quedó sin créditos.

      APIKEY: ${apiKeyHint}...
      ID del parallel: ${petitionGID}

      Saludos,
      El bot.
    `;
  },
  html({
    organizationName,
    apiKeyHint,
    petitionGID,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
  }: InternalSignaturitAccountDepletedCreditsProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title="¡Acción necesaria!"
        tone="INFORMAL"
        omitGdprDisclaimer
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <MjmlText>¡Hola!</MjmlText>

            <MjmlText>
              La organización {organizationName} acaba de enviar a firmar un parallel con
              Signaturit, pero se canceló automáticamente porque la APIKEY que está usando se quedó
              sin créditos.
            </MjmlText>

            <MjmlText>APIKEY: {apiKeyHint}...</MjmlText>
            <MjmlText>ID del parallel: {petitionGID}</MjmlText>

            <MjmlText> Saludos, El bot.</MjmlText>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

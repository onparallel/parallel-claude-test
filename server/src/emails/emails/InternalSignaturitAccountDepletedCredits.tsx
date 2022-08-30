import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { Email } from "../buildEmail";
import { Layout, LayoutProps } from "../components/Layout";

type InternalSignaturitAccountDepletedCreditsProps = {
  organizationName: string;
  petitionGID: string;
  userEmail: string;
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
    userEmail,
    apiKeyHint,
  }: InternalSignaturitAccountDepletedCreditsProps) {
    return outdent`
      ¡Hola!

      La organización ${organizationName} acaba de enviar a firmar un parallel con Signaturit,
      pero se canceló automáticamente porque la APIKEY que está usando se quedó sin créditos.

      APIKEY: ${apiKeyHint}...
      ID del parallel: ${petitionGID}
      Email del propietario del parallel: ${userEmail}

      Saludos,
      El bot.
    `;
  },
  html({
    organizationName,
    apiKeyHint,
    petitionGID,
    userEmail,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
    theme,
  }: InternalSignaturitAccountDepletedCreditsProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title="¡Acción necesaria!"
        omitGdprDisclaimer
        theme={theme}
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
            <MjmlText>Email del propietario del parallel: {userEmail}</MjmlText>

            <MjmlText> Saludos, El bot.</MjmlText>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";

type SignatureCancelledDeclinedBySignerProps = {
  userName: string | null;
  signerName: string;
  signerEmail: string;
  petitionName: string | null;
  petitionId: string;
  signatureProvider: string;
} & LayoutProps;

const email: Email<SignatureCancelledDeclinedBySignerProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-cancelled.subject",
      defaultMessage: "Cancelled signature request",
    });
  },
  text(
    {
      userName,
      signerName,
      signerEmail,
      petitionName,
      signatureProvider,
      petitionId,
      parallelUrl,
    }: SignatureCancelledDeclinedBySignerProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingUser({ name: userName }, intl)}
      
      ${intl.formatMessage(
        {
          id: "signature-cancelled-signer-declined.text",
          defaultMessage:
            "{signerName} ({signerEmail}) has declined the signature request on {petitionName} sent through {signatureProvider}.",
        },
        {
          signerName,
          signerEmail,
          petitionName:
            petitionName ??
            intl.formatMessage({
              id: "generic.unnamed-parallel",
              defaultMessage: "Unnamed parallel",
            }),
          signatureProvider,
        }
      )}

      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies#signatures

      ${closing({}, intl)}

    `;
  },
  html({
    userName,
    signerName,
    signerEmail,
    petitionName,
    signatureProvider,
    petitionId,
    parallelUrl,
    assetsUrl,
    logoAlt,
    logoUrl,
  }: SignatureCancelledDeclinedBySignerProps) {
    const intl = useIntl();
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-signer-declined.text"
                defaultMessage="{signerName} ({signerEmail}) has declined the signature request on {petitionName} sent through {signatureProvider}."
                values={{
                  signerName,
                  signerEmail,
                  petitionName: petitionName ?? (
                    <i>
                      {intl.formatMessage({
                        id: "generic.unnamed-parallel",
                        defaultMessage: "Unnamed parallel",
                      })}
                    </i>
                  ),
                  signatureProvider,
                }}
              />
            </MjmlText>
            <Button
              href={`${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies#signatures`}
            >
              <FormattedMessage
                id="generic.access-the-parallel-button"
                defaultMessage="Access the parallel"
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

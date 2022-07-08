import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";

type SignatureCancelledRequestErrorProps = {
  userName: string;
  signers: { name: string; email: string }[];
  petitionName: string;
  petitionId: string;
} & LayoutProps;

const email: Email<SignatureCancelledRequestErrorProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-cancelled-request-error.subject",
      defaultMessage: "The eSignature could not be sent",
    });
  },
  text(
    {
      userName,
      signers,
      petitionName,
      petitionId,
      parallelUrl,
    }: SignatureCancelledRequestErrorProps,
    intl: IntlShape
  ) {
    return outdent`
    **${intl
      .formatMessage({
        id: "signature-cancelled-request-error.alert",
        defaultMessage: "Error sending eSignature",
      })
      .toUpperCase()}**

    ${greetingUser({ name: userName }, intl)}
    
    ${intl.formatMessage(
      {
        id: "signature-cancelled-request-error.text",
        defaultMessage: "We couldn't send the document on {petitionName} sent to {signers}.",
      },
      {
        petitionName,
        signers: intl.formatList(signers.map((s) => `${s.name} (${s.email})`)),
      }
    )}

    ${intl.formatMessage({
      id: "signature-cancelled-request-error.text-2",
      defaultMessage:
        "You can access the parallel through the following link to see more information about the error.",
    })}

    ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/activity

    ${intl.formatMessage({
      id: "signature-cancelled-request-error.text-3",
      defaultMessage: "If the problem persists, please contact our support team via support chat.",
    })}

    ${closing({}, intl)}

    `;
  },
  html({
    userName,
    signers,
    petitionName,
    petitionId,
    parallelUrl,
    assetsUrl,
    logoAlt,
    logoUrl,
  }: SignatureCancelledRequestErrorProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        contentHeading={
          <Alert>
            <FormattedMessage
              id="signature-cancelled-request-error.alert"
              defaultMessage="Error sending eSignature"
            />
          </Alert>
        }
      >
        <MjmlSection padding="10px 0 0 0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-request-error.text"
                defaultMessage="We couldn't send the document on {petitionName} sent to {signers}."
                values={{
                  petitionName,
                  signers: (
                    <FormattedList
                      value={signers.map((signer, i) => (
                        <Fragment key={i}>
                          {signer.name} ({signer.email})
                        </Fragment>
                      ))}
                    />
                  ),
                }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-request-error.html-2"
                defaultMessage="You can access the parallel through the following button to see more information about the error."
              />
            </MjmlText>
            <Button href={`${parallelUrl}/${locale}/app/petition/${petitionId}/activity`}>
              <FormattedMessage
                id="generic.access-the-parallel-button"
                defaultMessage="Access the parallel"
              />
            </Button>

            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-request-error.text-3"
                defaultMessage="If the problem persists, please contact our support team via support chat."
              />
            </MjmlText>
            <ClosingParallelTeam />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

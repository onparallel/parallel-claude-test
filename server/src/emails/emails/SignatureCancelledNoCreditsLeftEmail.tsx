import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";

export type SignatureCancelledNoCreditsLeftEmailProps = {
  senderName: string | null;
  orgContactName: string;
  orgContactEmail: string;
  petitionName: string | null;
  signatureProvider: string;
} & LayoutProps;

const email: Email<SignatureCancelledNoCreditsLeftEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-cancelled-no-credits-left.subject",
      defaultMessage: "eSignature couldn't be started",
    });
  },
  text(
    {
      senderName,
      petitionName,
      orgContactEmail,
      orgContactName,
      signatureProvider,
    }: SignatureCancelledNoCreditsLeftEmailProps,
    intl: IntlShape
  ) {
    return outdent`
      **${intl
        .formatMessage({
          id: "generic.action-required.signature-cancelled-no-credits-left",
          defaultMessage: "You reached your plan's signatures limit",
        })
        .toUpperCase()}**

      ${greetingUser({ name: senderName }, intl)}

      ${intl.formatMessage(
        {
          id: "signature-cancelled-no-credits-left.intro-text",
          defaultMessage:
            "The following signing process sent through {signatureProvider} could not be started because you reached your plan's signatures limit.",
        },
        { signatureProvider }
      )}

      - ${
        petitionName ||
        intl.formatMessage({ id: "generic.unnamed-parallel", defaultMessage: "Unnamed parallel" })
      }

      ${intl.formatMessage(
        {
          id: "signature-cancelled-no-credits-left.contact-org-user",
          defaultMessage:
            "Please contact {orgContactName} (<a>{orgContactEmail}</a>) so you can start the signing process.",
        },
        { a: () => orgContactEmail, orgContactEmail, orgContactName }
      )}

      ${closing({}, intl)}
    `;
  },
  html({
    senderName,
    orgContactEmail,
    orgContactName,
    petitionName,
    signatureProvider,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    theme,
  }: SignatureCancelledNoCreditsLeftEmailProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        contentHeading={
          <MjmlSection backgroundColor="#CEEDFF" borderRadius="5px" padding="10px 0">
            <MjmlColumn>
              <MjmlText align="center" color="#153E75" fontWeight={600} textTransform="uppercase">
                <FormattedMessage
                  id="generic.action-required.signature-cancelled-no-credits-left"
                  defaultMessage="You reached your plan's signatures limit"
                />
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        }
        theme={theme}
      >
        <MjmlSection padding="10px 0 0 0">
          <MjmlColumn>
            <GreetingUser name={senderName} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-no-credits-left.intro-text"
                defaultMessage="The following signing process sent through {signatureProvider} could not be started because you reached your plan's signatures limit."
                values={{ signatureProvider }}
              />
            </MjmlText>
            <MjmlText padding="0 20px 0 50px" lineHeight="24px">
              <ul style={{ margin: 0, padding: 0 }}>
                <li style={{ margin: 0, padding: 0 }}>
                  {petitionName ? (
                    <span>{petitionName}</span>
                  ) : (
                    <span style={{ fontStyle: "italic" }}>
                      <FormattedMessage
                        id="generic.unnamed-parallel"
                        defaultMessage="Unnamed parallel"
                      />
                    </span>
                  )}
                </li>
              </ul>
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-no-credits-left.contact-org-user"
                defaultMessage="Please contact {orgContactName} (<a>{orgContactEmail}</a>) so you can start the signing process."
                values={{
                  a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
                  orgContactEmail,
                  orgContactName,
                }}
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

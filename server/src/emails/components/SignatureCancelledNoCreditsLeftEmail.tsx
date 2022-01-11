import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../common/ClosingParallelTeam";
import { GreetingUser } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greetingUser } from "../common/texts";

export type SignatureCancelledNoCredtisLeftEmailProps = {
  senderName: string | null;
  orgContactName: string;
  orgContactEmail: string;
  petitionName: string | null;
} & LayoutProps;

const email: Email<SignatureCancelledNoCredtisLeftEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-cancelled-no-credits-left.subject",
      defaultMessage: "eSignature couldn’t start due to lack of credits",
    });
  },
  text(
    {
      senderName,
      petitionName,
      orgContactEmail,
      orgContactName,
    }: SignatureCancelledNoCredtisLeftEmailProps,
    intl: IntlShape
  ) {
    return outdent`
      **${intl
        .formatMessage({
          id: "generic.action-required",
          defaultMessage: "Action required",
        })
        .toUpperCase()}**

      ${greetingUser({ name: senderName }, intl)}

      ${intl.formatMessage({
        id: "signature-cancelled-no-credits-left.intro-text",
        defaultMessage:
          "The following signing process sent through Signaturit could not be started due to lack of credits.",
      })}

      - ${
        petitionName ||
        intl.formatMessage({ id: "generic.untitled-petition", defaultMessage: "Untitled petition" })
      }

      ${intl.formatMessage(
        {
          id: "signature-cancelled-no-credits-left.contact-org-user",
          defaultMessage:
            "Please contact {orgContactName} (<a>{orgContactEmail}</a>) to get more credits.",
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
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: SignatureCancelledNoCredtisLeftEmailProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        contentHeading={
          <MjmlSection backgroundColor="#3182CE" borderRadius="5px" padding="10px 0">
            <MjmlColumn>
              <MjmlText align="center" color="white" fontWeight={600} textTransform="uppercase">
                <FormattedMessage id="generic.action-required" defaultMessage="Action required" />
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        }
      >
        <MjmlSection padding="10px 0 0 0">
          <MjmlColumn>
            <GreetingUser name={senderName} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-no-credits-left.intro-text"
                defaultMessage="The following signing process sent through Signaturit could not be started due to lack of credits."
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
                        id="generic.untitled-petition"
                        defaultMessage="Untitled petition"
                      />
                    </span>
                  )}
                </li>
              </ul>
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled-no-credits-left.contact-org-user"
                defaultMessage="Please contact {orgContactName} (<a>{orgContactEmail}</a>) to get more credits."
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

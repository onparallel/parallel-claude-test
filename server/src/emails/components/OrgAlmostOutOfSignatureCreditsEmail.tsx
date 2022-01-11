import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../common/ClosingParallelTeam";
import { GreetingUser } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greetingUser } from "../common/texts";

export type SharedSignatureOutOfCreditsEmailProps = {
  senderName: string | null;
  total: number;
  used: number;
} & LayoutProps;

const email: Email<SharedSignatureOutOfCreditsEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ used, total }, intl: IntlShape) {
    return used === total
      ? intl.formatMessage({
          id: "org-last-signature-credit-used.subject",
          defaultMessage: "Credit alert: All of your eSignature credits have been consumed.",
        })
      : intl.formatMessage(
          {
            id: "org-almost-out-of-signature-credits.subject",
            defaultMessage: "Credit alert: {percent}% of eSignature credits have been consumed.",
          },
          { percent: Math.round((used / total) * 100) }
        );
  },
  text({ senderName, used, total }: SharedSignatureOutOfCreditsEmailProps, intl: IntlShape) {
    return outdent`
      **${
        used === total
          ? intl.formatMessage({
              id: "generic.action-required.org-last-signature-credit-used",
              defaultMessage: "You have used all of your signature credits.",
            })
          : intl.formatMessage(
              {
                id: "generic.action-required.org-almost-out-of-signature-credits",
                defaultMessage: "You have used {percent}% of your signature credits.",
              },
              { percent: Math.round((used / total) * 100) }
            )
      }**

      ${greetingUser({ name: senderName }, intl)}

      ${intl.formatMessage(
        {
          id: "org-almost-out-of-signature-credits.intro-text",
          defaultMessage:
            "We notify you that at the time this email was sent, you had {remaining} signature credits remaining, {remainingPercent}% of the contracted credits. Remember that each eSignature sent means one credit.",
        },
        {
          remaining: total - used,
          remainingPercent: Math.round(((total - used) / total) * 100),
        }
      )}

      ${intl.formatMessage(
        {
          id: "org-almost-out-of-signature-credits.contact-us",
          defaultMessage: "Please contact us at <a>support@onparallel.com</a> to get more credits.",
        },
        { a: () => "support@onparallel.com" }
      )}

      ${closing({}, intl)}
    `;
  },
  html({
    senderName,
    used,
    total,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: SharedSignatureOutOfCreditsEmailProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        contentHeading={
          <MjmlSection backgroundColor="#3182CE" borderRadius="5px" padding="10px 0">
            <MjmlColumn>
              <MjmlText align="center" color="white" fontWeight={600}>
                {used === total ? (
                  <FormattedMessage
                    id="generic.action-required.org-last-signature-credit-used"
                    defaultMessage="You have used all of your signature credits."
                  />
                ) : (
                  <FormattedMessage
                    id="generic.action-required.org-almost-out-of-signature-credits"
                    defaultMessage="You have used {percent}% of your signature credits."
                    values={{ percent: Math.round((used / total) * 100) }}
                  />
                )}
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
                id="org-almost-out-of-signature-credits.intro-text"
                defaultMessage="We notify you that at the time this email was sent, you had {remaining} signature credits remaining, {remainingPercent}% of the contracted credits. Remember that each eSignature sent means one credit."
                values={{
                  remaining: total - used,
                  remainingPercent: Math.round(((total - used) / total) * 100),
                }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="org-almost-out-of-signature-credits.contact-us"
                defaultMessage="Please contact us at <a>support@onparallel.com</a> to get more credits."
                values={{
                  a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
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

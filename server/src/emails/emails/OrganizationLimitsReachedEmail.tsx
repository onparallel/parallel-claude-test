import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { OrganizationUsageLimitName } from "../../db/__types";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";

export type OrganizationLimitsReachedEmailProps = {
  senderName: string | null;
  limitName: OrganizationUsageLimitName;
  total: number;
  used: number;
} & LayoutProps;

const email: Email<OrganizationLimitsReachedEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ used, total, limitName }, intl: IntlShape) {
    const petitionSendTotalCreditsUsed = limitName === "PETITION_SEND" && used === total;
    const petitionSendFewCreditsRemaining = limitName === "PETITION_SEND" && used < total;
    const signatureTotalCreditsUsed = limitName === "SIGNATURIT_SHARED_APIKEY" && used === total;
    const signatureFewCreditsRemaining = limitName === "SIGNATURIT_SHARED_APIKEY" && used < total;

    const value = used / total;

    return petitionSendTotalCreditsUsed
      ? intl.formatMessage({
          id: "organization-limits-reached.parallel-send.last-credit-used.subject",
          defaultMessage: "You have reached your plan's parallels limit",
        })
      : signatureTotalCreditsUsed
      ? intl.formatMessage({
          id: "organization-limits-reached.signaturit-shared-apikey.last-credit-used.subject",
          defaultMessage: "You have reached your plan's signatures limit",
        })
      : petitionSendFewCreditsRemaining
      ? intl.formatMessage(
          {
            id: "organization-limits-reached.parallel-send.few-credits-remaining.subject",
            defaultMessage: "Alert: You have used {value, number, percent} of your parallels",
          },
          { value }
        )
      : signatureFewCreditsRemaining
      ? intl.formatMessage(
          {
            id: "organization-limits-reached.signaturit-shared-apikey.few-credits-remaining.subject",
            defaultMessage: "Alert: You have used {value, number, percent} of your signatures",
          },
          { value }
        )
      : (null as never);
  },
  text(
    { senderName, used, total, limitName }: OrganizationLimitsReachedEmailProps,
    intl: IntlShape
  ) {
    const petitionSendTotalCreditsUsed = used === total && limitName === "PETITION_SEND";
    const signatureTotalCreditsUsed = used === total && limitName === "SIGNATURIT_SHARED_APIKEY";
    const petitionSendFewCreditsRemaining = used < total && limitName === "PETITION_SEND";
    const signatureFewCreditsRemaining = used < total && limitName === "SIGNATURIT_SHARED_APIKEY";

    return petitionSendTotalCreditsUsed
      ? outdent`
        ${greetingUser({ name: senderName }, intl)}

        ${intl.formatMessage(
          {
            id: "organization-limits-reached.parallel-send.last-credit-used-text",
            defaultMessage:
              "It seems that Parallel is helping you with many of your processes, and you have already <b>reached your limit of {total, number} parallels</b>.",
          },
          { b: (chunks: any[]) => chunks, total }
        )}
        
        ${intl.formatMessage(
          {
            id: "organization-limits-reached.parallel-send.get-more-parallels",
            defaultMessage:
              "To increase the parallels limit, you can contact us at <a>support@onparallel.com</a>.",
          },
          { a: (chunks: any[]) => chunks }
        )}
            
        ${closing({}, intl)}
      `
      : signatureTotalCreditsUsed
      ? outdent`
        ${greetingUser({ name: senderName }, intl)}

        ${intl.formatMessage(
          {
            id: "organization-limits-reached.signaturit-shared-apikey.last-credit-used-text",
            defaultMessage:
              "It seems that Parallel is helping you sign many of your documents, and you have already <b>reached your limit of {total, number} signatures</b>.",
          },
          { b: (chunks: any[]) => chunks, total }
        )}
      
        ${intl.formatMessage(
          {
            id: "organization-limits-reached.signaturit-shared-apikey.get-more-signatures",
            defaultMessage:
              "To increase the signature limit, you can contact us at <a>support@onparallel.com</a>.",
          },
          { a: (chunks: any[]) => chunks }
        )}
      
        ${closing({}, intl)}
      `
      : petitionSendFewCreditsRemaining
      ? outdent`
        ${greetingUser({ name: senderName }, intl)}

        ${intl.formatMessage({
          id: "organization-limits-reached.parallel-send.few-credits-remaining-text",
          defaultMessage:
            "We are glad that you are speeding up your processes with Parallel. But it looks like you have already used a large part of the parallels included in your plan.",
        })}
          
        ${intl.formatMessage(
          {
            id: "organization-limits-reached.parallel-send.few-credits-remaining-text-2",
            defaultMessage:
              "At the time this email was sent, you had <b>{remaining, number} parallels left</b>, {percent, number, percent} of those included in the plan.",
          },
          {
            remaining: total - used,
            percent: (total - used) / total,
            b: (chunks: any[]) => chunks,
          }
        )}
          
        ${intl.formatMessage(
          {
            id: "organization-limits-reached.parallel-send.get-more-parallels",
            defaultMessage:
              "To increase the parallels limit, you can contact us at <a>support@onparallel.com</a>.",
          },
          { a: (chunks: any[]) => chunks }
        )}
        
        ${closing({}, intl)}
      `
      : signatureFewCreditsRemaining
      ? outdent`
        ${greetingUser({ name: senderName }, intl)}

        ${intl.formatMessage({
          id: "organization-limits-reached.signaturit-shared-apikey.few-credits-remaining-text",
          defaultMessage:
            "We are glad that you are signing your documents with Parallel. But it looks like you have already used a large part of the signatures included in your plan.",
        })}
        
        ${intl.formatMessage(
          {
            id: "organization-limits-reached.signaturit-shared-apikey.few-credits-remaining-text-2",
            defaultMessage:
              "At the time this email was sent, you had <b>{remaining, number} signatures left</b>, {percent, number, percent} of those included in the plan.",
          },
          {
            remaining: total - used,
            percent: (total - used) / total,
            b: (chunks: any[]) => chunks,
          }
        )}
        
        ${intl.formatMessage(
          {
            id: "organization-limits-reached.signaturit-shared-apikey.get-more-signatures",
            defaultMessage:
              "To increase the signature limit, you can contact us at <a>support@onparallel.com</a>.",
          },
          { a: (chunks: any[]) => chunks }
        )}

        ${closing({}, intl)}
      `
      : (null as never);
  },
  html({
    limitName,
    senderName,
    used,
    total,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    theme,
  }: OrganizationLimitsReachedEmailProps) {
    const petitionSendTotalCreditsUsed = used === total && limitName === "PETITION_SEND";
    const signatureTotalCreditsUsed = used === total && limitName === "SIGNATURIT_SHARED_APIKEY";
    const petitionSendFewCreditsRemaining = used < total && limitName === "PETITION_SEND";
    const signatureFewCreditsRemaining = used < total && limitName === "SIGNATURIT_SHARED_APIKEY";

    const value = used / total;
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
                {petitionSendTotalCreditsUsed ? (
                  <FormattedMessage
                    id="organization-limits-reached.parallel-send.last-credit-used-warning"
                    defaultMessage="You have reached your plan's parallels limit"
                  />
                ) : signatureTotalCreditsUsed ? (
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.last-credit-used-warning"
                    defaultMessage="You have reached your plan's signatures limit"
                  />
                ) : petitionSendFewCreditsRemaining ? (
                  <FormattedMessage
                    id="organization-limits-reached.parallel-send.few-credits-remaining-warning"
                    defaultMessage="You have used {value, number, percent} of your parallels"
                    values={{ value }}
                  />
                ) : signatureFewCreditsRemaining ? (
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.few-credits-remaining-warning"
                    defaultMessage="You have used {value, number, percent} of your signatures"
                    values={{ value }}
                  />
                ) : (
                  (null as never)
                )}
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        }
        theme={theme}
      >
        <MjmlSection padding="10px 0 0 0">
          <MjmlColumn>
            <GreetingUser name={senderName} />
            {petitionSendTotalCreditsUsed ? (
              <>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.parallel-send.last-credit-used-text"
                    defaultMessage="It seems that Parallel is helping you with many of your processes, and you have already <b>reached your limit of {total, number} parallels</b>."
                    values={{ total }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.parallel-send.get-more-parallels"
                    defaultMessage="To increase the parallels limit, you can contact us at <a>support@onparallel.com</a>."
                    values={{
                      a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
                    }}
                  />
                </MjmlText>
              </>
            ) : signatureTotalCreditsUsed ? (
              <>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.last-credit-used-text"
                    defaultMessage="It seems that Parallel is helping you sign many of your documents, and you have already <b>reached your limit of {total, number} signatures</b>."
                    values={{ total }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.get-more-signatures"
                    defaultMessage="To increase the signature limit, you can contact us at <a>support@onparallel.com</a>."
                    values={{
                      a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
                    }}
                  />
                </MjmlText>
              </>
            ) : petitionSendFewCreditsRemaining ? (
              <>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.parallel-send.few-credits-remaining-text"
                    defaultMessage="We are glad that you are speeding up your processes with Parallel. But it looks like you have already used a large part of the parallels included in your plan."
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.parallel-send.few-credits-remaining-text-2"
                    defaultMessage="At the time this email was sent, you had <b>{remaining, number} parallels left</b>, {percent, number, percent} of those included in the plan."
                    values={{
                      remaining: total - used,
                      percent: (total - used) / total,
                    }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.parallel-send.get-more-parallels"
                    defaultMessage="To increase the parallels limit, you can contact us at <a>support@onparallel.com</a>."
                    values={{
                      a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
                    }}
                  />
                </MjmlText>
              </>
            ) : signatureFewCreditsRemaining ? (
              <>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.few-credits-remaining-text"
                    defaultMessage="We are glad that you are signing your documents with Parallel. But it looks like you have already used a large part of the signatures included in your plan."
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.few-credits-remaining-text-2"
                    defaultMessage="At the time this email was sent, you had <b>{remaining, number} signatures left</b>, {percent, number, percent} of those included in the plan."
                    values={{
                      remaining: total - used,
                      percent: (total - used) / total,
                    }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.get-more-signatures"
                    defaultMessage="To increase the signature limit, you can contact us at <a>support@onparallel.com</a>."
                    values={{
                      a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
                    }}
                  />
                </MjmlText>
              </>
            ) : (
              (null as never)
            )}
            <ClosingParallelTeam />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

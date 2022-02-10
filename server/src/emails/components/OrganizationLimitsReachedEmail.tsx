import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { OrganizationUsageLimitName } from "../../db/__types";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../common/ClosingParallelTeam";
import { GreetingUser } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greetingUser } from "../common/texts";

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

    const percent = Math.round((used / total) * 100);

    return petitionSendTotalCreditsUsed
      ? intl.formatMessage({
          id: "organization-limits-reached.petition-send.last-credit-used.subject",
          defaultMessage: "You reached your petitions limit",
        })
      : signatureTotalCreditsUsed
      ? intl.formatMessage({
          id: "organization-limits-reached.signaturit-shared-apikey.last-credit-used.subject",
          defaultMessage: "You reached your signatures limit",
        })
      : petitionSendFewCreditsRemaining
      ? intl.formatMessage(
          {
            id: "organization-limits-reached.petition-send.few-credits-remaining.subject",
            defaultMessage: "Alert: {percent}% of your petitions have been consumed",
          },
          { percent }
        )
      : signatureFewCreditsRemaining
      ? intl.formatMessage(
          {
            id: "organization-limits-reached.signaturit-shared-apikey.few-credits-remaining.subject",
            defaultMessage: "Alert: {percent}% of your signatures have been consumed",
          },
          { percent }
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

    const percent = Math.round((used / total) * 100);

    return petitionSendTotalCreditsUsed
      ? outdent`
      **${intl
        .formatMessage({
          id: "organization-limits-reached.petition-send.action-required.last-credit-used",
          defaultMessage: "You reached your plan's petitions limit",
        })
        .toUpperCase()}**

      ${greetingUser({ name: senderName }, intl)}

      ${intl.formatMessage(
        {
          id: "organization-limits-reached.petition-send.last-credit-used.text",
          defaultMessage:
            "It seems that Parallel is helping you in many processes, and you already <b>reached your limit of {total} petitions</b>.",
        },
        { b: (chunks: any[]) => chunks, total }
      )}
      
      ${intl.formatMessage(
        {
          id: "organization-limits-reached.petition-send.last-credit-used.text-2",
          defaultMessage:
            "Please contact us at <a>support@onparallel.com</a> so that you can continue sending your processes via Parallel.",
        },
        { a: () => "support@onparallel.com" }
      )}
          
      ${closing({}, intl)}`
      : signatureTotalCreditsUsed
      ? outdent`
      **${intl
        .formatMessage({
          id: "organization-limits-reached.signaturit-shared-apikey.action-required.last-credit-used",
          defaultMessage: "You reached your plan's signatures limit",
        })
        .toUpperCase()}**

      ${greetingUser({ name: senderName }, intl)}

      ${intl.formatMessage(
        {
          id: "organization-limits-reached.signaturit-shared-apikey.last-credit-used.text",
          defaultMessage:
            "It seems that Parallel is helping you sign many of your documents, and you already <b>reached your signature limit</b>.",
        },
        { b: (chunks: any[]) => chunks }
      )}
    
      ${intl.formatMessage(
        {
          id: "organization-limits-reached.signaturit-shared-apikey.last-credit-used.text-2",
          defaultMessage:
            "If you need to initiate more signatures, please contact us at <a>support@onparallel.com</a>.",
        },
        { a: () => "support@onparallel.com" }
      )}
    
    ${closing({}, intl)}
      `
      : petitionSendFewCreditsRemaining
      ? outdent`
      **${intl
        .formatMessage(
          {
            id: "organization-limits-reached.petition-send.action-required.few-credits-remaining",
            defaultMessage: "You have consumed {percent}% of your petitions",
          },
          { percent }
        )
        .toUpperCase()}**

    ${greetingUser({ name: senderName }, intl)}

    ${intl.formatMessage({
      id: "organization-limits-reached.petition-send.few-credits-remaining.text",
      defaultMessage:
        "We are glad that you are speeding up your processes with Parallel. But it looks like you have already consumed a large part of your available petitions.",
    })}
      
    ${intl.formatMessage(
      {
        id: "organization-limits-reached.petition-send.few-credits-remaining.text-2",
        defaultMessage:
          "At the time this email was sent, you had <b>{remaining} petitions left</b>, {remainingPercent}% of those you had contracted.",
      },
      {
        remaining: total - used,
        remainingPercent: Math.round(((total - used) / total) * 100),
        b: (chunks: any[]) => chunks,
      }
    )}
      
    ${intl.formatMessage(
      {
        id: "organization-limits-reached.petition-send.contact-us",
        defaultMessage: "Please contact us at <a>support@onparallel.com</a> to get more petitions.",
      },
      { a: () => "support@onparallel.com" }
    )}
    
    ${closing({}, intl)}
      `
      : signatureFewCreditsRemaining
      ? outdent`
      **${intl
        .formatMessage(
          {
            id: "organization-limits-reached.signaturit-shared-apikey.action-required.few-credits-remaining",
            defaultMessage: "You have consumed {percent}% of your signatures",
          },
          { percent }
        )
        .toUpperCase()}**

      ${greetingUser({ name: senderName }, intl)}

      ${intl.formatMessage({
        id: "organization-limits-reached.signaturit-shared-apikey.few-credits-remaining.text",
        defaultMessage:
          "We are glad that you are signing your documents with Parallel. But it looks like you have already consumed a large part of your signatures plan.",
      })}
      
      ${intl.formatMessage(
        {
          id: "organization-limits-reached.signaturit-shared-apikey.few-credits-remaining.text-2",
          defaultMessage:
            "At the time this email was sent, you had <b>{remaining} signatures left</b>, {remainingPercent}% of those you had contracted.",
        },
        {
          remaining: total - used,
          remainingPercent: Math.round(((total - used) / total) * 100),
          b: (chunks: any[]) => chunks,
        }
      )}
      
      ${intl.formatMessage(
        {
          id: "organization-limits-reached.signaturit-shared-apikey.contact-us",
          defaultMessage:
            "Please contact us at <a>support@onparallel.com</a> to upgrade your signatures plan.",
        },
        { a: () => "support@onparallel.com" }
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
  }: OrganizationLimitsReachedEmailProps) {
    const petitionSendTotalCreditsUsed = used === total && limitName === "PETITION_SEND";
    const signatureTotalCreditsUsed = used === total && limitName === "SIGNATURIT_SHARED_APIKEY";
    const petitionSendFewCreditsRemaining = used < total && limitName === "PETITION_SEND";
    const signatureFewCreditsRemaining = used < total && limitName === "SIGNATURIT_SHARED_APIKEY";

    const percent = Math.round((used / total) * 100);
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
                    id="organization-limits-reached.petition-send.action-required.last-credit-used"
                    defaultMessage="You reached your plan's petitions limit"
                  />
                ) : signatureTotalCreditsUsed ? (
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.action-required.last-credit-used"
                    defaultMessage="You reached your plan's signatures limit"
                  />
                ) : petitionSendFewCreditsRemaining ? (
                  <FormattedMessage
                    id="organization-limits-reached.petition-send.action-required.few-credits-remaining"
                    defaultMessage="You have consumed {percent}% of your petitions"
                    values={{ percent }}
                  />
                ) : signatureFewCreditsRemaining ? (
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.action-required.few-credits-remaining"
                    defaultMessage="You have consumed {percent}% of your signatures"
                    values={{ percent }}
                  />
                ) : (
                  (null as never)
                )}
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        }
      >
        <MjmlSection padding="10px 0 0 0">
          <MjmlColumn>
            <GreetingUser name={senderName} />
            {petitionSendTotalCreditsUsed ? (
              <>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.petition-send.last-credit-used.text"
                    defaultMessage="It seems that Parallel is helping you in many processes, and you already <b>reached your limit of {total} petitions</b>."
                    values={{ total }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.petition-send.last-credit-used.text-2"
                    defaultMessage="Please contact us at <a>support@onparallel.com</a> so that you can continue sending your processes via Parallel."
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
                    id="organization-limits-reached.signaturit-shared-apikey.last-credit-used.text"
                    defaultMessage="It seems that Parallel is helping you sign many of your documents, and you already <b>reached your signature limit</b>."
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.last-credit-used.text-2"
                    defaultMessage="If you need to initiate more signatures, please contact us at <a>support@onparallel.com</a>."
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
                    id="organization-limits-reached.petition-send.few-credits-remaining.text"
                    defaultMessage="We are glad that you are speeding up your processes with Parallel. But it looks like you have already consumed a large part of your available petitions."
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.petition-send.few-credits-remaining.text-2"
                    defaultMessage="At the time this email was sent, you had <b>{remaining} petitions left</b>, {remainingPercent}% of those you had contracted."
                    values={{
                      remaining: total - used,
                      remainingPercent: Math.round(((total - used) / total) * 100),
                    }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.petition-send.contact-us"
                    defaultMessage="Please contact us at <a>support@onparallel.com</a> to get more petitions."
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
                    id="organization-limits-reached.signaturit-shared-apikey.few-credits-remaining.text"
                    defaultMessage="We are glad that you are signing your documents with Parallel. But it looks like you have already consumed a large part of your signatures plan."
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.few-credits-remaining.text-2"
                    defaultMessage="At the time this email was sent, you had <b>{remaining} signatures left</b>, {remainingPercent}% of those you had contracted."
                    values={{
                      remaining: total - used,
                      remainingPercent: Math.round(((total - used) / total) * 100),
                    }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.signaturit-shared-apikey.contact-us"
                    defaultMessage="Please contact us at <a>support@onparallel.com</a> to upgrade your signatures plan."
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

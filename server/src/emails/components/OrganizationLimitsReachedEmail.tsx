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
    return used === total
      ? intl.formatMessage(
          {
            id: "organization-limits-reached.last-credit-used.subject",
            defaultMessage:
              "You reached your {limitName, select, PETITION_SEND{petitions} other{signatures}} limit",
          },
          { limitName }
        )
      : intl.formatMessage(
          {
            id: "organization-limits-reached.few-credits-remaining.subject",
            defaultMessage:
              "Alert: {percent}% of your {limitName, select, PETITION_SEND{petitions} other{signatures}} have been consumed",
          },
          { percent: Math.round((used / total) * 100), limitName }
        );
  },
  text(
    { senderName, used, total, limitName }: OrganizationLimitsReachedEmailProps,
    intl: IntlShape
  ) {
    return outdent`
      **${
        used === total
          ? intl
              .formatMessage(
                {
                  id: "generic.action-required.last-credit-used",
                  defaultMessage:
                    "You reached your plan's {limitName, select, PETITION_SEND{petitions} other{signatures}} limit",
                },
                { limitName }
              )
              .toUpperCase()
          : intl
              .formatMessage(
                {
                  id: "generic.action-required.few-credits-remaining",
                  defaultMessage:
                    "You have consumed {percent}% of your {limitName, select, PETITION_SEND{petitions} other{signatures}}",
                },
                { percent: Math.round((used / total) * 100), limitName }
              )
              .toUpperCase()
      }**

      ${greetingUser({ name: senderName }, intl)}

      ${
        used < total
          ? `${intl.formatMessage(
              {
                id: "organization-limits-reached.few-credits-remaining.text",
                defaultMessage:
                  "We are glad that you are {limitName, select, PETITION_SEND{speeding up your processes} other{signing your documents}} with Parallel. But it looks like you have already consumed a large part of your {limitName, select, PETITION_SEND{available petitions} other{signatures plan}}.",
              },
              { limitName }
            )}

${intl.formatMessage(
  {
    id: "organization-limits-reached.few-credits-remaining.text-2",
    defaultMessage:
      "At the time this email was sent, you had <b>{remaining} {limitName, select, PETITION_SEND{petitions} other{signatures}} left</b>, {remainingPercent}% of those you had contracted.",
  },
  {
    limitName,
    remaining: total - used,
    remainingPercent: Math.round(((total - used) / total) * 100),
    b: (chunks: any[]) => chunks,
  }
)}
          
${intl.formatMessage(
  {
    id: "organization-limits-reached.contact-us",
    defaultMessage:
      "Please contact us at <a>support@onparallel.com</a> to {limitName, select, PETITION_SEND{get more petitions} other{upgrade your signatures plan}}.",
  },
  { a: () => "support@onparallel.com", limitName }
)}`
          : `${intl.formatMessage(
              {
                id: "organization-limits-reached.last-credit-used.text",
                defaultMessage:
                  "It seems that Parallel is helping you {limitName, select, PETITION_SEND{in many processes} other{sign many of your documents}}, and you already <b>reached your {limitName, select, PETITION_SEND{limit of {total} petitions} other{signature limit}}</b>.",
              },
              { b: (chunks: any[]) => chunks, limitName, total }
            )}
      
${intl.formatMessage(
  {
    id: "organization-limits-reached.last-credit-used.text-2",
    defaultMessage:
      "{limitName, select, PETITION_SEND{Please contact us at <a>support@onparallel.com</a> so that you can continue sending your processes via Parallel} other{If you need to initiate more signatures, please contact us at <a>support@onparallel.com</a>}}.",
  },
  { a: () => "support@onparallel.com", limitName }
)}`
      }
            
      ${closing({}, intl)}
    `;
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
                {used === total ? (
                  <FormattedMessage
                    id="generic.action-required.last-credit-used"
                    defaultMessage="You reached your plan's {limitName, select, PETITION_SEND{petitions} other{signatures}} limit"
                    values={{ limitName }}
                  />
                ) : (
                  <FormattedMessage
                    id="generic.action-required.few-credits-remaining"
                    defaultMessage="You have consumed {percent}% of your {limitName, select, PETITION_SEND{petitions} other{signatures}}"
                    values={{ percent: Math.round((used / total) * 100), limitName }}
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
            {used < total ? (
              <>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.few-credits-remaining.text"
                    defaultMessage="We are glad that you are {limitName, select, PETITION_SEND{speeding up your processes} other{signing your documents}} with Parallel. But it looks like you have already consumed a large part of your {limitName, select, PETITION_SEND{available petitions} other{signatures plan}}."
                    values={{ limitName }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.few-credits-remaining.text-2"
                    defaultMessage="At the time this email was sent, you had <b>{remaining} {limitName, select, PETITION_SEND{petitions} other{signatures}} left</b>, {remainingPercent}% of those you had contracted."
                    values={{
                      limitName,
                      remaining: total - used,
                      remainingPercent: Math.round(((total - used) / total) * 100),
                      b: (chunks: any[]) => <b>{chunks}</b>,
                    }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.contact-us"
                    defaultMessage="Please contact us at <a>support@onparallel.com</a> to {limitName, select, PETITION_SEND{get more petitions} other{upgrade your signatures plan}}."
                    values={{
                      a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
                      limitName,
                    }}
                  />
                </MjmlText>
              </>
            ) : (
              <>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.last-credit-used.text"
                    defaultMessage="It seems that Parallel is helping you {limitName, select, PETITION_SEND{in many processes} other{sign many of your documents}}, and you already <b>reached your {limitName, select, PETITION_SEND{limit of {total} petitions} other{signature limit}}</b>."
                    values={{
                      b: (chunks: any[]) => <b>{chunks}</b>,
                      limitName,
                      total,
                    }}
                  />
                </MjmlText>
                <MjmlText lineHeight="24px">
                  <FormattedMessage
                    id="organization-limits-reached.last-credit-used.text-2"
                    defaultMessage="{limitName, select, PETITION_SEND{Please contact us at <a>support@onparallel.com</a> so that you can continue sending your processes via Parallel} other{If you need to initiate more signatures, please contact us at <a>support@onparallel.com</a>}}."
                    values={{
                      a: (chunks: any[]) => <a href="mailto:support@onparallel.com">{chunks}</a>,
                      limitName,
                    }}
                  />
                </MjmlText>
              </>
            )}
            <ClosingParallelTeam />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

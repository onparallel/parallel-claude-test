import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { FORMATS } from "../../util/dates";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../components/CompleteInfoButton";
import { DateTime } from "../components/DateTime";
import { Disclaimer } from "../components/Disclaimer";
import { Layout, LayoutProps } from "../components/Layout";
import { disclaimer } from "../components/texts";
import { UserMessageBox } from "../components/UserMessageBox";
import { WhyWeUseParallel } from "../components/WhyWeUseParallel";

export type AccessDelegatedEmailProps = {
  senderName: string;
  senderEmail: string;
  petitionOwnerFullName: string;
  petitionOwnerEmail: string;
  emailSubject: string | null;
  bodyHtml: string;
  bodyPlainText: string;
  deadline: Date | null;
  keycode: string;
  removeWhyWeUseParallel: boolean;
  removeParallelBranding: boolean;
} & LayoutProps;

const email: Email<AccessDelegatedEmailProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ senderName, emailSubject, theme }, intl) {
    return intl.formatMessage(
      {
        id: "access-delegated-email.subject",
        defaultMessage:
          "{senderName} has invited you to collaborate on {subject, select, null{a parallel} other{{subject}}}",
      },
      {
        senderName,
        subject: emailSubject,
        tone: theme.preferredTone,
      }
    );
  },
  text(
    {
      senderName,
      senderEmail,
      petitionOwnerFullName,
      petitionOwnerEmail,
      bodyPlainText,
      deadline,
      keycode,
      parallelUrl,
      theme,
    },
    intl
  ) {
    return outdent`
      ${intl.formatMessage(
        {
          id: "access-delegated.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has asked you to complete the information requested by {petitionOwnerFullName} ({petitionOwnerEmail}):",
        },
        {
          senderName,
          senderEmail,
          petitionOwnerFullName,
          petitionOwnerEmail,
          tone: theme.preferredTone,
        }
      )}

      ${bodyPlainText}
      ${
        deadline
          ? outdent`

            ${intl.formatMessage(
              {
                id: "generic.submit-text.with-deadline",
                defaultMessage:
                  "This information has been requested to be submitted before {deadline}.",
              },
              { deadline: intl.formatDate(deadline, FORMATS.LLL) }
            )}

          `
          : ""
      }
      ${intl.formatMessage({
        id: "generic.complete-information-click-link",
        defaultMessage: "Please click the link below to complete the information.",
      })}
      ${parallelUrl}/${intl.locale}/petition/${keycode}
      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    senderName,
    senderEmail,
    petitionOwnerFullName,
    petitionOwnerEmail,
    bodyHtml,
    deadline,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    removeWhyWeUseParallel,
    removeParallelBranding,
    theme,
  }: AccessDelegatedEmailProps) {
    const { locale } = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        utmCampaign="recipients"
        removeParallelBranding={removeParallelBranding}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <MjmlText>
              <FormattedMessage
                id="access-delegated.text"
                defaultMessage="{senderName} ({senderEmail}) has asked you to complete the information requested by {petitionOwnerFullName} ({petitionOwnerEmail}):"
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                  petitionOwnerFullName: <b>{petitionOwnerFullName}</b>,
                  petitionOwnerEmail: <b>{petitionOwnerEmail}</b>,
                  tone: theme.preferredTone,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <UserMessageBox dangerouslySetInnerHTML={bodyHtml} />

        <MjmlSection>
          <MjmlColumn>
            {deadline ? (
              <MjmlText>
                <FormattedMessage
                  id="generic.submit-text.with-deadline"
                  defaultMessage="This information has been requested to be submitted before {deadline}."
                  values={{
                    deadline: (
                      <span style={{ textDecoration: "underline" }}>
                        <DateTime value={deadline} format={FORMATS.LLL} />
                      </span>
                    ),
                  }}
                />
              </MjmlText>
            ) : null}
            <MjmlSpacer height="10px" />
            <CompleteInfoButton
              tone={theme.preferredTone}
              href={`${parallelUrl}/${locale}/petition/${keycode}`}
            />
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
        {removeWhyWeUseParallel || removeParallelBranding ? null : (
          <WhyWeUseParallel assetsUrl={assetsUrl} tone={theme.preferredTone} />
        )}
      </Layout>
    );
  },
};
export default email;

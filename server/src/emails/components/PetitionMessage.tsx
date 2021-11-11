import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer } from "../common/texts";
import { UserMessageBox } from "../common/UserMessageBox";
import { WhyWeUseParallel } from "../common/WhyWeUseParallel";
import { FORMATS } from "../utils/dates";
import { Tone } from "../utils/types";

export type PetitionMessageProps = {
  senderName: string;
  senderEmail: string;
  subject: string | null;
  bodyHtml: string;
  bodyPlainText: string;
  deadline: Date | null;
  keycode: string;
  tone: Tone;
} & LayoutProps;

const email: Email<PetitionMessageProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ subject }) {
    return subject || "";
  },
  text({ senderName, senderEmail, bodyPlainText, deadline, keycode, parallelUrl, tone }, intl) {
    return outdent`
      ${intl.formatMessage(
        {
          id: "new-petition.text",
          defaultMessage: "{senderName} ({senderEmail}) has sent you the following petition:",
        },
        { senderName, senderEmail, tone }
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


      ${intl.formatMessage({
        id: "layout.stop-receiving-emails",
        defaultMessage: "Stop receiving emails",
      })}:
      ${parallelUrl}/${intl.locale}/petition/${keycode}/opt-out?ref=petition-access
    `;
  },
  html({
    senderName,
    senderEmail,
    bodyHtml,
    deadline,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    tone,
  }: PetitionMessageProps) {
    const intl = useIntl();

    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        optOutUrl={`${parallelUrl}/${intl.locale}/petition/${keycode}/opt-out?ref=petition-access`}
        optOutText={intl.formatMessage({
          id: "layout.stop-receiving-emails",
          defaultMessage: "Stop receiving emails",
        })}
        utmCampaign="recipients"
        tone={tone}
        hideTermsAndPrivacy
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <MjmlText align="center">
              <FormattedMessage
                id="new-petition.text"
                defaultMessage="{senderName} ({senderEmail}) has sent you the following petition:"
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                  tone,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <UserMessageBox dangerouslySetInnerHTML={bodyHtml} />

        <MjmlSection paddingTop="10px">
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
              tone={tone}
              href={`${parallelUrl}/${intl.locale}/petition/${keycode}`}
            />
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
        <WhyWeUseParallel assetsUrl={assetsUrl} tone={tone} />
      </Layout>
    );
  },
};

export default email;

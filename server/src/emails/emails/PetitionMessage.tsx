import {
  MjmlColumn,
  MjmlHtmlAttribute,
  MjmlHtmlAttributes,
  MjmlSection,
  MjmlSelector,
  MjmlSpacer,
  MjmlText,
} from "@faire/mjml-react";
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

export interface PetitionMessageProps extends LayoutProps {
  senderName: string;
  senderEmail: string;
  subject: string | null;
  bodyHtml: string;
  bodyPlainText: string;
  deadline: Date | null;
  keycode: string;
  recipients: { name: string; email: string }[] | null;
  removeWhyWeUseParallel: boolean;
  removeParallelBranding: boolean;
}

const email: Email<PetitionMessageProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} via Parallel",
      },
      { senderName },
    );
  },
  subject({ subject }) {
    return subject || "";
  },
  text(
    { senderName, senderEmail, recipients, bodyPlainText, deadline, keycode, parallelUrl, theme },
    intl,
  ) {
    return outdent`
      ${
        recipients
          ? intl.formatMessage(
              {
                id: "new-petition.text-multiple-recipients",
                defaultMessage: "{senderName} ({senderEmail}) has shared this link with {list}.",
              },
              {
                senderName,
                senderEmail,
                tone: theme.preferredTone,
                list: intl.formatList([
                  ...recipients.map((contact) => `${contact.name} <${contact.email}>`),
                  intl.formatMessage(
                    {
                      id: "new-petition.text-multiple-recipients.with-you",
                      defaultMessage: "you",
                    },
                    { tone: theme.preferredTone },
                  ),
                ]),
              },
            )
          : intl.formatMessage(
              {
                id: "new-petition.text",
                defaultMessage: "{senderName} ({senderEmail}) has shared this link with you.",
              },
              { senderName, senderEmail, tone: theme.preferredTone },
            )
      }

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
           { deadline: intl.formatDate(deadline, FORMATS.LLL) },
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
        id: "layout.stop-reminders",
        defaultMessage: "Stop receiving reminders",
      })}:
      ${parallelUrl}/${intl.locale}/petition/${keycode}/reminders?ref=petition-access
    `;
  },
  html({
    senderName,
    senderEmail,
    recipients,
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
  }: PetitionMessageProps) {
    const intl = useIntl();

    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        optOutUrl={`${parallelUrl}/${intl.locale}/petition/${keycode}/reminders?ref=petition-access`}
        utmCampaign="recipients"
        removeParallelBranding={removeParallelBranding}
        theme={theme}
        head={
          <MjmlHtmlAttributes>
            <MjmlSelector path=".complete-information a">
              <MjmlHtmlAttribute name="data-testid">complete-information-button</MjmlHtmlAttribute>
            </MjmlSelector>
          </MjmlHtmlAttributes>
        }
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <MjmlText align="center">
              {recipients ? (
                <FormattedMessage
                  id="new-petition.text-multiple-recipients"
                  defaultMessage="{senderName} ({senderEmail}) has shared this link with {list}."
                  values={{
                    senderName: <b>{senderName}</b>,
                    senderEmail: <b>{senderEmail}</b>,
                    tone: theme.preferredTone,
                    list: intl.formatList([
                      ...recipients.map((contact) => `${contact.name} <${contact.email}>`),
                      intl.formatMessage(
                        {
                          id: "new-petition.text-multiple-recipients.with-you",
                          defaultMessage: "you",
                        },
                        { tone: theme.preferredTone },
                      ),
                    ]),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="new-petition.text"
                  defaultMessage="{senderName} ({senderEmail}) has shared this link with you."
                  values={{
                    senderName: <b>{senderName}</b>,
                    senderEmail: <b>{senderEmail}</b>,
                    tone: theme.preferredTone,
                  }}
                />
              )}
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
              cssClass="complete-information"
              tone={theme.preferredTone}
              href={`${parallelUrl}/${intl.locale}/petition/${keycode}`}
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

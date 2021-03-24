import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import {
  PetitionFieldList,
  PetitionFieldListProps,
} from "../common/PetitionFieldList";
import { disclaimer, greetingFormal, petitionFieldList } from "../common/texts";
import { FORMATS } from "../utils/dates";

export type PetitionMessageProps = {
  contactFullName: string;
  senderName: string;
  senderEmail: string;
  showFields: boolean;
  fields: PetitionFieldListProps["fields"];
  subject: string | null;
  bodyHtml: string;
  bodyPlainText: string;
  deadline: Date | null;
  keycode: string;
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
  text(
    {
      contactFullName,
      senderName,
      senderEmail,
      showFields,
      fields,
      bodyPlainText,
      deadline,
      keycode,
      parallelUrl,
    },
    intl
  ) {
    return outdent`
      ${greetingFormal({ fullName: contactFullName }, intl)}
      ${intl.formatMessage(
        {
          id: "new-petition.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has sent you the following petition:",
        },
        { senderName, senderEmail }
      )}

      ${bodyPlainText}

      ${
        showFields
          ? outdent`
              ${
                deadline
                  ? intl.formatMessage(
                      {
                        id: "generic.submit-text.with-deadline",
                        defaultMessage:
                          "This is the information that has been requested to be submitted before {deadline}:",
                      },
                      { deadline: intl.formatDate(deadline, FORMATS.LLL) }
                    )
                  : intl.formatMessage({
                      id: "generic.submit-text.without-deadline",
                      defaultMessage:
                        "This is the information that has been requested:",
                    })
              }
              ${petitionFieldList({ fields }, intl)}
            `
          : ""
      }
      ${intl.formatMessage({
        id: "generic.complete-information-click-link",
        defaultMessage:
          "Please click the link below to complete the information.",
      })}
      ${parallelUrl}/${intl.locale}/petition/${keycode}
      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    contactFullName,
    senderName,
    senderEmail,
    showFields,
    fields,
    bodyHtml,
    deadline,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionMessageProps) {
    const { locale } = useIntl();

    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        showGdprDisclaimer
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <GreetingFormal fullName={contactFullName} />
            <MjmlText>
              <FormattedMessage
                id="new-petition.text"
                defaultMessage="{senderName} ({senderEmail}) has sent you the following petition:"
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection padding="0 20px">
          <MjmlColumn
            backgroundColor="#f6f6f6"
            borderRadius="4px"
            padding="10px 0"
          >
            <MjmlText>
              <span dangerouslySetInnerHTML={{ __html: bodyHtml }}></span>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection paddingTop="10px">
          <MjmlColumn>
            {showFields ? (
              <>
                {fields.length > 10 && (
                  <CompleteInfoButton
                    href={`${parallelUrl}/${locale}/petition/${keycode}`}
                  />
                )}
                <MjmlText>
                  {deadline ? (
                    <FormattedMessage
                      id="generic.submit-text.with-deadline"
                      defaultMessage="This is the information that has been requested to be submitted before {deadline}:"
                      values={{
                        deadline: (
                          <span style={{ textDecoration: "underline" }}>
                            <DateTime value={deadline} format={FORMATS.LLL} />
                          </span>
                        ),
                      }}
                    />
                  ) : (
                    <FormattedMessage
                      id="generic.submit-text.without-deadline"
                      defaultMessage="This is the information that has been requested:"
                    />
                  )}
                </MjmlText>
                <PetitionFieldList fields={fields} />
                <MjmlSpacer height="10px" />
              </>
            ) : null}
            <CompleteInfoButton
              href={`${parallelUrl}/${locale}/petition/${keycode}`}
            />
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

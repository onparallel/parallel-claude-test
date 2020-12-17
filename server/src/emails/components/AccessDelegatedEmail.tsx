import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
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
import { RenderSlate } from "../common/RenderSlate";
import {
  disclaimer,
  greetingFormal,
  petitionFieldList,
  renderSlateText,
} from "../common/texts";
import { FORMATS } from "../utils/dates";

export type AccessDelegatedEmailProps = {
  fullName: string | null;
  senderName: string;
  senderEmail: string;
  petitionOwnerFullName: string;
  petitionOwnerEmail: string;
  fields: PetitionFieldListProps["fields"];
  body: any | null;
  deadline: Date | null;
  keycode: string;
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
  subject({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "access-delegated-email.subject",
        defaultMessage: "You have a message from {senderName}",
      },
      {
        senderName,
      }
    );
  },
  text(
    {
      fullName,
      senderName,
      senderEmail,
      petitionOwnerFullName,
      petitionOwnerEmail,
      fields,
      body,
      deadline,
      keycode,
      parallelUrl,
    },
    intl
  ) {
    return outdent`
      ${greetingFormal({ fullName }, intl)}
      ${intl.formatMessage(
        {
          id: "access-delegated.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has asked you to complete the information requested by {petitionOwnerFullName} ({petitionOwnerEmail}):",
        },
        { senderName, senderEmail, petitionOwnerFullName, petitionOwnerEmail }
      )}

      ${renderSlateText(body)}

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
    fullName,
    senderName,
    senderEmail,
    petitionOwnerFullName,
    petitionOwnerEmail,
    fields,
    body,
    deadline,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: AccessDelegatedEmailProps) {
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
            <GreetingFormal fullName={fullName} />
            <MjmlText>
              <FormattedMessage
                id="access-delegated.text"
                defaultMessage="{senderName} ({senderEmail}) has asked you to complete the information requested by {petitionOwnerFullName} ({petitionOwnerEmail}):"
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                  petitionOwnerFullName: <b>{petitionOwnerFullName}</b>,
                  petitionOwnerEmail: <b>{petitionOwnerEmail}</b>,
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
            <RenderSlate value={body} />
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection paddingTop="10px">
          <MjmlColumn>
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

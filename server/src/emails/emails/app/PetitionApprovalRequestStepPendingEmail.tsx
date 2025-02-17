import {
  MjmlColumn,
  MjmlHtmlAttribute,
  MjmlHtmlAttributes,
  MjmlSection,
  MjmlSelector,
  MjmlText,
} from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { BreakLines } from "../../../util/BreakLines";
import { Email } from "../../buildEmail";
import { Button } from "../../components/Button";
import { GreetingUser } from "../../components/Greeting";
import { Layout, LayoutProps } from "../../components/Layout";
import { closing, greetingUser } from "../../components/texts";
import { UserMessageBox } from "../../components/UserMessageBox";

export type PetitionApprovalRequestStepPendingEmailProps = {
  userName: string | null;
  petitionId: string;
  petitionName: string | null;
  senderEmail: string;
  senderFullName: string;
  message: string | null;
  isReminder: boolean;
  numOfAttachments: number;
} & LayoutProps;

const email: Email<PetitionApprovalRequestStepPendingEmailProps> = {
  from({ senderFullName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} via Parallel",
      },
      { senderName: senderFullName },
    );
  },
  subject({ isReminder }: PetitionApprovalRequestStepPendingEmailProps, intl: IntlShape) {
    return `[${
      isReminder
        ? intl.formatMessage({
            id: "petition-approval-request-step-pending-email.subject-reminder",
            defaultMessage: "Reminder",
          })
        : intl.formatMessage({
            id: "petition-approval-request-step-pending-email.subject-action-required",
            defaultMessage: "Action required",
          })
    }] ${intl.formatMessage({
      id: "petition-approval-request-step-pending-email.subject",
      defaultMessage: "You have a pending approval",
    })}`;
  },
  text(
    {
      userName,
      petitionId,
      petitionName,
      senderFullName,
      senderEmail,
      message,
      numOfAttachments,
      parallelUrl,
    }: PetitionApprovalRequestStepPendingEmailProps,
    intl: IntlShape,
  ) {
    const body = outdent`
        ${intl.formatMessage(
          {
            id: "petition-approval-request-step-pending-email.text",
            defaultMessage: "{requester} has asked you to approve the following process.",
          },
          {
            requester: `${senderFullName} (${senderEmail})`,
          },
        )}

        ${
          petitionName ||
          intl.formatMessage({
            id: "generic.unnamed-parallel",
            defaultMessage: "Unnamed parallel",
          })
        }

        ${message
          ?.split(/\n/)
          .map((line) => `> ${line}`)
          .join("\n")}

          ${
            numOfAttachments
              ? intl.formatMessage(
                  {
                    id: "petition-approval-request-step-pending-email.number-of-attachments",
                    defaultMessage: "{count, plural, =1 {# file} other {# files}} attached",
                  },
                  {
                    count: numOfAttachments,
                  },
                )
              : ""
          }

        ${intl.formatMessage({
          id: "petition-approval-request-step-pending-email.access-click-link",
          defaultMessage: "Follow the link below link to access.",
        })}
        ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies?comments=general
      `;

    return outdent`
      ${greetingUser({ name: userName }, intl)}

      ${body}

      ${closing({}, intl)}
    `;
  },
  html({
    userName,
    petitionId,
    petitionName,
    senderFullName,
    senderEmail,
    numOfAttachments,
    message,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    theme,
  }: PetitionApprovalRequestStepPendingEmailProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
        head={
          <MjmlHtmlAttributes>
            <MjmlSelector path=".go-to-parallel a">
              <MjmlHtmlAttribute name="data-testid">go-to-parallel-button</MjmlHtmlAttribute>
            </MjmlSelector>
            <MjmlSelector path=".user-message-box div">
              <MjmlHtmlAttribute name="data-testid">review-information</MjmlHtmlAttribute>
            </MjmlSelector>
          </MjmlHtmlAttributes>
        }
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />

            <MjmlText>
              <FormattedMessage
                id="petition-approval-request-step-pending-email.text"
                defaultMessage="{requester} has asked you to approve the following process."
                values={{
                  requester: (
                    <b>
                      {senderFullName} ({senderEmail})
                    </b>
                  ),
                }}
              />
            </MjmlText>
            <MjmlText fontSize="16px">
              {petitionName ? (
                <li>{petitionName}</li>
              ) : (
                <li style={{ color: "#A0AEC0", fontStyle: "italic" }}>
                  <FormattedMessage
                    id="generic.unnamed-parallel"
                    defaultMessage="Unnamed parallel"
                  />
                </li>
              )}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        {message ? (
          <UserMessageBox>
            <BreakLines>{message}</BreakLines>
          </UserMessageBox>
        ) : null}

        {numOfAttachments ? (
          <MjmlSection padding="0">
            <MjmlColumn>
              <MjmlText>
                <FormattedMessage
                  id="petition-approval-request-step-pending-email.number-of-attachments"
                  defaultMessage="{count, plural, =1 {# file} other {# files}} attached"
                  values={{
                    count: numOfAttachments,
                  }}
                />
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        ) : null}

        <MjmlSection>
          <MjmlColumn>
            <Button
              cssClass="go-to-parallel"
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies?comments=general`}
            >
              <FormattedMessage
                id="petition-approval-request-step-pending-email.review-button"
                defaultMessage="Review information"
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

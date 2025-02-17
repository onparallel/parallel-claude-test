import {
  MjmlColumn,
  MjmlHtmlAttribute,
  MjmlHtmlAttributes,
  MjmlSection,
  MjmlSelector,
  MjmlStyle,
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

export type PetitionApprovalRequestStepFinishedEmailProps = {
  userName: string | null;
  petitionId: string;
  petitionName: string | null;
  senderFullName: string;
  approvalRequestStepName: string;
  isRejection: boolean;
  isFinal: boolean;
  message: string | null;
} & LayoutProps;

const email: Email<PetitionApprovalRequestStepFinishedEmailProps> = {
  from({ senderFullName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} via Parallel",
      },
      { senderName: senderFullName },
    );
  },
  subject(
    { approvalRequestStepName, isRejection }: PetitionApprovalRequestStepFinishedEmailProps,
    intl: IntlShape,
  ) {
    return isRejection
      ? intl.formatMessage(
          {
            id: "petition-approval-request-step-finished-email.subject-canceled",
            defaultMessage: "{approvalName} has been canceled",
          },
          { approvalName: approvalRequestStepName },
        )
      : intl.formatMessage(
          {
            id: "petition-approval-request-step-finished-email.subject-completed",
            defaultMessage: "{approvalName} is completed",
          },
          { approvalName: approvalRequestStepName },
        );
  },
  text(
    {
      userName,
      isRejection,
      isFinal,
      approvalRequestStepName,
      message,
      parallelUrl,
      petitionId,
      petitionName,
    }: PetitionApprovalRequestStepFinishedEmailProps,
    intl: IntlShape,
  ) {
    const body = outdent`
        ${
          isRejection
            ? intl.formatMessage(
                {
                  id: "petition-approval-request-step-finished-email.text-canceled",
                  defaultMessage:
                    'The step "{approvalName}" in <b>{petitionName}</b> has been cancelled.',
                },
                {
                  approvalName: approvalRequestStepName,
                  petitionName:
                    petitionName ||
                    intl.formatMessage({
                      id: "generic.unnamed-parallel",
                      defaultMessage: "Unnamed parallel",
                    }),
                },
              )
            : intl.formatMessage(
                {
                  id: "petition-approval-request-step-finished-email.text-completed",
                  defaultMessage:
                    'The step "{approvalName}" in <b>{petitionName}</b> has been completed.',
                },
                {
                  approvalName: approvalRequestStepName,
                  petitionName:
                    petitionName ||
                    intl.formatMessage({
                      id: "generic.unnamed-parallel",
                      defaultMessage: "Unnamed parallel",
                    }),
                },
              )
        }

        ${intl.formatMessage(
          {
            id: "petition-approval-request-step-finished-email.result",
            defaultMessage: "Result is: {result}",
          },
          {
            result: isRejection
              ? intl.formatMessage(
                  {
                    id: "petition-approval-request-step-finished-email.rejected",
                    defaultMessage: "Rejected ({status})",
                  },
                  {
                    status: isFinal
                      ? intl.formatMessage({
                          id: "petition-approval-request-step-finished-email.final",
                          defaultMessage: "final",
                        })
                      : intl.formatMessage({
                          id: "petition-approval-request-step-finished-email.not-final",
                          defaultMessage: "modifications",
                        }),
                  },
                )
              : intl.formatMessage({
                  id: "petition-approval-request-step-finished-email.approved",
                  defaultMessage: "Approved",
                }),
          },
        )}

        ${message
          ?.split(/\n/)
          .map((line) => `> ${line}`)
          .join("\n")}

        ${intl.formatMessage({
          id: "petition-approval-request-step-finished-email.access-click-link",
          defaultMessage: "Follow the link below link to access.",
        })}
        ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies
      `;

    return outdent`
      ${greetingUser({ name: userName }, intl)}

      ${body}

      ${closing({}, intl)}
    `;
  },
  html({
    userName,
    message,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    approvalRequestStepName,
    isFinal,
    isRejection,
    petitionId,
    petitionName,
    theme,
  }: PetitionApprovalRequestStepFinishedEmailProps) {
    const intl = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
        head={
          <>
            <MjmlHtmlAttributes>
              <MjmlSelector path=".go-to-parallel a">
                <MjmlHtmlAttribute name="data-testid">go-to-parallel-button</MjmlHtmlAttribute>
              </MjmlSelector>
              <MjmlSelector path=".user-message-box div">
                <MjmlHtmlAttribute name="data-testid">approval-message</MjmlHtmlAttribute>
              </MjmlSelector>
            </MjmlHtmlAttributes>
            <MjmlStyle>
              {`
          .rejected {
            font-size: 16px;
            color: #e53935;
            font-weight: 500;
          }
          .approved {
            font-size: 16px;
            color: #2F855A;
            font-weight: 500;
          }
          .icon {
            width: 16px;
            height: 16px;
            vertical-align: middle;
            margin-right: 4px;
            margin-left: 4px;
            padding-bottom: 4px;
          }
        `}
            </MjmlStyle>
          </>
        }
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />

            <MjmlText>
              {isRejection ? (
                <FormattedMessage
                  id="petition-approval-request-step-finished-email.text-canceled"
                  defaultMessage='The step "{approvalName}" in <b>{petitionName}</b> has been cancelled.'
                  values={{
                    approvalName: approvalRequestStepName,
                    petitionName:
                      petitionName ||
                      intl.formatMessage({
                        id: "generic.unnamed-parallel",
                        defaultMessage: "Unnamed parallel",
                      }),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="petition-approval-request-step-finished-email.text-completed"
                  defaultMessage='The step "{approvalName}" in <b>{petitionName}</b> has been completed.'
                  values={{
                    approvalName: approvalRequestStepName,
                    petitionName:
                      petitionName ||
                      intl.formatMessage({
                        id: "generic.unnamed-parallel",
                        defaultMessage: "Unnamed parallel",
                      }),
                  }}
                />
              )}
            </MjmlText>

            <MjmlText>
              <FormattedMessage
                id="petition-approval-request-step-finished-email.result"
                defaultMessage="Result is: {result}"
                values={{
                  result: "",
                }}
              />
              {isRejection ? (
                <img
                  src={`${assetsUrl}/static/emails/icons/thumbs-down.png`}
                  alt="thumbs down icon"
                  className="icon"
                />
              ) : (
                <img
                  src={`${assetsUrl}/static/emails/icons/thumbs-up.png`}
                  alt="thumbs up icon"
                  className="icon"
                />
              )}
              <span className={isRejection ? "rejected" : "approved"}>
                {isRejection
                  ? intl.formatMessage(
                      {
                        id: "petition-approval-request-step-finished-email.rejected",
                        defaultMessage: "Rejected ({status})",
                      },
                      {
                        status: isFinal
                          ? intl.formatMessage({
                              id: "petition-approval-request-step-finished-email.final",
                              defaultMessage: "final",
                            })
                          : intl.formatMessage({
                              id: "petition-approval-request-step-finished-email.not-final",
                              defaultMessage: "modifications",
                            }),
                      },
                    )
                  : intl.formatMessage({
                      id: "petition-approval-request-step-finished-email.approved",
                      defaultMessage: "Approved",
                    })}
              </span>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        {message ? (
          <UserMessageBox>
            <BreakLines>{message}</BreakLines>
          </UserMessageBox>
        ) : null}

        <MjmlSection>
          <MjmlColumn>
            <Button
              cssClass="go-to-parallel"
              href={`${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies`}
            >
              <FormattedMessage
                id="petition-approval-request-step-finished-email.access-information-button"
                defaultMessage="Access the information"
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

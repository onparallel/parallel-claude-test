import { MjmlColumn, MjmlSection, MjmlText } from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../../buildEmail";
import { Button } from "../../components/Button";
import { GreetingUser } from "../../components/Greeting";
import { Layout, LayoutProps } from "../../components/Layout";
import { greetingUser } from "../../components/texts";

type PetitionApprovalRequestStepCanceledEmailProps = {
  userName: string | null;
  stepName: string;
  petitionName: string | null;
  petitionId: string;
} & LayoutProps;

const email: Email<PetitionApprovalRequestStepCanceledEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "petition-approval-request-step-canceled-email.subject",
      defaultMessage: "Approval request cancelled",
    });
  },
  text(
    {
      userName,
      stepName,
      petitionName,
      petitionId,
      parallelUrl,
    }: PetitionApprovalRequestStepCanceledEmailProps,
    intl: IntlShape,
  ) {
    return outdent`
      ${greetingUser({ name: userName }, intl)}
      
      ${intl.formatMessage(
        {
          id: "petition-approval-request-step-canceled-email.text",
          defaultMessage: 'The step "{stepName}" in <b>{petitionName}</b> has been cancelled.',
        },
        {
          stepName,
          petitionName:
            petitionName ||
            intl.formatMessage({
              id: "generic.unnamed-parallel",
              defaultMessage: "Unnamed parallel",
            }),
        },
      )}

      ${intl.formatMessage({
        id: "petition-approval-request-step-canceled-email.access-parallel",
        defaultMessage: "You can access the parallel to request it again.",
      })}

      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies?comments=general

    `;
  },
  html({
    userName,
    stepName,
    petitionName,
    petitionId,
    parallelUrl,
    assetsUrl,
    logoAlt,
    logoUrl,
    theme,
  }: PetitionApprovalRequestStepCanceledEmailProps) {
    const intl = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="petition-approval-request-step-canceled-email.text"
                defaultMessage='The step "{stepName}" in <b>{petitionName}</b> has been cancelled.'
                values={{
                  stepName,
                  petitionName:
                    petitionName ||
                    intl.formatMessage({
                      id: "generic.unnamed-parallel",
                      defaultMessage: "Unnamed parallel",
                    }),
                }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="petition-approval-request-step-canceled-email.access-parallel"
                defaultMessage="You can access the parallel to request it again."
              />
            </MjmlText>
            <Button
              href={`${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies?comments=general`}
            >
              <FormattedMessage
                id="generic.access-the-parallel-button"
                defaultMessage="Access the parallel"
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

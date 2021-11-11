import { MjmlColumn, MjmlGroup, MjmlImage, MjmlSection, MjmlText, MjmlWrapper } from "mjml-react";
import { FormattedMessage, useIntl } from "react-intl";
import { Tone } from "../utils/types";

interface WhyWeUseParallelProps {
  tone: Tone;
  assetsUrl: string;
}

export function WhyWeUseParallel({ tone, assetsUrl }: WhyWeUseParallelProps) {
  const intl = useIntl();

  const reasons = [
    {
      imageSrc: `${assetsUrl}/static/emails/ic/ic_security.png`,
      title: intl.formatMessage(
        {
          id: "component.why-we-use-parallel.security-title",
          defaultMessage: "Private portal for your information",
        },
        { tone }
      ),
      body: intl.formatMessage(
        {
          id: "component.why-we-use-parallel.security-body",
          defaultMessage:
            "Parallel is a private space where you can <b>share information and documents</b> with third parties securely.",
        },
        { tone }
      ),
    },
    {
      imageSrc: `${assetsUrl}/static/emails/ic/ic_autosave.png`,
      title: intl.formatMessage(
        {
          id: "component.why-we-use-parallel.autosave-title",
          defaultMessage: "Your replies auto-saved",
        },
        { tone }
      ),
      body: intl.formatMessage(
        {
          id: "component.why-we-use-parallel.autosave-body",
          defaultMessage:
            "Every <b>response is saved automatically and synchronised</b> with your sender, allowing you to exit at any time and resume later.",
        },
        { tone }
      ),
    },
    {
      imageSrc: `${assetsUrl}/static/emails/ic/ic_invite.png`,
      title: intl.formatMessage(
        {
          id: "component.why-we-use-parallel.invite-title",
          defaultMessage: "Invite collaborators",
        },
        { tone }
      ),
      body: intl.formatMessage(
        {
          id: "component.why-we-use-parallel.invite-body",
          defaultMessage:
            "Only allowed users will be able to access the link. Once inside, they can <b>invite the collaborators</b> they need to help complete the information.",
        },
        { tone }
      ),
    },
  ];

  return (
    <MjmlWrapper padding="10px 25px">
      <MjmlSection>
        <MjmlText fontSize="20px" fontWeight={600} paddingRight={0}>
          <FormattedMessage
            id="component.why-we-use-parallel.title"
            defaultMessage="Why we use Parallel"
          />
        </MjmlText>
      </MjmlSection>
      {reasons.map((reason, index) => (
        <MjmlSection key={index}>
          <MjmlGroup>
            <MjmlColumn verticalAlign="middle" width="12%">
              <MjmlImage padding="0px" width="32px" src={reason.imageSrc} alt="" />
            </MjmlColumn>
            <MjmlColumn verticalAlign="middle" width="88%">
              <MjmlText
                fontSize="16px"
                fontWeight={600}
                paddingBottom={0}
                paddingLeft="16px"
                paddingRight={0}
              >
                {reason.title}
              </MjmlText>
              <MjmlText fontSize="14px" paddingLeft="16px" paddingRight={0}>
                {reason.body}
              </MjmlText>
            </MjmlColumn>
          </MjmlGroup>
        </MjmlSection>
      ))}
    </MjmlWrapper>
  );
}

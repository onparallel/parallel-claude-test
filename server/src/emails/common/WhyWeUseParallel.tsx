import { MjmlColumn, MjmlGroup, MjmlImage, MjmlSection, MjmlText, MjmlWrapper } from "mjml-react";
import { FormattedMessage } from "react-intl";
import { Tone } from "../utils/types";

interface WhyWeUseParallelProps {
  tone: Tone;
  assetsUrl: string;
}

export function WhyWeUseParallel({ tone, assetsUrl }: WhyWeUseParallelProps) {
  return (
    <MjmlWrapper padding="10px 25px">
      <MjmlSection padding="12px 16px">
        <MjmlText fontSize="20px" fontWeight={600}>
          <FormattedMessage
            id="component.why-we-use-parallel.title"
            defaultMessage="Why we use Parallel?"
          />
        </MjmlText>
      </MjmlSection>
      <MjmlSection padding="12px 16px">
        <MjmlGroup>
          <MjmlColumn verticalAlign="middle" width="12%">
            <MjmlImage
              padding="0px"
              width="32px"
              src={`${assetsUrl}/static/emails/ic/ic_security.png`}
            />
          </MjmlColumn>
          <MjmlColumn verticalAlign="middle" width="88%">
            <MjmlText fontSize="16px" fontWeight={600} paddingBottom={0} paddingLeft="16px">
              <FormattedMessage
                id="component.why-we-use-parallel.security-title"
                defaultMessage="Private portal for your information"
                values={{ tone }}
              />
            </MjmlText>
            <MjmlText fontSize="14px" paddingLeft="16px">
              <FormattedMessage
                id="component.why-we-use-parallel.security-body"
                defaultMessage="Parallel is a private space where you can <b>share information and documents</b> with third parties securely."
                values={{ tone }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlGroup>
      </MjmlSection>
      <MjmlSection padding="12px 16px">
        <MjmlGroup>
          <MjmlColumn verticalAlign="middle" width="12%">
            <MjmlImage
              padding="0px"
              width="32px"
              src={`${assetsUrl}/static/emails/ic/ic_autosave.png`}
            />
          </MjmlColumn>
          <MjmlColumn verticalAlign="middle" width="88%">
            <MjmlText fontSize="16px" fontWeight={600} paddingBottom={0} paddingLeft="16px">
              <FormattedMessage
                id="component.why-we-use-parallel.autosave-title"
                defaultMessage="Your replies auto-saved"
                values={{ tone }}
              />
            </MjmlText>
            <MjmlText fontSize="14px" paddingLeft="16px">
              <FormattedMessage
                id="component.why-we-use-parallel.autosave-body"
                defaultMessage="Each <b>response is auto-saved and synchronised</b> with your sender to allow to exit at any time and completing later."
                values={{ tone }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlGroup>
      </MjmlSection>
      <MjmlSection padding="12px 16px">
        <MjmlGroup>
          <MjmlColumn verticalAlign="middle" width="12%">
            <MjmlImage
              padding="0px"
              width="32px"
              src={`${assetsUrl}/static/emails/ic/ic_invite.png`}
            />
          </MjmlColumn>
          <MjmlColumn verticalAlign="middle" width="88%">
            <MjmlText fontSize="16px" fontWeight={600} paddingBottom={0} paddingLeft="16px">
              <FormattedMessage
                id="component.why-we-use-parallel.invite-title"
                defaultMessage="Invite collaborators"
                values={{ tone }}
              />
            </MjmlText>
            <MjmlText fontSize="14px" paddingLeft="16px">
              <FormattedMessage
                id="component.why-we-use-parallel.invite-body"
                defaultMessage="Users can only access the link with permission, once inside, they can <b>invite the collaborators</b> they need to complete the information collaboratively."
                values={{ tone }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlGroup>
      </MjmlSection>
    </MjmlWrapper>
  );
}

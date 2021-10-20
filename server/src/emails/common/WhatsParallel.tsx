import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function WhatsParallel() {
  return (
    <MjmlSection>
      <MjmlColumn>
        <MjmlText fontSize="16px" fontWeight={600} paddingTop="20px" paddingBottom={0}>
          <FormattedMessage id="component.whats-parallel.title" defaultMessage="What’s Parallel?" />
        </MjmlText>
        <MjmlText fontSize="14px" paddingBottom="14px">
          <FormattedMessage
            id="component.whats-parallel.body"
            defaultMessage="Parallel is a platform that will help you manage your client’s documentation and information in an agile and secure way."
          />
        </MjmlText>
        <MjmlText fontSize="14px">
          <FormattedMessage
            id="component.whats-parallel.contact"
            defaultMessage="If you have any questions, please contact us at {contactEmail} and we will be happy to answer them."
            values={{
              contactEmail: (
                <a className="link" href="mailto:support@onparallel.com">
                  support@onparallel.com
                </a>
              ),
            }}
          />
        </MjmlText>
      </MjmlColumn>
    </MjmlSection>
  );
}

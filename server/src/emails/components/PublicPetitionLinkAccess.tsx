import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Maybe } from "../../util/types";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { greetingFormal } from "../common/texts";

export type PublicPetitionLinkAccessProps = {
  emailSubject: Maybe<string>;
  fullName: string | null;
  senderName: string;
  petitionTitle: string;
  keycode: string;
} & LayoutProps;

const email: Email<PublicPetitionLinkAccessProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ emailSubject, petitionTitle }) {
    return emailSubject || petitionTitle;
  },
  text({ fullName, petitionTitle, keycode, parallelUrl }, intl) {
    return outdent`
      ${greetingFormal({ fullName }, intl)}

      ${intl.formatMessage(
        {
          id: "public-petition-link.text-1",
          defaultMessage: "We send you the requested access to {petitionTitle}.",
        },
        { petitionTitle }
      )}

      ${intl.formatMessage({
        id: "public-petition-link.text-2",
        defaultMessage:
          "The information will be automatically saved on the platform, and you can continue the process later through the same link.",
      })}

      ${intl.formatMessage({
        id: "public-petition-link.text-3",
        defaultMessage:
          "If you have any questions or comments you can contact us in the designated spaces on the platform.",
      })}

      ${intl.formatMessage({
        id: "generic.complete-information-click-link",
        defaultMessage: "Please click the link below to complete the information.",
      })}

      ${parallelUrl}/${intl.locale}/petition/${keycode}
    `;
  },
  html({
    fullName,
    petitionTitle,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PublicPetitionLinkAccessProps) {
    const { locale } = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingFormal fullName={fullName} />
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-1"
                defaultMessage="We send you the requested access to {petitionTitle}."
                values={{ petitionTitle: <b>{petitionTitle}</b> }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-2"
                defaultMessage="The information will be automatically saved on the platform, and you can continue the process later through the same link."
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-3"
                defaultMessage="If you have any questions or comments you can contact us in the designated spaces on the platform."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection>
          <MjmlColumn>
            <CompleteInfoButton href={`${parallelUrl}/${locale}/petition/${keycode}`} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

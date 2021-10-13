import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Maybe } from "../../util/types";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { GreetingContact } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { greetingContact } from "../common/texts";

export type PublicPetitionLinkAccessProps = {
  emailSubject: Maybe<string>;
  name: string | null;
  fullName: string | null;
  senderName: string;
  petitionTitle: string;
  keycode: string;
  tone: string;
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
  text({ name, fullName, petitionTitle, keycode, parallelUrl, tone }, intl) {
    return outdent`
      ${greetingContact({ name, fullName, tone }, intl)}
      
      ${intl.formatMessage(
        {
          id: "public-petition-link.text-1",
          defaultMessage: "We send you the requested access to {petitionTitle}.",
        },
        { petitionTitle }
      )}

      ${intl.formatMessage(
        {
          id: "public-petition-link.text-2",
          defaultMessage:
            "The information will be automatically saved on the platform, and you can continue the process later through the same link.",
        },
        { tone }
      )}

      ${intl.formatMessage(
        {
          id: "public-petition-link.text-3",
          defaultMessage:
            "If you have any questions or comments you can contact us in the designated spaces on the platform.",
        },
        { tone }
      )}

      ${intl.formatMessage({
        id: "generic.complete-information-click-link",
        defaultMessage: "Please click the link below to complete the information.",
      })}

      ${parallelUrl}/${intl.locale}/petition/${keycode}
    `;
  },
  html({
    name,
    fullName,
    petitionTitle,
    keycode,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    tone,
  }: PublicPetitionLinkAccessProps) {
    const { locale } = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        tone={tone}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={name} fullName={fullName} tone={tone} />
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-1"
                defaultMessage="We send you the requested access to {petitionTitle}."
                values={{ petitionTitle: <b>{petitionTitle}</b>, tone }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-2"
                defaultMessage="The information will be automatically saved on the platform, and you can continue the process later through the same link."
                values={{ tone }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-3"
                defaultMessage="If you have any questions or comments you can contact us in the designated spaces on the platform."
                values={{ tone }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection>
          <MjmlColumn>
            <CompleteInfoButton tone={tone} href={`${parallelUrl}/${locale}/petition/${keycode}`} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

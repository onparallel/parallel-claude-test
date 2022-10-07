import { MjmlColumn, MjmlSection, MjmlText } from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Maybe } from "../../util/types";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../components/CompleteInfoButton";
import { GreetingContact } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { greetingContact } from "../components/texts";
import { WhyWeUseParallel } from "../components/WhyWeUseParallel";

export type PublicPetitionLinkAccessProps = {
  emailSubject: Maybe<string>;
  name: string;
  fullName: string;
  senderName: string;
  petitionTitle: string;
  keycode: string;
  removeWhyWeUseParallel: boolean;
  removeParallelBranding: boolean;
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
  text({ name, fullName, petitionTitle, keycode, parallelUrl, theme }, intl) {
    return outdent`
      ${greetingContact({ name, fullName, tone: theme.preferredTone }, intl)}
      
      ${intl.formatMessage(
        {
          id: "public-petition-link.text-1",
          defaultMessage: "We send you the requested access to {petitionTitle}.",
        },
        { petitionTitle, tone: theme.preferredTone }
      )}

      ${intl.formatMessage(
        {
          id: "public-petition-link.text-2",
          defaultMessage:
            "The information will be automatically saved on the platform, and you can continue the process later through the same link.",
        },
        { tone: theme.preferredTone }
      )}

      ${intl.formatMessage(
        {
          id: "public-petition-link.text-3",
          defaultMessage:
            "If you have any questions or comments you can contact us in the designated spaces on the platform.",
        },
        { tone: theme.preferredTone }
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
    removeWhyWeUseParallel,
    removeParallelBranding,
    theme,
  }: PublicPetitionLinkAccessProps) {
    const { locale } = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        utmCampaign="recipients"
        removeParallelBranding={removeParallelBranding}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={name} fullName={fullName} tone={theme.preferredTone} />
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-1"
                defaultMessage="We send you the requested access to {petitionTitle}."
                values={{ petitionTitle: <b>{petitionTitle}</b>, tone: theme.preferredTone }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-2"
                defaultMessage="The information will be automatically saved on the platform, and you can continue the process later through the same link."
                values={{ tone: theme.preferredTone }}
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="public-petition-link.text-3"
                defaultMessage="If you have any questions or comments you can contact us in the designated spaces on the platform."
                values={{ tone: theme.preferredTone }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection>
          <MjmlColumn>
            <CompleteInfoButton
              tone={theme.preferredTone}
              href={`${parallelUrl}/${locale}/petition/${keycode}`}
            />
          </MjmlColumn>
        </MjmlSection>
        {removeWhyWeUseParallel || removeParallelBranding ? null : (
          <WhyWeUseParallel assetsUrl={assetsUrl} tone={theme.preferredTone} />
        )}
      </Layout>
    );
  },
};
export default email;

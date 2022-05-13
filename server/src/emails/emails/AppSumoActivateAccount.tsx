import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { greetingUser, closing } from "../components/texts";

export type AppsumoActivateAccountProps = {
  redirectUrl: string;
} & LayoutProps;

const email: Email<AppsumoActivateAccountProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({}, intl: IntlShape) {
    return intl.formatMessage({
      id: "appsumo-activate-account.subject",
      defaultMessage: "Activate your Parallel account",
    });
  },
  text({ redirectUrl }: AppsumoActivateAccountProps, intl: IntlShape) {
    return outdent`
      ${greetingUser({ name: "Sumo-ling!" }, intl)}
      ${intl.formatMessage({
        id: "appsumo-activate-account.intro-text",
        defaultMessage: "You are just a few clicks away from using Parallel.",
      })}

      ${intl.formatMessage({
        id: "appsumo-activate-account.intro-text-2",
        defaultMessage: "Please, click the link below to sign-up and activate your account.",
      })}

      ${redirectUrl}

      ${intl.formatMessage({
        id: "appsumo-activate-account.intro-text-3",
        defaultMessage:
          "If you already activated it via AppSumo, then you're all set. No need to do anything.",
      })}

      ${closing({}, intl)}
    `;
  },
  html({ redirectUrl, parallelUrl, assetsUrl, logoUrl, logoAlt }: AppsumoActivateAccountProps) {
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={"Sumo-ling!"} />
            <MjmlText>
              <FormattedMessage
                id="appsumo-activate-account.intro-text"
                defaultMessage="You are just a few clicks away from using Parallel."
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="appsumo-activate-account.intro-text-2"
                defaultMessage="Please, click the link below to sign-up and activate your account."
              />
            </MjmlText>
            <Button href={`${redirectUrl}`}>
              <FormattedMessage
                id="appsumo-activate-account.activate-button"
                defaultMessage="Activate my account"
              />
            </Button>
            <MjmlText>
              <FormattedMessage
                id="appsumo-activate-account.intro-text-3"
                defaultMessage="If you already activated it via AppSumo, then you're all set. No need to do anything."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

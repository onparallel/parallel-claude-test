import {
  Mjml,
  MjmlAll,
  MjmlAttributes,
  MjmlBody,
  MjmlButton,
  MjmlClass,
  MjmlColumn,
  MjmlDivider,
  MjmlHead,
  MjmlImage,
  MjmlSection,
  MjmlSocial,
  MjmlSocialElement,
  MjmlStyle,
  MjmlText,
  MjmlTitle,
  MjmlWrapper,
} from "mjml-react";
import { FC, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { URLSearchParams } from "url";
import { BrandTheme } from "../../util/BrandTheme";
import { ThemeProvider, useTheme } from "../utils/ThemeProvider";
import { GdprDisclaimer } from "./GdprDisclaimer";

export type LayoutProps = {
  title?: string;
  parallelUrl: string;
  logoUrl: string;
  logoAlt: string;
  assetsUrl: string;
  contentHeading?: ReactNode;
  useAlternativeSlogan?: boolean;
  optOutUrl?: string;
  optOutText?: string;
  omitGdprDisclaimer?: boolean;
  utmCampaign?: string;
  removeParallelBranding?: boolean;
  theme: BrandTheme;
};

export const Layout: FC<LayoutProps> = function Layout({ theme, ...props }) {
  return (
    <ThemeProvider theme={theme}>
      <ThemedLayout {...props} />
    </ThemeProvider>
  );
};

const ThemedLayout: FC<Omit<LayoutProps, "theme">> = function ThemedLayout({
  title,
  logoUrl,
  logoAlt,
  assetsUrl,
  children,
  contentHeading,
  optOutUrl,
  optOutText,
  useAlternativeSlogan,
  omitGdprDisclaimer,
  utmCampaign,
  removeParallelBranding,
}) {
  const { locale } = useIntl();
  const utm = new URLSearchParams({
    utm_source: "parallel",
    utm_medium: "email",
    ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
  });

  const theme = useTheme();

  return (
    <Mjml>
      <MjmlHead>
        {title ? <MjmlTitle>{title}</MjmlTitle> : null}
        <MjmlAttributes>
          <MjmlAll fontSize="14px" lineHeight="1.4" fontFamily={theme.fontFamily} />
          <MjmlClass
            name="button-primary"
            backgroundColor={theme.colors.primary[500]}
            color="#FFFFFF"
            fontWeight="600"
            borderRadius="4px"
            fontSize="16px"
          />
        </MjmlAttributes>
        <MjmlStyle inline>{
          /* css */ `
          body {
            padding: 0 16px;
          }
          .link {
            color: ${theme.colors.primary[500]};
            text-decoration: none;
          }
        `
        }</MjmlStyle>
      </MjmlHead>
      <MjmlBody>
        {/* Header */}
        <MjmlSection>
          <MjmlColumn>
            <MjmlImage alt={logoAlt} width="200px" src={logoUrl} />
          </MjmlColumn>
        </MjmlSection>

        {/* Content */}
        <MjmlWrapper padding="1px">
          {contentHeading}
          {children}
        </MjmlWrapper>

        {/* Footer */}
        <MjmlSection>
          <MjmlDivider borderWidth="1px" borderColor="#CBD5E0" width="80%" />
        </MjmlSection>

        <MjmlSection padding="0">
          <MjmlColumn width="100%">
            {removeParallelBranding ? null : (
              <>
                {useAlternativeSlogan ? (
                  <MjmlButton
                    href={`https://www.onparallel.com/${locale}?${utm}`}
                    innerPadding="6px 25px"
                    backgroundColor="white"
                    color="black"
                    border="1px solid #A0AEC0"
                    borderRadius="5px"
                  >
                    <FormattedMessage
                      id="footer.slogan.alternative"
                      defaultMessage="Create your own <b>parallel</b>"
                      values={{ tone: theme.tone }}
                    />
                  </MjmlButton>
                ) : (
                  <>
                    <MjmlText color="#2D3748" align="center">
                      <FormattedMessage id="footer.slogan" defaultMessage="Work better with" />
                    </MjmlText>
                    <MjmlImage
                      padding="0"
                      width="120px"
                      alt="Parallel"
                      src={`${assetsUrl}/static/emails/logo.png`}
                      href={`https://www.onparallel.com/${locale}?${utm}`}
                    />
                  </>
                )}
                {useAlternativeSlogan ? null : (
                  <MjmlSocial align="center" icon-padding="1px">
                    <MjmlSocialElement
                      alt="LinkedIn"
                      name="linkedin-noshare"
                      href="https://www.linkedin.com/company/onparallel"
                      backgroundColor={theme.colors.primary[500]}
                    />
                    <MjmlSocialElement
                      alt="Slack"
                      src={`${assetsUrl}/static/emails/slack.png`}
                      href="https://joinparallel.slack.com/join/shared_invite/zt-sda28ew5-tCZBQzZpPupCIsd85RgwGA#/shared-invite/email"
                      backgroundColor={theme.colors.primary[500]}
                    />
                    <MjmlSocialElement
                      alt="Facebook"
                      name="facebook-noshare"
                      href="https://www.facebook.com/parallel.so"
                      backgroundColor={theme.colors.primary[500]}
                    />
                    <MjmlSocialElement
                      alt="Twitter"
                      name="twitter-noshare"
                      href="https://twitter.com/Parallel_SO"
                      backgroundColor={theme.colors.primary[500]}
                    />
                  </MjmlSocial>
                )}
                {useAlternativeSlogan ? null : (
                  <MjmlText align="center">
                    <a
                      className="link"
                      href={`https://www.onparallel.com/${locale}/legal/terms?${utm}`}
                    >
                      <FormattedMessage
                        id="layout.terms-and-conditions-link"
                        defaultMessage="Terms and conditions"
                      />
                    </a>
                    <span> | </span>
                    <a
                      className="link"
                      href={`https://www.onparallel.com/${locale}/legal/privacy?${utm}`}
                    >
                      <FormattedMessage id="layout.privacy-link" defaultMessage="Privacy" />
                    </a>
                  </MjmlText>
                )}
              </>
            )}
            {optOutUrl ? (
              <MjmlText align="center" fontSize="14px">
                <a className="link" href={optOutUrl}>
                  {optOutText}
                </a>
              </MjmlText>
            ) : null}
          </MjmlColumn>
        </MjmlSection>

        {omitGdprDisclaimer ? null : (
          <MjmlSection>
            <MjmlColumn>
              <GdprDisclaimer />
            </MjmlColumn>
          </MjmlSection>
        )}
      </MjmlBody>
    </Mjml>
  );
};

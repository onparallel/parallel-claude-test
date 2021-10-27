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
import { FC } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { URLSearchParams } from "url";
import { GdprDisclaimer } from "./GdprDisclaimer";

export type LayoutProps = {
  title?: string;
  parallelUrl: string;
  logoUrl: string;
  logoAlt: string;
  assetsUrl: string;
  contentHeading?: Element | null;
  useAlternativeSlogan?: boolean;
  optOutUrl?: string;
  optOutText?: string;
  omitGdprDisclaimer?: boolean;
  tone?: string;
  utmCampaign?: string;
};

export const Layout: FC<LayoutProps> = function Layout({
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
  tone,
}) {
  const { locale } = useIntl();
  const utm = new URLSearchParams({
    utm_source: "parallel",
    utm_medium: "email",
    ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
  });
  return (
    <Mjml>
      <MjmlHead>
        {title ? <MjmlTitle>{title}</MjmlTitle> : null}
        <MjmlAttributes>
          <MjmlAll fontSize="14px" lineHeight="1.4" />
          <MjmlClass
            name="button-primary"
            backgroundColor="#6059f7"
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
            color: #6059f7;
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
                  values={{ tone }}
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
                  backgroundColor="#6059f7"
                />
                <MjmlSocialElement
                  alt="Slack"
                  src={`${assetsUrl}/static/emails/slack.png`}
                  href="https://joinparallel.slack.com/join/shared_invite/zt-sda28ew5-tCZBQzZpPupCIsd85RgwGA#/shared-invite/email"
                  backgroundColor="#6059f7"
                />
                <MjmlSocialElement
                  alt="Facebook"
                  name="facebook-noshare"
                  href="https://www.facebook.com/parallel.so"
                  backgroundColor="#6059f7"
                />
                <MjmlSocialElement
                  alt="Twitter"
                  name="twitter-noshare"
                  href="https://twitter.com/Parallel_SO"
                  backgroundColor="#6059f7"
                />
              </MjmlSocial>
            )}
            <MjmlText align="center" color="#1A202C" lineHeight="20px">
              <FormattedMessage
                id="layout.email-sent-by"
                defaultMessage="Sent by Parallel Solutions, S.L."
              />
              <br />
              C/Almogàvers 165, 59.203, 08018 | Barcelona, Spain
            </MjmlText>
            <MjmlText align="center">
              <a className="link" href={`https://www.onparallel.com/${locale}/legal/terms?${utm}`}>
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

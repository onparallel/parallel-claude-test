import {
  Mjml,
  MjmlAll,
  MjmlAttributes,
  MjmlBody,
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
import { GdprDisclaimer } from "./GdprDisclaimer";

export type LayoutProps = {
  title?: string;
  parallelUrl: string;
  logoUrl: string;
  logoAlt: string;
  assetsUrl: string;
  showGdprDisclaimer?: boolean;
  contentHeading?: Element | null;
};

export const Layout: FC<LayoutProps> = function Layout({
  title,
  parallelUrl,
  logoUrl,
  logoAlt,
  assetsUrl,
  children,
  showGdprDisclaimer,
  contentHeading,
}) {
  const { locale } = useIntl();
  return (
    <Mjml>
      <MjmlHead>
        {title ? <MjmlTitle>{title}</MjmlTitle> : null}
        <MjmlAttributes>
          <MjmlAll fontSize="14px" />
          <MjmlClass
            name="button-primary"
            backgroundColor="#6059f7"
            color="#FFFFFF"
            fontWeight={600}
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
      <MjmlBody backgroundColor="#f6f6f6">
        {/* Header */}
        <MjmlSection>
          <MjmlColumn>
            <MjmlImage alt={logoAlt} width="200px" src={logoUrl} />
          </MjmlColumn>
        </MjmlSection>

        {/* Content */}
        <MjmlWrapper padding="1px" backgroundColor="#A0AEC0" borderRadius="4px">
          {contentHeading}
          <MjmlWrapper
            padding="0"
            backgroundColor="#ffffff"
            borderRadius={contentHeading ? "0 0 3px 3px" : "3px"}
          >
            {children}
          </MjmlWrapper>
        </MjmlWrapper>

        {/* Footer */}
        <MjmlSection>
          <MjmlDivider borderWidth="1px" borderColor="#A0AEC0" width="80%" />
        </MjmlSection>
        <MjmlSection padding="0">
          <MjmlColumn width="100%">
            <MjmlText color="#2D3748" align="center">
              <FormattedMessage
                id="footer.slogan"
                defaultMessage="Work better with"
              />
            </MjmlText>
            <MjmlImage
              padding="0"
              width="120px"
              alt="Parallel"
              src={`${assetsUrl}/static/emails/logo.png`}
              href="https://www.parallel.so"
            />
            <MjmlSocial align="center" icon-padding="1px">
              <MjmlSocialElement
                alt="LinkedIn"
                name="linkedin-noshare"
                href="https://www.linkedin.com/company/parallel-so"
                backgroundColor="#6059f7"
              >
                {" "}
              </MjmlSocialElement>
              <MjmlSocialElement
                alt="Twitter"
                name="twitter-noshare"
                href="https://twitter.com/Parallel_SO"
                backgroundColor="#6059f7"
              >
                {" "}
              </MjmlSocialElement>
            </MjmlSocial>
            <MjmlText align="center" fontSize="12px">
              {`Parallel Solutions, S.L. - C/Almogàvers 165, 59.203, 08018 Barcelona, Spain`}
            </MjmlText>
            <MjmlText align="center" fontSize="12px">
              <a className="link" href={`${parallelUrl}/${locale}/legal/terms`}>
                <FormattedMessage
                  id="layout.terms-and-conditions-link"
                  defaultMessage="Terms and conditions"
                />
              </a>
              <span>&nbsp;|&nbsp;</span>
              <a
                className="link"
                href={`${parallelUrl}/${locale}/legal/privacy`}
              >
                <FormattedMessage
                  id="layout.privacy-link"
                  defaultMessage="Privacy"
                />
              </a>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        {showGdprDisclaimer ? (
          <MjmlSection>
            <GdprDisclaimer />
          </MjmlSection>
        ) : null}
      </MjmlBody>
    </Mjml>
  );
};

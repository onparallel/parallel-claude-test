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
  MjmlWrapper,
} from "mjml-react";
import React, { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export type LayoutProps = {
  parallelUrl: string;
  assetsUrl: string;
  children: ReactNode;
};

export function Layout({ parallelUrl, assetsUrl, children }: LayoutProps) {
  const { locale } = useIntl();
  return (
    <Mjml>
      <MjmlHead>
        <MjmlAttributes>
          <MjmlAll fontSize="14px"></MjmlAll>
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
            <MjmlImage
              alt="Parallel"
              width="200px"
              src={`${assetsUrl}/static/emails/logo.png`}
            ></MjmlImage>
          </MjmlColumn>
        </MjmlSection>

        {/* Content */}
        <MjmlWrapper padding="1px" backgroundColor="#A0AEC0" borderRadius="4px">
          <MjmlWrapper padding="0" backgroundColor="#ffffff" borderRadius="3px">
            {children}
          </MjmlWrapper>
        </MjmlWrapper>

        {/* Footer */}
        <MjmlSection>
          <MjmlDivider
            borderWidth="1px"
            borderColor="#A0AEC0"
            width="80%"
          ></MjmlDivider>
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
            ></MjmlImage>
            <MjmlSocial align="center" icon-padding="1px">
              <MjmlSocialElement
                name="linkedin-noshare"
                href="https://www.linkedin.com/company/parallel-so"
                backgroundColor="#6059f7"
              >
                {" "}
              </MjmlSocialElement>
              <MjmlSocialElement
                name="twitter-noshare"
                href="https://twitter.com/Parallel_SO"
                backgroundColor="#6059f7"
              >
                {" "}
              </MjmlSocialElement>
            </MjmlSocial>
            <MjmlText align="center" fontSize="12px">
              {`Parallel Solutions, S.L. - Av. Meridiana 89, 08026 Barcelona, Spain`}
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
      </MjmlBody>
    </Mjml>
  );
}

import { Router } from "express";
import { Container } from "inversify";
import { DocusignOauthIntegration } from "./DocusignOauthIntegration";
import { OAuthIntegration } from "./OAuthIntegration";

export function oauth(container: Container) {
  const docusign = container.get<OAuthIntegration>(DocusignOauthIntegration);
  return Router().use("/docusign", docusign.handler());
}

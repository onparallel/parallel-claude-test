import { Router } from "express";
import { Container } from "inversify";
import { DocusignOauthIntegration } from "./DocusignOauthIntegration";

export function oauth(container: Container) {
  const docusign = container.get<DocusignOauthIntegration>(DocusignOauthIntegration);
  return Router().use("/docusign", docusign.handler());
}

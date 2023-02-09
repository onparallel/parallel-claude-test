import { Router } from "express";
import { Container } from "inversify";
import { DocusignIntegration } from "../integrations/DocusignIntegration";

export function oauth(container: Container) {
  const docusign = container.get<DocusignIntegration>(DocusignIntegration);
  return Router().use("/docusign", docusign.handler());
}

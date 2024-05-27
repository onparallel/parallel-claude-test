import { Router } from "express";
import { Container } from "inversify";
import { DocusignIntegration } from "../integrations/signature/DocusignIntegration";

export function oauth(container: Container) {
  return Router().use("/docusign", (req, res, next) => {
    const docusign = container.get<DocusignIntegration>(DocusignIntegration);
    return docusign.handler()(req, res, next);
  });
}

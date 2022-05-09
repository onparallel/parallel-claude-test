import { Router, urlencoded } from "express";
import { isDefined } from "remeda";
import { sign, verify } from "../util/jwt";

type AppSumoPayload =
  | {
      action: "activate" | "refund" | "update";
      plan_id: string;
      uuid: string;
      activation_email: string;
      invoice_item_uuid: string;
    }
  | {
      action: "enhance_tier" | "reduce_tier";
      plan_id: string;
      uuid: string;
      activation_email: string;
    };

export const appsumo = Router()
  .use(urlencoded({ extended: true }))
  .post("/token", async (req, res) => {
    if (
      req.body.username === req.context.config.appsumo.username &&
      req.body.password === req.context.config.appsumo.password
    ) {
      res.status(200).json({
        access: await sign({}, req.context.config.security.jwtSecret, {
          expiresIn: "1 minute",
        }),
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  })
  .post(
    "/notification",
    (req, res, next) => {
      try {
        req.context.logger.debug(
          JSON.stringify(
            {
              url: req.url,
              method: req.method,
              body: JSON.stringify(req.body),
              authorization: req.header("authorization"),
            },
            null,
            2
          )
        );
      } catch {}
      next();
    },
    async function authenticate(req, res, next) {
      try {
        const match = req.headers.authorization?.match(/^Bearer (.*)$/);
        if (!match) {
          throw new Error();
        }

        await verify(match[1], req.context.config.security.jwtSecret);

        const orgs = await req.context.organizations.getOrganizationsByUserEmail(
          req.body.activation_email
        );

        if (orgs.length > 1) {
          // block every action if the email has more than 1 organization
          return res.status(401).json({ message: "Unauthorized" });
        }

        req.context.organization = orgs[0];
        const payload = req.body as AppSumoPayload;
        if (
          !["activate", "refund", "update", "enhance_tier", "reduce_tier"].includes(payload.action)
        ) {
          return res.status(401).json({ message: "invalid action" });
        }

        return isDefined(req.context.organization) ||
          ["activate", "refund"].includes(payload.action)
          ? next()
          : res.status(401).json({
              message:
                "We could not find an active organization in Parallel to perform this action",
            });
      } catch (error: any) {
        req.context.logger.error(error.message, { stack: error.stack });
        return res.status(401).json({ message: "Unauthorized" });
      }
    },
    async (req, res) => {
      const payload = { source: "AppSumo", ...(req.body as AppSumoPayload) };
      const org = req.context.organization;

      if (payload.action === "activate") {
        if (isDefined(org)) {
          // first we need to make sure this organization was not created previously with another AppSumo purchase UNLESS the last action was a refund
          // "Sumo-lings SHOULD NOT be able to activate multiple AppSumo licenses with the same email."
          if (org.metadata.source === "AppSumo" && org.metadata.action !== "refund") {
            return res.status(401).json({
              message: "The email is already registered in Parallel with an active license",
            });
          }

          // user with activation_email already has an account created on Parallel.
          // so we just need to set the purchased license and redirect to login page
          await req.context.organizations.updateOrganization(
            org.id,
            {
              metadata: {
                ...org.metadata,
                ...payload,
                events: [...(org.metadata.events ?? []), payload],
              },
            },
            `AppSumo:${payload.uuid}`
          );
          await req.context.tiers.updateOrganizationTier(
            org.id,
            mapTier(payload.plan_id),
            `AppSumo:${payload.uuid}`
          );

          return res.status(201).json({
            message: "license activated",
            redirect_url: `${req.context.config.misc.parallelUrl}/login`,
          });
        } else {
          // user does not have a Parallel account.
          // Redirect to signup page with special JWT to apply purchased license after user creates an account
          const token = await sign(payload, req.context.config.security.jwtSecret);
          return res.status(201).json({
            message: "product activated",
            redirect_url: `${req.context.config.misc.parallelUrl}/signup?token=${token}`,
          });
        }
      } else if (payload.action === "refund") {
        // if doing a refund and the organization does not exist, do nothing and return success
        if (isDefined(org)) {
          await req.context.organizations.updateOrganization(
            org.id,
            {
              metadata: {
                ...org.metadata,
                ...payload,
                events: [...(org.metadata.events ?? []), payload],
              },
            },
            `AppSumo:${payload.uuid}`
          );

          await req.context.tiers.updateOrganizationTier(org.id, "FREE", `AppSumo:${payload.uuid}`);
        }
        return res.status(200).json({ message: "license refunded" });
      } else {
        await req.context.organizations.updateOrganization(
          org!.id,
          {
            metadata: {
              ...org!.metadata,
              ...payload,
              events: [...(org!.metadata.events ?? []), payload],
            },
          },
          `AppSumo:${payload.uuid}`
        );

        await req.context.tiers.updateOrganizationTier(
          org!.id,
          mapTier(payload.plan_id),
          `AppSumo:${payload.uuid}`
        );

        return res.status(200).json({ message: "license updated" });
      }
    }
  );

function mapTier(planId: string) {
  return {
    parallel_tier1: "APPSUMO1",
    parallel_tier2: "APPSUMO2",
    parallel_tier3: "APPSUMO3",
    parallel_tier4: "APPSUMO4",
  }[planId]!;
}

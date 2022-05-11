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
        req.context.logger.debug("AppSumo request:", {
          url: req.url,
          method: req.method,
          body: req.body,
          authorization: req.header("authorization"),
        });
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
      const body = req.body as AppSumoPayload;
      const payload = { parallel_tier: mapTier(body.plan_id), ...body };
      const org = req.context.organization;

      if (payload.action === "activate") {
        if (isDefined(org)) {
          // first we need to make sure this organization was not created previously with another AppSumo purchase UNLESS the last action was a refund
          // "Sumo-lings SHOULD NOT be able to activate multiple AppSumo licenses with the same email."
          if (isDefined(org.appsumo_license.uuid) && org.appsumo_license.action !== "refund") {
            return res.status(401).json({
              message: "The email is already registered in Parallel with an active license",
            });
          }

          // user with activation_email already has an account created on Parallel.
          // so we just need to set the purchased license and redirect to login page
          await req.context.organizations.updateAppSumoLicense(
            org.id,
            payload,
            `AppSumo:${payload.uuid}`
          );
          await req.context.tiers.updateOrganizationTier(
            org,
            payload.parallel_tier,
            `AppSumo:${payload.uuid}`
          );

          return res.status(201).json({
            message: "license activated",
            redirect_url: `${req.context.config.misc.parallelUrl}/login`,
          });
        } else {
          // user does not have a Parallel account.
          // Redirect to signup page with special code to apply purchased license after user creates an account
          const license = await req.context.licenseCodes.createLicenseCode(
            "AppSumo",
            payload,
            `AppSumo:${payload.uuid}`
          );
          const redirectUrl = `${req.context.config.misc.parallelUrl}/signup?${new URLSearchParams({
            code: license.code,
          })}`;
          await req.context.emails.sendAppSumoActivateAccountEmail(
            redirectUrl,
            payload.activation_email
          );
          return res.status(201).json({
            message: "product activated",
            redirect_url: redirectUrl,
          });
        }
      } else if (payload.action === "refund") {
        // if doing a refund and the organization does not exist, do nothing and return success
        if (isDefined(org)) {
          await req.context.organizations.updateAppSumoLicense(
            org.id,
            payload,
            `AppSumo:${payload.uuid}`
          );

          await req.context.tiers.updateOrganizationTier(org, "FREE", `AppSumo:${payload.uuid}`);
        }
        return res.status(200).json({ message: "license refunded" });
      } else {
        await req.context.organizations.updateAppSumoLicense(
          org!.id,
          payload,
          `AppSumo:${payload.uuid}`
        );

        await req.context.tiers.updateOrganizationTier(
          org!,
          payload.parallel_tier,
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

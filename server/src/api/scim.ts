import { json, Router } from "express";
import { CreateUser, User } from "../db/__types";
import { isDefined } from "../util/remedaExtensions";
import { Maybe } from "../util/types";

export const scim = Router().use(
  json({ type: "application/scim+json" }),
  (req, res, next) => {
    try {
      console.log({
        url: req.url,
        method: req.method,
        body: JSON.stringify(req.body),
        authorization: req.header("authorization"),
      });
    } catch {}
    next();
  },
  async function authenticate(req, res, next) {
    try {
      const match = req.headers.authorization?.match(/^Bearer (.*)$/);
      if (!match) {
        throw new Error("Missing authentication");
      }
      const integration = await req.context.integrations.loadProvisioningIntegrationByAuthKey(
        match[1]
      );
      if (!integration) {
        throw new Error("Invalid authentication");
      }
      req.context.organization = await req.context.organizations.loadOrg(integration.org_id);
      next();
    } catch (error) {
      return res.sendStatus(401);
    }
  }
);

scim
  .route("/Users")
  .get(async (req, res) => {
    const externalId = getExternalId(req.query.filter);
    let user: User | undefined;
    if (externalId) {
      user = await req.context.users.loadUserByExternalId({
        externalId,
        orgId: req.context.organization!.id,
      });
    }
    if (!user) {
      res.json({
        totalResults: 0,
        Resources: [],
      });
    } else {
      res.json({
        totalResults: 1,
        Resources: [toScimUser(user)],
      });
    }
  })
  .post(async (req, res) => {
    const {
      externalId,
      active,
      name: { familyName, givenName },
      emails,
    }: {
      externalId: string;
      active: boolean;
      name: { givenName: string; familyName: string };
      emails: { type: string; value: string }[];
    } = req.body;
    let user = await req.context.users.loadUserByExternalId({
      externalId,
      orgId: req.context.organization!.id,
    });
    if (user) {
      if (
        user.first_name !== givenName ||
        user.last_name !== familyName ||
        (user.status === "ACTIVE") !== active
      ) {
        [user] = await req.context.users.updateUserById(
          user.id,
          {
            status: active ? "ACTIVE" : "INACTIVE",
            first_name: givenName,
            last_name: familyName,
          },
          `Provisioning:${req.context.organization!.id}`
        );
      }
      res.json(toScimUser(user));
    } else {
      const orgId = req.context.organization!.id;
      const integrations = await req.context.integrations.loadEnabledIntegrationsForOrgId(orgId);
      const email = emails.find((e) => e.type === "work")?.value;
      if (integrations.some((i) => i.type === "SSO") && email) {
        const user = await req.context.users.createUser(
          {
            // fake unique cognitoId, should update when user logs in
            cognito_id: `${req.context.organization!.identifier}_${externalId}`,
            org_id: orgId,
            email: email.toLowerCase(),
            first_name: givenName,
            last_name: familyName,
            status: active ? "ACTIVE" : "INACTIVE",
            external_id: externalId,
          },
          `Provisioning:${req.context.organization!.id}`
        );
        res.json(toScimUser(user));
      } else {
        res.sendStatus(401);
      }
    }
  });

scim
  .route("/Users/:externalId")
  .all(async (req, res, next) => {
    const externalId = req.params.externalId;
    const user = await req.context.users.loadUserByExternalId({
      externalId,
      orgId: req.context.organization!.id,
    });
    if (!user) {
      return res.status(404).json({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail: `Resource ${externalId} not found`,
        status: "404",
      });
    } else {
      next();
    }
  })
  .get(async (req, res) => {
    const user = await req.context.users.loadUserByExternalId({
      externalId: req.params.externalId,
      orgId: req.context.organization!.id,
    });
    res.json(toScimUser(user!));
  })
  .patch(async (req, res) => {
    const data: Partial<CreateUser> = {};
    req.body.Operations.forEach((op: any) => {
      if (op.op === "Replace") {
        switch (op.path) {
          case "name.givenName":
            data.first_name = op.value;
            break;
          case "name.familyName":
            data.last_name = op.value;
            break;
          case "active":
            data.status = op.value === "True" ? "ACTIVE" : "INACTIVE";
            break;
          default:
            break;
        }
      }
    });
    const [user] = await req.context.users.updateUserByExternalId(
      req.params.externalId,
      req.context.organization!.id,
      data,
      `Provisioning:${req.context.organization!.id}`
    );
    res.json(toScimUser(user));
  })
  .put(async (req, res) => {
    const data: Partial<CreateUser> = {};
    if (isDefined(req.body.name.givenName)) {
      data.first_name = req.body.name.givenName;
    }
    if (isDefined(req.body.name.familyName)) {
      data.last_name = req.body.name.familyName;
    }
    if (isDefined(req.body.active)) {
      data.status = req.body.active === "True" ? "ACTIVE" : "INACTIVE";
    }

    const [user] = await req.context.users.updateUserByExternalId(
      req.params.externalId,
      req.context.organization!.id,
      data,
      `Provisioning:${req.context.organization!.id}`
    );
    res.json(toScimUser(user));
  })
  .delete(async (req, res) => {
    await req.context.users.updateUserByExternalId(
      req.params.externalId,
      req.context.organization!.id,
      { status: "INACTIVE" },
      `Provisioning:${req.context.organization!.id}`
    );
    res.sendStatus(204);
  });

function getExternalId(filter: any): Maybe<string> {
  if (!filter) return null;
  const match = filter.match(/externalId eq "([^"]*)"/);
  return match?.[1] ?? null;
}

function toScimUser(user: User) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: user.external_id,
    externalId: user.external_id,
    active: user.status === "ACTIVE",
    name: {
      givenName: user.first_name,
      familyName: user.last_name,
    },
    emails: [
      {
        type: "work",
        value: user.email,
      },
    ],
  };
}

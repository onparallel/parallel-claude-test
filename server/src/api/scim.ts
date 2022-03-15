import { json, Router } from "express";
import { isDefined, pick } from "remeda";
import { CreateUser, CreateUserData, User, UserData } from "../db/__types";
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
    } catch (error: any) {
      return res.sendStatus(401);
    }
  }
);

scim
  .route("/Users")
  .get(async (req, res) => {
    const externalId = getExternalId(req.query.filter);
    let user: Maybe<User> = null;
    if (externalId) {
      user = await req.context.users.loadUserByExternalId({
        externalId,
        orgId: req.context.organization!.id,
      });
    }
    const userData = user ? await req.context.users.loadUserData(user.user_data_id) : null;
    if (!user || !userData) {
      res.json({
        totalResults: 0,
        Resources: [],
      });
    } else {
      res.json({
        totalResults: 1,
        Resources: [
          toScimUser({
            ...pick(user, ["status", "external_id"]),
            ...pick(userData, ["email", "first_name", "last_name"]),
          }),
        ],
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
    const user = await req.context.users.loadUserByExternalId({
      externalId,
      orgId: req.context.organization!.id,
    });
    const userData = user ? await req.context.users.loadUserData(user.user_data_id) : null;
    if (user && userData) {
      if ((user.status === "ACTIVE") !== active) {
        await req.context.users.updateUserById(
          user.id,
          {
            status: active ? "ACTIVE" : "INACTIVE",
          },
          `Provisioning:${req.context.organization!.id}`
        );
      }
      if (userData.first_name !== givenName || userData.last_name !== familyName) {
        await req.context.users.updateUserData(
          userData.id,
          {
            first_name: givenName,
            last_name: familyName,
          },
          `Provisioning:${req.context.organization!.id}`
        );
      }
      res.json(
        toScimUser({
          email: userData.email,
          external_id: user.external_id,
          first_name: givenName,
          last_name: familyName,
          status: active ? "ACTIVE" : "INACTIVE",
        })
      );
    } else {
      const orgId = req.context.organization!.id;
      const ssoIntegrations = await req.context.integrations.loadIntegrationsByOrgId(orgId, "SSO");
      const email = emails.find((e) => e.type === "work")?.value;
      if (ssoIntegrations.length > 0 && email) {
        const user = await req.context.users.createUser(
          {
            org_id: orgId,
            status: active ? "ACTIVE" : "INACTIVE",
            external_id: externalId,
          },
          {
            // fake unique cognitoId, should update when user logs in
            cognito_id: `${req.context.organization!.id}_${externalId}`,
            email: email.toLowerCase(),
            first_name: givenName,
            last_name: familyName,
            details: { source: "SCIM" },
          },
          `Provisioning:${req.context.organization!.id}`
        );
        const userData = (await req.context.users.loadUserData(user.user_data_id))!;
        res.json(
          toScimUser({
            ...pick(user, ["status", "external_id"]),
            ...pick(userData, ["email", "first_name", "last_name"]),
          })
        );
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
    const user = (await req.context.users.loadUserByExternalId({
      externalId: req.params.externalId,
      orgId: req.context.organization!.id,
    }))!;
    const userData = (await req.context.users.loadUserData(user.user_data_id))!;
    res.json(
      toScimUser({
        ...pick(user, ["status", "external_id"]),
        ...pick(userData, ["email", "first_name", "last_name"]),
      })
    );
  })
  .patch(async (req, res) => {
    const userUpdate: Partial<CreateUser> = {};
    const userDataUpdate: Partial<CreateUserData> = {};
    req.body.Operations.forEach((op: any) => {
      if (op.op === "Replace") {
        switch (op.path) {
          case "name.givenName":
            userDataUpdate.first_name = op.value;
            break;
          case "name.familyName":
            userDataUpdate.last_name = op.value;
            break;
          case "active":
            userUpdate.status = op.value === "True" ? "ACTIVE" : "INACTIVE";
            break;
          default:
            break;
        }
      }
    });
    if (isDefined(userUpdate.status)) {
      await req.context.users.updateUserByExternalId(
        req.params.externalId,
        req.context.organization!.id,
        userUpdate,
        `Provisioning:${req.context.organization!.id}`
      );
    }
    if (isDefined(userDataUpdate.first_name) || isDefined(userDataUpdate.last_name)) {
      await req.context.users.updateUserDataByExternalId(
        req.params.externalId,
        req.context.organization!.id,
        userDataUpdate,
        `Provisioning:${req.context.organization!.id}`
      );
    }
    const user = await req.context.users.loadUserByExternalId({
      orgId: req.context.organization!.id,
      externalId: req.params.externalId,
    });
    if (!user) {
      res.sendStatus(401);
    } else {
      const userData = (await req.context.users.loadUserData(user.user_data_id))!;
      res.json(
        toScimUser({
          ...pick(user, ["status", "external_id"]),
          ...pick(userData, ["email", "first_name", "last_name"]),
        })
      );
    }
  })
  .put(async (req, res) => {
    const userUpdate: Partial<CreateUser> = {};
    const userDataUpdate: Partial<CreateUserData> = {};
    if (isDefined(req.body.name.givenName)) {
      userDataUpdate.first_name = req.body.name.givenName;
    }
    if (isDefined(req.body.name.familyName)) {
      userDataUpdate.last_name = req.body.name.familyName;
    }
    if (isDefined(req.body.active)) {
      userUpdate.status = req.body.active === "True" ? "ACTIVE" : "INACTIVE";
    }

    if (isDefined(userUpdate.status)) {
      await req.context.users.updateUserByExternalId(
        req.params.externalId,
        req.context.organization!.id,
        userUpdate,
        `Provisioning:${req.context.organization!.id}`
      );
    }
    if (isDefined(userDataUpdate.first_name) || isDefined(userDataUpdate.last_name)) {
      await req.context.users.updateUserDataByExternalId(
        req.params.externalId,
        req.context.organization!.id,
        userDataUpdate,
        `Provisioning:${req.context.organization!.id}`
      );
    }
    const user = await req.context.users.loadUserByExternalId({
      orgId: req.context.organization!.id,
      externalId: req.params.externalId,
    });
    if (!user) {
      res.sendStatus(401);
    } else {
      const userData = (await req.context.users.loadUserData(user.user_data_id))!;
      res.json(
        toScimUser({
          ...pick(user, ["status", "external_id"]),
          ...pick(userData, ["email", "first_name", "last_name"]),
        })
      );
    }
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

function toScimUser(
  user: Pick<User, "status" | "external_id"> & Pick<UserData, "first_name" | "last_name" | "email">
) {
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

import { json, NextFunction, Request, Response, Router } from "express";
import { pick } from "remeda";
import { CreateUser, User } from "../db/__types";
import { isDefined } from "../util/remedaExtensions";

function getExternalId(filter: any) {
  if (!filter) return;
  const match = filter.match(/externalId eq "([^"]*)"/);
  if (!match) return;
  return match[1];
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

async function authenticateOrganization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const match = req.headers.authorization?.match(/^Bearer (.*)$/);
    if (!match) {
      return res.status(401).end();
    }
    const integration = await req.context.integrations.loadProvisioningIntegrationByAuthKey(
      match[1]
    );
    if (!integration) {
      return res.status(401).end();
    }
    req.context.organization = await req.context.organizations.loadOrg(
      integration.org_id
    );
    next();
  } catch (error) {
    next(error);
  }
}

/**
 *  make sure the organization triggering an action has access to the user
 */
async function validateExternalId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const externalId = req.params?.externalId ?? req.body?.externalId;
  if (!externalId) {
    next();
    return;
  }

  const user = await req.context.users.loadUserByExternalId({
    externalId,
    orgId: req.context.organization!.id,
  });
  if (!user) {
    return res
      .status(404)
      .json({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail: `Resource ${externalId} not found`,
        status: "404",
      })
      .end();
  } else {
    next();
  }
}

async function logRequest(req: Request, _: Response, next: NextFunction) {
  console.log(
    pick(req, ["method", "url", "query", "body", "params", "headers"])
  );
  next();
}

export const scim = Router().use(
  json({ type: "application/scim+json" }),
  logRequest,
  authenticateOrganization,
  validateExternalId
);

scim
  .route("/Users")
  .get(async (req, res) => {
    const externalId: string = getExternalId(req.query.filter);
    let totalResults = 0;
    const users: User[] = [];
    if (externalId) {
      const user = await req.context.users.loadUserByExternalId({
        externalId,
        orgId: req.context.organization!.id,
      });
      if (user) {
        totalResults = 1;
        users.push(user!);
      }
    }
    res
      .json({
        totalResults,
        Resources: users.map(toScimUser),
      })
      .end();
  })
  /**
   * Use the CREATE endpoint just for reactivating disabled users
   */
  .post(async (req, res) => {
    const {
      externalId,
      active,
      name: { familyName, givenName },
    }: {
      externalId: string;
      active: boolean;
      name: { givenName: string; familyName: string };
    } = req.body;
    let user = await req.context.users.loadUserByExternalId({
      externalId,
      orgId: req.context.organization!.id,
    });
    if (user && user.status === "INACTIVE" && user.is_sso_user) {
      [user] = await req.context.users.updateUserById(
        user.id,
        {
          status: active ? "ACTIVE" : "INACTIVE",
          first_name: givenName,
          last_name: familyName,
        },
        `Provisioning:${req.context.organization!.id}`
      );
      res.json(toScimUser(user)).end();
    } else {
      // fake an "OK" response to provider
      res.json({ ...req.body, id: externalId }).end();
    }
  });

scim
  .route("/Users/:externalId")
  .get(async (req, res) => {
    const user = await req.context.users.loadUserByExternalId({
      externalId: req.params.externalId,
      orgId: req.context.organization!.id,
    });
    res.json(toScimUser(user!)).end();
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
    res.json(toScimUser(user)).end();
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
    res.json(toScimUser(user)).end();
  })
  .delete(async (req, res) => {
    await req.context.users.updateUserByExternalId(
      req.params.externalId,
      req.context.organization!.id,
      { status: "INACTIVE" },
      `Provisioning:${req.context.organization!.id}`
    );
    res.sendStatus(204).end();
  });

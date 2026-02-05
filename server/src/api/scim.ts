import { json, Router } from "express";
import { DatabaseError } from "pg";
import { isNonNullish, isNullish, pick } from "remeda";
import { ApiContext } from "../context";
import { CreateUser, CreateUserData, User, UserData, UserStatus } from "../db/__types";
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
        match[1],
      );
      if (!integration) {
        throw new Error("Invalid authentication");
      }
      const organization = await req.context.organizations.loadOrg(integration.org_id);
      req.context.organization = organization;
      req.context.trails["orgId"] = organization?.id;
      next();
    } catch {
      return res.sendStatus(401);
    }
  },
);

scim
  .route("/Users")
  .get(async (req, res, next) => {
    try {
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
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => {
    try {
      const { externalId, active, name, emails } = req.body as {
        externalId: string;
        active: boolean;
        name?: { givenName: string; familyName: string };
        emails?: { type: string; value: string }[];
      };

      if (isNullish(name) || isNullish(emails)) {
        return res.status(401).send("'emails' and 'name' are required fields");
      }

      let user = await req.context.users.loadUserByExternalId({
        externalId,
        orgId: req.context.organization!.id,
      });
      let userData = user ? await req.context.users.loadUserData(user.user_data_id) : null;
      if (user && userData) {
        if ((user.status === "ACTIVE") !== active) {
          const newUserStatus = await getUserNewStatus(user.id, active, req.context);
          if (newUserStatus === "ACTIVE") {
            const allUsersGroups = await req.context.userGroups.loadAllUsersGroupsByOrgId(
              user.org_id,
            );
            await req.context.userGroups.addUsersToGroups(
              allUsersGroups.map((ug) => ug.id),
              user.id,
              `Provisioning:${req.context.organization!.id}`,
            );
          } else if (newUserStatus === "INACTIVE") {
            await req.context.userGroups.removeUsersFromAllGroups(
              user.id,
              `Provisioning:${req.context.organization!.id}`,
            );
          }
          [user] = await req.context.users.updateUserById(
            user.id,
            { status: newUserStatus },
            `Provisioning:${req.context.organization!.id}`,
          );
          if (newUserStatus === "ON_HOLD") {
            await req.context.emails.sendTransferParallelsEmail(
              externalId,
              req.context.organization!.id,
            );
          }
        }
        if (userData.first_name !== name.givenName || userData.last_name !== name.familyName) {
          [userData] = await req.context.users.updateUserData(
            userData.id,
            {
              first_name: name.givenName,
              last_name: name.familyName,
            },
            `Provisioning:${req.context.organization!.id}`,
          );
        }
        res.json(
          toScimUser({
            email: userData.email,
            external_id: user.external_id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            status: user.status,
          }),
        );
      } else {
        const orgId = req.context.organization!.id;
        const ssoIntegrations = await req.context.integrations.loadIntegrationsByOrgId(
          orgId,
          "SSO",
        );
        const email = emails.find((e) => e.type === "work")?.value;
        if (!email) {
          return res.status(401).send("work email is required");
        }

        if (ssoIntegrations.length > 0) {
          // find userData by email
          const userData = await req.context.users.loadUserDataByEmail(email);

          // if userData is found:
          if (isNonNullish(userData)) {
            // first update the userData with the new data
            if (userData.first_name !== name.givenName || userData.last_name !== name.familyName) {
              await req.context.users.updateUserData(
                userData.id,
                {
                  first_name: name.givenName,
                  last_name: name.familyName,
                },
                `Provisioning:${req.context.organization!.id}`,
              );
            }
            // find user by userData.id/orgId and update the user with the new data
            const user = (await req.context.users.loadUsersByUserDataId(userData.id)).find(
              (u) => u.org_id === orgId,
            );
            if (isNonNullish(user)) {
              await req.context.users.updateUserById(
                user.id,
                {
                  status: active ? "ACTIVE" : "INACTIVE",
                  external_id: externalId,
                },
                `Provisioning:${req.context.organization!.id}`,
              );
            } else {
              req.context.logger.error(
                `Found UserData:${userData.id} but no user for Organization:${orgId}`,
              );
              return res.status(401).send("User not found");
            }

            res.json(
              toScimUser({
                status: active ? "ACTIVE" : "INACTIVE",
                external_id: externalId,
                email: email,
                first_name: name.givenName,
                last_name: name.familyName,
              }),
            );
          } else {
            // if userData is not found, create a new userData and user
            try {
              const user = await req.context.accountSetup.createUser(
                {
                  org_id: orgId,
                  status: active ? "ACTIVE" : "INACTIVE",
                  external_id: externalId,
                },
                {
                  // fake unique cognitoId, should update when user logs in
                  cognito_id: `${req.context.organization!.id}_${externalId}`,
                  email: email.toLowerCase(),
                  first_name: name.givenName,
                  last_name: name.familyName,
                  details: {
                    source: "SCIM",
                  },
                  preferred_locale: "en",
                },
                `Provisioning:${req.context.organization!.id}`,
              );
              const userData = (await req.context.users.loadUserData(user.user_data_id))!;
              res.json(
                toScimUser({
                  ...pick(user, ["status", "external_id"]),
                  ...pick(userData, ["email", "first_name", "last_name"]),
                }),
              );
            } catch (error) {
              if (
                error instanceof DatabaseError &&
                error.constraint === "user__org_id__user_data_id"
              ) {
                req.context.logger.error(
                  `User ${email} already exists on organization ${orgId}. New externalId: ${externalId}`,
                );
              }
              throw error;
            }
          }
        } else {
          res.sendStatus(401);
        }
      }
    } catch (error) {
      next(error);
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
  .get(async (req, res, next) => {
    try {
      const user = (await req.context.users.loadUserByExternalId({
        externalId: req.params.externalId,
        orgId: req.context.organization!.id,
      }))!;
      const userData = (await req.context.users.loadUserData(user.user_data_id))!;
      res.json(
        toScimUser({
          ...pick(user, ["status", "external_id"]),
          ...pick(userData, ["email", "first_name", "last_name"]),
        }),
      );
    } catch (error) {
      next(error);
    }
  })
  .patch(async (req, res, next) => {
    try {
      const userUpdate: Partial<CreateUser> = {};
      const userDataUpdate: Partial<CreateUserData> = {};

      let userExternalId = req.params.externalId;

      const user = (await req.context.users.loadUserByExternalId({
        externalId: userExternalId,
        orgId: req.context.organization!.id,
      }))!;

      let userDataId = user.user_data_id;

      if (!user) {
        res.sendStatus(401);
        return;
      }

      for (const op of req.body.Operations) {
        if (op.op === "Replace") {
          switch (op.path) {
            case "name.givenName":
              userDataUpdate.first_name = op.value;
              break;
            case "name.familyName":
              userDataUpdate.last_name = op.value;
              break;
            case "externalId":
              userUpdate.external_id = op.value;
              break;
            case "active": {
              userUpdate.status = await getUserNewStatus(
                user!.id,
                op.value === "True",
                req.context,
              );
              break;
            }
            case 'emails[type eq "work"].value': {
              const userData = (await req.context.users.loadUserData(userDataId))!;
              const newUserData = await req.context.users.getOrCreateUserData(
                {
                  first_name: userData.first_name,
                  last_name: userData.last_name,
                  // fake unique cognitoId, should update when user logs in
                  cognito_id: `${req.context.organization!.id}_${userExternalId}`,
                  preferred_locale: userData.preferred_locale,
                  email: op.value.toLowerCase(),
                },
                `Provisioning:${req.context.organization!.id}`,
              );
              userUpdate.user_data_id = newUserData.id;
              break;
            }
            default:
              req.context.logger.error(`Unknown path: ${op.op} ${op.path}`);
              break;
          }
        } else {
          req.context.logger.error(`Unknown operation: ${op.op} ${op.path}`);
        }
      }

      if (isNonNullish(userUpdate.status) && user.status !== userUpdate.status) {
        if (userUpdate.status === "ACTIVE") {
          const allUsersGroups = await req.context.userGroups.loadAllUsersGroupsByOrgId(
            user.org_id,
          );
          await req.context.userGroups.addUsersToGroups(
            allUsersGroups.map((ug) => ug.id),
            user.id,
            `Provisioning:${req.context.organization!.id}`,
          );
        } else if (userUpdate.status === "INACTIVE") {
          await req.context.userGroups.removeUsersFromAllGroups(
            user.id,
            `Provisioning:${req.context.organization!.id}`,
          );
        }
      }

      if (Object.keys(userUpdate).length > 0) {
        await req.context.users.updateUserByExternalId(
          userExternalId,
          req.context.organization!.id,
          userUpdate,
          `Provisioning:${req.context.organization!.id}`,
        );

        userExternalId = userUpdate.external_id ?? req.params.externalId;
        userDataId = userUpdate.user_data_id ?? userDataId;
      }

      if (userUpdate.status === "ON_HOLD") {
        await req.context.emails.sendTransferParallelsEmail(
          userExternalId,
          req.context.organization!.id,
        );
      }

      if (Object.keys(userDataUpdate).length > 0) {
        await req.context.users.updateUserDataByExternalId(
          userExternalId,
          req.context.organization!.id,
          userDataUpdate,
          `Provisioning:${req.context.organization!.id}`,
        );
      }

      const userData = (await req.context.users.loadUserData(userDataId))!;
      res.json(
        toScimUser({
          ...pick(user, ["status", "external_id"]),
          ...pick(userData, ["email", "first_name", "last_name"]),
        }),
      );
    } catch (error) {
      next(error);
    }
  })
  .put(async (req, res, next) => {
    try {
      const userUpdate: Partial<CreateUser> = {};
      const userDataUpdate: Partial<CreateUserData> = {};
      if (isNonNullish(req.body.name.givenName)) {
        userDataUpdate.first_name = req.body.name.givenName;
      }
      if (isNonNullish(req.body.name.familyName)) {
        userDataUpdate.last_name = req.body.name.familyName;
      }
      if (isNonNullish(req.body.active)) {
        const user = await req.context.users.loadUserByExternalId({
          externalId: req.params.externalId,
          orgId: req.context.organization!.id,
        });
        userUpdate.status = await getUserNewStatus(
          user!.id,
          req.body.active === "True",
          req.context,
        );
      }

      if (isNonNullish(userUpdate.status)) {
        const user = await req.context.users.loadUserByExternalId({
          externalId: req.params.externalId,
          orgId: req.context.organization!.id,
        });
        if (user && user.status !== userUpdate.status) {
          if (userUpdate.status === "ACTIVE") {
            const allUsersGroups = await req.context.userGroups.loadAllUsersGroupsByOrgId(
              user.org_id,
            );
            await req.context.userGroups.addUsersToGroups(
              allUsersGroups.map((ug) => ug.id),
              user.id,
              `Provisioning:${req.context.organization!.id}`,
            );
          } else if (userUpdate.status === "INACTIVE") {
            await req.context.userGroups.removeUsersFromAllGroups(
              user.id,
              `Provisioning:${req.context.organization!.id}`,
            );
          }
        }
        await req.context.users.updateUserByExternalId(
          req.params.externalId,
          req.context.organization!.id,
          userUpdate,
          `Provisioning:${req.context.organization!.id}`,
        );
        if (userUpdate.status === "ON_HOLD") {
          await req.context.emails.sendTransferParallelsEmail(
            req.params.externalId,
            req.context.organization!.id,
          );
        }
      }
      if (isNonNullish(userDataUpdate.first_name) || isNonNullish(userDataUpdate.last_name)) {
        await req.context.users.updateUserDataByExternalId(
          req.params.externalId,
          req.context.organization!.id,
          userDataUpdate,
          `Provisioning:${req.context.organization!.id}`,
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
          }),
        );
      }
    } catch (error) {
      next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const user = await req.context.users.loadUserByExternalId({
        externalId: req.params.externalId,
        orgId: req.context.organization!.id,
      });
      const newStatus = await getUserNewStatus(user!.id, false, req.context);
      if (user && user.status !== "INACTIVE" && newStatus === "INACTIVE") {
        await req.context.userGroups.removeUsersFromAllGroups(
          user.id,
          `Provisioning:${req.context.organization!.id}`,
        );
      }
      await req.context.users.updateUserByExternalId(
        req.params.externalId,
        req.context.organization!.id,
        { status: newStatus },
        `Provisioning:${req.context.organization!.id}`,
      );
      if (newStatus === "ON_HOLD") {
        await req.context.emails.sendTransferParallelsEmail(
          req.params.externalId,
          req.context.organization!.id,
        );
      }
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

function getExternalId(filter: any): Maybe<string> {
  if (!filter) return null;
  const match = filter.match(/externalId eq "([^"]*)"/);
  return match?.[1] ?? null;
}

function toScimUser(
  user: Pick<User, "status" | "external_id"> & Pick<UserData, "first_name" | "last_name" | "email">,
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

async function getUserNewStatus(
  userId: number,
  active: boolean,
  ctx: ApiContext,
): Promise<UserStatus> {
  if (active) {
    return "ACTIVE";
  }
  const userPermissions = await ctx.petitions.loadPetitionPermissionsByUserId(userId);
  if (userPermissions.some((p) => p.type === "OWNER")) {
    return "ON_HOLD";
  }

  return "INACTIVE";
}

import { ApolloError, ForbiddenError } from "apollo-server-core";
import { differenceInMinutes } from "date-fns";
import { isDefined } from "remeda";
import { ApiContext } from "../../context";
import { fullName } from "../../util/fullName";
import { RESULT } from "./result";

type resetTempPasswordProps = {
  email: string;
  locale: string | null | undefined;
  ctx: ApiContext;
  throwErrors?: boolean;
};

export const resetTempPassword = async ({
  email,
  locale,
  ctx,
  throwErrors,
}: resetTempPasswordProps) => {
  try {
    const [users, cognitoUser] = await Promise.all([
      ctx.users.loadUsersByEmail(email),
      ctx.aws.getUser(email),
    ]);
    const definedUsers = users.filter(isDefined);
    if (definedUsers.length === 0) {
      if (throwErrors) {
        throw new ForbiddenError("Not authorized");
      } else {
        return RESULT.SUCCESS;
      }
    }

    // TODO which org to use??
    const user = definedUsers[0];
    const [organization, userData] = await Promise.all([
      user ? await ctx.organizations.loadOrg(user.org_id) : null,
      user ? await ctx.users.loadUserData(user.user_data_id) : null,
    ]);

    if (
      user &&
      organization &&
      userData &&
      !userData.is_sso_user &&
      cognitoUser.UserStatus === "FORCE_CHANGE_PASSWORD" &&
      cognitoUser.UserLastModifiedDate &&
      // allow 1 reset every hour
      differenceInMinutes(new Date(), cognitoUser.UserLastModifiedDate) >= 60
    ) {
      const orgOwner = await ctx.organizations.getOrganizationOwner(organization.id);
      const orgOwnerData = await ctx.users.loadUserData(orgOwner.user_data_id);
      if (!orgOwnerData) {
        if (throwErrors) {
          throw new ApolloError(
            `UserData:${orgOwner.user_data_id} not found for User:${orgOwner.id}`,
            "USER_DATA_NOT_FOUND"
          );
        } else {
          return RESULT.SUCCESS;
        }
      }
      await ctx.aws.resetUserPassword(email, {
        locale: locale ?? "en",
        organizationName: organization.name,
        organizationUser: fullName(orgOwnerData.first_name, orgOwnerData.last_name),
      });
    }
  } catch {
    if (throwErrors) {
      throw new ApolloError(
        "Unhandled error when reset user password",
        "RESET_USER_PASSWORD_ERROR"
      );
    } else {
      return RESULT.SUCCESS;
    }
  }

  return RESULT.SUCCESS;
};

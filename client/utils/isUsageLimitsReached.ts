import { gql } from "@apollo/client";
import { isUsageLimitsReached_OrganizationFragment } from "@parallel/graphql/__types";

export function isUsageLimitsReached(
  organization: isUsageLimitsReached_OrganizationFragment
): boolean {
  return organization.usageLimits.petitions.limit <= organization.usageLimits.petitions.used;
}

isUsageLimitsReached.fragments = {
  Organization: gql`
    fragment isUsageLimitsReached_Organization on Organization {
      usageLimits {
        petitions {
          used
          limit
        }
      }
    }
  `,
};

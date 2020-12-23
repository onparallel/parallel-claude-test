import { Badge, Text } from "@chakra-ui/react";

import { DateTime } from "@parallel/components/common/DateTime";

import { TableColumn } from "@parallel/components/common/Table";
import {
  OrganizationRole,
  OrganizationUsers_UserFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FORMATS } from "./dates";

export function useOrganizationUsersTableColumns(): TableColumn<
  OrganizationUsers_UserFragment,
  {}
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "firstName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-firstname",
          defaultMessage: "First name",
        }),
        CellContent: ({ row }) => <>{row.firstName}</>,
      },
      {
        key: "lastName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-lastname",
          defaultMessage: "Last name",
        }),
        CellContent: ({ row }) => <>{row.lastName}</>,
      },
      {
        key: "email",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-email",
          defaultMessage: "Email",
        }),
        CellContent: ({ row }) => <>{row.email}</>,
      },
      {
        key: "role",
        header: intl.formatMessage({
          id: "organization-users.header.user-role",
          defaultMessage: "Role",
        }),
        cellProps: {
          width: "1px",
          textAlign: "center",
        },
        CellContent: ({ row }) => (
          <Badge
            aria-label={row.role}
            colorScheme={
              ({
                ADMIN: "green",
                NORMAL: "gray",
              } as Record<OrganizationRole, string>)[row.role]
            }
          >
            {row.role}
          </Badge>
        ),
      },
      {
        key: "lastActiveAt",
        header: intl.formatMessage({
          id: "generic.last-active-at",
          defaultMessage: "Last active at",
        }),
        isSortable: true,
        CellContent: ({ row }) =>
          row.lastActiveAt ? (
            <DateTime
              value={row.lastActiveAt}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ) : (
            <Text textStyle="hint">
              <FormattedMessage
                id="generic.never-active"
                defaultMessage="Never active"
              />
            </Text>
          ),
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "1px",
        },
        CellContent: ({ row }) => (
          <DateTime
            value={row.createdAt}
            format={FORMATS.LLL}
            useRelativeTime
            whiteSpace="nowrap"
          />
        ),
      },
    ],
    [intl.locale]
  );
}

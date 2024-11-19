import { gql } from "@apollo/client";
import { Flex } from "@chakra-ui/react";
import { DateTime } from "@parallel/components/common/DateTime";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ProfilePropertyContent } from "@parallel/components/common/ProfilePropertyContent";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { TableColumn } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import {
  useProfileTableColumns_ProfileTypeFragment,
  useProfileTableColumns_ProfileWithPropertiesFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";

export function useProfileTableColumns(
  profileType: useProfileTableColumns_ProfileTypeFragment | null,
): TableColumn<useProfileTableColumns_ProfileWithPropertiesFragment, any>[] {
  const intl = useIntl();

  const profileTypeFields = profileType?.fields ?? [];

  return useMemo(() => {
    return ([] as TableColumn<useProfileTableColumns_ProfileWithPropertiesFragment>[])
      .concat([
        {
          key: "name",
          isFixed: true,
          isSortable: true,
          label: intl.formatMessage({
            id: "generic.name",
            defaultMessage: "Name",
          }),
          headerProps: {
            minWidth: "240px",
          },
          cellProps: {
            maxWidth: 0,
            minWidth: "240px",
          },
          CellContent: ({ row }) => {
            return (
              <OverflownText>
                <ProfileReference profile={row} showNameEvenIfDeleted />
              </OverflownText>
            );
          },
        },
        {
          key: "subscribers",
          label: intl.formatMessage({
            id: "component.profile-table-columns.subscribed",
            defaultMessage: "Subscribed",
          }),
          align: "left",
          headerProps: { minWidth: "132px" },
          cellProps: { minWidth: "132px" },
          CellContent: ({ row, column }) => {
            const { subscribers } = row;

            if (!subscribers?.length) {
              return <></>;
            }
            return (
              <Flex justifyContent={column.align}>
                <UserAvatarList usersOrGroups={subscribers?.map((s) => s.user)} />
              </Flex>
            );
          },
        },
        {
          key: "createdAt",
          isSortable: true,
          label: intl.formatMessage({
            id: "generic.created-at",
            defaultMessage: "Created at",
          }),
          headerProps: {
            minWidth: "160px",
          },
          cellProps: {
            minWidth: "160px",
          },
          CellContent: ({ row: { createdAt } }) => (
            <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
          ),
        },
      ])
      .concat(
        profileTypeFields.map((field) => ({
          key: `field_${field.id}`,
          label: localizableUserTextRender({
            intl,
            value: field.name,
            default: intl.formatMessage({
              id: "generic.unnamed-profile-type-field",
              defaultMessage: "Unnamed property",
            }),
          }),
          headerProps: {
            minWidth: 0,
            maxWidth: "340px",
          },
          cellProps: {
            minWidth: "160px",
            whiteSpace: "nowrap",
            maxWidth: "340px",
          },
          CellContent: ({ row: profile }) => {
            const property = profile.properties.find((p) => p.field.id === field.id);
            if (isNonNullish(property)) {
              return (
                <ProfilePropertyContent
                  {...pick(property, ["field", "files", "value"])}
                  profileId={profile.id}
                  singleLine
                />
              );
            } else {
              return null;
            }
          },
        })),
      );
  }, [intl.locale, profileType]);
}

useProfileTableColumns.fragments = {
  ProfileType: gql`
    fragment useProfileTableColumns_ProfileType on ProfileType {
      id
      fields {
        id
        name
        position
      }
    }
  `,
  Profile: gql`
    fragment useProfileTableColumns_Profile on Profile {
      id
      createdAt
      subscribers {
        id
        user {
          id
          ...UserAvatarList_User
        }
      }
      ...ProfileReference_Profile
    }
    ${ProfileReference.fragments.Profile}
    ${UserAvatarList.fragments.User}
  `,
  ProfileFieldProperty: gql`
    fragment useProfileTableColumns_ProfileFieldProperty on ProfileFieldProperty {
      field {
        ...ProfilePropertyContent_ProfileTypeField
      }
      files {
        ...ProfilePropertyContent_ProfileFieldFile
      }
      value {
        ...ProfilePropertyContent_ProfileFieldValue
      }
    }
    ${ProfilePropertyContent.fragments.ProfileTypeField}
    ${ProfilePropertyContent.fragments.ProfileFieldFile}
    ${ProfilePropertyContent.fragments.ProfileFieldValue}
  `,
  get _Profile() {
    return gql`
      fragment useProfileTableColumns_ProfileWithProperties on Profile {
        ...useProfileTableColumns_Profile
        properties {
          ...useProfileTableColumns_ProfileFieldProperty
        }
      }
      ${this.Profile}
      ${this.ProfileFieldProperty}
    `;
  },
};

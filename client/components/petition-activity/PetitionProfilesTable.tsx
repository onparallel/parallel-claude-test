import { gql } from "@apollo/client";
import { Box, BoxProps, Button, Center, Flex, Stack, Text } from "@chakra-ui/react";
import { AddIcon, CloseIconSmall } from "@parallel/chakra/icons";
import {
  PetitionProfilesTable_PetitionFragment,
  PetitionProfilesTable_ProfileFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { DateTime } from "../common/DateTime";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NormalLink } from "../common/Link";
import { LocalizableUserTextRender } from "../common/LocalizableUserTextRender";
import { Table, TableColumn } from "../common/Table";
import { UserAvatarList } from "../common/UserAvatarList";
import { ProfileLink } from "../common/ProfileLink";

export interface PetitionProfilesTable extends BoxProps {
  petition: PetitionProfilesTable_PetitionFragment;
  onAddProfile: () => void;
  onRemoveProfile: (profileId: string) => void;
}

export function PetitionProfilesTable({
  petition,
  onAddProfile,
  onRemoveProfile,
  ...props
}: PetitionProfilesTable) {
  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const columns = usePetitionProfilesColumns();
  const context = useMemo(
    () => ({
      petition,
      onRemoveProfile,
    }),
    [petition]
  );

  const profiles = petition.__typename === "Petition" ? petition.profiles : [];

  return (
    <Card {...props} data-section="petition-profiles-table">
      <CardHeader
        omitDivider={profiles.length > 0}
        rightAction={
          <Stack direction="row">
            <Button
              leftIcon={<AddIcon fontSize="18px" />}
              onClick={onAddProfile}
              isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
            >
              <FormattedMessage
                id="component.petition-profiles-table.add-profile"
                defaultMessage="Add profile"
              />
            </Button>
          </Stack>
        }
      >
        <FormattedMessage
          id="component.petition-profiles-table.profiles"
          defaultMessage="Profiles"
        />
      </CardHeader>
      <Box overflowX="auto">
        {profiles.length ? (
          <Table
            columns={columns}
            context={context}
            rows={profiles}
            rowKeyProp="id"
            marginBottom={2}
          />
        ) : (
          <Center minHeight="60px" textAlign="center" padding={4} color="gray.400">
            <Stack spacing={1}>
              <Text>
                <FormattedMessage
                  id="component.petition-profiles-table.no-profiles-associated"
                  defaultMessage="There are no profiles associated to this parallel yet."
                />
              </Text>
              {!petition.isAnonymized && myEffectivePermission !== "READ" ? (
                <Text>
                  <FormattedMessage
                    id="component.petition-profiles-table.associate-profile"
                    defaultMessage="<a>Associate a profile</a>"
                    values={{
                      a: (chunks: any) => <NormalLink onClick={onAddProfile}>{chunks}</NormalLink>,
                    }}
                  />
                </Text>
              ) : null}
            </Stack>
          </Center>
        )}
      </Box>
    </Card>
  );
}

function usePetitionProfilesColumns(): TableColumn<
  PetitionProfilesTable_ProfileFragment,
  {
    petition: PetitionProfilesTable_PetitionFragment;
    onRemoveProfile: (profileId: string) => void;
  }
>[] {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.petition-profiles-table.name-header",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => <ProfileLink profile={row} />,
      },
      {
        key: "type",
        header: intl.formatMessage({
          id: "component.petition-profiles-table.profile-type-header",
          defaultMessage: "Type",
        }),
        CellContent: ({ row: { profileType } }) => {
          return (
            <LocalizableUserTextRender
              value={profileType.name}
              default={intl.formatMessage({
                id: "generic.unnamed-profile-type",
                defaultMessage: "Unnamed profile type",
              })}
            />
          );
        },
      },
      {
        key: "subscribed",
        header: intl.formatMessage({
          id: "component.petition-profiles-table.subscribers-header",
          defaultMessage: "Subscribers",
        }),
        CellContent: ({ row: { subscribers }, column }) => {
          if (!subscribers.length)
            return (
              <Text textStyle="hint">
                <FormattedMessage
                  id="component.petition-profiles-table.no-subscribers-profile"
                  defaultMessage="No subscribers to this profile"
                />
              </Text>
            );
          return (
            <Flex justifyContent={column.align}>
              <UserAvatarList usersOrGroups={subscribers.map((s) => s.user)} />
            </Flex>
          );
        },
      },
      {
        key: "createdAt",
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
        ),
      },
      {
        key: "actions",
        header: "",
        cellProps: {
          paddingY: 1,
          width: "1px",
        },
        CellContent: ({ row, context }) => {
          const { petition, onRemoveProfile } = context!;
          const { id } = row;
          const intl = useIntl();

          const myEffectivePermission = petition.myEffectivePermission!.permissionType;

          return (
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <IconButtonWithTooltip
                label={intl.formatMessage({
                  id: "component.petition-profiles-table.remove-profile-button",
                  defaultMessage: "Remove association",
                })}
                onClick={() => onRemoveProfile(id)}
                placement="bottom"
                icon={<CloseIconSmall fontSize="16px" />}
                size="sm"
                isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
              />
            </Stack>
          );
        },
      },
    ],
    [intl.locale]
  );
}

PetitionProfilesTable.fragments = {
  get Profile() {
    return gql`
      fragment PetitionProfilesTable_Profile on Profile {
        id
        name
        profileType {
          id
          name
        }
        subscribers {
          id
          user {
            ...UserAvatarList_User
          }
        }
        createdAt
        ...ProfileLink_Profile
      }
      ${UserAvatarList.fragments.User}
      ${ProfileLink.fragments.Profile}
    `;
  },
  get Petition() {
    return gql`
      fragment PetitionProfilesTable_Petition on Petition {
        id
        isAnonymized
        myEffectivePermission {
          permissionType
        }
        profiles {
          ...PetitionProfilesTable_Profile
        }
      }
      ${this.Profile}
    `;
  },
};

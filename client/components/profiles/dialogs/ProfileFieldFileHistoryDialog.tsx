import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Badge, Center, Stack, Text } from "@chakra-ui/react";
import { HistoryIcon, RepeatIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ProfilePropertyContent } from "@parallel/components/common/ProfilePropertyContent";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserReference } from "@parallel/components/common/UserReference";
import { HStack } from "@parallel/components/ui";
import {
  useProfileFieldFileHistoryDialog_profileTypeFieldFileHistoryDocument,
  useProfileFieldFileHistoryDialog_ProfileTypeFieldFileHistoryFragment,
  useProfileFieldFileHistoryDialog_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ProfileValueSource } from "../ProfileValueSource";

function ProfileFieldFileHistoryDialog({
  profileId,
  field,
  ...props
}: DialogProps<{
  profileId: string;
  field: useProfileFieldFileHistoryDialog_ProfileTypeFieldFragment;
}>) {
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [{ page, items }, setTableState] = useState({
    page: 1,
    items: 10,
  });
  const { data, loading, refetch } = useQuery(
    useProfileFieldFileHistoryDialog_profileTypeFieldFileHistoryDocument,
    {
      variables: {
        profileId,
        profileTypeFieldId: field.id,
        limit: items,
        offset: (page - 1) * items,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const columns = useProfileFieldFileHistoryDialogColumns({ profileId, field });

  const tableRows = data?.profileTypeFieldFileHistory.items ?? [];
  const totalCount = data?.profileTypeFieldFileHistory.totalCount ?? 0;

  return (
    <ConfirmDialog
      initialFocusRef={inputRef}
      hasCloseButton
      size="6xl"
      header={
        <HStack>
          <HistoryIcon />
          <Text>
            <FormattedMessage
              id="component.profile-field-file-history-dialog.header"
              defaultMessage="Property history"
            />
          </Text>
        </HStack>
      }
      body={
        <TablePage
          flex="1 1 auto"
          minHeight={0}
          rowKeyProp={(row) => row.profileFieldFile.id!}
          isHighlightable
          loading={loading}
          columns={columns}
          rows={tableRows}
          page={page}
          pageSize={items}
          totalCount={totalCount}
          onPageChange={(page) => setTableState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setTableState((s) => ({ ...s, items, page: 1 }))}
          header={
            <Stack direction="row" alignItems="center" padding={2}>
              <IconButtonWithTooltip
                onClick={() => refetch()}
                icon={<RepeatIcon />}
                placement="bottom"
                variant="outline"
                label={intl.formatMessage({
                  id: "generic.reload-data",
                  defaultMessage: "Reload",
                })}
              />
            </Stack>
          }
          body={
            tableRows.length === 0 ? (
              <Center minHeight="120px">
                <Text textStyle="hint">
                  <FormattedMessage
                    id="component.profile-field-file-history-dialog.no-data"
                    defaultMessage="There has never been a file added for this property."
                  />
                </Text>
              </Center>
            ) : null
          }
        />
      }
      confirm={null}
      {...props}
    />
  );
}

function useProfileFieldFileHistoryDialogColumns({
  profileId,
  field,
}: {
  profileId: string;
  field: useProfileFieldFileHistoryDialog_ProfileTypeFieldFragment;
}): TableColumn<useProfileFieldFileHistoryDialog_ProfileTypeFieldFileHistoryFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "eventType",
        label: intl.formatMessage({
          id: "component.profile-field-file-history-dialog.event-type",
          defaultMessage: "Action",
        }),
        cellProps: {
          width: "5%",
          minWidth: "100px",
        },
        CellContent: ({ row }) => {
          return row.eventType === "ADDED" ? (
            <Badge colorScheme="green">
              <FormattedMessage
                id="component.profile-field-file-history-dialog.event-type-added"
                defaultMessage="Added"
              />
            </Badge>
          ) : (
            <Badge colorScheme="red">
              <FormattedMessage
                id="component.profile-field-file-history-dialog.event-type-removed"
                defaultMessage="Removed"
              />
            </Badge>
          );
        },
      },
      {
        key: "file",
        label: "",
        cellProps: {
          width: "25%",
          minWidth: "220px",
        },
        CellContent: ({ row }) => {
          return (
            <ProfilePropertyContent
              fromHistory
              profileId={profileId}
              field={field}
              files={[row.profileFieldFile]}
            />
          );
        },
      },

      {
        key: "source",
        label: intl.formatMessage({
          id: "component.profile-field-file-history-dialog.source",
          defaultMessage: "Source",
        }),
        cellProps: {
          width: "40%",
          minWidth: "220px",
        },
        CellContent: ({ row: { profileFieldFile } }) => {
          return (
            <ProfileValueSource
              source={profileFieldFile.source}
              sourceName={
                profileFieldFile.createdBy ? (
                  <UserReference user={profileFieldFile.createdBy} />
                ) : (
                  <Text textStyle="hint">{"-"}</Text>
                )
              }
              parentReplyId={profileFieldFile.petitionFieldReply?.parent?.id}
              petitionId={profileFieldFile.petitionFieldReply?.field?.petition?.id}
            />
          );
        },
      },
      {
        key: "createdAt",
        label: intl.formatMessage({
          id: "component.profile-field-file-history-dialog.date",
          defaultMessage: "Date",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
        },
        CellContent: ({ row: { profileFieldFile } }) => {
          return (
            <DateTime value={profileFieldFile.createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
          );
        },
      },
    ],
    [intl.locale],
  );
}

const _fragments = {
  ProfileTypeField: gql`
    fragment useProfileFieldFileHistoryDialog_ProfileTypeField on ProfileTypeField {
      id
      ...ProfilePropertyContent_ProfileTypeField
    }
  `,
  ProfileTypeFieldFileHistory: gql`
    fragment useProfileFieldFileHistoryDialog_ProfileTypeFieldFileHistory on ProfileTypeFieldFileHistory {
      eventType
      profileFieldFile {
        id
        source
        createdBy {
          id
          ...UserReference_User
        }
        createdAt
        ...ProfilePropertyContent_ProfileFieldFile
        petitionFieldReply {
          id
          parent {
            id
          }
          field {
            id
            petition {
              id
            }
          }
        }
      }
    }
  `,
};

const _query = gql`
  query useProfileFieldFileHistoryDialog_profileTypeFieldFileHistory(
    $profileId: GID!
    $profileTypeFieldId: GID!
    $limit: Int
    $offset: Int
  ) {
    profileTypeFieldFileHistory(
      profileId: $profileId
      profileTypeFieldId: $profileTypeFieldId
      limit: $limit
      offset: $offset
    ) {
      totalCount
      items {
        ...useProfileFieldFileHistoryDialog_ProfileTypeFieldFileHistory
      }
    }
  }
`;

export function useProfileFieldFileHistoryDialog() {
  return useDialog(ProfileFieldFileHistoryDialog);
}

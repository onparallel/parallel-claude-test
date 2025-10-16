import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Center, Stack, Text } from "@chakra-ui/react";
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
  useProfileFieldValueHistoryDialog_ProfileFieldValueFragment,
  useProfileFieldValueHistoryDialog_ProfileTypeFieldFragment,
  useProfileFieldValueHistoryDialog_profileTypeFieldValueHistoryDocument,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ProfileValueSource } from "../ProfileValueSource";

function ProfileFieldValueHistoryDialog({
  profileId,
  field,
  ...props
}: DialogProps<{
  profileId: string;
  field: useProfileFieldValueHistoryDialog_ProfileTypeFieldFragment;
}>) {
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [{ page, items }, setTableState] = useState({
    page: 1,
    items: 10,
  });
  const { data, loading, refetch } = useQuery(
    useProfileFieldValueHistoryDialog_profileTypeFieldValueHistoryDocument,
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

  const columns = useProfileFieldValueHistoryDialogColumns({ profileId, field });

  const tableRows = data?.profileTypeFieldValueHistory.items ?? [];
  const totalCount = data?.profileTypeFieldValueHistory.totalCount ?? 0;

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
              id="component.profile-field-value-history-dialog.header"
              defaultMessage="Property history"
            />
          </Text>
        </HStack>
      }
      body={
        <TablePage
          flex="1 1 auto"
          minHeight={0}
          rowKeyProp={(row) => row.id}
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
                    id="component.profile-field-value-history-dialog.no-data"
                    defaultMessage="There has never been a value set for this property."
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

function useProfileFieldValueHistoryDialogColumns({
  profileId,
  field,
}: {
  profileId: string;
  field: useProfileFieldValueHistoryDialog_ProfileTypeFieldFragment;
}): TableColumn<useProfileFieldValueHistoryDialog_ProfileFieldValueFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "value",
        label: intl.formatMessage({
          id: "component.profile-field-value-history-dialog.value",
          defaultMessage: "Value",
        }),
        cellProps: {
          width: "30%",
          minWidth: "220px",
        },
        CellContent: ({ row }) => {
          return (
            <ProfilePropertyContent fromHistory profileId={profileId} field={field} value={row} />
          );
        },
      },
      {
        key: "source",
        label: intl.formatMessage({
          id: "component.profile-field-value-history-dialog.source",
          defaultMessage: "Source",
        }),
        cellProps: {
          width: "40%",
          minWidth: "220px",
        },
        CellContent: ({ row }) => {
          return (
            <ProfileValueSource
              source={row.source}
              externalSourceName={row.externalSourceName}
              sourceName={
                row.createdBy ? (
                  <UserReference user={row.createdBy} />
                ) : (
                  <Text textStyle="hint">{"-"}</Text>
                )
              }
              parentReplyId={row.petitionFieldReply?.parent?.id}
              petitionId={row.petitionFieldReply?.field?.petition?.id}
            />
          );
        },
      },
      {
        key: "createdAt",
        label: intl.formatMessage({
          id: "component.profile-field-value-history-dialog.date",
          defaultMessage: "Date",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
        },
        CellContent: ({ row }) => {
          return <DateTime value={row.createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />;
        },
      },
    ],
    [intl.locale],
  );
}

useProfileFieldValueHistoryDialog.fragments = {
  get ProfileTypeField() {
    return gql`
      fragment useProfileFieldValueHistoryDialog_ProfileTypeField on ProfileTypeField {
        id
        ...ProfilePropertyContent_ProfileTypeField
      }
      ${ProfilePropertyContent.fragments.ProfileTypeField}
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment useProfileFieldValueHistoryDialog_ProfileFieldValue on ProfileFieldValue {
        id
        createdAt
        createdBy {
          id
          fullName
          ...UserReference_User
        }
        source
        externalSourceName
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
        ...ProfilePropertyContent_ProfileFieldValue
      }
      ${ProfilePropertyContent.fragments.ProfileFieldValue}
      ${UserReference.fragments.User}
    `;
  },
};

const _query = gql`
  query useProfileFieldValueHistoryDialog_profileTypeFieldValueHistory(
    $profileId: GID!
    $profileTypeFieldId: GID!
    $limit: Int
    $offset: Int
  ) {
    profileTypeFieldValueHistory(
      profileId: $profileId
      profileTypeFieldId: $profileTypeFieldId
      limit: $limit
      offset: $offset
    ) {
      totalCount
      items {
        ...useProfileFieldValueHistoryDialog_ProfileFieldValue
      }
    }
  }
  ${useProfileFieldValueHistoryDialog.fragments.ProfileFieldValue}
`;

export function useProfileFieldValueHistoryDialog() {
  return useDialog(ProfileFieldValueHistoryDialog);
}

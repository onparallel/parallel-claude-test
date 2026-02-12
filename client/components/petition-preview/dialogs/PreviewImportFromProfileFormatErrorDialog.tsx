import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { List, ListItem } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ProfileTypeFieldReference } from "@parallel/components/common/ProfileTypeFieldReference";
import { Button, Stack, Text } from "@parallel/components/ui";
import { PreviewImportFromProfileFormatErrorDialog_profilesDocument } from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { isNonNullish, unique, uniqueBy } from "remeda";

export interface PreviewImportFromProfileFormatErrorDialogProps {
  profileTypeId: string;
  profileIds: string[];
  profileTypeFieldIds: string[];
}

export function PreviewImportFromProfileFormatErrorDialog({
  profileIds,
  profileTypeId,
  profileTypeFieldIds,
  ...props
}: DialogProps<PreviewImportFromProfileFormatErrorDialogProps>) {
  const focusRef = useRef<HTMLButtonElement>(null);

  const { data } = useQuery(PreviewImportFromProfileFormatErrorDialog_profilesDocument, {
    variables: {
      profileTypeId,
      filter: { property: "id", operator: "IS_ONE_OF", value: unique(profileIds) },
    },
  });

  const allFields =
    uniqueBy(data?.profiles.items ?? [], (p) => p.profileType.id).flatMap(
      (profile) => profile.profileType.fields,
    ) ?? [];

  const fields = isNonNullish(data)
    ? allFields.filter((field) => profileTypeFieldIds.includes(field.id))
    : ([] as any[]);

  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={focusRef}
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <Stack direction="row" gap={2} align="center">
          <AlertCircleIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.preview-import-from-profile-format-error-dialog.header"
              defaultMessage="Incompatible fields"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack gap={4}>
          <Text>
            <FormattedMessage
              id="component.preview-import-from-profile-format-error-dialog.body"
              defaultMessage="Some properties are incompatible with the fields they are linked to. You can proceed but the following incompatible properties won't be imported:"
            />
          </Text>
          <List>
            {fields.map((field) => {
              return (
                <ListItem key={field.id}>
                  <ProfileTypeFieldReference field={field} />
                </ListItem>
              );
            })}
          </List>
        </Stack>
      }
      confirm={
        <Button
          ref={focusRef}
          colorPalette="primary"
          minWidth={24}
          onClick={() => props.onResolve()}
        >
          <FormattedMessage id="generic.proceed" defaultMessage="Proceed" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewImportFromProfileFormatErrorDialog() {
  return useDialog(PreviewImportFromProfileFormatErrorDialog);
}

const _fragments = {
  ProfileType: gql`
    fragment PreviewImportFromProfileFormatErrorDialog_ProfileType on ProfileType {
      id
      fields {
        id
        name
        type
      }
    }
  `,
};

const _queries = [
  gql`
    query PreviewImportFromProfileFormatErrorDialog_profiles(
      $filter: ProfileQueryFilterInput
      $profileTypeId: GID!
    ) {
      profiles(limit: 100, offset: 0, filter: $filter, profileTypeId: $profileTypeId) {
        items {
          id
          profileType {
            ...PreviewImportFromProfileFormatErrorDialog_ProfileType
          }
        }
        totalCount
      }
    }
  `,
];

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { ListItem, UnorderedList } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { Button, Stack, Text } from "@parallel/components/ui";
import { usePreviewConfirmImportFromProfileDialog_profilesDocument } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function PreviewConfirmImportFromProfileDialog({
  profileIds,
  profileTypeId,
  ...props
}: DialogProps<{ profileIds: string[]; profileTypeId: string }, void>) {
  const { data } = useQuery(usePreviewConfirmImportFromProfileDialog_profilesDocument, {
    variables: {
      profileTypeId,
      filter: { property: "id", operator: "IS_ONE_OF", value: profileIds },
    },
  });

  return (
    <ConfirmDialog
      header={
        <Stack direction="row" gap={2} align="center">
          <AlertCircleIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.preview-confirm-import-from-profile-dialog.header"
              defaultMessage="No information found"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.preview-confirm-import-from-profile-dialog.body"
              defaultMessage="The following selected profiles do not have information available for importing into the group:"
            />
          </Text>
          <UnorderedList paddingStart={2} paddingBottom={2}>
            {data?.profiles.items.map((profile) => (
              <ListItem key={profile.id}>
                <ProfileReference profile={profile} />
              </ListItem>
            ))}
          </UnorderedList>
          <Text>
            <FormattedMessage
              id="component.preview-confirm-import-from-profile-dialog.body-2"
              defaultMessage="If you continue, the profile will be associated with the parallel, but existing responses in fields linked to the profile type will be deleted."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button onClick={() => props.onResolve()} colorPalette="primary" variant="solid">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewConfirmImportFromProfileDialog() {
  return useDialog(PreviewConfirmImportFromProfileDialog);
}

const _queries = [
  gql`
    query usePreviewConfirmImportFromProfileDialog_profiles(
      $filter: ProfileQueryFilterInput
      $profileTypeId: GID!
    ) {
      profiles(offset: 0, limit: 100, filter: $filter, profileTypeId: $profileTypeId) {
        items {
          id
          ...ProfileReference_Profile
        }
      }
    }
  `,
];

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Stack, Text } from "@chakra-ui/react";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  useArchiveProfileType_ProfileTypeFragment,
  useArchiveProfileType_archiveProfileTypeDocument,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";

export function useArchiveProfileType() {
  const [archiveProfileType] = useMutation(useArchiveProfileType_archiveProfileTypeDocument);

  const showArchiveProfileTypeDialog = useDialog(ArchiveProfileTypeDialog);

  return async function ({
    profileTypes,
  }: {
    profileTypes: useArchiveProfileType_ProfileTypeFragment[];
  }) {
    try {
      await showArchiveProfileTypeDialog({
        count: profileTypes.length,
        profileTypeName: profileTypes[0].name,
      });

      const { data: res } = await archiveProfileType({
        variables: { profileTypeIds: profileTypes.map((profileType) => profileType.id) },
      });

      return res?.archiveProfileType;
    } catch {}
  };
}

useArchiveProfileType.fragments = {
  get ProfileType() {
    return gql`
      fragment useArchiveProfileType_ProfileType on ProfileType {
        id
        name
      }
    `;
  },
};

useArchiveProfileType.mutations = [
  gql`
    mutation useArchiveProfileType_archiveProfileType($profileTypeIds: [GID!]!) {
      archiveProfileType(profileTypeIds: $profileTypeIds) {
        id
      }
    }
  `,
];

interface ArchiveProfileTypeDialogProps {
  count: number;
  profileTypeName: LocalizableUserText;
}

function ArchiveProfileTypeDialog({
  count,
  profileTypeName,
  ...props
}: DialogProps<ArchiveProfileTypeDialogProps, {}>) {
  const intl = useIntl();
  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      header={
        <FormattedMessage
          id="component.archive-profile-type-confirmation-dialog.title"
          defaultMessage="Archive profile type"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.archive-profile-type-confirmation-dialog.body"
              defaultMessage="If you continue, you won't be able to create new profiles of {count, plural, =1 {type {profileTypeName}} other {the selected types}}. Existing profiles won't be affected and this action can be reversed if necessary."
              values={{
                count,
                profileTypeName: (
                  <Text as="strong">
                    <LocalizableUserTextRender
                      value={profileTypeName}
                      default={intl.formatMessage({
                        id: "generic.unnamed-profile-type",
                        defaultMessage: "Unnamed profile type",
                      })}
                    />
                  </Text>
                ),
              }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.archive-profile-type-confirmation-dialog.body-question"
              defaultMessage="Are you sure you want to archive {count, plural, =1 {{profileTypeName}} other {the selected profile types}}?"
              values={{
                count,
                profileTypeName: (
                  <Text as="strong">
                    <LocalizableUserTextRender
                      value={profileTypeName}
                      default={intl.formatMessage({
                        id: "generic.unnamed-profile-type",
                        defaultMessage: "Unnamed profile type",
                      })}
                    />
                  </Text>
                ),
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.archive-profile-type-confirmation-dialog.archive"
            defaultMessage="Archive"
          />
        </Button>
      }
    />
  );
}

import { gql, useMutation } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useCloseProfile_closeProfileDocument } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function useCloseProfile() {
  const showCloseProfileDialog = useCloseProfileDialog();
  const [closeProfile] = useMutation(useCloseProfile_closeProfileDocument);
  return async function ({
    profileIds,
    profileName,
  }: {
    profileIds: string[];
    profileName: React.ReactNode;
  }) {
    try {
      await showCloseProfileDialog({ profileCount: profileIds.length, profileName });
      await closeProfile({
        variables: {
          profileIds,
        },
      });
    } catch {}
  };
}

useCloseProfile.mutations = [
  gql`
    mutation useCloseProfile_closeProfile($profileIds: [GID!]!) {
      closeProfile(profileIds: $profileIds) {
        id
        status
      }
    }
  `,
];

function CloseProfileDialog({
  profileCount,
  profileName,
  ...props
}: DialogProps<{ profileName: React.ReactNode; profileCount: number }, void>) {
  return (
    <ConfirmDialog
      {...props}
      content={{
        containerProps: {
          as: "form",
          onSubmit: () => {
            props.onResolve();
          },
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.close-profile-dialog.header"
          defaultMessage="Close {count, plural, =1 {profile} other {# profiles}}"
          values={{ count: profileCount }}
        />
      }
      body={
        <Stack>
          <Alert status="info" rounded="md">
            <AlertIcon />
            <AlertDescription>
              <FormattedMessage
                id="component.close-profile-dialog.alert-description"
                defaultMessage="If a profile has alerts, they will be disabled upon closing it."
              />
            </AlertDescription>
          </Alert>
          <Text>
            <FormattedMessage
              id="component.close-profile-dialog.body"
              defaultMessage="When you close a profile, the content is preserved but you won't be able to edit it."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.close-profile-dialog.body-2"
              defaultMessage="Personal data will be anonymized after the retention period set by your organization."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.close-profile-dialog.body-question"
              defaultMessage="Are you sure you want to close {count, plural, =1 {the profile of {profileName}} other {the selected profiles}}?"
              values={{
                profileName: (
                  <Text as="span" fontWeight="bold">
                    {profileName}
                  </Text>
                ),
                count: profileCount,
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="red">
          <FormattedMessage
            id="component.close-profile-dialog.close-profile-button"
            defaultMessage="Close {count, plural, =1 {profile} other {profiles}}"
            values={{ count: profileCount }}
          />
        </Button>
      }
    />
  );
}

function useCloseProfileDialog() {
  return useDialog(CloseProfileDialog);
}

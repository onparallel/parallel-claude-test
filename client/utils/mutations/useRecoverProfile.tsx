import { gql, useMutation } from "@apollo/client";
import { Button, Radio, RadioGroup, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  useRecoverProfile_closeProfileDocument,
  useRecoverProfile_reopenProfileDocument,
} from "@parallel/graphql/__types";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

export function useRecoverProfile() {
  const showReopenProfileDialog = useRecoverProfileDialog();
  const [closeProfile] = useMutation(useRecoverProfile_closeProfileDocument);
  const [reopenProfile] = useMutation(useRecoverProfile_reopenProfileDocument);
  return async function ({
    profileIds,
    profileName,
  }: {
    profileIds: string[];
    profileName: React.ReactNode;
  }) {
    try {
      const { status } = await showReopenProfileDialog({
        profileCount: profileIds.length,
        profileName,
      });
      if (status === "OPEN") {
        await reopenProfile({
          variables: {
            profileIds,
          },
        });
      } else {
        await closeProfile({
          variables: {
            profileIds,
          },
        });
      }
    } catch {}
  };
}

useRecoverProfile.mutations = [
  gql`
    mutation useRecoverProfile_closeProfile($profileIds: [GID!]!) {
      closeProfile(profileIds: $profileIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation useRecoverProfile_reopenProfile($profileIds: [GID!]!) {
      reopenProfile(profileIds: $profileIds) {
        id
        status
      }
    }
  `,
];

interface RecoverProfileDialogResult {
  status: "CLOSED" | "OPEN";
}

function RecoverProfileDialog({
  profileName,
  profileCount,
  ...props
}: DialogProps<
  { profileName: React.ReactNode; profileCount: number },
  RecoverProfileDialogResult
>) {
  const [status, setStatus] = useState<"CLOSED" | "OPEN">("CLOSED");
  const radioRef = useRef<HTMLInputElement>(null);

  return (
    <ConfirmDialog
      {...props}
      content={{
        containerProps: {
          as: "form",
          onSubmit: () => {
            props.onResolve({ status });
          },
        },
      }}
      hasCloseButton
      initialFocusRef={radioRef}
      header={
        <FormattedMessage
          id="component.recover-profile-dialog.header"
          defaultMessage="Recover {count, plural, =1 {profile} other {# profiles}}"
          values={{ count: profileCount }}
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.recover-profile-dialog.body"
              defaultMessage="Recover {count, plural, =1 {the profile <b>{profileName}</b>} other {# profiles}} and its content."
              values={{ profileName, count: profileCount }}
            />
          </Text>
          <RadioGroup
            onChange={(value) => setStatus(value as any)}
            value={status}
            colorScheme="purple"
          >
            <Stack>
              <Radio value="CLOSED" ref={radioRef}>
                <FormattedMessage
                  id="component.recover-profile-dialog.radio-closed"
                  defaultMessage="<b>Keep {count, plural, =1 {profile closed} other {profiles closed}}</b> and edition locked."
                  values={{ count: profileCount }}
                />
              </Radio>
              <Radio value="OPEN">
                <FormattedMessage
                  id="component.recover-profile-dialog.radio-reopened"
                  defaultMessage="<b>Reopen the {count, plural, =1 {profile} other {profiles}}</b> to edit its content."
                  values={{ count: profileCount }}
                />
              </Radio>
            </Stack>
          </RadioGroup>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage
            id="component.recover-profile-dialog.recover-button"
            defaultMessage="Recover"
          />
        </Button>
      }
    />
  );
}

function useRecoverProfileDialog() {
  return useDialog(RecoverProfileDialog);
}

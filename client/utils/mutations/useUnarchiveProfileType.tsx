import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  useUnarchiveProfileType_ProfileTypeFragment,
  useUnarchiveProfileType_unarchiveProfileTypeDocument,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

export function useUnarchiveProfileType() {
  const [unarchiveProfileType] = useMutation(useUnarchiveProfileType_unarchiveProfileTypeDocument);

  const showUnarchiveProfileTypeDialog = useDialog(UnarchiveProfileTypeDialog);

  return async function ({
    profileTypes,
  }: {
    profileTypes: useUnarchiveProfileType_ProfileTypeFragment[];
  }) {
    try {
      await showUnarchiveProfileTypeDialog({ count: profileTypes.length });

      const { data: res } = await unarchiveProfileType({
        variables: { profileTypeIds: profileTypes.map((profileType) => profileType.id) },
      });

      return res?.unarchiveProfileType;
    } catch {}
  };
}

const _fragments = {
  ProfileType: gql`
    fragment useUnarchiveProfileType_ProfileType on ProfileType {
      id
      name
    }
  `,
};

useUnarchiveProfileType.mutations = [
  gql`
    mutation useUnarchiveProfileType_unarchiveProfileType($profileTypeIds: [GID!]!) {
      unarchiveProfileType(profileTypeIds: $profileTypeIds) {
        id
      }
    }
  `,
];

interface UnarchiveProfileTypeDialogProps {
  count: number;
}

function UnarchiveProfileTypeDialog({
  count,
  ...props
}: DialogProps<UnarchiveProfileTypeDialogProps, {}>) {
  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      header={
        <FormattedMessage
          id="component.unarchive-profile-type-dialog.title"
          defaultMessage="Unarchive profile type"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.unarchive-profile-type-dialog.body"
            defaultMessage="If you continue, the selected profile {count, plural, =1 {type} other {types}} will be unarchived and you will be able to create new profiles using {count, plural, =1 {it} other {them}}."
            values={{ count }}
          />
        </Text>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.unarchive" defaultMessage="Unarchive" />
        </Button>
      }
    />
  );
}

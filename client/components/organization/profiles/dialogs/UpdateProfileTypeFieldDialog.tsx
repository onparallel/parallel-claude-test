import { gql } from "@apollo/client";
import { Button, Center, HStack, Stack, Switch, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface UpdateProfileTypeFieldDialogProps {
  fields: useUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment[];
}

function UpdateProfileTypeFieldDialog({
  fields,
  ...props
}: DialogProps<UpdateProfileTypeFieldDialogProps, { isExpirable: boolean }>) {
  const { register, handleSubmit } = useForm<{ isExpirable: boolean }>({
    defaultValues: {
      isExpirable: fields.every((field) => field.isExpirable),
    },
  });

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ isExpirable }) => {
          props.onResolve({ isExpirable });
        }),
      }}
      header={
        <FormattedMessage
          id="component.update-profile-type-field-dialog.title"
          defaultMessage="Edit {count} properties"
          values={{
            count: fields.length,
          }}
        />
      }
      body={
        <HStack>
          <Stack spacing={1}>
            <Text fontWeight={600}>
              <FormattedMessage
                id="component.update-profile-type-field-dialog.expiration"
                defaultMessage="Expiration"
              />
            </Text>
            <Text color="gray.600" fontSize="sm">
              <FormattedMessage
                id="component.update-profile-type-field-dialog.expiration-description"
                defaultMessage="Select if this property will have an expiration date. Example: Passports and contracts."
              />
            </Text>
          </Stack>
          <Center>
            <Switch {...register("isExpirable")} />
          </Center>
        </HStack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

useUpdateProfileTypeFieldDialog.fragments = {
  ProfileTypeField: gql`
    fragment useUpdateProfileTypeFieldDialog_ProfileTypeField on ProfileTypeField {
      id
      isExpirable
    }
  `,
};

export function useUpdateProfileTypeFieldDialog() {
  return useDialog(UpdateProfileTypeFieldDialog);
}

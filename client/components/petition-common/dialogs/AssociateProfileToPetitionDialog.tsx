import { gql } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, HStack, Text } from "@chakra-ui/react";
import { ArrowDiagonalRightIcon } from "@parallel/chakra/icons";
import { ProfileSelect, ProfileSelectInstance } from "@parallel/components/common/ProfileSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface AssociateProfileToPetitionDialogProps {
  excludeProfiles?: string[];
}

interface AssociateProfileToPetitionDialogData {
  profileId: string | null;
}

function AssociateProfileToPetitionDialog({
  excludeProfiles,
  ...props
}: DialogProps<AssociateProfileToPetitionDialogProps, string>) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssociateProfileToPetitionDialogData>({
    defaultValues: { profileId: null },
  });

  const selectRef = useRef<ProfileSelectInstance<false>>(null);
  return (
    <ConfirmDialog
      size="lg"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={selectRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ profileId }) => props.onResolve(profileId!)),
        },
      }}
      {...props}
      header={
        <HStack>
          <ArrowDiagonalRightIcon />
          <Text as="span">
            <FormattedMessage
              id="component.associate-profile-to-parallel-dialog.header"
              defaultMessage="Associate profile"
            />
          </Text>
        </HStack>
      }
      body={
        <FormControl isInvalid={!!errors.profileId}>
          <FormLabel fontWeight={400}>
            <FormattedMessage
              id="component.associate-profile-to-parallel-dialog.profile-label"
              defaultMessage="Profile"
            />
          </FormLabel>
          <Controller
            name="profileId"
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <ProfileSelect
                ref={selectRef}
                excludeProfiles={excludeProfiles}
                defaultOptions
                value={value}
                onChange={(v) => onChange(v?.id ?? null)}
                canCreateProfiles
              />
            )}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="component.associate-profile-to-parallel-dialog.profile-error"
              defaultMessage="Please, select a profile"
            />
          </FormErrorMessage>
        </FormControl>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage
            id="component.associate-profile-to-parallel-dialog.associate"
            defaultMessage="Associate"
          />
        </Button>
      }
    />
  );
}

const _fragments = {
  Profile: gql`
    fragment AssociateProfileToPetitionDialog_Profile on Profile {
      id
      ...ProfileSelect_Profile
    }
  `,
};

export function useAssociateProfileToPetitionDialog() {
  return useDialog(AssociateProfileToPetitionDialog);
}

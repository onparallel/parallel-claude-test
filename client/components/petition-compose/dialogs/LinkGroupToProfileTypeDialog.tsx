import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { SelectInstance } from "react-select";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

function LinkGroupToProfileTypeDialog({
  defaultProfileTypeId,
  defaultGroupName,
  hasLinkedFields,
  ...props
}: DialogProps<
  {
    defaultProfileTypeId?: string | null;
    defaultGroupName: string | null;
    hasLinkedFields: boolean;
  },
  { profileTypeId: string | null; groupName: string | null }
>) {
  const intl = useIntl();
  const selectRef = useRef<SelectInstance>(null);

  const {
    control,
    formState: { errors, dirtyFields },
    register,
    handleSubmit,
  } = useForm<{ profileTypeId: string | null; groupName: string | null }>({
    defaultValues: {
      profileTypeId: defaultProfileTypeId ?? null,
      groupName: defaultGroupName ?? null,
    },
  });
  return (
    <ConfirmDialog
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ profileTypeId, groupName }) => {
            props.onResolve({
              profileTypeId: isNonNullish(dirtyFields.profileTypeId) ? profileTypeId : null,
              groupName: isNonNullish(dirtyFields.groupName) ? groupName : null,
            });
          }),
        },
      }}
      initialFocusRef={selectRef}
      header={
        <FormattedMessage
          id="component.link-group-to-profile-type-dialog.header"
          defaultMessage="Link to profiles"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.link-group-to-profile-type-dialog.body"
              defaultMessage="Select a profile type to add its fields to this group."
            />
          </Text>
          <HelpCenterLink articleId={6022979} display="flex" alignItems="center" marginBottom={2}>
            <FormattedMessage
              id="component.link-group-to-profile-type-dialog.more-about-profiles-help-link"
              defaultMessage="More about profiles"
            />
          </HelpCenterLink>
          <FormControl isInvalid={!!errors.profileTypeId} isDisabled={hasLinkedFields}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.link-group-to-profile-type-dialog.profile-type-label"
                defaultMessage="Profile type"
              />
            </FormLabel>
            <Controller
              name="profileTypeId"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <ProfileTypeSelect
                  ref={selectRef as any}
                  defaultOptions
                  value={value}
                  onChange={(v) => onChange(v?.id ?? "")}
                />
              )}
            />

            {hasLinkedFields ? (
              <Alert status="warning" marginTop={4} rounded="md">
                <AlertIcon />
                <AlertDescription>
                  <FormattedMessage
                    id="component.link-group-to-profile-type-dialog.delete-profile-fields"
                    defaultMessage="Delete the profile fields and the relationships added to change the profile type."
                  />
                </AlertDescription>
              </Alert>
            ) : (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.field-required-error"
                  defaultMessage="This field is required"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="group-name" isInvalid={!!errors.groupName}>
            <FormLabel display="flex" alignItems="center" fontWeight={400}>
              <FormattedMessage
                id="component.link-group-to-profile-type-dialog.group-name"
                defaultMessage="Group name"
              />

              <HelpPopover>
                <Text fontSize="sm" marginBottom={2}>
                  <FormattedMessage
                    id="component.link-group-to-profile-type-dialog.group-name-help-popover-1"
                    defaultMessage="Name your question groups for easier identification."
                  />
                </Text>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.link-group-to-profile-type-dialog.group-name-help-popover-2"
                    defaultMessage='For example, if the name is "Director", the groups will be called Director 1, Director 2, and so on.'
                  />
                </Text>
              </HelpPopover>
            </FormLabel>
            <Input
              {...register("groupName", { required: true })}
              placeholder={intl.formatMessage({
                id: "component.link-group-to-profile-type-dialog.group-name-placeholder",
                defaultMessage: "E.g., Client",
              })}
            />

            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

export function useLinkGroupToProfileTypeDialog() {
  return useDialog(LinkGroupToProfileTypeDialog);
}

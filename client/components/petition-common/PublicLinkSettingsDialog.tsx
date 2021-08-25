import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { UserSelect, UserSelectSelection, useSearchUsers } from "../common/UserSelect";

interface AddMemberGroupDialogData {
  title: string;
  description: string;
  owner: string;
  editors: UserSelectSelection<true>[];
}

export function PublicLinkSettingsDialog({
  owner = "",
  ...props
}: DialogProps<{ owner: string }, AddMemberGroupDialogData>) {
  const {
    handleSubmit,
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<AddMemberGroupDialogData>({
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      owner: owner,
      editors: [],
    },
  });

  const intl = useIntl();
  const _handleSearchUsers = useSearchUsers();

  const titleRef = useRef<HTMLInputElement>(null);
  const titleRegisterProps = useRegisterWithRef(titleRef, register, "title", {
    required: true,
  });

  const handleSearchOwner = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers],
      });
    },
    [_handleSearchUsers]
  );

  const watchOwner = watch("owner");

  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers, watchOwner],
      });
    },
    [_handleSearchUsers, watchOwner]
  );

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      initialFocusRef={titleRef}
      header={
        <Text>
          <FormattedMessage
            id="component.settings-public-link-dialog.title"
            defaultMessage="Public link configuration"
          />
        </Text>
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.settings-public-link-dialog.description"
              defaultMessage="Complete the information for users who access the link and define who will have access to the created petitions."
            />
          </Text>
          <FormControl id="title" isInvalid={!!errors.title}>
            <FormLabel>
              <FormattedMessage
                id="component.settings-public-link-dialog.page-title-label"
                defaultMessage="Title of the page"
              />
            </FormLabel>
            <Input
              {...titleRegisterProps}
              type="text"
              name="title"
              placeholder={intl.formatMessage({
                id: "component.settings-public-link-dialog.page-title-placeholder",
                defaultMessage: "Include the title your recipients will see",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.settings-public-link-dialog.page-title-error"
                defaultMessage="The title is a required field"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="description" isInvalid={!!errors.description}>
            <FormLabel>
              <FormattedMessage
                id="component.settings-public-link-dialog.description-label"
                defaultMessage="Description"
              />
            </FormLabel>
            <Textarea
              {...register("description", { required: true })}
              type="text"
              name="description"
              placeholder={intl.formatMessage({
                id: "component.settings-public-link-dialog.description-placeholder",
                defaultMessage:
                  "Explain what the service is and what kind of information you will need",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.settings-public-link-dialog.description-error"
                defaultMessage="The description is a required field"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="owner">
            <FormLabel>
              <FormattedMessage
                id="component.settings-public-link-dialog.owner-label"
                defaultMessage="Owner:"
              />
            </FormLabel>
            <Controller
              name="owner"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  value={value}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(users) => {
                    onChange(users?.id);
                  }}
                  onBlur={onBlur}
                  onSearch={handleSearchOwner}
                  placeholder={intl.formatMessage({
                    id: "component.settings-public-link-dialog.owner-placeholder",
                    defaultMessage: "Select an owner",
                  })}
                />
              )}
            />
          </FormControl>

          <FormControl id="editors">
            <FormLabel>
              <FormattedMessage
                id="component.settings-public-link-dialog.editors-label"
                defaultMessage="Editors:"
              />
            </FormLabel>
            <Controller
              name="editors"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  isMulti
                  includeGroups
                  value={value}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(users) => {
                    onChange(users);
                  }}
                  onBlur={onBlur}
                  onSearch={handleSearchUsers}
                  placeholder={intl.formatMessage({
                    id: "component.settings-public-link-dialog.editors-placeholder",
                    defaultMessage: "Add users and teams from your organization",
                  })}
                />
              )}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          <FormattedMessage
            id="component.settings-public-link-dialog.generate-link"
            defaultMessage="Generate link"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function usePublicLinkSettingsDialog() {
  return useDialog(PublicLinkSettingsDialog);
}

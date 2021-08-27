import { gql } from "@apollo/client";
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
import {
  PublicLinkSettingsDialog_PublicPetitionLinkFragment,
  UserOrUserGroupPublicLinkPermission,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { UserSelect, useSearchUsers } from "../common/UserSelect";

interface PublicLinkSettingsData {
  title: string;
  description: string;
  ownerId: string;
  otherPermissions: UserOrUserGroupPublicLinkPermission[];
}

export function PublicLinkSettingsDialog({
  publicLink,
  ownerId,
  ...props
}: DialogProps<
  { ownerId?: string; publicLink?: PublicLinkSettingsDialog_PublicPetitionLinkFragment },
  PublicLinkSettingsData
>) {
  const owner = publicLink?.linkPermissions.find((p) => p.permissionType === "OWNER");

  const {
    handleSubmit,
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<PublicLinkSettingsData>({
    mode: "onChange",
    defaultValues: {
      title: publicLink?.title ?? "",
      description: publicLink?.description ?? "",
      ownerId:
        owner?.__typename === "PublicPetitionLinkUserPermission" ? owner.user.id : ownerId ?? "",
      otherPermissions:
        (publicLink?.linkPermissions
          ?.filter((p) => p.permissionType !== "OWNER")
          ?.map((p) => {
            if (p.__typename === "PublicPetitionLinkUserGroupPermission") {
              return {
                id: p.group.id,
                permissionType: p.permissionType,
              };
            } else if (p.__typename === "PublicPetitionLinkUserPermission") {
              return {
                id: p.user.id,
                permissionType: p.permissionType,
              };
            }
          }) as UserOrUserGroupPublicLinkPermission[]) ?? [],
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

  const watchOwnerId = watch("ownerId");

  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers, watchOwnerId],
      });
    },
    [_handleSearchUsers, watchOwnerId]
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
                defaultMessage="Title is required"
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
                defaultMessage="Description is required"
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
              name="ownerId"
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
              name="otherPermissions"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  isMulti
                  includeGroups
                  value={value.map((v) => v.id)}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(usersOrGroups) => {
                    onChange(
                      usersOrGroups.map((value) => ({
                        id: value.id,
                        permissionType: "WRITE",
                      }))
                    );
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
          {publicLink ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage
              id="component.settings-public-link-dialog.generate-link"
              defaultMessage="Generate link"
            />
          )}
        </Button>
      }
      {...props}
    />
  );
}

PublicLinkSettingsDialog.fragments = {
  PublicPetitionLink: gql`
    fragment PublicLinkSettingsDialog_PublicPetitionLink on PublicPetitionLink {
      id
      title
      isActive
      description
      slug
      linkPermissions {
        ... on PublicPetitionLinkUserPermission {
          user {
            id
          }
        }
        ... on PublicPetitionLinkUserGroupPermission {
          group {
            id
          }
        }
        permissionType
      }
    }
  `,
};

export function usePublicLinkSettingsDialog() {
  return useDialog(PublicLinkSettingsDialog);
}

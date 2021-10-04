import { gql, useApolloClient } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import {
  PublicLinkSettingsDialog_isValidPublicPetitionLinkSlugQuery,
  PublicLinkSettingsDialog_isValidPublicPetitionLinkSlugQueryVariables,
  PublicLinkSettingsDialog_PublicPetitionLinkFragment,
  usePublicLinkSettingsDialog_getSlugForPublicPetitionLinkLazyQuery,
  UserOrUserGroupPublicLinkPermission,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { UserSelect, useSearchUsers } from "../common/UserSelect";

interface PublicLinkSettingsData {
  title: string;
  description: string;
  ownerId: string;
  slug: string;
  petitionName: string;
  otherPermissions: UserOrUserGroupPublicLinkPermission[];
}

export function PublicLinkSettingsDialog({
  publicLink,
  ownerId,
  locale,
  petitionName,
  ...props
}: DialogProps<
  {
    publicLink?: PublicLinkSettingsDialog_PublicPetitionLinkFragment;
    ownerId?: string;
    locale: string;
    petitionName: string;
  },
  PublicLinkSettingsData
>) {
  const apollo = useApolloClient();
  const intl = useIntl();
  const _handleSearchUsers = useSearchUsers();

  const owner = publicLink?.linkPermissions.find((p) => p.permissionType === "OWNER");

  const {
    handleSubmit,
    register,
    watch,
    control,
    setValue,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<PublicLinkSettingsData>({
    mode: "onChange",
    defaultValues: {
      title: publicLink?.title ?? "",
      description: publicLink?.description ?? "",
      slug: publicLink?.slug ?? "",
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

  const [getSlugLazy, { data: getSlugData, loading: getSlugLoading }] =
    usePublicLinkSettingsDialog_getSlugForPublicPetitionLinkLazyQuery({
      fetchPolicy: "network-only",
    });

  useEffect(() => {
    if (!publicLink) {
      getSlugLazy({
        variables: {
          petitionName,
        },
      });
    }
  }, []);

  useEffect(() => {
    // console.log(errors.slug);
  }, [errors.slug]);

  useEffect(() => {
    if (getSlugData?.getSlugForPublicPetitionLink) {
      setValue("slug", getSlugData?.getSlugForPublicPetitionLink);
    }
  }, [getSlugData]);

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
        includeGroups: true,
      });
    },
    [_handleSearchUsers, watchOwnerId]
  );

  const debouncedIsValidSlug = useDebouncedAsync(
    async (slug: string) => {
      const { data } = await apollo.query<
        PublicLinkSettingsDialog_isValidPublicPetitionLinkSlugQuery,
        PublicLinkSettingsDialog_isValidPublicPetitionLinkSlugQueryVariables
      >({
        query: gql`
          query PublicLinkSettingsDialog_isValidPublicPetitionLinkSlug($slug: String!) {
            isValidPublicPetitionLinkSlug(slug: $slug)
          }
        `,
        variables: { slug },
        fetchPolicy: "no-cache",
      });
      return data.isValidPublicPetitionLinkSlug;
    },
    300,
    []
  );

  const isValidSlug = async (value: string) => {
    try {
      return await debouncedIsValidSlug(value);
    } catch (e) {
      // "DEBOUNCED" error means the search was cancelled because user kept typing
      if (e === "DEBOUNCED") {
        return "DEBOUNCED";
      } else if (isApolloError(e)) {
        return e.graphQLErrors[0]?.extensions?.code as string;
      } else {
        throw e;
      }
    }
  };

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: isDirty
          ? handleSubmit((data) => props.onResolve(data))
          : (evnt) => {
              evnt.preventDefault();
              props.onReject();
            },
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
          {publicLink && dirtyFields.slug === true ? (
            <Alert status="warning" rounded="md">
              <AlertIcon color="yellow.500" />
              <Stack>
                <Text>
                  <FormattedMessage
                    id="component.settings-public-link-dialog.link-edited-alert"
                    defaultMessage="The link has been edited, if you save, you will no longer be able to access the request through the old link:"
                  />
                </Text>
                <Text as="b">
                  {`${process.env.NEXT_PUBLIC_PARALLEL_URL}/${locale}/pp/${publicLink?.slug}`}
                </Text>
              </Stack>
            </Alert>
          ) : null}

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
          <FormControl isInvalid={errors.slug?.message !== "DEBOUNCED" && !!errors.slug}>
            <FormLabel>
              <FormattedMessage
                id="component.settings-public-link-dialog.link-label"
                defaultMessage="Link:"
              />
            </FormLabel>
            <InputGroup>
              <InputLeftAddon>{`${process.env.NEXT_PUBLIC_PARALLEL_URL}/${locale}/pp/`}</InputLeftAddon>
              <Input
                type="text"
                {...register("slug", {
                  required: true,
                  validate: { isValidSlug },
                })}
                disabled={getSlugLoading}
              />
              {!publicLink || dirtyFields.slug === true ? (
                <InputRightElement>
                  {getSlugLoading || errors.slug?.message === "DEBOUNCED" ? (
                    <Spinner thickness="2px" speed="0.65s" emptyColor="gray.200" color="gray.500" />
                  ) : !errors.slug ? (
                    <CheckIcon color="green.500" />
                  ) : errors.slug ? (
                    <CloseIcon color="red.500" fontSize="sm" />
                  ) : null}
                </InputRightElement>
              ) : null}
            </InputGroup>
            <FormErrorMessage>
              <FormattedMessage
                id="component.settings-public-link-dialog.link-error"
                defaultMessage="The link is invalid, please choose another"
              />
            </FormErrorMessage>
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

PublicLinkSettingsDialog.queries = [
  gql`
    query PublicLinkSettingsDialog_getSlugForPublicPetitionLink($petitionName: String) {
      getSlugForPublicPetitionLink(petitionName: $petitionName)
    }
  `,
];

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

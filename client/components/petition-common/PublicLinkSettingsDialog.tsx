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
import { Maybe } from "@parallel/utils/types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import { UserSelect, useSearchUsers } from "../common/UserSelect";

interface PublicLinkSettingsData {
  title: string;
  description: string;
  ownerId: string;
  slug: string;
  petitionName: string | null;
  customHost: Maybe<string> | undefined;
  otherPermissions: UserOrUserGroupPublicLinkPermission[];
}

export function PublicLinkSettingsDialog({
  publicLink,
  ownerId,
  locale,
  petitionName,
  customHost,
  ...props
}: DialogProps<
  {
    publicLink?: PublicLinkSettingsDialog_PublicPetitionLinkFragment;
    ownerId?: string;
    locale: string;
    petitionName: string | null;
    customHost: Maybe<string> | undefined;
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
        query: PublicLinkSettingsDialog.queries.slugIsValid,
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

  const parallelUrl = customHost
    ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${customHost}`
    : process.env.NEXT_PUBLIC_PARALLEL_URL;

  return (
    <ConfirmDialog
      size="2xl"
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
        <Stack spacing={4}>
          {publicLink && dirtyFields.slug === true ? (
            <Alert status="warning" rounded="md">
              <AlertIcon color="yellow.500" />
              <Stack>
                <Text>
                  <FormattedMessage
                    id="component.settings-public-link-dialog.link-edited-alert"
                    defaultMessage="The link has been edited. If you save, you will no longer be able to access the request through the old link:"
                  />
                </Text>
                <Text as="b">{`${parallelUrl}/${locale}/pp/${publicLink?.slug}`}</Text>
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
              <Text as="span">
                <FormattedMessage
                  id="component.settings-public-link-dialog.page-title-label"
                  defaultMessage="Title of the page"
                />
              </Text>
              <Text as="span" marginLeft={0.5}>
                *
              </Text>
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
              <Text as="span">
                <FormattedMessage
                  id="component.settings-public-link-dialog.description-label"
                  defaultMessage="Description"
                />
              </Text>
              <Text as="span" marginLeft={0.5}>
                *
              </Text>
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
              <Text as="span">
                <FormattedMessage
                  id="component.settings-public-link-dialog.owner-label"
                  defaultMessage="Owner"
                />
              </Text>
              <Text as="span" marginLeft={0.5}>
                *
              </Text>
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
                defaultMessage="Editors"
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
          <FormControl
            isInvalid={errors.slug?.message !== "DEBOUNCED" && !!errors.slug && dirtyFields.slug}
            isDisabled={getSlugLoading}
          >
            <FormLabel display="flex" alignItems="center">
              <Text as="span">
                <FormattedMessage
                  id="component.settings-public-link-dialog.link-label"
                  defaultMessage="Link"
                />
              </Text>
              <Text as="span" marginLeft={0.5}>
                *
              </Text>
              <HelpPopover>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.settings-public-link-dialog.link-popover"
                    defaultMessage="Customize your public link. Add between 8 and 30 characters, only alphanumeric and hyphens are allowed."
                  />
                </Text>
              </HelpPopover>
            </FormLabel>
            <Controller
              name="slug"
              control={control}
              rules={{
                required: true,
                validate: { isValidSlug },
              }}
              render={({ field: { onChange, ...field } }) => (
                <InputGroup>
                  <InputLeftAddon>{`${parallelUrl}/${locale}/pp/`}</InputLeftAddon>
                  <Input
                    onChange={(e) => onChange(e.target.value.replace(/[^a-z0-9-]/gi, ""))}
                    {...field}
                  />
                  {!publicLink || dirtyFields.slug === true ? (
                    <InputRightElement>
                      {getSlugLoading || errors.slug?.message === "DEBOUNCED" ? (
                        <Spinner
                          thickness="2px"
                          speed="0.65s"
                          emptyColor="gray.200"
                          color="gray.500"
                        />
                      ) : !errors.slug ? (
                        <CheckIcon color="green.500" />
                      ) : errors.slug ? (
                        <CloseIcon color="red.500" fontSize="sm" />
                      ) : null}
                    </InputRightElement>
                  ) : null}
                </InputGroup>
              )}
            />
            <FormErrorMessage>
              <Stack spacing={1}>
                <Text>
                  <FormattedMessage
                    id="component.settings-public-link-dialog.link-error"
                    defaultMessage="Invalid link, please make sure it meets the requirements."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="component.settings-public-link-dialog.link-error-exemple"
                    defaultMessage="E.g: abc-ABC-123"
                  />
                </Text>
              </Stack>
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

PublicLinkSettingsDialog.queries = {
  getSlug: gql`
    query PublicLinkSettingsDialog_getSlugForPublicPetitionLink($petitionName: String) {
      getSlugForPublicPetitionLink(petitionName: $petitionName)
    }
  `,
  slugIsValid: gql`
    query PublicLinkSettingsDialog_isValidPublicPetitionLinkSlug($slug: String!) {
      isValidPublicPetitionLinkSlug(slug: $slug)
    }
  `,
};

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

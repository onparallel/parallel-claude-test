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
  PublicLinkSettingsDialog_getSlugForPublicPetitionLinkQuery,
  PublicLinkSettingsDialog_getSlugForPublicPetitionLinkQueryVariables,
  PublicLinkSettingsDialog_isValidPublicPetitionLinkSlugQuery,
  PublicLinkSettingsDialog_isValidPublicPetitionLinkSlugQueryVariables,
  PublicLinkSettingsDialog_PetitionTemplateFragment,
  PublicLinkSettingsDialog_PublicPetitionLinkFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useAsyncEffect } from "@parallel/utils/useAsyncEffect";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick } from "remeda";
import { HelpPopover } from "../common/HelpPopover";
import { UserSelect, useSearchUsers } from "../common/UserSelect";

interface PublicLinkSettingsData {
  title: string;
  description: string;
  ownerId: string;
  slug: string;
}

interface PublicLinkSettingsDialogProps {
  publicLink?: PublicLinkSettingsDialog_PublicPetitionLinkFragment;
  template: PublicLinkSettingsDialog_PetitionTemplateFragment;
}
export function PublicLinkSettingsDialog({
  publicLink,
  template,
  ...props
}: DialogProps<PublicLinkSettingsDialogProps, PublicLinkSettingsData>) {
  const apollo = useApolloClient();
  const intl = useIntl();
  const _handleSearchUsers = useSearchUsers();

  const { handleSubmit, register, control, setValue, formState } =
    useForm<PublicLinkSettingsDialog_PublicPetitionLinkFragment>({
      mode: "onChange",
      defaultValues: {
        title: publicLink?.title ?? "",
        description: publicLink?.description ?? "",
        slug: publicLink?.slug ?? "",
        owner: publicLink?.owner ?? template.owner,
      },
    });
  const { errors, dirtyFields, isValidating } = formState;

  useAsyncEffect(async (isMounted) => {
    if (!publicLink) {
      const {
        data: { getSlugForPublicPetitionLink: slug },
      } = await apollo.query<
        PublicLinkSettingsDialog_getSlugForPublicPetitionLinkQuery,
        PublicLinkSettingsDialog_getSlugForPublicPetitionLinkQueryVariables
      >({
        query: PublicLinkSettingsDialog.queries.getSlug,
        variables: { petitionName: template.name },
        fetchPolicy: "network-only",
      });
      if (isMounted()) {
        setValue("slug", slug);
      }
    }
  }, []);

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

  const { customHost } = template.organization;
  const parallelUrl = customHost
    ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${customHost}`
    : process.env.NEXT_PUBLIC_PARALLEL_URL;

  return (
    <ConfirmDialog
      size="2xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => {
          props.onResolve({
            ...pick(data, ["title", "description", "slug"]),
            ownerId: data.owner.id,
          });
        }),
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
                <Text as="b">{`${parallelUrl}/${template.locale}/pp/${publicLink?.slug}`}</Text>
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
              name="owner"
              control={control}
              rules={{ validate: { isDefined } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  value={value}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={onChange}
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
          <FormControl
            isInvalid={errors.slug && errors.slug.message !== "DEBOUNCED" && dirtyFields.slug}
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
              render={({ field: { onChange, ...props } }) => (
                <InputGroup>
                  <InputLeftAddon>{`${parallelUrl}/${template.locale}/pp/`}</InputLeftAddon>
                  <Input
                    onChange={(e) => onChange(e.target.value.replace(/[^a-z0-9-]/gi, ""))}
                    {...props}
                  />
                  <InputRightElement>
                    {publicLink?.isActive && !dirtyFields.slug ? (
                      <CheckIcon color="green.500" />
                    ) : isValidating || errors.slug?.message === "DEBOUNCED" ? (
                      <Spinner
                        thickness="2px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="gray.500"
                      />
                    ) : !errors.slug ? (
                      <CheckIcon color="green.500" />
                    ) : (
                      <CloseIcon color="red.500" fontSize="sm" />
                    )}
                  </InputRightElement>
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
  PetitionTemplate: gql`
    fragment PublicLinkSettingsDialog_PetitionTemplate on PetitionTemplate {
      name
      locale
      organization {
        customHost
      }
      owner {
        ...UserSelect_User
      }
    }
    ${UserSelect.fragments.User}
  `,
  PublicPetitionLink: gql`
    fragment PublicLinkSettingsDialog_PublicPetitionLink on PublicPetitionLink {
      isActive
      title
      description
      slug
      owner {
        ...UserSelect_User
      }
    }
    ${UserSelect.fragments.User}
  `,
};

export function usePublicLinkSettingsDialog() {
  return useDialog(PublicLinkSettingsDialog);
}

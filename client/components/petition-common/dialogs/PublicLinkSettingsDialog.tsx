import { gql, useApolloClient } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { AlertCircleIcon, CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { PlaceholderInput } from "@parallel/components/common/slate/PlaceholderInput";
import {
  PublicLinkSettingsDialog_getSlugDocument,
  PublicLinkSettingsDialog_isValidSlugDocument,
  PublicLinkSettingsDialog_PetitionTemplateFragment,
  PublicLinkSettingsDialog_PublicPetitionLinkFragment,
  PublicLinkSettingsDialog_UserFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import { untranslated } from "@parallel/utils/untranslated";
import { useAsyncEffect } from "@parallel/utils/useAsyncEffect";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useRerender } from "@parallel/utils/useReRender";
import { useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";

interface PublicLinkSettingsData {
  title: string;
  description: string;
  slug: string;
  prefillSecret: Maybe<string>;
  allowMultiplePetitions: boolean;
  petitionNamePattern: Maybe<string>;
}

interface PublicLinkSettingsDialogProps {
  publicLink?: PublicLinkSettingsDialog_PublicPetitionLinkFragment;
  template: PublicLinkSettingsDialog_PetitionTemplateFragment;
  user: PublicLinkSettingsDialog_UserFragment;
}
export function PublicLinkSettingsDialog({
  publicLink,
  template,
  user,
  ...props
}: DialogProps<PublicLinkSettingsDialogProps, PublicLinkSettingsData>) {
  const apollo = useApolloClient();
  const intl = useIntl();

  const defaultPetitionNamePattern = "{{ petition-title }}";

  const { handleSubmit, register, control, setValue, formState, watch } =
    useForm<PublicLinkSettingsDialog_PublicPetitionLinkFragment>({
      mode: "onChange",
      defaultValues: {
        title: publicLink?.title ?? "",
        description: publicLink?.description ?? "",
        slug: publicLink?.slug ?? "",
        prefillSecret: publicLink?.prefillSecret ?? "",
        allowMultiplePetitions: publicLink?.allowMultiplePetitions ?? false,
        petitionNamePattern: publicLink?.petitionNamePattern ?? defaultPetitionNamePattern,
      },
    });
  const { errors, dirtyFields, isValidating } = formState;
  const pattern = watch("petitionNamePattern");

  useAsyncEffect(async (isMounted) => {
    if (!publicLink) {
      const {
        data: { getSlugForPublicPetitionLink: slug },
      } = await apollo.query({
        query: PublicLinkSettingsDialog_getSlugDocument,
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

  const [key, rerender] = useRerender();

  const handleRestorePetitionNamePattern = () => {
    setValue("petitionNamePattern", defaultPetitionNamePattern, { shouldDirty: true });
    rerender();
  };

  const debouncedIsValidSlug = useDebouncedAsync(
    async (slug: string) => {
      const { data } = await apollo.query({
        query: PublicLinkSettingsDialog_isValidSlugDocument,
        variables: { slug },
        fetchPolicy: "no-cache",
      });
      return data.isValidPublicPetitionLinkSlug;
    },
    300,
    [],
  );

  const isValidSlug = async (value: string) => {
    if (publicLink?.slug === value) {
      return true;
    }
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

  const placeholders = useMemo(() => {
    return [
      {
        key: "petition-title",
        text: intl.formatMessage({
          id: "component.settings-public-link-dialog.placeholder-template-name",
          defaultMessage: "Template name",
        }),
      },
      {
        key: "contact-full-name",
        text: intl.formatMessage({
          id: "component.settings-public-link-dialog.placeholder-contact-full-name",
          defaultMessage: "Contact full name",
        }),
      },
      {
        key: "contact-first-name",
        text: intl.formatMessage({
          id: "component.settings-public-link-dialog.placeholder-contact-name",
          defaultMessage: "Contact name",
        }),
      },
      {
        key: "contact-last-name",
        text: intl.formatMessage({
          id: "component.settings-public-link-dialog.placeholder-contact-last-name",
          defaultMessage: "Contact last name",
        }),
      },
      {
        key: "contact-email",
        text: intl.formatMessage({
          id: "component.settings-public-link-dialog.placeholder-contact-email",
          defaultMessage: "Contact email",
        }),
      },
    ];
  }, [intl.locale]);

  const { customHost } = template.organization;
  const parallelUrl = customHost
    ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${customHost}`
    : process.env.NEXT_PUBLIC_PARALLEL_URL;

  const patternIsEmpty = pattern !== null && pattern?.trim().length === 0;

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => {
          props.onResolve({
            ...pick(data, ["title", "description", "slug", "allowMultiplePetitions"]),
            petitionNamePattern: data.petitionNamePattern ?? null,
            prefillSecret: data.prefillSecret || null,
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
                <Text as="b">{publicLink.url}</Text>
              </Stack>
            </Alert>
          ) : null}
          <Stack spacing={2}>
            <Text>
              <FormattedMessage
                id="component.settings-public-link-dialog.description"
                defaultMessage="Generates a link that allows third parties to start a parallel. These parallels will be assigned by default to the template owner."
              />
            </Text>
            <HelpCenterLink articleId={6050184}>
              <FormattedMessage
                id="component.settings-public-link-dialog.know-more"
                defaultMessage="Learn more about sharing via link"
              />
            </HelpCenterLink>
          </Stack>
          <FormControl id="title" isInvalid={!!errors.title}>
            <FormLabel>
              <Text as="span">
                <FormattedMessage
                  id="component.settings-public-link-dialog.page-title-label"
                  defaultMessage="Title of the page"
                />
              </Text>
              <Text as="span" marginStart={0.5}>
                *
              </Text>
            </FormLabel>
            <Input {...titleRegisterProps} />
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
              <Text as="span" marginStart={0.5}>
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
              <Text as="span" marginStart={0.5}>
                *
              </Text>
              <HelpPopover>
                <FormattedMessage
                  id="component.settings-public-link-dialog.link-popover"
                  defaultMessage="Customize your public link. Add between 8 and 30 characters, only alphanumeric and hyphens are allowed."
                />
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
                  <InputLeftAddon>
                    {untranslated(`${parallelUrl}/${template.locale}/pp/`)}
                  </InputLeftAddon>
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
                    id="component.settings-public-link-dialog.link-error-example"
                    defaultMessage="E.g., abc-ABC-123"
                  />
                </Text>
              </Stack>
            </FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel alignItems="center" display="flex">
              <Text as="span">
                <FormattedMessage
                  id="component.settings-public-link-dialog.petition-name-label"
                  defaultMessage="Parallel name"
                />
              </Text>
              <HelpPopover>
                <FormattedMessage
                  id="component.settings-public-link-dialog.petition-name-popover"
                  defaultMessage="Set the name of the parallels created from this link."
                />
              </HelpPopover>
            </FormLabel>
            <Controller
              name="petitionNamePattern"
              control={control}
              render={({ field: { onChange, value, ...props } }) => (
                <PlaceholderInput
                  key={key}
                  value={value ?? ""}
                  onChange={onChange}
                  placeholder={intl.formatMessage({
                    id: "component.settings-public-link-dialog.petition-name-placeholder",
                    defaultMessage: "Enter a name for the created parallels",
                  })}
                  placeholders={placeholders}
                  {...props}
                />
              )}
            />
            <HStack
              justify={patternIsEmpty ? "space-between" : "flex-end"}
              align="center"
              wrap="wrap-reverse"
              paddingTop={2}
              spacing={1}
              fontSize="sm"
              minHeight="29px"
            >
              {patternIsEmpty ? (
                <HStack>
                  <AlertCircleIcon />
                  <Text>
                    <FormattedMessage
                      id="component.settings-public-link-dialog.petition-name-alert"
                      defaultMessage="The parallels created will not have a name"
                    />
                  </Text>
                </HStack>
              ) : null}

              <Button
                variant="link"
                size="sm"
                onClick={handleRestorePetitionNamePattern}
                isDisabled={(pattern?.trim() ?? "") === defaultPetitionNamePattern}
              >
                <FormattedMessage
                  id="component.settings-public-link-dialog.petition-name-restore-defaults"
                  defaultMessage="Restore defaults"
                />
              </Button>
            </HStack>
            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="allowMultiplePetitions" alignItems="center" display="flex">
            <Checkbox {...register("allowMultiplePetitions")}>
              <Text>
                <FormattedMessage
                  id="component.settings-public-link-dialog.allow-multiple-parallels"
                  defaultMessage="Allow more than one parallel per contact"
                />
              </Text>
            </Checkbox>
            <HelpPopover>
              <FormattedMessage
                id="component.settings-public-link-dialog.allow-multiple-parallels-popover"
                defaultMessage="By default, each contact will be able to create one parallel. Check this option to allow contacts to create more than one parallel from this template."
              />
            </HelpPopover>
          </FormControl>
          {user.hasPrefillSecret ? (
            <FormControl id="prefillSecret">
              <FormLabel alignItems="center" display="flex">
                <Text as="span">
                  <FormattedMessage
                    id="component.settings-public-link-dialog.prefill-secret-label"
                    defaultMessage="Prefill secret"
                  />
                </Text>
                <HelpPopover>
                  <FormattedMessage
                    id="component.settings-public-link-dialog.prefill-secret-popover"
                    defaultMessage="JWT secret used to verify the integrity of the parameter passed to prefill the parallel. This must be set in case you use the <b>prefill</b> query parameter in your link."
                  />
                </HelpPopover>
              </FormLabel>
              <Input {...register("prefillSecret")} />
            </FormControl>
          ) : null}
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
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
    query PublicLinkSettingsDialog_getSlug($petitionName: String) {
      getSlugForPublicPetitionLink(petitionName: $petitionName)
    }
  `,
  gql`
    query PublicLinkSettingsDialog_isValidSlug($slug: String!) {
      isValidPublicPetitionLinkSlug(slug: $slug)
    }
  `,
];

PublicLinkSettingsDialog.fragments = {
  User: gql`
    fragment PublicLinkSettingsDialog_User on User {
      hasPrefillSecret: hasFeatureFlag(featureFlag: PUBLIC_PETITION_LINK_PREFILL_SECRET_UI)
    }
  `,
  PetitionTemplate: gql`
    fragment PublicLinkSettingsDialog_PetitionTemplate on PetitionTemplate {
      name
      locale
      organization {
        customHost
      }
    }
  `,
  PublicPetitionLink: gql`
    fragment PublicLinkSettingsDialog_PublicPetitionLink on PublicPetitionLink {
      id
      isActive
      title
      description
      slug
      url
      prefillSecret
      allowMultiplePetitions
      petitionNamePattern
    }
  `,
};

export function usePublicLinkSettingsDialog() {
  return useDialog(PublicLinkSettingsDialog);
}

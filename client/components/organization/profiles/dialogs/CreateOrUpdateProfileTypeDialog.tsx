import {
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  GridItem,
  SimpleGrid,
} from "@chakra-ui/react";
import { BusinessIcon, ContractIcon, FileNewIcon, UserIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { HStack, Stack, Text } from "@parallel/components/ui";
import { ProfileTypeStandardType, UserLocale } from "@parallel/graphql/__types";
import { ReactNode, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

type CreateOrUpdateProfileTypeDialogSteps = {
  SELECT_STANDARD_TYPE: {};
  CHOOSE_NAME: {
    standardType: ProfileTypeStandardType | null;
    name?: LocalizableUserText;
    pluralName?: LocalizableUserText;
    isEditing?: boolean;
  };
};

interface PreviewsType {
  key: ProfileTypeStandardType | "CUSTOM";
  icon: ReactNode;
  background: string;
  title: string;
  description: string;
}

function SelectStandardTypeDialog({
  onStep,
  ...props
}: WizardStepDialogProps<
  CreateOrUpdateProfileTypeDialogSteps,
  "SELECT_STANDARD_TYPE",
  { standardType: PreviewsType["key"] | null }
>) {
  const intl = useIntl();

  const previews = useMemo(
    () =>
      [
        {
          key: "INDIVIDUAL",
          icon: <UserIcon color="blue.800" boxSize={6} />,
          background: "blue.100",
          title: intl.formatMessage({
            id: "component.create-profile-type-dialog.individual",
            defaultMessage: "Individual",
          }),
          description: intl.formatMessage({
            id: "component.create-profile-type-dialog.individual-description",
            defaultMessage:
              "Personal information profiles for individuals, including contact details, identification, and personal data.",
          }),
        },
        {
          key: "LEGAL_ENTITY",
          icon: <BusinessIcon color="primary.800" boxSize={6} />,
          background: "primary.100",
          title: intl.formatMessage({
            id: "component.create-profile-type-dialog.legal-entity",
            defaultMessage: "Legal entity",
          }),
          description: intl.formatMessage({
            id: "component.create-profile-type-dialog.legal-entity-description",
            defaultMessage:
              "Business and organization profiles for companies, including corporate information, legal details, and business data.",
          }),
        },
        {
          key: "CONTRACT",
          icon: <ContractIcon color="green.800" boxSize={6} />,
          background: "green.100",
          title: intl.formatMessage({
            id: "component.create-profile-type-dialog.contract",
            defaultMessage: "Contract",
          }),
          description: intl.formatMessage({
            id: "component.create-profile-type-dialog.contract-description",
            defaultMessage:
              "Contract and agreement profiles for storing contract information, terms, parties, and related documentation.",
          }),
        },
        {
          key: "CUSTOM",
          icon: <FileNewIcon color="orange.800" boxSize={6} />,
          background: "orange.100",
          title: intl.formatMessage({
            id: "component.create-profile-type-dialog.custom",
            defaultMessage: "From scratch",
          }),
          description: intl.formatMessage({
            id: "component.create-profile-type-dialog.custom-description",
            defaultMessage:
              "Create a custom profile type from scratch to store any specific information structure you need.",
          }),
        },
      ] as PreviewsType[],
    [intl.locale],
  );

  const { handleSubmit, setValue, watch } = useForm<{
    standardType: ProfileTypeStandardType | "CUSTOM" | null;
  }>({
    mode: "onSubmit",
    defaultValues: {
      standardType: null,
    },
  });

  const standardType = watch("standardType");

  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            onStep("CHOOSE_NAME", {
              standardType: data.standardType === "CUSTOM" ? null : data.standardType,
            });
          }),
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.create-profile-type-dialog.title"
          defaultMessage="What do you want to create?"
        />
      }
      body={
        <Stack gap={4} flex="1">
          <Text fontSize="sm">
            <FormattedMessage
              id="component.create-profile-type-dialog.select-template"
              defaultMessage="Select the profile type that best fits your needs."
            />
          </Text>
          <Stack flex="1">
            {previews.map((preview) => {
              const { key, icon, background, title, description } = preview;
              return (
                <Button
                  key={key}
                  isActive={standardType === key}
                  variant="outline"
                  display="block"
                  onClick={() => setValue("standardType", key)}
                  padding={4}
                  height="auto"
                  textAlign="left"
                  fontWeight="normal"
                >
                  <HStack gap={4} paddingY={0.5}>
                    <Center padding={2} borderRadius="md" backgroundColor={background}>
                      {icon}
                    </Center>
                    <Stack gap={1}>
                      <Text fontWeight="bold">{title}</Text>
                      <Text fontSize="sm" color="gray.600" whiteSpace="break-spaces">
                        {description}
                      </Text>
                    </Stack>
                  </HStack>
                </Button>
              );
            })}
          </Stack>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" isDisabled={!standardType}>
          <FormattedMessage id="generic.next-button" defaultMessage="Next" />
        </Button>
      }
      {...props}
    />
  );
}

function UpdateProfileTypeDialog({
  name,
  pluralName,
  isEditing,
  standardType,
  fromStep,
  onBack,
  ...props
}: WizardStepDialogProps<
  CreateOrUpdateProfileTypeDialogSteps,
  "CHOOSE_NAME",
  {
    name: LocalizableUserText;
    pluralName: LocalizableUserText;
    standardType: ProfileTypeStandardType | null;
  }
>) {
  const intl = useIntl();
  const [selectedLocale, setSelectedLocale] = useState(intl.locale as UserLocale);
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<{
    name: LocalizableUserText;
    pluralName: LocalizableUserText;
  }>({
    defaultValues: {
      name: name ?? { [intl.locale]: "" },
      pluralName: pluralName ?? { [intl.locale]: "" },
    },
  });
  const focusRef = useRef<HTMLInputElement>(null);

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      initialFocusRef={focusRef}
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ name, pluralName }) => {
            props.onResolve({ name, pluralName, standardType });
          }),
        },
      }}
      header={
        isNonNullish(name) && isEditing ? (
          <FormattedMessage
            id="component.create-profile-type-dialog.edit-profile-type-name"
            defaultMessage="Edit profile type name"
          />
        ) : (
          <FormattedMessage
            id="component.create-profile-type-dialog.new-profile-type"
            defaultMessage="New profile type"
          />
        )
      }
      body={
        <SimpleGrid gap={4} columns={{ base: 1, sm: 2 }}>
          <FormControl as={GridItem} isInvalid={!!errors.name}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-type-dialog.singular-name"
                defaultMessage="Singular name"
              />
            </FormLabel>
            <Controller
              name="name"
              control={control}
              rules={{
                required: true,
                validate: {
                  isNotEmpty: (name) =>
                    Object.values(name).some((value) => value!.trim().length > 0),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <LocalizableUserTextInput
                  value={value}
                  onChange={onChange}
                  inputRef={focusRef}
                  locale={selectedLocale}
                  onChangeLocale={(locale) => setSelectedLocale(locale)}
                />
              )}
            />

            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
            <FormHelperText>
              <FormattedMessage
                id="generic.for-example"
                defaultMessage="E.g. {example}"
                values={{
                  example:
                    !standardType || standardType === "INDIVIDUAL" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.singular-name-individual-helper"
                        defaultMessage="Individual"
                      />
                    ) : standardType === "LEGAL_ENTITY" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.singular-name-legal-entity-helper"
                        defaultMessage="Legal entity"
                      />
                    ) : standardType === "CONTRACT" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.singular-name-contract-helper"
                        defaultMessage="Contract"
                      />
                    ) : null,
                }}
              />
            </FormHelperText>
          </FormControl>
          <FormControl as={GridItem} isInvalid={!!errors.pluralName}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-type-dialog.plural-name"
                defaultMessage="Plural name"
              />
            </FormLabel>
            <Controller
              name="pluralName"
              control={control}
              rules={{
                required: true,
                validate: {
                  isNotEmpty: (name) =>
                    Object.values(name).some((value) => value!.trim().length > 0),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <LocalizableUserTextInput
                  value={value}
                  onChange={onChange}
                  locale={selectedLocale}
                  onChangeLocale={(locale) => setSelectedLocale(locale)}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
            <FormHelperText>
              <FormattedMessage
                id="generic.for-example"
                defaultMessage="E.g. {example}"
                values={{
                  example:
                    !standardType || standardType === "INDIVIDUAL" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.plural-name-helper"
                        defaultMessage="Individuals"
                      />
                    ) : standardType === "LEGAL_ENTITY" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.plural-name-legal-entity-helper"
                        defaultMessage="Legal entities"
                      />
                    ) : standardType === "CONTRACT" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.plural-name-contract-helper"
                        defaultMessage="Contracts"
                      />
                    ) : null,
                }}
              />
            </FormHelperText>
          </FormControl>
        </SimpleGrid>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      cancel={
        !fromStep ? (
          <></>
        ) : (
          <Button onClick={() => onBack()}>
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          </Button>
        )
      }
    />
  );
}

export function useCreateProfileTypeDialog() {
  return useWizardDialog(
    {
      SELECT_STANDARD_TYPE: SelectStandardTypeDialog,
      CHOOSE_NAME: UpdateProfileTypeDialog,
    },
    "SELECT_STANDARD_TYPE",
  );
}

export function useUpdateProfileTypeDialog() {
  return useWizardDialog({ CHOOSE_NAME: UpdateProfileTypeDialog }, "CHOOSE_NAME");
}

import {
  Center,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  GridItem,
  RadioProps,
  SimpleGrid,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import {
  BusinessIcon,
  ClipboardIcon,
  ContractIcon,
  FileNewIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { Button, HStack, Stack, Text } from "@parallel/components/ui";
import { ProfileTypeStandardType, UserLocale } from "@parallel/graphql/__types";
import { useSetFocusRef } from "@parallel/utils/react-form-hook/useSetFocusRef";
import { ReactNode, Ref, RefAttributes, useMemo, useRef, useState } from "react";
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
  const {
    handleSubmit,
    control,
    formState: { errors },
    setFocus,
  } = useForm<{
    standardType: ProfileTypeStandardType | "CUSTOM";
  }>({
    mode: "onSubmit",
    defaultValues: {
      standardType: "CUSTOM",
    },
  });

  return (
    <ConfirmDialog
      size="2xl"
      initialFocusRef={useSetFocusRef(setFocus, "standardType")}
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
        <FormControl as={Stack} gap={4} flex="1" isInvalid={!!errors.standardType}>
          <FormLabel fontWeight={400}>
            <FormattedMessage
              id="component.create-profile-type-dialog.select-template"
              defaultMessage="Select the profile type that best fits your needs."
            />
          </FormLabel>
          <Controller
            name="standardType"
            control={control}
            rules={{
              required: true,
            }}
            render={({ field }) => <ProfileTypeRadioGroup {...field} />}
          />
        </FormControl>
      }
      confirm={
        <Button type="submit" colorPalette="primary">
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
                    ) : standardType === "MATTER" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.singular-name-matter-helper"
                        defaultMessage="Matter"
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
                    ) : standardType === "MATTER" ? (
                      <FormattedMessage
                        id="component.create-profile-type-dialog.plural-name-matter-helper"
                        defaultMessage="Matters"
                      />
                    ) : null,
                }}
              />
            </FormHelperText>
          </FormControl>
        </SimpleGrid>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
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

interface ProfileTypeRadioProps {
  value?: ProfileTypeStandardType | "CUSTOM";
  onChange: (value: ProfileTypeStandardType | "CUSTOM") => void;
}

function ProfileTypeRadioGroup({
  value,
  onChange,
  ref,
}: ProfileTypeRadioProps & RefAttributes<HTMLInputElement>) {
  const intl = useIntl();
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "standardType",
    value,
    defaultValue: "CUSTOM",
    onChange,
    isFocusable: true,
  });

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
          key: "MATTER",
          icon: <ClipboardIcon color="red.800" boxSize={6} />,
          background: "red.100",
          title: intl.formatMessage({
            id: "component.create-profile-type-dialog.matter",
            defaultMessage: "Matter",
          }),
          description: intl.formatMessage({
            id: "component.create-profile-type-dialog.matter-description",
            defaultMessage:
              "Matter and case profiles for storing matter information, details, and related documentation.",
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

  return (
    <Stack {...getRootProps()}>
      {previews.map(({ key, icon, background, title, description }) => (
        <ProfileTypeRadioButton
          key={key}
          inputRef={key === value ? ref : undefined}
          {...(getRadioProps({ value: key }) as RadioProps)}
        >
          <Center padding={2} borderRadius="md" backgroundColor={background}>
            {icon}
          </Center>
          <Stack gap={0}>
            <Text fontWeight="bold">{title}</Text>
            <Text fontSize="sm" whiteSpace="break-spaces" fontWeight="normal">
              {description}
            </Text>
          </Stack>
        </ProfileTypeRadioButton>
      ))}
    </Stack>
  );
}

interface ProfileTypeRadioButtonProps extends RadioProps {
  inputRef?: Ref<HTMLInputElement>;
}

function ProfileTypeRadioButton({ inputRef, ...props }: ProfileTypeRadioButtonProps) {
  const { getInputProps, getRadioProps } = useRadio(props);

  return (
    <Button
      as="label"
      variant="unstyled"
      display="flex"
      maxHeight="auto"
      height="auto"
      cursor="pointer"
      gridArea={props.value}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      fontWeight={500}
      _checked={{
        borderColor: "primary.500",
        backgroundColor: "primary.50",
      }}
      _hover={{
        backgroundColor: "primary.50",
      }}
      flex="1"
      padding={4}
      paddingY={3}
      {...getRadioProps()}
    >
      <input {...getInputProps()} ref={inputRef} />
      <HStack gap={4} paddingY={0.5}>
        {props.children}
      </HStack>
    </Button>
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

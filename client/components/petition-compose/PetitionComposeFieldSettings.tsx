import {
  BoxProps,
  Flex,
  Heading,
  Icon,
  IconButton,
  Image,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  PetitionComposeFieldSettings_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitions";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { gql } from "apollo-boost";
import { ChangeEvent, ReactNode, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { SmallPopover } from "../common/SmallPopover";

export type PetitionComposeFieldSettingsProps = BoxProps & {
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  onClose: () => void;
};

export function PetitionComposeFieldSettings({
  field,
  onFieldEdit,
  onClose,
  ...props
}: PetitionComposeFieldSettingsProps) {
  const intl = useIntl();

  return (
    <Card
      borderRight="2px solid"
      borderRightColor="gray.200"
      backgroundColor="white"
      padding={4}
      {...props}
    >
      <Stack direction="row" alignItems="center" marginBottom={2}>
        <Heading size="sm">
          <FormattedMessage
            id="petition.field-settings"
            defaultMessage="Field settings"
          />
        </Heading>
        <Spacer />
        <IconButton
          variant="ghost"
          size="sm"
          icon="close"
          aria-label={intl.formatMessage({
            id: "petition.close-sidebar-button",
            defaultMessage: "Close",
          })}
          onClick={onClose}
        />
      </Stack>
      <Divider />
      <Flex flexDirection="column">
        <SettingsRow
          label={
            <FormattedMessage
              id="field-settings.required-label"
              defaultMessage="Required"
            />
          }
          description={
            <Text fontSize="sm">
              <FormattedMessage
                id="field-settings.required-description"
                defaultMessage="If you mark this field as required, the recipients won't be able to finish the petition until they reply to this field."
              />
            </Text>
          }
          controlId="field-required"
        >
          <Switch
            height="20px"
            display="block"
            id="field-required"
            color="green"
            isChecked={!field.optional}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFieldEdit(field.id, { optional: !event.target.checked })
            }
          />
        </SettingsRow>
        <Divider />
        <SettingsRow
          label={
            field.type === "FILE_UPLOAD" ? (
              <FormattedMessage
                id="field-settings.file-multiple-label"
                defaultMessage="Allow multiple file uploads"
              />
            ) : (
              <FormattedMessage
                id="field-settings.multiple-label"
                defaultMessage="Allow multiple replies"
              />
            )
          }
          description={
            <Text fontSize="sm">
              {field.type === "FILE_UPLOAD" ? (
                <FormattedMessage
                  id="field-settings.file-multiple-description"
                  defaultMessage="Enabling this allows the recipient to upload multiple files to this field."
                />
              ) : (
                <FormattedMessage
                  id="field-settings.multiple-description"
                  defaultMessage="Enabling this allows the recipient to submit multiple answers to this field."
                />
              )}
            </Text>
          }
          controlId="field-multiple"
        >
          <Switch
            height="20px"
            display="block"
            id="field-multiple"
            color="green"
            isChecked={field.multiple}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFieldEdit(field.id, { multiple: event.target.checked })
            }
          />
        </SettingsRow>
        <Divider />
        {field.type === "FILE_UPLOAD" ? (
          <FileUploadSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "TEXT" ? (
          <TextSettings field={field} onFieldEdit={onFieldEdit} />
        ) : null}
      </Flex>
    </Card>
  );
}

function FileUploadSettings({
  field,
  onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
  // const options: FieldOptions["FILE_UPLOAD"] = field.options as any;
  return <></>;
}

function TextSettings({
  field,
  onFieldEdit: onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
  const options: FieldOptions["TEXT"] = field.options as any;
  const [placeholder, setPlaceholder] = useState(options.placeholder ?? "");
  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 300, [field.id]);
  const handlePlaceholderChange = function (
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value;
    setPlaceholder(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        placeholder: value || null,
      },
    });
  };

  return (
    <Flex flexDirection="column">
      <SettingsRow
        label={
          <FormattedMessage
            id="field-settings.text-multiline-label"
            defaultMessage="Multi-line"
          />
        }
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="field-settings.text-multiline-description"
              defaultMessage="Enabling this will display a multi-line input field instead of a single line."
            />
          </Text>
        }
        controlId="text-multiline"
      >
        <Switch
          height="20px"
          display="block"
          id="text-multiline"
          color="green"
          isChecked={options.multiline}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onFieldEdit(field.id, {
              options: { ...field.options, multiline: event.target.checked },
            })
          }
        />
      </SettingsRow>
      <Divider />
      <SettingsRow
        label={
          <FormattedMessage
            id="field-settings.text-placeholder-label"
            defaultMessage="Placeholder"
          />
        }
        description={
          <>
            <Text fontSize="sm">
              <FormattedMessage
                id="field-settings.text-placeholder-description"
                defaultMessage="The placeholder is the subtle descriptive text that shows when the input field is empty."
              />
            </Text>
            <Image
              height="55px"
              marginTop={2}
              src="/static/images/placeholder.gif"
              role="presentation"
            />
          </>
        }
        controlId="text-placeholder"
        paddingY={2}
      >
        <Input
          id="text-placeholder"
          value={placeholder}
          marginLeft={2}
          onChange={handlePlaceholderChange}
        />
      </SettingsRow>
      <Divider />
    </Flex>
  );
}

function SettingsRow({
  label,
  controlId,
  description,
  children,
  ...props
}: BoxProps & {
  label: ReactNode;
  controlId: string;
  children: ReactNode;
  description: ReactNode;
}) {
  return (
    <SmallPopover content={description} placement="left">
      <Flex
        as="label"
        alignItems="center"
        paddingY={4}
        {...{ htmlFor: controlId }}
        {...props}
      >
        <Text as="div">{label}</Text>
        <Icon marginLeft={2} name="question" color="gray.200" />
        <Spacer minWidth={4} />
        <Flex alignSelf="center">{children}</Flex>
      </Flex>
    </SmallPopover>
  );
}

PetitionComposeFieldSettings.fragments = {
  PetitionField: gql`
    fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
      id
      type
      optional
      multiple
      options
    }
  `,
};

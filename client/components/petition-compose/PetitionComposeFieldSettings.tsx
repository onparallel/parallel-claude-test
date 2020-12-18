import { gql } from "@apollo/client";
import {
  Box,
  FormControl,
  FormControlProps,
  FormLabel,
  Image,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  PetitionComposeFieldSettings_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, ReactNode, useState } from "react";
import { FormattedMessage } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import { PetitionFieldTypeSelect } from "./PetitionFieldTypeSelectDropdown";

export type PetitionComposeFieldSettingsProps = {
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  onFieldTypeChange: (fieldId: string, type: PetitionFieldType) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  onIsDescriptionShownChange: (fieldId: string) => void;
  onClose: () => void;
};

export function PetitionComposeFieldSettings({
  field,
  onFieldEdit,
  onFieldTypeChange,
  onIsDescriptionShownChange,
  onClose,
}: PetitionComposeFieldSettingsProps) {
  return (
    <Card>
      <CardHeader isCloseable onClose={onClose}>
        <FormattedMessage
          id="petition.field-settings"
          defaultMessage="Field settings"
        />
      </CardHeader>
      <Stack spacing={4} padding={4} direction="column">
        {!field.isFixed && (
          <Box>
            <PetitionFieldTypeSelect
              type={field.type}
              onChange={(type) => onFieldTypeChange(field.id, type)}
            />
          </Box>
        )}
        {!field.isReadOnly && (
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
              onChange={(event) =>
                onFieldEdit(field.id, { optional: !event.target.checked })
              }
            />
          </SettingsRow>
        )}

        <SettingsRow
          label={
            <FormattedMessage
              id="field-settings.show-description-label"
              defaultMessage="Show description"
            />
          }
          description={
            <Text fontSize="sm">
              <FormattedMessage
                id="field-settings.show-description-description"
                defaultMessage="Enabling this allows you to write a description for the field."
              />
            </Text>
          }
          controlId="field-show-description"
        >
          <Switch
            height="20px"
            display="block"
            id="field-show-description"
            color="green"
            isChecked={field.isDescriptionShown}
            onChange={() => onIsDescriptionShownChange(field.id)}
          />
        </SettingsRow>

        {!field.isReadOnly && (
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
              onChange={(event) =>
                onFieldEdit(field.id, { multiple: event.target.checked })
              }
            />
          </SettingsRow>
        )}
        {field.type === "HEADING" ? (
          <HeadingSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "FILE_UPLOAD" ? (
          <FileUploadSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "TEXT" ? (
          <TextSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "SELECT" ? (
          <SelectOptionSettings field={field} onFieldEdit={onFieldEdit} />
        ) : null}
      </Stack>
    </Card>
  );
}

function HeadingSettings({
  field,
  onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
  const options = field.options as FieldOptions["HEADING"];
  return (
    // dont show switch for field is the first on the list
    field.position > 0 ? (
      <SettingsRow
        label={
          <FormattedMessage
            id="field-settings.heading-page-break-label"
            defaultMessage="Start new page"
          />
        }
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="field-settings.heading-page-break-description"
              defaultMessage="Enabling this will create a new page and use this as the heading of the new page"
            />
          </Text>
        }
        controlId="heading-page-break"
      >
        <Switch
          height="20px"
          display="block"
          id="heading-page-break"
          color="green"
          isChecked={options.hasPageBreak}
          onChange={(event) =>
            onFieldEdit(field.id, {
              options: { ...field.options, hasPageBreak: event.target.checked },
            })
          }
        />
      </SettingsRow>
    ) : null
  );
}

function FileUploadSettings({
  field,
  onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
  // const options = field.options as FieldOptions["FILE_UPLOAD"];
  return <></>;
}

function TextSettings({
  field,
  onFieldEdit: onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
  const options = field.options as FieldOptions["TEXT"];
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
    <Stack spacing={4}>
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
          onChange={(event) =>
            onFieldEdit(field.id, {
              options: { ...field.options, multiline: event.target.checked },
            })
          }
        />
      </SettingsRow>
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
      />
    </Stack>
  );
}

function SelectOptionSettings({
  field,
  onFieldEdit: onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
  const options = field.options as FieldOptions["SELECT"];
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
    <Stack spacing={4}>
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
      />
    </Stack>
  );
}

interface SettingsRowProps extends Omit<FormControlProps, "label"> {
  label: ReactNode;
  controlId: string;
  children: ReactNode;
  description: ReactNode;
}

function SettingsRow({
  label,
  controlId,
  description,
  children,
  ...props
}: SettingsRowProps) {
  return (
    <FormControl display="flex" alignItems="center" id={controlId} {...props}>
      <FormLabel
        display="flex"
        alignItems="center"
        fontWeight="normal"
        margin={0}
      >
        {label}
        <HelpPopover marginLeft={2}>{description}</HelpPopover>
      </FormLabel>
      <Spacer minWidth={4} />
      {children}
    </FormControl>
  );
}

type SettingsRowPlaceholderProps = {
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};
function SettingsRowPlaceholder({
  placeholder,
  onChange,
}: SettingsRowPlaceholderProps) {
  return (
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
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/placeholder.gif`}
            role="presentation"
          />
        </>
      }
      controlId="text-placeholder"
    >
      <Input
        id="text-placeholder"
        value={placeholder}
        marginLeft={2}
        size="sm"
        onChange={onChange}
      />
    </SettingsRow>
  );
}

PetitionComposeFieldSettings.fragments = {
  PetitionField: gql`
    fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
      id
      type
      isDescriptionShown @client
      optional
      multiple
      options
      isReadOnly
      isFixed
      position
    }
  `,
};

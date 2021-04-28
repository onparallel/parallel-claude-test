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
import { SmallPopover } from "../common/SmallPopover";
import { DynamicSelectSettings } from "./PetitionComposeDynamicSelectFieldSettings";
import { PetitionFieldTypeSelect } from "./PetitionFieldTypeSelectDropdown";

export type PetitionComposeFieldSettingsProps = {
  petitionId: string;
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  onFieldTypeChange: (fieldId: string, type: PetitionFieldType) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  onClose: () => void;
};

export function PetitionComposeFieldSettings({
  petitionId,
  field,
  onFieldEdit,
  onFieldTypeChange,
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
              onChange={(type) => {
                if (type !== field.type) {
                  onFieldTypeChange(field.id, type);
                }
              }}
            />
          </Box>
        )}

        {!field.isReadOnly && (
          <SettingsRow
            label={
              field.type === "FILE_UPLOAD" ? (
                <FormattedMessage
                  id="field-settings.file-multiple-label"
                  defaultMessage="Allow uploading more than one file"
                />
              ) : (
                <FormattedMessage
                  id="field-settings.multiple-label"
                  defaultMessage="Allow more than one reply"
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
        ) : field.type === "TEXT" || field.type === "SHORT_TEXT" ? (
          <TextSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "SELECT" ? (
          <SelectOptionSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "DYNAMIC_SELECT" ? (
          <DynamicSelectSettings
            petitionId={petitionId}
            field={field}
            onFieldEdit={onFieldEdit}
          />
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
        <SmallPopover
          isDisabled={!field.visibility}
          content={
            <Text fontSize="sm">
              <FormattedMessage
                id="field-settings.heading-page-break-visibility"
                defaultMessage="Can't add page breaks on headings with visibility conditions"
              />
            </Text>
          }
        >
          <Box>
            <Switch
              isDisabled={field.visibility !== null}
              height="20px"
              display="block"
              id="heading-page-break"
              color="green"
              isChecked={options.hasPageBreak}
              onChange={(event) =>
                onFieldEdit(field.id, {
                  options: {
                    ...field.options,
                    hasPageBreak: event.target.checked,
                  },
                })
              }
            />
          </Box>
        </SmallPopover>
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
  onFieldEdit,
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
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
      />
    </Stack>
  );
}

function SelectOptionSettings({
  field,
  onFieldEdit,
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

export function SettingsRow({
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
      optional
      multiple
      options
      isReadOnly
      isFixed
      position
      visibility
    }
  `,
};

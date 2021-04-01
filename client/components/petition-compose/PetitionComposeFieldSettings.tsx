import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  FormControl,
  FormControlProps,
  FormLabel,
  Image,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  PetitionComposeFieldSettings_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { importFromExcel } from "@parallel/utils/data-import/importFromExcel";
import { useDynamicSelectValues } from "@parallel/utils/data-import/useDynamicSelectValues";
import {
  DynamicSelectOption,
  FieldOptions,
} from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, ReactNode, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { FormattedMessage } from "react-intl";
import { useErrorDialog } from "../common/ErrorDialog";
import { FileSize } from "../common/FileSize";
import { HelpPopover } from "../common/HelpPopover";
import { Link } from "../common/Link";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeSelect } from "./PetitionFieldTypeSelectDropdown";

export type PetitionComposeFieldSettingsProps = {
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  onFieldTypeChange: (fieldId: string, type: PetitionFieldType) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  onClose: () => void;
};

export function PetitionComposeFieldSettings({
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
        ) : field.type === "TEXT" ? (
          <TextSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "SELECT" ? (
          <SelectOptionSettings field={field} onFieldEdit={onFieldEdit} />
        ) : field.type === "DYNAMIC_SELECT" ? (
          <DynamicSelectSettings field={field} onFieldEdit={onFieldEdit} />
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

function DynamicSelectSettings({
  field,
  onFieldEdit,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit">) {
  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];

  function handleOptionsChange(options: FieldOptions["DYNAMIC_SELECT"]) {
    onFieldEdit(field.id, { options });
  }

  function removeOptions() {
    onFieldEdit(field.id, { options: { labels: [], values: [] } });
  }

  return (
    <Stack spacing={4}>
      <SettingsRow
        flexDirection="column"
        alignItems="start"
        label={
          <Text as="strong">
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.label"
              defaultMessage="Import options from Excel"
            />
          </Text>
        }
        description={
          <FormattedMessage
            id="field-settings.dynamic-select.import-from-excel.description"
            defaultMessage="Import listings to create related dropdowns. You can use the loading model as a guide."
          />
        }
        controlId="dynamic-select-options"
      >
        <Stack width="100%">
          {fieldOptions.labels.length > 0 ? (
            <>
              {fieldOptions.labels}
              <Button onClick={removeOptions}>DELETE</Button>
            </>
          ) : (
            <DynamicSelectOptionsDropzone
              onOptionsChange={handleOptionsChange}
            />
          )}

          <Text>
            <FormattedMessage id="generic.download" defaultMessage="Download" />
            &nbsp;
            <Link href="">
              <Text as="strong">
                <FormattedMessage
                  id="field-settings.dynamic-select.import-from-excel.download-model"
                  defaultMessage="option loading model"
                />
                <DownloadIcon marginLeft={2} />
              </Text>
            </Link>
          </Text>
        </Stack>
      </SettingsRow>
    </Stack>
  );
}

function DynamicSelectOptionsDropzone({
  onOptionsChange,
}: {
  onOptionsChange: (options: FieldOptions["DYNAMIC_SELECT"]) => void;
}) {
  const MAX_FILESIZE = 1024 * 1024 * 10;

  const [fileDropError, setFileDropError] = useState<string | null>(null);
  const { labels, values, parseValues } = useDynamicSelectValues();

  useEffect(() => {
    if (labels && values) {
      onOptionsChange({ labels, values });
    }
  }, [labels, values]);

  const showErrorDialog = useErrorDialog();
  async function handleFileDrop(accepted: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      try {
        parseValues(await importFromExcel(accepted[0]));
      } catch (e) {
        await showErrorDialog({
          header: (
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.error-dialog-header"
              defaultMessage="Import error"
            />
          ),
          message: (
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.error-dialog-body"
              defaultMessage="Please, review your file and make sure there are no empty cells between the listings."
            />
          ),
        });
      }
    }
  }
  const { getRootProps, getInputProps } = useDropzone({
    accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxSize: MAX_FILESIZE,
    multiple: false,
    onDrop: handleFileDrop,
  });

  return (
    <>
      <Text fontSize="14px" color="gray.600" marginTop={1}>
        <FormattedMessage
          id="field-settings.dynamic-select.import-from-excel.attach-xlsx"
          defaultMessage="Attach an .xlsx file like the one in the model."
        />
      </Text>
      <Center
        height="100px"
        borderWidth={2}
        borderStyle="dashed"
        borderColor="gray.300"
        borderRadius="md"
        padding={4}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <Text pointerEvents="none" fontSize="14px" color="gray.500">
          <FormattedMessage
            id="generic.dropzone-single.default"
            defaultMessage="Drag the file here, or click to select it"
          />
        </Text>
      </Center>
      {fileDropError ? (
        <Text color="red.500" fontSize="14px">
          {fileDropError === "file-too-large" ? (
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.error-file-too-large"
              defaultMessage="The file is too large. Maximum size allowed {size}"
              values={{ size: <FileSize value={MAX_FILESIZE} /> }}
            />
          ) : fileDropError === "file-invalid-type" ? (
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.error-file-invalid-type"
              defaultMessage="File type not allowed. Please, attach an .xlsx file"
            />
          ) : null}
        </Text>
      ) : null}
    </>
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

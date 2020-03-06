import {
  Box,
  BoxProps,
  Flex,
  Heading,
  IconButton,
  Stack,
  Switch,
  Text
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  PetitionComposeFieldSettings_PetitionFieldFragment,
  UpdatePetitionFieldInput
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitions";
import { gql } from "apollo-boost";
import { ChangeEvent, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";

export type PetitionComposeFieldSettingsProps = BoxProps & {
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  onUpdate: (data: UpdatePetitionFieldInput) => void;
  onClose: () => void;
};

export function PetitionComposeFieldSettings({
  field,
  onUpdate,
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
      <Stack spacing={4}>
        <Stack direction="row" alignItems="center">
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
              defaultMessage: "Close"
            })}
            onClick={onClose}
          />
        </Stack>
        <Divider />
        <SettingsRow
          label={
            <FormattedMessage
              id="field-settings.required-label"
              defaultMessage="Required"
            />
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
              onUpdate({ optional: !event.target.checked })
            }
          />
        </SettingsRow>
        <Divider />
        {field.type === "FILE_UPLOAD" ? (
          <FileUploadSettings field={field} onUpdate={onUpdate} />
        ) : field.type === "TEXT" ? (
          <TextSettings field={field} onUpdate={onUpdate} />
        ) : null}
      </Stack>
    </Card>
  );
}

function FileUploadSettings({
  field,
  onUpdate
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onUpdate">) {
  const options: FieldOptions["FILE_UPLOAD"] = field.options as any;
  return (
    <Stack spacing={4}>
      <SettingsRow
        label={
          <FormattedMessage
            id="field-settings.file-multiple-label"
            defaultMessage="Allow multiple file uploads"
          />
        }
        controlId="field-file-multiple"
      >
        <Switch
          height="20px"
          display="block"
          id="field-file-multiple"
          color="green"
          isChecked={options.multiple}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onUpdate({
              options: { ...field.options, multiple: event.target.checked }
            })
          }
        />
      </SettingsRow>
      <Divider />
    </Stack>
  );
}

function TextSettings({
  field,
  onUpdate
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onUpdate">) {
  const options: FieldOptions["TEXT"] = field.options as any;

  return (
    <Stack spacing={4}>
      <SettingsRow
        label={
          <FormattedMessage
            id="field-settings.text-multiline-label"
            defaultMessage="Multiline"
          />
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
            onUpdate({
              options: { ...field.options, multiline: event.target.checked }
            })
          }
        />
      </SettingsRow>
      <Divider />
    </Stack>
  );
}

function SettingsRow({
  label,
  controlId,
  children,
  ...props
}: BoxProps & {
  label: ReactNode;
  controlId: string;
  children: ReactNode;
}) {
  return (
    <Flex {...props}>
      <Box flex="1" as="label" cursor="pointer" {...{ htmlFor: controlId }}>
        <Text as="div">{label}</Text>
      </Box>
      <Flex alignSelf="center">{children}</Flex>
    </Flex>
  );
}

PetitionComposeFieldSettings.fragments = {
  petitionField: gql`
    fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
      id
      type
      optional
      options
    }
  `
};

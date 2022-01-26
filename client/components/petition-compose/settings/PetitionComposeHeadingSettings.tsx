import { Box, Switch, Text } from "@chakra-ui/react";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { FormattedMessage } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRow } from "./SettingsRow";

export function HeadingSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["HEADING"];
  const isDisabled = field.visibility !== null || isReadOnly || field.isFixed;
  return (
    <SettingsRow
      isDisabled={isDisabled}
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
            isDisabled={isDisabled}
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
  );
}

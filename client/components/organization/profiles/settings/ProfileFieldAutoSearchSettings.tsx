import { FormControl, FormLabel } from "@chakra-ui/react";
import { DeleteIcon, SettingsIcon } from "@parallel/chakra/icons";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Button, HStack } from "@parallel/components/ui";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { useConfigureProfileBackgroundCheckAutomateSearchDialog } from "../dialogs/ConfigureProfileBackgroundCheckAutomateSearchDialog";
import { CreateOrUpdateProfileTypeFieldDialogFormData } from "../dialogs/CreateOrUpdateProfileTypeFieldDialog";

export function ProfileFieldAutoSearchSettings({ profileTypeId }: { profileTypeId: string }) {
  const intl = useIntl();

  const { control } = useFormContext<CreateOrUpdateProfileTypeFieldDialogFormData>();

  const showConfigureProfileBackgroundCheckAutomateSearchDialog =
    useConfigureProfileBackgroundCheckAutomateSearchDialog();

  return (
    <Controller
      name="options.autoSearchConfig"
      control={control}
      render={({ field: { value, ...field } }) => {
        const onAdd = async () => {
          try {
            const res = await showConfigureProfileBackgroundCheckAutomateSearchDialog({
              profileTypeId,
              autoSearchConfig: value,
            });
            if (res) {
              field.onChange(res);
            }
          } catch (e) {
            if (isDialogError(e) && e.reason === "DELETE_AUTO_SEARCH_CONFIG") {
              field.onChange(null);
            }
          }
        };

        return (
          <FormControl display="flex" justifyContent="space-between">
            <FormLabel fontWeight={500} margin={0} display="flex" alignItems="center">
              <FormattedMessage
                id="component.create-or-update-property-dialog.automate-search"
                defaultMessage="Automate search"
              />
              <HelpPopover>
                <FormattedMessage
                  id="component.create-or-update-property-dialog.automate-search-help"
                  defaultMessage="Add this option to automate <b>the first search</b> using values from the profile."
                />
              </HelpPopover>
            </FormLabel>
            {isNonNullish(value) ? (
              <HStack>
                <IconButtonWithTooltip
                  icon={<SettingsIcon />}
                  label={intl.formatMessage({
                    id: "generic.edit-settings",
                    defaultMessage: "Edit settings",
                  })}
                  placement="bottom"
                  size="sm"
                  onClick={() => onAdd?.()}
                />
                <IconButtonWithTooltip
                  icon={<DeleteIcon />}
                  label={intl.formatMessage({
                    id: "component.settings-row-button.remove-setting",
                    defaultMessage: "Remove setting",
                  })}
                  placement="bottom-start"
                  size="sm"
                  variant="outline"
                  onClick={() => field.onChange(null)}
                />
              </HStack>
            ) : (
              <Button size="sm" fontWeight="normal" fontSize="16px" onClick={() => onAdd?.()}>
                <FormattedMessage id="generic.add" defaultMessage="Add" />
              </Button>
            )}
          </FormControl>
        );
      }}
    />
  );
}

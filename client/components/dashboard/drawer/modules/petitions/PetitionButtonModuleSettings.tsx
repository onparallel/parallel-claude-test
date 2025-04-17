import { FormControl, Input } from "@chakra-ui/react";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { DashboardModuleFormLabel } from "../../components/DashboardModuleFormLabel";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";

export function PetitionButtonModuleSettings() {
  const intl = useIntl();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<DashboardModuleDrawerFormData>();
  return (
    <>
      <FormControl isInvalid={!!errors.settings?.buttonLabel}>
        <DashboardModuleFormLabel field="settings.buttonLabel">
          <FormattedMessage
            id="component.petition-button-module-settings.button-text-label"
            defaultMessage="Button text"
          />
        </DashboardModuleFormLabel>
        <Input
          {...register("settings.buttonLabel", { required: true })}
          placeholder={intl.formatMessage(
            {
              id: "generic.for-example",
              defaultMessage: "E.g. {example}",
            },
            {
              example: intl.formatMessage({
                id: "component.petition-button-module-settings.button-text-placeholder",
                defaultMessage: "New KYC",
              }),
            },
          )}
        />
      </FormControl>

      <FormControl isInvalid={!!errors.settings?.templateId}>
        <DashboardModuleFormLabel field="settings.templateId">
          <FormattedMessage id="generic.template" defaultMessage="Template" />
        </DashboardModuleFormLabel>
        <Controller
          name="settings.templateId"
          control={control}
          rules={{ required: true }}
          shouldUnregister={true}
          render={({ field: { value, onChange } }) => (
            <PetitionSelect
              defaultOptions
              type="TEMPLATE"
              value={value ?? ""}
              excludePublicTemplates
              onChange={(v) => {
                onChange(v?.id);
              }}
            />
          )}
        />
      </FormControl>
    </>
  );
}

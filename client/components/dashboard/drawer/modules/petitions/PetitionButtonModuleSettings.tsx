import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleFormLabel } from "../../components/DashboardModuleFormLabel";
import type { DashboardModuleFormData } from "../../DashboardModuleForm";

export function PetitionButtonModuleSettings({ isUpdating }: { isUpdating?: boolean }) {
  const intl = useIntl();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<DashboardModuleFormData>();
  return (
    <>
      <FormControl isInvalid={!!errors.settings?.buttonLabel}>
        <DashboardModuleFormLabel field="settings.buttonLabel" isUpdating={isUpdating}>
          <FormattedMessage
            id="component.petition-button-module-settings.button-text-label"
            defaultMessage="Button text"
          />
        </DashboardModuleFormLabel>
        <Input
          {...register("settings.buttonLabel", { required: true })}
          placeholder={intl.formatMessage(
            { id: "generic.for-example", defaultMessage: "E.g. {example}" },
            {
              example: intl.formatMessage({
                id: "component.petition-button-module-settings.button-text-placeholder",
                defaultMessage: "New KYC",
              }),
            },
          )}
        />
        <FormErrorMessage>
          <FormattedMessage
            id="generic.required-field-error"
            defaultMessage="The field is required"
          />
        </FormErrorMessage>
      </FormControl>
      <Controller
        name="settings.templateId"
        control={control}
        rules={{ required: true }}
        shouldUnregister={true}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <FormControl isInvalid={isNonNullish(error)}>
            <DashboardModuleFormLabel field="settings.templateId" isUpdating={isUpdating}>
              <FormattedMessage id="generic.template" defaultMessage="Template" />
            </DashboardModuleFormLabel>
            <PetitionSelect
              defaultOptions
              type="TEMPLATE"
              value={value ?? ""}
              excludePublicTemplates
              onChange={(v) => {
                onChange(v?.id);
              }}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.required-field-error"
                defaultMessage="The field is required"
              />
            </FormErrorMessage>
          </FormControl>
        )}
      />
    </>
  );
}

import { Button, Checkbox, FormControl, FormLabel, Stack } from "@chakra-ui/react";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { AutomaticNumberingType } from "@parallel/graphql/__types";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

interface ConfigureAutomaticNumberingDialogProps {
  numberingType?: AutomaticNumberingType;
}

interface ConfigureAutomaticNumberingDialogData {
  numberingType: AutomaticNumberingType;
  updateExistingFields?: boolean;
}

export function ConfigureAutomaticNumberingDialog({
  numberingType,
  ...props
}: DialogProps<ConfigureAutomaticNumberingDialogProps, ConfigureAutomaticNumberingDialogData>) {
  const isUpdating = isNonNullish(numberingType);

  const { handleSubmit, control, register } = useForm({
    mode: "onSubmit",
    defaultValues: {
      numberingType: numberingType ?? "NUMBERS",
      updateExistingFields: false,
    },
  });

  const options = useSimpleSelectOptions<AutomaticNumberingType>((intl) => {
    return [
      {
        value: "NUMBERS",
        label: intl.formatMessage({
          id: "component.configure-automatic-numbering-dialog.numbers",
          defaultMessage: "Numbers (1, 2, 3, 4, etc.)",
        }),
      },
      {
        value: "LETTERS",
        label: intl.formatMessage({
          id: "component.configure-automatic-numbering-dialog.letters",
          defaultMessage: "Letters (A, B, C, D, etc.)",
        }),
      },
      {
        value: "ROMAN_NUMERALS",
        label: intl.formatMessage({
          id: "component.configure-automatic-numbering-dialog.roman-numerals",
          defaultMessage: "Roman numerals (I, II, III, IV, etc.)",
        }),
      },
    ];
  }, []);

  return (
    <ConfirmDialog
      size="lg"
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => {
            props.onResolve(data);
          }),
        },
      }}
      header={
        isUpdating ? (
          <FormattedMessage
            id="component.configure-automatic-numbering-dialog.header-configure"
            defaultMessage="Configure automatic numbering"
          />
        ) : (
          <FormattedMessage
            id="component.configure-automatic-numbering-dialog.header-add"
            defaultMessage="Add automatic numbering"
          />
        )
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.configure-automatic-numbering-dialog.body"
              defaultMessage="Automatically numbers each block of text."
            />
          </Text>
          {/* <HelpCenterLink articleId={ARTICLE_ID}>
           <FormattedMessage
             id="component.configure-automatic-numbering-dialog.more-about-numbering"
             defaultMessage="More about numbering"
           />
          </HelpCenterLink> */}
          <FormControl>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.configure-automatic-numbering-dialog.type-of-numbering-label"
                defaultMessage="Type of numbering"
              />
            </FormLabel>
            <Controller
              name="numberingType"
              control={control}
              render={({ field: { onChange, value } }) => (
                <SimpleSelect options={options} onChange={onChange} value={value} />
              )}
            />
          </FormControl>
          {isUpdating ? null : (
            <FormControl>
              <Checkbox {...register("updateExistingFields")}>
                <FormattedMessage
                  id="component.configure-automatic-numbering-dialog.update-existing-fields"
                  defaultMessage="Activate in existing text blocks"
                />
              </Checkbox>
            </FormControl>
          )}
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfigureAutomaticNumberingDialog() {
  return useDialog(ConfigureAutomaticNumberingDialog);
}

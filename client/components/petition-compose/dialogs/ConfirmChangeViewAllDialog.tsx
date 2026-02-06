import { FormControl, FormLabel, Radio, RadioGroup, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

export function ConfirmChangeViewAllDialog({
  ...props
}: DialogProps<{}, "CREATE_NEW_VIEW" | "OMIT_FILTERS">) {
  const { handleSubmit, control } = useForm<{ action: "CREATE_NEW_VIEW" | "OMIT_FILTERS" }>({
    defaultValues: {
      action: "OMIT_FILTERS",
    },
  });

  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            props.onResolve(data.action);
          }),
        },
      }}
      header={
        <FormattedMessage
          id="component.confirm-change-view-all-dialog.header"
          defaultMessage='The "{name}" view cannot include filters'
          values={{
            name: <FormattedMessage id="generic.all-view" defaultMessage="All" />,
          }}
        />
      }
      body={
        <FormControl>
          <FormLabel fontWeight={400}>
            <FormattedMessage
              id="component.confirm-change-view-all-dialog.body"
              defaultMessage="What do you want to do?"
            />
          </FormLabel>
          <Controller
            name="action"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <RadioGroup value={value} onChange={onChange as any}>
                <Stack>
                  <Radio value="OMIT_FILTERS">
                    <FormattedMessage
                      id="component.confirm-change-view-all-dialog.omit-filters-option"
                      defaultMessage="Save only changes to columns in the current view."
                    />
                  </Radio>
                  <Radio value="CREATE_NEW_VIEW">
                    <FormattedMessage
                      id="component.confirm-change-view-all-dialog.keep-all-option"
                      defaultMessage="Keep everything and save it in a new view."
                    />
                  </Radio>
                </Stack>
              </RadioGroup>
            )}
          />
        </FormControl>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmChangeViewAllDialog() {
  return useDialog(ConfirmChangeViewAllDialog);
}

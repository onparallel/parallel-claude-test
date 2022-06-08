import { gql } from "@apollo/client";
import {
  Button,
  Stack,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  HStack,
  FormLabel,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { CompliancePeriodDialog_PetitionBaseFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface CompliancePeriodDialogData {
  months: Maybe<number>;
  purpose?: Maybe<string>;
}
export function CompliancePeriodDialog({
  __typename: type,
  anonymizeAfterMonths,
  anonymizePurpose,
  ...props
}: DialogProps<CompliancePeriodDialog_PetitionBaseFragment, CompliancePeriodDialogData>) {
  const intl = useIntl();
  const { handleSubmit, control, watch, register } = useForm<CompliancePeriodDialogData>({
    mode: "onSubmit",
    defaultValues: {
      purpose: anonymizePurpose,
      months: anonymizeAfterMonths,
    },
  });

  const selectedMonths = watch("months");

  return (
    <ConfirmDialog
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit((data) =>
          props.onResolve({
            months: Number(data.months), // otherwise this is resolved as a string
            purpose: data.purpose,
          })
        ),
      }}
      header={
        <FormattedMessage
          id="component.petition-compliance-period-dialog.header"
          defaultMessage="Data retention period"
        />
      }
      body={
        <Stack>
          <FormControl>
            <Controller
              name="months"
              control={control}
              rules={{ required: true, min: 1 }}
              render={({ field: { ref, value, ...restField } }) => (
                <HStack>
                  <FormattedMessage
                    id="component.petition-compliance-period-dialog.delete-after"
                    defaultMessage="Delete data after"
                  />
                  <NumberInput
                    marginX={2}
                    {...restField}
                    value={value ?? 1}
                    min={1}
                    clampValueOnBlur={true}
                    maxWidth="100px"
                  >
                    <NumberInputField ref={ref} name={restField.name} type="number" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormattedMessage
                    id="generic.months"
                    defaultMessage="{count, plural, =1{month} other{months}}"
                    values={{ count: selectedMonths }}
                  />
                </HStack>
              )}
            />
          </FormControl>
          <Text fontStyle="italic" fontSize="sm">
            <FormattedMessage
              id="component.petition-compliance-period-dialog.explainer"
              defaultMessage="This period will start from the closing of {type, select, PETITION{this petition} other{a petition created from this template}}, once completed, the data contained will be anonymized."
              values={{ type }}
            />
          </Text>
          <FormControl>
            <FormLabel>
              <FormattedMessage
                id="component.petition-compliance-period-dialog.purpose-of-treatment"
                defaultMessage="Purpose of treatment"
              />
            </FormLabel>
            <GrowingTextarea
              {...register("purpose")}
              placeholder={intl.formatMessage({
                id: "component.petition-compliance-period-dialog.purpose-of-treatment.placeholder",
                defaultMessage: "Briefly describe the purpose of the data processing.",
              })}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage id="generic.apply-changes" defaultMessage="Apply changes" />
        </Button>
      }
      {...props}
    />
  );
}

export function useCompliancePeriodDialog() {
  return useDialog(CompliancePeriodDialog);
}

CompliancePeriodDialog.fragments = {
  PetitionBase: gql`
    fragment CompliancePeriodDialog_PetitionBase on PetitionBase {
      id
      anonymizeAfterMonths
      anonymizePurpose
      __typename
    }
  `,
};

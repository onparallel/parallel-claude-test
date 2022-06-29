import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { CompliancePeriodDialog_PetitionBaseFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { addMonths } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { useConfirmCompliancePeriodDialog } from "./ConfirmCompliancePeriodDialog";

interface CompliancePeriodDialogInput {
  petition: CompliancePeriodDialog_PetitionBaseFragment;
}

interface CompliancePeriodDialogData {
  anonymizeAfterMonths: number;
  anonymizePurpose?: Maybe<string>;
}
export function CompliancePeriodDialog({
  petition,
  ...props
}: DialogProps<CompliancePeriodDialogInput, CompliancePeriodDialogData>) {
  const intl = useIntl();
  const { handleSubmit, control, watch, register } = useForm<CompliancePeriodDialogData>({
    mode: "onSubmit",
    defaultValues: {
      anonymizePurpose: petition.anonymizePurpose,
      anonymizeAfterMonths: petition.anonymizeAfterMonths || 1,
    },
  });

  const selectedMonths = watch("anonymizeAfterMonths");

  const showConfirmCompliancePeriodDialog = useConfirmCompliancePeriodDialog();
  async function handleFormSubmit(data: CompliancePeriodDialogData) {
    try {
      if (petition.__typename === "Petition" && isDefined(petition.closedAt)) {
        const anonymizeAt = addMonths(new Date(petition.closedAt), data.anonymizeAfterMonths);
        if (new Date() >= anonymizeAt) {
          await showConfirmCompliancePeriodDialog({ months: data.anonymizeAfterMonths });
        }
      }
      props.onResolve({
        anonymizeAfterMonths: Number(data.anonymizeAfterMonths), // otherwise this is resolved as a string
        anonymizePurpose: data.anonymizePurpose,
      });
    } catch {}
  }

  return (
    <ConfirmDialog
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit(handleFormSubmit),
      }}
      header={
        <FormattedMessage
          id="component.petition-compliance-period-dialog.header"
          defaultMessage="Data retention period"
        />
      }
      body={
        <Stack>
          <FormControl id="anonymize-after">
            <Controller
              name="anonymizeAfterMonths"
              control={control}
              rules={{ required: true, min: 1 }}
              render={({ field: { ref, value, ...restField } }) => (
                <HStack as={FormLabel} margin={0}>
                  <FormattedMessage
                    id="component.petition-compliance-period-dialog.anonymize-after-label"
                    defaultMessage="Anonymize data after {input} {count, plural, =1{month} other{months}}"
                    values={{
                      count: selectedMonths,
                      input: (
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
                      ),
                    }}
                  />
                </HStack>
              )}
            />
          </FormControl>
          <Text fontStyle="italic" fontSize="sm">
            <FormattedMessage
              id="component.petition-compliance-period-dialog.explainer"
              defaultMessage="This period will start from the closing of {type, select, PETITION{this parallel} other{a parallel created from this template}}, once completed, the data contained will be anonymized."
              values={{ type: petition.__typename === "Petition" ? "PETITION" : "TEMPLATE" }}
            />
          </Text>
          <FormControl>
            <FormLabel>
              <FormattedMessage
                id="component.petition-compliance-period-dialog.purpose-of-treatment"
                defaultMessage="Purpose of the treatment"
              />
            </FormLabel>
            <GrowingTextarea
              {...register("anonymizePurpose")}
              placeholder={intl.formatMessage({
                id: "component.petition-compliance-period-dialog.purpose-of-treatment.placeholder",
                defaultMessage: "Briefly describe the purpose of the data processing.",
              })}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
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
      ... on Petition {
        closedAt
      }
      __typename
    }
  `,
};

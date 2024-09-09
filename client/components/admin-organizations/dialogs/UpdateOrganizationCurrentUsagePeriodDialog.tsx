import { gql } from "@apollo/client";
import {
  Button,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { UpdateOrganizationCurrentUsagePeriodDialog_OrganizationUsageLimitFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { add } from "date-fns";
import { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedDate, FormattedMessage } from "react-intl";

interface UpdateOrganizationCurrentUsagePeriodDialogData {
  header: ReactNode;
  usagePeriod?: UpdateOrganizationCurrentUsagePeriodDialog_OrganizationUsageLimitFragment | null;
}

interface UpdateOrganizationCurrentUsagePeriodDialogResult {
  limit: number;
}

export function UpdateOrganizationCurrentUsagePeriodDialog({
  header,
  usagePeriod,
  ...props
}: DialogProps<
  UpdateOrganizationCurrentUsagePeriodDialogData,
  UpdateOrganizationCurrentUsagePeriodDialogResult
>) {
  const {
    control,
    formState: { isDirty },
    handleSubmit,
  } = useForm<UpdateOrganizationCurrentUsagePeriodDialogResult>({
    defaultValues: {
      limit: usagePeriod?.limit || 1,
    },
  });

  const periodEndDate = add(
    usagePeriod?.periodStartDate ? new Date(usagePeriod.periodStartDate) : new Date(),
    usagePeriod?.period ?? { months: 1 },
  );

  return (
    <ConfirmDialog
      {...props}
      size="lg"
      content={{
        containerProps: { as: "form", onSubmit: handleSubmit(props.onResolve) },
      }}
      header={header}
      body={
        <Grid templateColumns="auto 1fr 1fr" gap={3} alignItems="flex-end">
          <GridItem>
            <FormLabel fontWeight="600">
              <FormattedMessage
                id="component.update-organization-current-usage-period-dialog.limit-label"
                defaultMessage="Limit"
              />
            </FormLabel>
          </GridItem>
          <GridItem colSpan={2}>
            <Controller
              name="limit"
              control={control}
              render={({ field }) => (
                <NumberInput
                  min={1}
                  width="100%"
                  {...field}
                  onChange={(_, value) => field.onChange(value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              )}
            />
          </GridItem>
          <GridItem colSpan={3}>
            <HStack>
              <Text fontWeight="bold">
                <FormattedMessage
                  id="component.update-organization-current-usage-period-dialog.ongoing-period-end-label"
                  defaultMessage="Ongoing period end:"
                />
              </Text>
              <Text>
                <FormattedDate value={periodEndDate} {...FORMATS["LL"]} />
              </Text>
            </HStack>
          </GridItem>
        </Grid>
      }
      confirm={
        <Button colorScheme="primary" type="submit" isDisabled={!isDirty && !!usagePeriod}>
          <FormattedMessage id="generic.update" defaultMessage="Update" />
        </Button>
      }
    />
  );
}

export function useUpdateOrganizationCurrentUsagePeriodDialog() {
  return useDialog(UpdateOrganizationCurrentUsagePeriodDialog);
}

UpdateOrganizationCurrentUsagePeriodDialog.fragments = {
  OrganizationUsageLimit: gql`
    fragment UpdateOrganizationCurrentUsagePeriodDialog_OrganizationUsageLimit on OrganizationUsageLimit {
      limit
      period
      periodStartDate
    }
  `,
};

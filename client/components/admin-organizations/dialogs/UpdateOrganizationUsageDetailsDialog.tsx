import { gql } from "@apollo/client";
import {
  Button,
  Checkbox,
  FormLabel,
  Grid,
  GridItem,
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
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import {
  Maybe,
  UpdateOrganizationUsageDetailsDialog_OrganizationUsageLimitFragment,
} from "@parallel/graphql/__types";
import { add, Duration } from "date-fns";
import { ReactNode, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";

interface UpdateOrganizationUsageDetailsDialogProps {
  header: ReactNode;
  hidePeriodSection?: boolean;
  usageDetails: {
    limit: number;
    duration?: Duration;
    renewalCycles?: number;
  } | null;
  currentUsageLimit?: Maybe<UpdateOrganizationUsageDetailsDialog_OrganizationUsageLimitFragment>;
}

interface UpdateOrganizationUsageDetailsDialogInput {
  limit: number;
  periodValue: number;
  periodUnits: string;
  renewalCycles: number;
  startNewPeriod: boolean;
}

interface UpdateOrganizationUsageDetailsDialogResult {
  limit: number;
  duration: Duration;
  renewalCycles: number;
  startNewPeriod: boolean;
}

export function UpdateOrganizationUsageDetailsDialog({
  header,
  hidePeriodSection,
  usageDetails,
  currentUsageLimit,
  ...props
}: DialogProps<
  UpdateOrganizationUsageDetailsDialogProps,
  UpdateOrganizationUsageDetailsDialogResult
>) {
  const [[pUnits, pValue]] = Object.entries(usageDetails?.duration ?? { months: 1 });
  const {
    control,
    register,
    watch,
    formState: { isDirty },
    handleSubmit,
  } = useForm<UpdateOrganizationUsageDetailsDialogInput>({
    defaultValues: {
      limit: usageDetails?.limit || 1,
      periodValue: pValue,
      periodUnits: pUnits,
      renewalCycles: usageDetails?.renewalCycles || 0,
      startNewPeriod: !usageDetails,
    },
  });

  const intl = useIntl();
  const durationOptions = useMemo<Record<string, string>>(
    () => ({
      years: intl
        .formatMessage({
          id: "component.update-organization-usage-details-dialog.years-label",
          defaultMessage: "Years",
        })
        .toLowerCase(),
      months: intl
        .formatMessage({
          id: "component.update-organization-usage-details-dialog.months-label",
          defaultMessage: "Months",
        })
        .toLowerCase(),
    }),
    [intl]
  );

  const { startNewPeriod, periodUnits, periodValue, renewalCycles } = watch();

  const now = new Date();

  let nextPeriod: Maybe<Date> = startNewPeriod
    ? now
    : currentUsageLimit
    ? add(new Date(currentUsageLimit.periodStartDate), currentUsageLimit.period)
    : now;

  const subscriptionEndDate =
    renewalCycles > 0
      ? add(
          currentUsageLimit && !startNewPeriod
            ? add(new Date(currentUsageLimit.periodStartDate), currentUsageLimit.period) // end date of the current period
            : now,
          {
            // + duration of the remaining periods, if any
            [periodUnits as keyof Duration]:
              periodValue *
              (renewalCycles -
                (startNewPeriod
                  ? 0 // cycle count is restarted when starting a new period
                  : currentUsageLimit?.cycleNumber ?? 0)), // if not starting a new period, we have to consider the cycle number of the current period
          }
        )
      : null;

  if (nextPeriod.getTime() - (subscriptionEndDate?.getTime() ?? 0) === 0) {
    nextPeriod = null;
  }

  return (
    <ConfirmDialog
      {...props}
      size="lg"
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => {
          props.onResolve({
            ...omit(data, ["periodUnits", "periodValue"]),
            duration: { [data.periodUnits as keyof Duration]: data.periodValue },
          });
        }),
      }}
      header={header}
      body={
        <Grid templateColumns="auto 1fr 1fr" gap={3} alignItems="flex-end">
          <GridItem>
            <FormLabel fontWeight="600">
              <FormattedMessage
                id="component.update-organization-usage-details-dialog.limit-label"
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
          {hidePeriodSection ? null : (
            <>
              <GridItem>
                <FormLabel fontWeight="600">
                  <FormattedMessage
                    id="component.update-organization-usage-details-dialog.period-label"
                    defaultMessage="Period"
                  />
                </FormLabel>
              </GridItem>
              <GridItem>
                <Controller
                  name="periodValue"
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
              <GridItem>
                <Controller
                  name="periodUnits"
                  control={control}
                  render={({ field }) => (
                    <SimpleSelect<string>
                      options={Object.entries(durationOptions).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                      {...field}
                    />
                  )}
                />
              </GridItem>
              <GridItem>
                <FormLabel fontWeight="600">
                  <FormattedMessage
                    id="component.update-organization-usage-details-dialog.renewal-cycles-label"
                    defaultMessage="Renewal cycles"
                  />
                </FormLabel>
              </GridItem>
              <GridItem colSpan={2}>
                <Controller
                  name="renewalCycles"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      min={0}
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
                <Checkbox {...register("startNewPeriod")} isDisabled={!usageDetails}>
                  <HStack alignItems="center">
                    <FormattedMessage
                      id="component.update-organization-usage-details-dialog.start-new-period-label"
                      defaultMessage="Start new period"
                    />

                    <HelpPopover>
                      <Text fontSize="sm">
                        <FormattedMessage
                          id="component.update-organization-usage-details-dialog.start-new-period-popover"
                          defaultMessage="Activating this option will finalize the current period and start a new one with the new subscription."
                        />
                      </Text>
                    </HelpPopover>
                  </HStack>
                </Checkbox>
              </GridItem>
              <GridItem
                colSpan={3}
                borderColor="gray.200"
                borderWidth="1px"
                borderRadius="5px"
                paddingX={4}
                paddingY={2}
              >
                <Stack>
                  <HStack>
                    <Text fontWeight="bold">
                      <FormattedMessage
                        id="component.update-organization-usage-details-dialog.next-period-label"
                        defaultMessage="Next period:"
                      />
                    </Text>
                    {nextPeriod ? (
                      <Text>
                        <FormattedDate value={nextPeriod} dateStyle="long" />
                      </Text>
                    ) : (
                      <Text textStyle="hint">
                        <FormattedMessage
                          id="component.update-organization-usage-details-dialog.no-periods"
                          defaultMessage="No periods"
                        />
                      </Text>
                    )}
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold">
                      <FormattedMessage
                        id="component.update-organization-usage-details-dialog.subscription-end-label"
                        defaultMessage="Subscription end:"
                      />
                    </Text>
                    {subscriptionEndDate ? (
                      <Text>
                        <FormattedDate value={subscriptionEndDate} dateStyle="long" />
                      </Text>
                    ) : (
                      <Text textStyle="hint">
                        <FormattedMessage id="generic.unlimited" defaultMessage="Unlimited" />
                      </Text>
                    )}
                  </HStack>
                </Stack>
              </GridItem>
            </>
          )}
        </Grid>
      }
      confirm={
        <Button colorScheme="primary" type="submit" isDisabled={!isDirty && !!usageDetails}>
          <FormattedMessage id="generic.update" defaultMessage="Update" />
        </Button>
      }
    />
  );
}

UpdateOrganizationUsageDetailsDialog.fragments = {
  OrganizationUsageLimit: gql`
    fragment UpdateOrganizationUsageDetailsDialog_OrganizationUsageLimit on OrganizationUsageLimit {
      id
      period
      cycleNumber
      periodStartDate
    }
  `,
};

export function useUpdateOrganizationUsageDetailsDialog() {
  return useDialog(UpdateOrganizationUsageDetailsDialog);
}

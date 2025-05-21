import { Button, HStack, Progress, Stack, Text } from "@chakra-ui/react";
import { RepeatIcon, RepeatOffIcon, RepeatPauseIcon } from "@parallel/chakra/icons";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { ProfileFormField_ProfileFieldPropertyFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";

// Helper to check if monitoring is active based on conditions
export function checkIfMonitoringIsActive(
  monitoring: any,
  properties: ProfileFormField_ProfileFieldPropertyFragment[] | undefined,
) {
  if (!monitoring?.activationCondition) return true;

  const conditions = monitoring.activationCondition;
  const property = properties?.find(({ field }) => field.id === conditions?.profileTypeFieldId);
  return conditions?.values?.includes(property?.value?.content?.value) ?? false;
}

// Helper to get search frequency
export function getSearchFrequency(
  monitoring: any,
  properties: ProfileFormField_ProfileFieldPropertyFragment[] | undefined,
) {
  if (monitoring?.searchFrequency?.type === "FIXED") {
    return monitoring.searchFrequency.frequency.split("_");
  } else {
    const searchFrequency = monitoring.searchFrequency;
    const property = properties?.find(
      ({ field }) => field.id === searchFrequency?.profileTypeFieldId,
    );
    const frequency = searchFrequency.options.find(
      ({ value }: { value: string }) => value === property?.value?.content?.value,
    )?.frequency;
    return frequency?.split("_") ?? ["3", "YEARS"];
  }
}

// UI Component for showing loading state during search
export function SearchProgressComponent({
  onCancelClick,
  loadingMessage,
}: {
  onCancelClick: () => void;
  loadingMessage: string;
}) {
  return (
    <Stack>
      <Text fontSize="sm">{loadingMessage}</Text>
      <HStack>
        <Progress size="md" isIndeterminate colorScheme="green" borderRadius="full" width="100%" />
        <Button size="sm" fontWeight="normal" onClick={onCancelClick}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      </HStack>
    </Stack>
  );
}

// Component to display monitoring information
export function MonitoringInfo({
  isMonitoringActive,
  monitoringFrequency,
  createdAt,
  hasActiveMonitoring,
  hasDraft,
}: {
  isMonitoringActive: boolean;
  monitoringFrequency: string[] | null;
  createdAt: string;
  hasActiveMonitoring?: boolean;
  hasDraft?: boolean;
}) {
  const intl = useIntl();

  const isMonitoringPaused = isMonitoringActive && hasActiveMonitoring === false;

  if ((isMonitoringActive || isMonitoringPaused) && monitoringFrequency) {
    return (
      <HStack>
        <SmallPopover
          content={
            <Text fontSize="sm">
              {isMonitoringPaused ? (
                <FormattedMessage
                  id="component.profile-field-background-check.deactivated-monitoring"
                  defaultMessage="Monitoring is deactivated."
                />
              ) : hasDraft ? (
                <FormattedMessage
                  id="component.profile-field-background-check.paused-monitoring-draft"
                  defaultMessage="Monitoring is paused because there are changes not saved."
                />
              ) : (
                <>
                  <FormattedMessage
                    id="component.profile-field-background-check.active-monitoring"
                    defaultMessage="Active monitoring"
                  />{" "}
                  {monitoringFrequency[1] === "DAYS" ? (
                    <FormattedMessage
                      id="component.profile-field-background-check.results-monitored-x-days"
                      defaultMessage="The results are monitored every {count, plural, =1 {day} other {# days}}."
                      values={{ count: parseInt(monitoringFrequency[0]) }}
                    />
                  ) : monitoringFrequency[1] === "MONTHS" ? (
                    <FormattedMessage
                      id="component.profile-field-background-check.results-monitored-x-months"
                      defaultMessage="The results are monitored every {count, plural, =1 {month} other {# months}}."
                      values={{ count: parseInt(monitoringFrequency[0]) }}
                    />
                  ) : monitoringFrequency[1] === "YEARS" ? (
                    <FormattedMessage
                      id="component.profile-field-background-check.results-monitored-x-years"
                      defaultMessage="The results are monitored every {count, plural, =1 {year} other {# years}}."
                      values={{ count: parseInt(monitoringFrequency[0]) }}
                    />
                  ) : null}
                </>
              )}
            </Text>
          }
          placement="bottom"
          maxWidth="250px"
          width="auto"
        >
          {isMonitoringPaused ? (
            <RepeatOffIcon color="red.300" marginBottom={0.5} />
          ) : hasDraft ? (
            <RepeatPauseIcon color="gray.400" marginBottom={0.5} />
          ) : (
            <RepeatIcon color="yellow.500" marginBottom={0.5} />
          )}
        </SmallPopover>
        <Text fontSize="sm">
          <FormattedMessage
            id="generic.last-updated-on"
            defaultMessage="Last updated on {date}"
            values={{
              date: intl.formatDate(new Date(createdAt), FORMATS.LL),
            }}
          />
        </Text>
      </HStack>
    );
  }

  return (
    <Text fontSize="sm">
      <FormattedMessage
        id="generic.saved-on"
        defaultMessage="Saved on {date}"
        values={{
          date: intl.formatDate(new Date(createdAt), FORMATS.LL),
        }}
      />
    </Text>
  );
}

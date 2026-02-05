import { HStack, Stack } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { PetitionRepliesMetadataText } from "./PetitionRepliesMetadata";
import { Text } from "@parallel/components/ui";

interface CurrencyAmount {
  value: number;
  currency: string;
}

interface PayslipMetadata {
  type: "PAYSLIP";
  inferred_data: {
    periodStart: string | null; // YYYY-MM-DD
    periodEnd: string | null; // YYYY-MM-DD
    netPay: CurrencyAmount | null;
    totalDeduction: CurrencyAmount | null;
    totalAccrued: CurrencyAmount | null;
    employeeName: string | null;
    employeeId: string | null;
    employerName: string | null;
    employerId: string | null;
  }[];
}

export function PetitionRepliesFieldFileUploadPayslipReply({
  metadata,
}: {
  metadata: PayslipMetadata;
}) {
  const intl = useIntl();

  if (
    !metadata.inferred_data ||
    (Array.isArray(metadata.inferred_data) && metadata.inferred_data.length === 0)
  ) {
    return (
      <Text paddingBottom={3} color="yellow.700">
        <FormattedMessage
          id="component.petition-field-file-upload-payslip-reply.error-reading-document"
          defaultMessage="We have not been able to read this document. Please check it to make sure it is the correct type of document."
        />
      </Text>
    );
  }

  function formatCurrencyAmount(value: CurrencyAmount | null) {
    return isNonNullish(value)
      ? intl.formatNumber(value.value, { style: "currency", currency: value.currency })
      : null;
  }

  return (
    <Stack paddingBottom={3} divider={<Divider />} width="100%">
      {metadata.inferred_data.map((data, i) => {
        const periodStart = data.periodStart
          ? intl.formatDate(data.periodStart, FORMATS.L)
          : intl.formatMessage({ id: "generic.unknown", defaultMessage: "Unknown" });

        const periodEnd = data.periodEnd
          ? intl.formatDate(data.periodEnd, FORMATS.L)
          : intl.formatMessage({ id: "generic.unknown", defaultMessage: "Unknown" });

        const period = data.periodStart || data.periodEnd ? `${periodStart} - ${periodEnd}` : null;
        return (
          <HStack key={i} flexWrap="wrap" width="100%">
            <Stack marginEnd={{ base: 0, xl: 12 }}>
              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-file-upload-payslip-reply.period",
                  defaultMessage: "Period",
                })}
                content={period}
              />

              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-file-upload-payslip-reply.net-salary",
                  defaultMessage: "Net salary",
                })}
                content={formatCurrencyAmount(data.netPay)}
              />

              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-file-upload-payslip-reply.total-deduction",
                  defaultMessage: "Total deduction",
                })}
                content={formatCurrencyAmount(data.totalDeduction)}
              />

              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-file-upload-payslip-reply.total-accrued",
                  defaultMessage: "Total accrued",
                })}
                content={formatCurrencyAmount(data.totalAccrued)}
              />
            </Stack>
            <Stack>
              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-file-upload-payslip-reply.employee-name",
                  defaultMessage: "Employee name",
                })}
                content={data.employeeName}
              />

              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-file-upload-payslip-reply.employee-id",
                  defaultMessage: "Employee ID",
                })}
                content={data.employeeId}
              />

              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-file-upload-payslip-reply.employer-name",
                  defaultMessage: "Employer name",
                })}
                content={data.employerName}
              />

              <PetitionRepliesMetadataText
                label={intl.formatMessage({
                  id: "component.petition-replies-field-id-verification-reply.employer-id",
                  defaultMessage: "Employer ID",
                })}
                content={data.employerId}
              />
            </Stack>
          </HStack>
        );
      })}
    </Stack>
  );
}

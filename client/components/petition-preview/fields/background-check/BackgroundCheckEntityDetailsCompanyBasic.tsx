import { gql } from "@apollo/client";
import { Box, Button, Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import {
  BusinessIcon,
  CheckIcon,
  DeleteIcon,
  EyeIcon,
  FieldDateIcon,
  StarEmptyIcon,
} from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { BackgroundCheckEntityDetailsCompanyBasic_BackgroundCheckEntityDetailsCompanyFragment } from "@parallel/graphql/__types";
import { formatPartialDate } from "@parallel/utils/formatPartialDate";
import {
  isOpenSanctionsCountryCode,
  useLoadOpenSanctionsCountryNames,
} from "@parallel/utils/useLoadOpenSanctionsCountryNames";
import { FormattedMessage, useIntl } from "react-intl";

export function BackgroundCheckEntityDetailsCompanyBasic({
  isDisabled,
  hasReply,
  isSaving,
  isDeleting,
  isReadOnly,
  onSave,
  onDelete,
  onDownloadPDF,
  data,
}: {
  isDisabled?: boolean;
  hasReply: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isReadOnly: boolean;
  onSave: () => void;
  onDelete: () => void;
  onDownloadPDF: () => void;
  data: BackgroundCheckEntityDetailsCompanyBasic_BackgroundCheckEntityDetailsCompanyFragment;
}) {
  const intl = useIntl();

  const detailsSpanProps = {
    color: "gray.600",
    fontSize: "sm",
    fontWeight: 500,
  };

  const {
    name: fullName,
    properties: { topics, dateOfRegistration, jurisdiction },
  } = data;

  const { countries } = useLoadOpenSanctionsCountryNames(intl.locale);
  const getCountryName = (code: string) => {
    return countries?.[code] ?? countries?.[code.toUpperCase()];
  };

  return (
    <Card>
      <CardHeader headingLevel="h2" minHeight="65px">
        <Stack direction={{ base: "column", md: "row" }} spacing={4}>
          <Stack
            direction={{ base: "column", md: "row" }}
            alignItems={{ base: "start", md: "center" }}
            flex="1"
          >
            <Text as="div" fontSize="xl">
              {fullName}
            </Text>
            <Flex lineHeight="base" gap={2} flexWrap="wrap">
              {topics?.map((hint, i) => <BackgroundCheckRiskLabel key={i} risk={hint} />)}
            </Flex>
          </Stack>
          <HStack alignSelf="end" flexWrap="wrap">
            <Button
              variant="ghost"
              colorScheme="primary"
              leftIcon={<EyeIcon />}
              isDisabled={isDisabled}
              onClick={() => onDownloadPDF()}
              width={{ base: "100%", sm: "auto" }}
            >
              <FormattedMessage
                id="component.background-check-entity-details-company-basic.preview-pdf"
                defaultMessage="Preview PDF"
              />
            </Button>
            {hasReply ? (
              <HStack>
                <CheckIcon color="green.500" />
                <Text fontWeight={500}>
                  <FormattedMessage id="generic.saved" defaultMessage="Saved" />
                </Text>
                <IconButtonWithTooltip
                  size="sm"
                  fontSize="md"
                  label={intl.formatMessage({ id: "generic.delete", defaultMessage: "Delete" })}
                  icon={<DeleteIcon />}
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  isDisabled={isDeleting || isReadOnly || isDisabled}
                />
              </HStack>
            ) : (
              <Button
                variant="solid"
                colorScheme="primary"
                leftIcon={<StarEmptyIcon />}
                onClick={onSave}
                isLoading={isSaving}
                isDisabled={isReadOnly || isDisabled}
                width={{ base: "100%", sm: "auto" }}
              >
                <FormattedMessage
                  id="component.background-check-search-result.save-match"
                  defaultMessage="Save match"
                />
              </Button>
            )}
          </HStack>
        </Stack>
      </CardHeader>

      <HStack paddingX={6} paddingY={4} gridGap={{ base: 4, md: 8 }} spacing={0} wrap="wrap">
        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-company-basic.type"
              defaultMessage="Type"
            />
            :
          </Text>
          <HStack>
            <BusinessIcon />
            <Text>
              <FormattedMessage
                id="component.background-check-entity-details-company-basic.entity"
                defaultMessage="Entity"
              />
            </Text>
          </HStack>
        </Stack>
        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-company-basic.jurisdiction"
              defaultMessage="Jurisdiction"
            />
            :
          </Text>
          {jurisdiction?.map((nationCode: string) => {
            const flag =
              nationCode && !isOpenSanctionsCountryCode(nationCode) ? (
                <Image
                  alt={getCountryName(nationCode)}
                  boxSize={6}
                  src={`${
                    process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
                  }/static/countries/flags/${nationCode.toLowerCase()}.png`}
                />
              ) : (
                <Box boxSize={6}></Box>
              );
            return (
              <HStack key={nationCode}>
                {flag}
                <Text>{nationCode ? (getCountryName(nationCode) ?? nationCode) : "-"}</Text>
              </HStack>
            );
          }) ?? <Text>{"-"}</Text>}
        </Stack>
        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-company-basic.date-of-registration"
              defaultMessage="Date of registration"
            />
            :
          </Text>
          <HStack>
            <FieldDateIcon />
            <Text as="span">
              {dateOfRegistration?.map((date, i) => formatPartialDate({ date }))?.join(" · ") ??
                "-"}
            </Text>
          </HStack>
        </Stack>
      </HStack>
    </Card>
  );
}

BackgroundCheckEntityDetailsCompanyBasic.fragments = {
  get BackgroundCheckEntityDetailsCompanyBasic() {
    return gql`
      fragment BackgroundCheckEntityDetailsCompanyBasic_BackgroundCheckEntityDetailsCompany on BackgroundCheckEntityDetailsCompany {
        id
        name
        properties {
          dateOfRegistration
          topics
          jurisdiction
        }
      }
    `;
  },
};

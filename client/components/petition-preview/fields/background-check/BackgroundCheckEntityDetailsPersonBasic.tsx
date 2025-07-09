import { gql } from "@apollo/client";
import { Box, Button, Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import {
  CheckIcon,
  DeleteIcon,
  EyeIcon,
  FieldDateIcon,
  SaveIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { BackgroundCheckEntityDetailsPersonBasic_BackgroundCheckEntityDetailsPersonFragment } from "@parallel/graphql/__types";
import { formatPartialDate } from "@parallel/utils/formatPartialDate";
import {
  isOpenSanctionsCountryCode,
  useLoadOpenSanctionsCountryNames,
} from "@parallel/utils/useLoadOpenSanctionsCountryNames";
import { FormattedMessage, useIntl } from "react-intl";

export function BackgroundCheckEntityDetailsPersonBasic({
  hasReply,
  isSaving,
  isDeleting,
  isReadOnly,
  onSave,
  onDelete,
  onDownloadPDF,
  data,
}: {
  hasReply: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isReadOnly: boolean;
  onSave: () => void;
  onDelete: () => void;
  onDownloadPDF: () => void;
  data: BackgroundCheckEntityDetailsPersonBasic_BackgroundCheckEntityDetailsPersonFragment;
}) {
  const intl = useIntl();

  const { countries } = useLoadOpenSanctionsCountryNames(intl.locale);
  const getCountryName = (code: string) => {
    return countries?.[code] ?? countries?.[code.toUpperCase()];
  };

  const {
    name: fullName,
    properties: { country, countryOfBirth, dateOfBirth, gender, nationality, topics },
  } = data;

  const detailsSpanProps = {
    color: "gray.600",
    fontSize: "sm",
    fontWeight: 500,
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
              onClick={() => onDownloadPDF()}
              width={{ base: "100%", sm: "auto" }}
            >
              <FormattedMessage
                id="component.background-check-entity-details-person-basic.preview-pdf"
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
                  isDisabled={isDeleting || isReadOnly}
                />
              </HStack>
            ) : (
              <Button
                variant="solid"
                colorScheme="primary"
                leftIcon={<SaveIcon />}
                onClick={onSave}
                isLoading={isSaving}
                isDisabled={isReadOnly}
                width={{ base: "100%", sm: "auto" }}
              >
                <FormattedMessage id="generic.save" defaultMessage="Save" />
              </Button>
            )}
          </HStack>
        </Stack>
      </CardHeader>

      <HStack
        paddingX={6}
        paddingY={4}
        gridGap={{ base: 4, md: 10 }}
        spacing={0}
        wrap="wrap"
        alignItems="start"
      >
        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-person-basic.type"
              defaultMessage="Type"
            />
            :
          </Text>
          <HStack>
            <UserIcon />
            <Text>
              <FormattedMessage
                id="component.background-check-entity-details-person-basic.person"
                defaultMessage="Person"
              />
            </Text>
          </HStack>
        </Stack>

        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-person-basic.gender"
              defaultMessage="Gender"
            />
            :
          </Text>
          <Flex gap={2}>
            {gender?.map((g, i) => (
              <Text key={i}>
                {g === "male"
                  ? intl.formatMessage({ id: "generic.male", defaultMessage: "Male" })
                  : g === "female"
                    ? intl.formatMessage({ id: "generic.female", defaultMessage: "Female" })
                    : g || "-"}
              </Text>
            )) ?? "-"}
          </Flex>
        </Stack>

        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-person-basic.nationality"
              defaultMessage="Nationality"
            />
            :
          </Text>
          {nationality?.map((nationCode: string) => {
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
              id="component.background-check-entity-details-person-basic.country"
              defaultMessage="Country"
            />
            :
          </Text>
          {country?.map((c, i) => {
            const countryFlag = !isOpenSanctionsCountryCode(c) ? (
              <Image
                fallback={<Box width="12px" height="10px" bgColor="black"></Box>}
                alt={getCountryName(c)}
                boxSize={6}
                src={`${
                  process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
                }/static/countries/flags/${c.toLowerCase()}.png`}
              />
            ) : (
              <Box boxSize={6}></Box>
            );

            return (
              <HStack key={i}>
                {countryFlag}
                <Text>{getCountryName(c)}</Text>
              </HStack>
            );
          }) ?? <Text>{"-"}</Text>}
        </Stack>

        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-person-basic.country-of-birth"
              defaultMessage="Country of birth"
            />
            :
          </Text>
          {countryOfBirth?.map((c, i) => {
            const countryFlag = !isOpenSanctionsCountryCode(c) ? (
              <Image
                fallback={<Box width="12px" height="10px" bgColor="black"></Box>}
                alt={getCountryName(c)}
                boxSize={6}
                src={`${
                  process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
                }/static/countries/flags/${c.toLowerCase()}.png`}
              />
            ) : (
              <Box boxSize={6}></Box>
            );

            return (
              <HStack key={i}>
                {countryFlag}
                <Text>{getCountryName(c)}</Text>
              </HStack>
            );
          }) ?? <Text>{"-"}</Text>}
        </Stack>
        <Stack>
          <Text {...detailsSpanProps}>
            <FormattedMessage
              id="component.background-check-entity-details-person-basic.date-of-birth"
              defaultMessage="Date of birth"
            />
            :
          </Text>
          <HStack>
            <FieldDateIcon />

            <Flex gap={2}>
              {dateOfBirth?.map((date, i) => <Text key={i}>{formatPartialDate({ date })}</Text>) ??
                "-"}
            </Flex>
          </HStack>
        </Stack>
      </HStack>
    </Card>
  );
}

BackgroundCheckEntityDetailsPersonBasic.fragments = {
  get BackgroundCheckEntityDetailsPersonBasic() {
    return gql`
      fragment BackgroundCheckEntityDetailsPersonBasic_BackgroundCheckEntityDetailsPerson on BackgroundCheckEntityDetailsPerson {
        id
        name
        properties {
          country
          countryOfBirth
          dateOfBirth
          gender
          nationality
          topics
        }
      }
    `;
  },
};

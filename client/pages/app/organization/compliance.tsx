import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
  FormControl,
  FormErrorMessage,
  Heading,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { SupportLink } from "@parallel/components/common/SupportLink";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  OrganizationCompliance_updateOrganizationAutoAnonymizePeriodDocument,
  OrganizationCompliance_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

interface ComplianceFormData {
  period: number | null;
  isActive: boolean;
}

function OrganizationCompliance() {
  const intl = useIntl();
  const toast = useToast();

  const updateSuccessToast = () => {
    toast({
      title: intl.formatMessage({
        id: "organization.compliance.success-toast-title",
        defaultMessage: "Updated conservation period.",
      }),
      description: intl.formatMessage({
        id: "organization.compliance.success-toast-description",
        defaultMessage: "Changes have been successfully saved.",
      }),
      status: "success",
      isClosable: true,
    });
  };

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationCompliance_userDocument);

  const defaultPeriod = me.organization.anonymizePetitionsAfterMonths;

  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComplianceFormData>({
    defaultValues: {
      period: defaultPeriod,
      isActive: isDefined(defaultPeriod),
    },
  });

  const isActive = watch("isActive");
  const period = Number(watch("period"));

  const sections = useOrganizationSections(me);

  const [updateOrganizationAutoAnonymizePeriod] = useMutation(
    OrganizationCompliance_updateOrganizationAutoAnonymizePeriodDocument
  );

  const onPeriodChange = async ({ period, isActive }: ComplianceFormData) => {
    try {
      await updateOrganizationAutoAnonymizePeriod({
        variables: { months: period && isActive ? period : null },
      });
      updateSuccessToast();
    } catch {}
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.compliance.title",
        defaultMessage: "Compliance",
      })}
      basePath="/app/organization"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.compliance.title" defaultMessage="Compliance" />
        </Heading>
      }
    >
      <Box padding={6}>
        <Stack spacing={6} maxWidth="container.xs" width="100%">
          {me.hasAutoAnonymize ? null : (
            <Alert status="info" rounded="md">
              <AlertIcon />
              <HStack spacing={8}>
                <Text flex="1">
                  <FormattedMessage
                    id="page.compliance.upgrade-plan-alert"
                    defaultMessage="Upgrade your plan to access Compliance functionalities."
                  />
                </Text>
                <Center>
                  <Button
                    as={SupportLink}
                    variant="outline"
                    backgroundColor="white"
                    colorScheme="blue"
                    message={intl.formatMessage({
                      id: "page.compliance.upgrade-plan-message",
                      defaultMessage:
                        "Hi, I would like more information about upgrade my plan to access Compliance.",
                    })}
                  >
                    <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                  </Button>
                </Center>
              </HStack>
            </Alert>
          )}

          <Box>
            <Text>
              <FormattedMessage
                id="page.compliance.description-text-1"
                defaultMessage="In compliance with data protection regulations, the personal data collected must be kept for the time strictly necessary for their purpose."
              />
            </Text>
            <br />
            <Text>
              <FormattedMessage
                id="page.compliance.description-text-2"
                defaultMessage="You can set the <b>retention period</b> from the <b>closing</b> of the parallels, after which the data will be anonymized."
              />
            </Text>
          </Box>
          <Stack
            as="form"
            spacing={4}
            onSubmit={handleSubmit(({ period, isActive }) => {
              onPeriodChange({ isActive, period: Number(period) });
            })}
          >
            <Checkbox
              colorScheme="primary"
              {...register("isActive", {
                onChange: (event) => {
                  onPeriodChange({ period: 1, isActive: event.target.checked });
                  setValue("period", 1);
                },
              })}
              isDisabled={!me.hasAutoAnonymize}
            >
              <FormattedMessage
                id="page.compliance.include-data-retention"
                defaultMessage="Enable data erasure"
              />
            </Checkbox>
            <PaddedCollapse in={isActive && me.hasAutoAnonymize}>
              <FormControl marginBottom={4} isInvalid={!!errors.period}>
                <HStack>
                  <Controller
                    name="period"
                    control={control}
                    rules={{ required: isActive, min: 1 }}
                    render={({ field: { ref, value, ...restField } }) => (
                      <NumberInput
                        {...restField}
                        value={value ?? 1}
                        min={1}
                        clampValueOnBlur={true}
                        maxWidth="100px"
                      >
                        <NumberInputField ref={ref} name={restField.name} />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                  />
                  <Text>
                    <FormattedMessage id="page.compliance.months" defaultMessage="months" />
                  </Text>
                </HStack>
                <FormErrorMessage>
                  <FormattedMessage
                    id="page.compliance.duration-period-error"
                    defaultMessage="The duration of the period is required"
                  />
                </FormErrorMessage>
              </FormControl>

              <Button
                colorScheme="primary"
                type="submit"
                width="fit-content"
                isDisabled={defaultPeriod === period}
              >
                <FormattedMessage
                  id="page.compliance.upload-period"
                  defaultMessage="Update period"
                />
              </Button>
            </PaddedCollapse>
          </Stack>
          <Box>
            <HStack marginY={4}>
              <Text>
                <FormattedMessage
                  id="page.compliance.most-common-data"
                  defaultMessage="💡 Most common data retention periods:"
                />
              </Text>
              <HelpPopover>
                <FormattedMessage
                  id="page.compliance.most-common-data-help"
                  defaultMessage="Always get advice from a legal advisor in your jurisdiction. These periods may be subject to legislative changes. Parallel will maintain the data for the period you indicate and will not be liable in the event that the time period you set is incorrect."
                />
              </HelpPopover>
            </HStack>

            <TableContainer
              border="1px solid"
              borderColor="gray.200"
              borderRadius="10px"
              sx={{
                table: {
                  borderCollapse: "collapse",
                  borderStyle: "hidden",
                },
                "table th": {
                  fontSize: "md",
                },
                "table td, table th": {
                  border: "4px solid white",
                  borderY: 0,
                  paddingX: 4,
                  paddingY: 3,
                  textAlign: "center",
                },
                "table tbody tr:nth-of-type(2n) td": {
                  backgroundColor: "white",
                },
                "table tbody tr:nth-of-type(2n+1) td": {
                  backgroundColor: "gray.100",
                },
                "table tbody:first-of-type tr:nth-of-type(2n) td": {
                  backgroundColor: "gray.100",
                },
                "table tbody:first-of-type tr:nth-of-type(2n+1) td": {
                  backgroundColor: "white",
                },
                "table thead:not(:first-of-type) th": {
                  paddingTop: 8,
                },
              }}
            >
              <Table variant="unstyled">
                <Thead color="white" bgColor="gray.600">
                  <Tr>
                    <Th>
                      <FormattedMessage
                        id="page.compliance.table-purpose"
                        defaultMessage="purpose"
                      />
                    </Th>
                    <Th>
                      <FormattedMessage id="page.compliance.table-period" defaultMessage="period" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>
                      <FormattedMessage
                        id="page.compliance.labor-social-security"
                        defaultMessage="Labor or Social Security"
                      />
                    </Td>
                    <Td>
                      <FormattedMessage
                        id="page.compliance.x-years"
                        defaultMessage="{amount} years"
                        values={{ amount: 4 }}
                      />
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>
                      <FormattedMessage
                        id="page.compliance.accounting-tax"
                        defaultMessage="Accounting and tax"
                      />
                    </Td>
                    <Td>
                      <FormattedMessage
                        id="page.compliance.x-years"
                        defaultMessage="{amount} years"
                        values={{ amount: 6 }}
                      />
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>
                      <FormattedMessage
                        id="page.compliance.prevention-money-laundering"
                        defaultMessage="Prevention of Money Laundering"
                      />
                    </Td>
                    <Td>
                      <FormattedMessage
                        id="page.compliance.x-years"
                        defaultMessage="{amount} years"
                        values={{ amount: 10 }}
                      />
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Box>
    </SettingsLayout>
  );
}

const _fragments = {
  Organization: gql`
    fragment OrganizationCompliance_Organization on Organization {
      id
      anonymizePetitionsAfterMonths
    }
  `,
};

const _mutations = [
  gql`
    mutation OrganizationCompliance_updateOrganizationAutoAnonymizePeriod($months: Int) {
      updateOrganizationAutoAnonymizePeriod(months: $months) {
        ...OrganizationCompliance_Organization
      }
    }
    ${_fragments.Organization}
  `,
];

OrganizationCompliance.queries = [
  gql`
    query OrganizationCompliance_user {
      ...SettingsLayout_Query
      me {
        hasAutoAnonymize: hasFeatureFlag(featureFlag: AUTO_ANONYMIZE)
        organization {
          ...OrganizationCompliance_Organization
        }
      }
    }
    ${SettingsLayout.fragments.Query}
    ${_fragments.Organization}
  `,
];

OrganizationCompliance.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationCompliance_userDocument);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(OrganizationCompliance);

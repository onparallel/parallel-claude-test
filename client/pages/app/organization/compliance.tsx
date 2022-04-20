import { gql } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
  Collapse,
  FormControl,
  FormErrorMessage,
  Heading,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
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
import { SupportLink } from "@parallel/components/common/SupportLink";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { OrganizationCompliance_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface ComplianceFormData {
  amount: number;
  period: "YEARS" | "MONTHS";
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

  const {
    control,
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<ComplianceFormData>({
    defaultValues: {
      amount: 1,
      period: "MONTHS",
      isActive: false,
    },
  });

  const isActive = watch("isActive");

  const sections = useOrganizationSections(me);

  const onPeriodChange = ({ amount, period, isActive }: ComplianceFormData) => {
    try {
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
                defaultMessage="You can set the retention period from the <b>closing</b> of the petitions, after which the data will be anonymized."
              />
            </Text>
          </Box>
          <Stack as="form" spacing={4} onSubmit={handleSubmit(onPeriodChange)}>
            <Checkbox
              colorScheme="purple"
              {...register("isActive")}
              isDisabled={!me.hasAutoAnonymize}
            >
              <FormattedMessage
                id="page.compliance.include-data-retention"
                defaultMessage="Include data retention period"
              />
            </Checkbox>
            <Collapse in={isActive && me.hasAutoAnonymize}>
              <FormControl marginBottom={4} isInvalid={!!errors.amount}>
                <HStack>
                  <Controller
                    name={"amount"}
                    control={control}
                    rules={{ required: isActive }}
                    render={({ field: { ref, ...restField } }) => (
                      <NumberInput {...restField} min={1} clampValueOnBlur={true}>
                        <NumberInputField ref={ref} name={restField.name} />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                  />
                  <Select width="auto" {...register("period")} isInvalid={false}>
                    <option value="MONTHS">
                      {intl.formatMessage({
                        id: "page.compliance.months",
                        defaultMessage: "months",
                      })}
                    </option>
                    <option value="YEARS">
                      {intl.formatMessage({
                        id: "page.compliance.years",
                        defaultMessage: "years",
                      })}
                    </option>
                  </Select>
                </HStack>
                <FormErrorMessage>
                  <FormattedMessage
                    id="page.compliance.duration-period-error"
                    defaultMessage="The duration of the period is required"
                  />
                </FormErrorMessage>
              </FormControl>

              <Button colorScheme="purple" type="submit" width="fit-content">
                <FormattedMessage
                  id="page.compliance.upload-period"
                  defaultMessage="Update period"
                />
              </Button>
            </Collapse>
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

OrganizationCompliance.queries = [
  gql`
    query OrganizationCompliance_user {
      ...SettingsLayout_Query
      me {
        hasAutoAnonymize: hasFeatureFlag(featureFlag: AUTO_ANONYMIZE)
        organization {
          id
          activeUserCount
          usageLimits {
            users {
              limit
            }
            petitions {
              used
              limit
            }
            signatures {
              used
              limit
            }
          }
        }
      }
    }
    ${SettingsLayout.fragments.Query}
  `,
];

OrganizationCompliance.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationCompliance_userDocument);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(OrganizationCompliance);

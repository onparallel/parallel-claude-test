import { Center, Heading, Stack, Text } from "@chakra-ui/layout";
import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { CircleCheckFilledIcon, CircleCrossFilledIcon } from "@parallel/chakra/icons";
import { Card, CardProps } from "@parallel/components/common/Card";
import { Fragment } from "react";
import { FormattedMessage } from "react-intl";
import { usePricingList } from "../../../utils/usePricingList";

export function PublicPricingTable(props: CardProps) {
  const list = usePricingList();

  const plans = ["FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE"];

  return (
    <Card {...props} padding={8} paddingTop={6}>
      <Stack spacing={6}>
        <Heading as="h2" fontSize="2xl">
          <FormattedMessage
            id="component.pricing-table.compare-plans"
            defaultMessage="Compare plans"
          />
        </Heading>
        <Stack
          spacing={8}
          sx={{
            table: {
              borderCollapse: "collapse",
              borderStyle: "hidden",
            },
            "table td, table th": {
              border: "4px solid white",
              borderY: 0,
              paddingX: 4,
              paddingY: 2,
            },
            "table tbody tr:nth-child(2n) td": {
              backgroundColor: "white",
            },
            "table tbody tr:nth-child(2n+1) td": {
              backgroundColor: "gray.75",
            },
            "table tbody:first-of-type tr:nth-child(2n) td": {
              backgroundColor: "gray.75",
            },
            "table tbody:first-of-type tr:nth-child(2n+1) td": {
              backgroundColor: "white",
            },
            "table thead:not(:first-of-type) th": {
              paddingTop: 8,
            },
          }}
        >
          <Table>
            {list.map((entry, index) => {
              return (
                <Fragment key={index}>
                  <Thead>
                    <Tr>
                      <Th fontWeight="600" color="purple.800" fontSize="sm">
                        {entry.category}
                      </Th>
                      {index === 0 ? (
                        <>
                          <Th
                            background="gray.400"
                            color="white"
                            fontWeight="600"
                            textAlign="center"
                            fontSize="sm"
                          >
                            <Text isTruncated>
                              <FormattedMessage id="generic.plans.free" defaultMessage="Free" />
                            </Text>
                          </Th>
                          <Th
                            background="gray.500"
                            color="white"
                            fontWeight="600"
                            textAlign="center"
                            fontSize="sm"
                          >
                            <Text isTruncated>
                              <FormattedMessage id="generic.plans.basic" defaultMessage="Basic" />
                            </Text>
                          </Th>
                          <Th
                            background="blue.700"
                            color="white"
                            fontWeight="600"
                            textAlign="center"
                            fontSize="sm"
                          >
                            <Text isTruncated>
                              <FormattedMessage
                                id="generic.plans.professional"
                                defaultMessage="Professional"
                              />
                            </Text>
                          </Th>
                          <Th
                            background="purple.600"
                            color="white"
                            fontWeight="600"
                            textAlign="center"
                            fontSize="sm"
                          >
                            <Text isTruncated>
                              <FormattedMessage
                                id="generic.plans.enterprise"
                                defaultMessage="Enterprise"
                              />
                            </Text>
                          </Th>
                        </>
                      ) : null}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {entry.features.map((feature, i) => {
                      return (
                        <Tr key={i}>
                          <Td>{feature.label}</Td>
                          {plans.map((_, j) => (
                            <Td key={j}>
                              <Center>
                                {plans.slice(0, j + 1).includes(feature.plan) ? (
                                  <CircleCheckFilledIcon boxSize={5} color="purple.400" />
                                ) : feature.plan === "ON_DEMAND" ? (
                                  <FormattedMessage
                                    id="component.pricing-table.on-demand"
                                    defaultMessage="On demand"
                                  />
                                ) : (
                                  <CircleCrossFilledIcon boxSize={5} color="gray.400" />
                                )}
                              </Center>
                            </Td>
                          ))}
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Fragment>
              );
            })}
          </Table>
        </Stack>
      </Stack>
    </Card>
  );
}

import { Center, Heading, Stack, Text } from "@chakra-ui/layout";
import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { CircleCheckFilledIcon, CircleCrossFilledIcon } from "@parallel/chakra/icons";
import { Card, CardProps } from "@parallel/components/common/Card";
import { FormattedMessage } from "react-intl";
import { usePricingList } from "../../../utils/usePricingList";

export function PublicPricingTable(props: CardProps) {
  const list = usePricingList();

  return (
    <Card {...props} px={8} py={6}>
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
              borderTop: 0,
              borderBottom: 0,
            },
          }}
        >
          {list.map((entry, index) => {
            return (
              <Table key={index}>
                <Thead>
                  <Tr display="flex" alignItems="center">
                    <Th
                      flexGrow={5}
                      flexBasis={0}
                      fontWeight="600"
                      color="purple.800"
                      px={4}
                      py={2}
                      fontSize="sm"
                    >
                      <Text>{entry.category}</Text>
                    </Th>
                    {index === 0 ? (
                      <>
                        <Th
                          flexGrow={2}
                          flexBasis={0}
                          background="gray.400"
                          color="white"
                          fontWeight="600"
                          px={4}
                          py={2}
                          textAlign="center"
                          fontSize="sm"
                        >
                          <Text isTruncated>
                            <FormattedMessage id="page.pricing.free" defaultMessage="Free" />
                          </Text>
                        </Th>
                        <Th
                          flexGrow={2}
                          flexBasis={0}
                          background="gray.500"
                          color="white"
                          fontWeight="600"
                          px={4}
                          py={2}
                          textAlign="center"
                          fontSize="sm"
                        >
                          <Text isTruncated>
                            <FormattedMessage id="page.pricing.basic" defaultMessage="Basic" />
                          </Text>
                        </Th>
                        <Th
                          flexGrow={2}
                          flexBasis={0}
                          background="blue.700"
                          color="white"
                          fontWeight="600"
                          px={4}
                          py={2}
                          textAlign="center"
                          fontSize="sm"
                        >
                          <Text isTruncated>
                            <FormattedMessage
                              id="page.pricing.professional"
                              defaultMessage="Professional"
                            />
                          </Text>
                        </Th>
                        <Th
                          flexGrow={2}
                          flexBasis={0}
                          background="purple.600"
                          color="white"
                          fontWeight="600"
                          px={4}
                          py={2}
                          textAlign="center"
                          fontSize="sm"
                        >
                          <Text isTruncated>
                            <FormattedMessage
                              id="page.pricing.enterprise"
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
                    const colorGrayWhite = index === 0 ? "gray.75" : "white";
                    const colorWhiteGray = index === 0 ? "white" : "gray.75";

                    return (
                      <Tr key={i} display="flex">
                        <Td
                          flexGrow={5}
                          flexBasis={0}
                          py={2}
                          px={4}
                          backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                        >
                          <Text>{feature.label}</Text>
                        </Td>
                        <Td
                          flexGrow={2}
                          flexBasis={0}
                          px={4}
                          py={2}
                          backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                        >
                          <Center>
                            {feature.plan === "FREE" ? (
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
                        <Td
                          flexGrow={2}
                          flexBasis={0}
                          px={4}
                          py={2}
                          backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                        >
                          <Center>
                            {feature.plan === "BASIC" || feature.plan === "FREE" ? (
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
                        <Td
                          flexGrow={2}
                          flexBasis={0}
                          px={4}
                          py={2}
                          backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                        >
                          <Center>
                            {feature.plan === "BASIC" ||
                            feature.plan === "FREE" ||
                            feature.plan === "PROFESSIONAL" ? (
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
                        <Td
                          flexGrow={2}
                          flexBasis={0}
                          px={4}
                          py={2}
                          textAlign="center"
                          backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                        >
                          <Center>
                            {feature.plan === "BASIC" ||
                            feature.plan === "FREE" ||
                            feature.plan === "PROFESSIONAL" ||
                            feature.plan === "ENTERPRISE" ? (
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
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

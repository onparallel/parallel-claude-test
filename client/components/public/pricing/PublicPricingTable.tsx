import { Box, Center, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
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

        <Stack spacing={8}>
          {list.map((entry, index) => {
            return (
              <Stack key={index}>
                <HStack fontSize="sm" textTransform="uppercase">
                  <Box px={4} flexGrow={5} flexBasis={0} fontWeight="600" color="purple.800">
                    <Text>{entry.category}</Text>
                  </Box>
                  {index === 0 ? (
                    <>
                      <Box
                        flexGrow={2}
                        flexBasis={0}
                        background="gray.400"
                        color="white"
                        fontWeight="600"
                        px={4}
                        py={1}
                        textAlign="center"
                      >
                        <Text isTruncated>
                          <FormattedMessage id="page.pricing.free" defaultMessage="Free" />
                        </Text>
                      </Box>
                      <Box
                        flexGrow={2}
                        flexBasis={0}
                        background="gray.500"
                        color="white"
                        fontWeight="600"
                        px={4}
                        py={1}
                        textAlign="center"
                      >
                        <Text isTruncated>
                          <FormattedMessage id="page.pricing.basic" defaultMessage="Basic" />
                        </Text>
                      </Box>
                      <Box
                        flexGrow={2}
                        flexBasis={0}
                        background="blue.700"
                        color="white"
                        fontWeight="600"
                        px={4}
                        py={1}
                        textAlign="center"
                      >
                        <Text isTruncated>
                          <FormattedMessage
                            id="page.pricing.professional"
                            defaultMessage="Professional"
                          />
                        </Text>
                      </Box>
                      <Box
                        flexGrow={2}
                        flexBasis={0}
                        background="purple.600"
                        color="white"
                        fontWeight="600"
                        px={4}
                        py={1}
                        textAlign="center"
                      >
                        <Text isTruncated>
                          <FormattedMessage
                            id="page.pricing.enterprise"
                            defaultMessage="Enterprise"
                          />
                        </Text>
                      </Box>
                    </>
                  ) : null}
                </HStack>
                {entry.features.map((feature, i) => {
                  const colorGrayWhite = index === 0 ? "gray.75" : "white";
                  const colorWhiteGray = index === 0 ? "white" : "gray.75";

                  return (
                    <HStack key={i}>
                      <Box
                        flexGrow={5}
                        flexBasis={0}
                        py={1}
                        px={4}
                        backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                      >
                        <Text>{feature.label}</Text>
                      </Box>
                      <Center
                        flexGrow={2}
                        flexBasis={0}
                        px={4}
                        py={1.5}
                        backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                      >
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
                      <Center
                        flexGrow={2}
                        flexBasis={0}
                        px={4}
                        py={1.5}
                        backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                      >
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
                      <Center
                        flexGrow={2}
                        flexBasis={0}
                        px={4}
                        py={1.5}
                        backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                      >
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
                      <Center
                        flexGrow={2}
                        flexBasis={0}
                        px={4}
                        py={1.5}
                        textAlign="center"
                        backgroundColor={i % 2 ? colorGrayWhite : colorWhiteGray}
                      >
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
                    </HStack>
                  );
                })}
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

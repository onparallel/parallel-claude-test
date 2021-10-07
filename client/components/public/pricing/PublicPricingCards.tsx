import { Button } from "@chakra-ui/button";
import {
  Grid,
  GridProps,
  Heading,
  List,
  ListIcon,
  ListItem,
  Stack,
  StackProps,
  Text,
} from "@chakra-ui/layout";
import { CheckIcon } from "@parallel/chakra/icons";
import { Card, CardProps } from "@parallel/components/common/Card";
import { Divider } from "@parallel/components/common/Divider";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { usePricingList } from "../../../utils/usePricingList";
import { PublicSwitchValues } from "./PublicSwitchPricing";

interface PublicPricingCardsProps extends GridProps {
  billing?: PublicSwitchValues;
  hideFeatures?: boolean;
}

const HUBSPOT_FORM = {
  es: "https://share.hsforms.com/1Hgh7zQXGRrqHTngca1ftTw3zfl0",
  en: "https://share.hsforms.com/1EOhegQqeTq2qGlQPdVbxEg3zfl0",
};

interface PricingCardProps extends CardProps {}

const PricingCard = ({ children, ...props }: PricingCardProps) => (
  <Card flex="1" p={6} display="flex" flexDirection="column" alignItems="center" {...props}>
    {children}
  </Card>
);

interface DetailsStackProps extends StackProps {}

const DetailsStack = ({ children, ...props }: DetailsStackProps) => {
  return (
    <Stack textAlign="center" spacing={4} maxWidth="sm" w="full" {...props}>
      {children}
    </Stack>
  );
};

export function PublicPricingCards({
  billing = "monthly",
  hideFeatures,
  ...props
}: PublicPricingCardsProps) {
  const list = usePricingList();
  const { locale = "es", push } = useRouter();

  const plans = {
    free: {
      users: 1,
      petitions: 20,
      price: {
        monthly: 0,
        yearly: 0,
      },
    },
    basic: {
      users: 3,
      petitions: 40,
      price: {
        monthly: 40,
        yearly: 33,
      },
    },
    professional: {
      users: 5,
      petitions: 70,
      price: {
        monthly: 100,
        yearly: 83,
      },
    },
  };

  const handleBasicPlanClick = () => {
    window.open(`${HUBSPOT_FORM[locale as "es" | "en"]}?desired_plan=basic`, "_blank");
  };

  const handleProPlanClick = () => {
    window.open(`${HUBSPOT_FORM[locale as "es" | "en"]}?desired_plan=professional`, "_blank");
  };

  const handleEnterprisePlanClick = () => {
    window.open(`${HUBSPOT_FORM[locale as "es" | "en"]}?desired_plan=enterprise`, "_blank");
  };

  const features = list.flatMap((value) => value.features);

  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-pricing" });
    push(`/signup`);
  }

  return (
    <Grid
      {...props}
      templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }}
      flexWrap="wrap"
      gridGap={4}
    >
      {/* Start Free Plan */}
      <PricingCard>
        <DetailsStack>
          <Stack>
            <Heading as="h2" fontSize="2xl" color="gray.500">
              <FormattedMessage id="generic.plans.free" defaultMessage="Free" />
            </Heading>
            <Text fontSize="sm">
              <FormattedMessage
                id="page.pricing.firsts-steps"
                defaultMessage="Your first steps with Parallel"
              />
            </Text>
          </Stack>
          <Text fontWeight="bold" fontSize="2xl">
            <FormattedMessage
              id="page.pricing.euros-always"
              defaultMessage="<big>{amount}€/</big>always"
              values={{
                amount: plans.free.price[billing],
                big: (chunks: any) => (
                  <Text as="span" fontSize="3xl">
                    {chunks}
                  </Text>
                ),
              }}
            />
          </Text>
          <Button onClick={trackCTAClick}>
            <Text as="span" fontWeight="bold">
              <FormattedMessage id="page.pricing.try-it-now" defaultMessage="Try it now" />
            </Text>
          </Button>
          <Stack wordBreak="keep-all" whiteSpace="nowrap">
            <Text>
              <FormattedMessage
                id="page.pricing.only-one-user"
                defaultMessage="{count, plural, one {Only <b>#</b> user} other {Up to <b>#</b> users}}"
                values={{
                  count: plans.free.users,
                }}
              />
            </Text>
            <Text>
              <FormattedMessage
                id="page.pricing.petitions-per-month"
                defaultMessage="<b>{petitions}</b> petitions/month"
                values={{
                  petitions: plans.free.petitions,
                }}
              />
            </Text>
          </Stack>
        </DetailsStack>
        {hideFeatures ? null : (
          <>
            <Divider my={4} minW="200px" w="full" />
            <Stack spacing={4} maxWidth="sm" w="full">
              <List spacing={4} pl={1}>
                {features
                  .filter((feature) => feature.plan === "FREE")
                  .map((feature, index) => {
                    return (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={CheckIcon} color="purple.500" />
                        <Text>{feature.label}</Text>
                      </ListItem>
                    );
                  })}
              </List>
            </Stack>
          </>
        )}
      </PricingCard>
      {/* End Free Plan */}
      {/* Start Base Plan */}
      <PricingCard>
        <DetailsStack>
          <Stack>
            <Heading as="h2" fontSize="2xl" color="gray.600">
              <FormattedMessage id="generic.plans.basic" defaultMessage="Basic" />
            </Heading>
            <Text fontSize="sm">
              <FormattedMessage
                id="page.pricing.connect-workflow"
                defaultMessage="Connect to your workflow"
              />
            </Text>
          </Stack>
          <Text fontWeight="bold" fontSize="2xl">
            <FormattedMessage
              id="page.pricing.euros-month"
              defaultMessage="<big>{amount}€/</big>month"
              values={{
                amount: plans.basic.price[billing],
                big: (chunks: any) => (
                  <Text as="span" fontSize="3xl">
                    {chunks}
                  </Text>
                ),
              }}
            />
          </Text>
          <Button colorScheme="purple" onClick={handleBasicPlanClick}>
            <Text as="span" fontWeight="bold">
              <FormattedMessage
                id="page.pricing.contact-sales"
                defaultMessage="Contact with sales"
              />
            </Text>
          </Button>
          <Stack wordBreak="keep-all" whiteSpace="nowrap">
            <Text>
              <FormattedMessage
                id="page.pricing.only-one-user"
                defaultMessage="{count, plural, one {Only <b>#</b> user} other {Up to <b>#</b> users}}"
                values={{
                  count: plans.basic.users,
                }}
              />
            </Text>
            <Text>
              <FormattedMessage
                id="page.pricing.petitions-per-month"
                defaultMessage="<b>{petitions}</b> petitions/month"
                values={{
                  petitions: plans.basic.petitions,
                }}
              />
            </Text>
          </Stack>
        </DetailsStack>
        {hideFeatures ? null : (
          <>
            <Divider my={4} minW="200px" w="full" />
            <Stack spacing={4} maxWidth="sm" w="full">
              <Text fontSize="xl" fontWeight="bold">
                <FormattedMessage
                  id="page.pricing.all-free-plan"
                  defaultMessage="All included in Free, and also:"
                />
              </Text>
              <List spacing={4} pl={1}>
                {features
                  .filter((feature) => feature.plan === "BASIC")
                  .map((feature, index) => {
                    return (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={CheckIcon} color="purple.500" />
                        <Text>{feature.label}</Text>
                      </ListItem>
                    );
                  })}
              </List>
            </Stack>
          </>
        )}
      </PricingCard>
      {/* End Base Plan */}
      {/* Start Pro Plan */}
      <PricingCard>
        <DetailsStack>
          <Stack>
            <Heading as="h2" fontSize="2xl" color="blue.700">
              <FormattedMessage id="generic.plans.professional" defaultMessage="Professional" />
            </Heading>
            <Text fontSize="sm">
              <FormattedMessage
                id="page.pricing.increase-control"
                defaultMessage="Increase control in your processes"
              />
            </Text>
          </Stack>
          <Text fontWeight="bold" fontSize="2xl">
            <FormattedMessage
              id="page.pricing.euros-month"
              defaultMessage="<big>{amount}€/</big>month"
              values={{
                amount: plans.professional.price[billing],
                big: (chunks: any) => (
                  <Text as="span" fontSize="3xl">
                    {chunks}
                  </Text>
                ),
              }}
            />
          </Text>
          <Button colorScheme="purple" onClick={handleProPlanClick}>
            <Text as="span" fontWeight="bold">
              <FormattedMessage
                id="page.pricing.contact-sales"
                defaultMessage="Contact with sales"
              />
            </Text>
          </Button>
          <Stack>
            <Text>
              <FormattedMessage
                id="page.pricing.only-one-user"
                defaultMessage="{count, plural, one {Only <b>#</b> user} other {Up to <b>#</b> users}}"
                values={{
                  count: plans.professional.users,
                }}
              />
            </Text>
            <Text>
              <FormattedMessage
                id="page.pricing.petitions-per-month"
                defaultMessage="<b>{petitions}</b> petitions/month"
                values={{
                  petitions: plans.professional.petitions,
                }}
              />
            </Text>
          </Stack>
        </DetailsStack>
        {hideFeatures ? null : (
          <>
            <Divider my={4} minW="200px" w="full" />
            <Stack spacing={4} maxWidth="sm" w="full">
              <Text fontSize="xl" fontWeight="bold">
                <FormattedMessage
                  id="page.pricing.all-basic-plan"
                  defaultMessage="All included in Basic, and also:"
                />
              </Text>
              <List spacing={4} pl={1}>
                {features
                  .filter((feature) => feature.plan === "PROFESSIONAL")
                  .map((feature, index) => {
                    return (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={CheckIcon} color="purple.500" />
                        <Text>{feature.label}</Text>
                      </ListItem>
                    );
                  })}
              </List>
            </Stack>
          </>
        )}
      </PricingCard>
      {/* End Pro Plan */}
      {/* Start Enterprise Plan*/}
      <PricingCard>
        <DetailsStack minHeight="246px">
          <Stack>
            <Heading as="h2" fontSize="2xl" color="purple.600">
              <FormattedMessage id="generic.plans.enterprise" defaultMessage="Enterprise" />
            </Heading>
            <Text fontSize="sm">
              <FormattedMessage
                id="page.pricing.personalized-plan"
                defaultMessage="Create your personalized plan"
              />
            </Text>
          </Stack>
          <Text
            fontWeight="bold"
            fontSize="2xl"
            minHeight="45px"
            lineHeight="39px"
            display="flex"
            alignItems="flex-end"
            justifyContent="center"
          >
            <FormattedMessage id="page.pricing.plan-suit-you" defaultMessage="A plan to suit you" />
          </Text>
          <Button colorScheme="purple" onClick={handleEnterprisePlanClick}>
            <Text as="span" fontWeight="bold">
              <FormattedMessage
                id="page.pricing.contact-sales"
                defaultMessage="Contact with sales"
              />
            </Text>
          </Button>
          <Text>
            <FormattedMessage
              id="page.pricing.contact-team-request-budget"
              defaultMessage="<b>Contact with our team</b> to request your budget"
            />
          </Text>
        </DetailsStack>
        {hideFeatures ? null : (
          <>
            <Divider my={4} minW="200px" w="full" />
            <Stack spacing={4} maxWidth="sm" w="full">
              <Text fontSize="xl" fontWeight="bold">
                <FormattedMessage
                  id="page.pricing.all-professional-plan"
                  defaultMessage="All included in Professional, and also:"
                />
              </Text>
              <List spacing={4} pl={1}>
                {features
                  .filter((feature) => feature.plan === "ENTERPRISE")
                  .map((feature, index) => {
                    return (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={CheckIcon} color="purple.500" />
                        <Text>{feature.label}</Text>
                      </ListItem>
                    );
                  })}
              </List>
            </Stack>
          </>
        )}
      </PricingCard>
      {/* End Enterprise Plan */}
    </Grid>
  );
}

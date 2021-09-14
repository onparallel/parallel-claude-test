import { Button } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import {
  Box,
  Grid,
  GridProps,
  Heading,
  List,
  ListIcon,
  ListItem,
  Stack,
  Text,
} from "@chakra-ui/layout";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal";
import { CheckIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Divider } from "@parallel/components/common/Divider";
import { NakedLink } from "@parallel/components/common/Link";
import { useHubspotForm } from "@parallel/utils/useHubspotForm";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PublicSwitchValues } from "./PublicSwitchPricing";
import { PricingListCategory, PricingListFeatures } from "./usePricingList";

interface PublicPricingCardsProps extends GridProps {
  list: PricingListCategory[];
  billing: PublicSwitchValues;
}

export function PublicPricingCards({ list, billing, ...props }: PublicPricingCardsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formId, setFormId] = useState({
    es: "",
    en: "",
  });

  const { query } = useRouter();

  const initHubspotForm = useHubspotForm(
    query.locale
      ? {
          target: "#form-container",
          ...(
            {
              es: {
                portalId: "6692004",
                formId: formId.es,
              },
              en: {
                portalId: "6692004",
                formId: formId.en,
              },
            } as any
          )[query.locale as string],
        }
      : null
  );

  useEffect(() => {
    if (formId.es) {
      initHubspotForm();
      onOpen();
    }
  }, [formId]);

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
    setFormId({
      es: "74f7ac98-03aa-4501-b887-383ef327135c",
      en: "a0a337b0-30c5-48df-a0e0-eb3015677e95",
    });
  };

  const handleProPlanClick = () => {
    setFormId({
      es: "a0a337b0-30c5-48df-a0e0-eb3015677e95",
      en: "0b85dec8-3ccc-4a3e-95e2-a5a43e44abf4",
    });
  };

  const handleEnterprisePlanClick = () => {
    setFormId({
      es: "6a5213c8-2670-430f-895d-1b12242dc2f1",
      en: "fe1cf2c2-07f3-48b2-93e1-5c1443e43873",
    });
  };

  const features = list.reduce<PricingListFeatures[]>((acc, value) => {
    return [...acc, ...value.features];
  }, []);

  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-pricing" });
  }

  return (
    <>
      <Grid
        {...props}
        templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }}
        flexWrap="wrap"
        gridGap={4}
      >
        {/* Start Free Plan */}
        <Card flex="1" p={6} display="flex" flexDirection="column" alignItems="center">
          <Stack textAlign="center" spacing={4} maxWidth="sm" w="full">
            <Stack>
              <Heading as="h2" fontSize="2xl" color="gray.500">
                <FormattedMessage id="page.pricing.free" defaultMessage="Free" />
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
            <NakedLink href="/signup">
              <Button onClick={trackCTAClick}>
                <Text as="span" fontWeight="bold">
                  <FormattedMessage id="page.pricing.try-it-now" defaultMessage="Try it now" />
                </Text>
              </Button>
            </NakedLink>
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
          </Stack>
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
        </Card>
        {/* End Free Plan */}
        {/* Start Base Plan */}
        <Card flex="1" p={6} display="flex" flexDirection="column" alignItems="center">
          <Stack textAlign="center" spacing={4} maxWidth="sm" w="full">
            <Stack>
              <Heading as="h2" fontSize="2xl" color="gray.600">
                <FormattedMessage id="page.pricing.basic" defaultMessage="Basic" />
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
          </Stack>
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
        </Card>
        {/* End Base Plan */}
        {/* Start Pro Plan */}
        <Card flex="1" p={6} display="flex" flexDirection="column" alignItems="center">
          <Stack textAlign="center" spacing={4} maxWidth="sm" w="full">
            <Stack>
              <Heading as="h2" fontSize="2xl" color="gray.700">
                <FormattedMessage id="page.pricing.professional" defaultMessage="Professional" />
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
          </Stack>
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
        </Card>
        {/* End Pro Plan */}
        {/* Start Enterprise Plan*/}
        <Card flex="1" p={6} display="flex" flexDirection="column" alignItems="center">
          <Stack textAlign="center" spacing={4} maxWidth="sm" w="full">
            <Stack>
              <Heading as="h2" fontSize="2xl" color="purple.600">
                <FormattedMessage id="page.pricing.enterprise" defaultMessage="Enterprise" />
              </Heading>
              <Text fontSize="sm">
                <FormattedMessage
                  id="page.pricing.personalized-plan"
                  defaultMessage="Create your personalized plan"
                />
              </Text>
            </Stack>
            <Text fontWeight="bold" fontSize="2xl">
              <FormattedMessage
                id="page.pricing.plan-suit-you"
                defaultMessage="A plan to suit you"
              />
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
          </Stack>
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
        </Card>
        {/* End Enterprise Plan */}
      </Grid>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="page.pricing.modal-title" defaultMessage="Contact with sales" />
          </ModalHeader>
          <ModalCloseButton mt={1} />
          <ModalBody>
            <Stack spacing={4}>
              <Text>
                <FormattedMessage
                  id="page.pricing.modal-body"
                  defaultMessage="Complete the following information and we will contact you as soon as possible."
                />
              </Text>
              <Box id="form-container"></Box>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

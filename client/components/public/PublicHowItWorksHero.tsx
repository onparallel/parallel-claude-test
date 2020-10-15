import {
  AspectRatio,
  Box,
  BoxProps,
  Button,
  Flex,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/core";
import { useRouter } from "next/router";
import { useCallback, useState, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import { Card } from "../common/Card";
import { NakedLink } from "../common/Link";
import { Spacer } from "../common/Spacer";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicHowItWorksHero({ ...props }: BoxProps) {
  const { query } = useRouter();
  const intl = useIntl();
  const [index, setIndex] = useState(0);
  const steps = [
    {
      header: (
        <FormattedMessage
          id="public.how-it-works-hero.send-parallel"
          defaultMessage="Send a Parallel"
        />
      ),
      description: (
        <>
          <Text>
            <FormattedMessage
              id="public.how-it-works-hero.start-petition-1"
              defaultMessage="Start with a template or do it from scratch."
            />
          </Text>
          <Text marginTop={2}>
            <FormattedMessage
              id="public.how-it-works-hero.start-petition-2"
              defaultMessage="It is as simple as creating a form."
            />
          </Text>
        </>
      ),
      image: "how_it_works_1",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-1",
        defaultMessage:
          "A screenshot of the app showing the creation of a petition.",
      }),
    },
    {
      header: (
        <FormattedMessage
          id="public.how-it-works-hero.let-client-complete"
          defaultMessage="Let them complete at their own pace"
        />
      ),
      description: (
        <>
          <Text>
            <FormattedMessage
              id="public.how-it-works-hero.client-timings-1"
              defaultMessage="Your recipients can return as many times as they need to complete it."
            />
          </Text>
          <Text marginTop={2}>
            <FormattedMessage
              id="public.how-it-works-hero.client-timings-2"
              defaultMessage="In the meantime, track it or automate it easily."
            />
          </Text>
        </>
      ),
      image: "how_it_works_2",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-2",
        defaultMessage:
          "A screenshot of the app showing how you can schedule the sendout of a petition so the email arrives when the user decides.",
      }),
    },
    {
      header: (
        <FormattedMessage
          id="public.how-it-works-hero.receive-inbox"
          defaultMessage="Receive all the information on time"
        />
      ),
      description: (
        <FormattedMessage
          id="public.how-it-works-hero.review"
          defaultMessage="Review, approve or reject, and communicate within Parallel."
        />
      ),
      image: "how_it_works_3",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-3",
        defaultMessage:
          "A screenshot of the app showing the petitions the user has created with some information for each one so the user can quickly see the overall status.",
      }),
    },
    {
      header: (
        <FormattedMessage
          id="public.how-it-works-hero.share"
          defaultMessage="Share it with your team"
        />
      ),
      description: (
        <FormattedMessage
          id="public.how-it-works-hero.keep-working"
          defaultMessage="Share the Parallel with your team to keep working collaboratively."
        />
      ),
      image: "how_it_works_4",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-4",
        defaultMessage:
          "A screenshot of the app showing that the petition can be shared with other members from your team and enable collaboration.",
      }),
    },
  ];

  const handleImageClick = useCallback(
    () => setIndex((state) => (state + 1) % steps.length),
    [steps.length]
  );

  return (
    <PublicContainer
      {...props}
      wrapper={{
        paddingY: 16,
        textAlign: "center",
        backgroundColor: "white",
      }}
    >
      <Heading as="h2" size="xl" fontWeight="bold">
        <FormattedMessage
          id="public.how-it-works-hero.title"
          defaultMessage="How it works"
        />
      </Heading>
      <Heading as="h3" size="md" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.how-it-works-hero.description"
          defaultMessage="Designed to make work easier for you, your team, and your clients."
        />
      </Heading>
      <Stack
        direction={{ base: "column", lg: "row" }}
        alignItems={{ base: "center", md: "stretch" }}
        marginTop={16}
        justifyContent="space-evenly"
        spacing={6}
      >
        <Grid
          width={{ base: "320px", md: "initial", lg: "320px" }}
          gridTemplateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr" }}
          gridGap={6}
        >
          {steps.map((step, i) => (
            <Step
              key={i}
              header={step.header}
              description={step.description}
              isActive={index === i}
              onClick={() => setIndex(i)}
            />
          ))}
        </Grid>
        <Flex
          flex="3"
          justifyContent="center"
          display={{ base: "none", md: "flex" }}
          maxWidth={{ lg: "720px" }}
          alignItems="center"
        >
          <Box flex="1" maxWidth="720px">
            <SwitchTransition mode="out-in">
              <CSSTransition
                key={index}
                timeout={{ enter: 300, exit: 200 }}
                addEndListener={(node, done) => {
                  node.addEventListener("transitionend", done, false);
                }}
                classNames="fade"
              >
                <AspectRatio
                  ratio={2520 / 1606}
                  onClick={handleImageClick}
                  willChange="opacity"
                  sx={{
                    "&.fade": {
                      "&-enter": { opacity: 0 },
                      "&-enter-active": {
                        opacity: 1,
                        transition: "opacity 300ms cubic-bezier(0,0,.2,1)",
                      },
                      "&-exit": {
                        opacity: 1,
                      },
                      "&-exit-active": {
                        opacity: 0,
                        transition: "opacity 200ms cubic-bezier(.4,0,1,1)",
                      },
                    },
                  }}
                >
                  <Card overflow="hidden" role="button">
                    <Image
                      src={`/static/images/${steps[index].image}_${query.locale}.png`}
                      alt={`${steps[index].alt}`}
                    />
                  </Card>
                </AspectRatio>
              </CSSTransition>
            </SwitchTransition>
          </Box>
        </Flex>
      </Stack>
      <Flex marginTop={16} justifyContent="center">
        <NakedLink href="/invite">
          <Button as="a" colorScheme="purple">
            <FormattedMessage
              id="public.invite-button"
              defaultMessage="Request an invite"
            />
          </Button>
        </NakedLink>
      </Flex>
    </PublicContainer>
  );
}

function Step({
  header,
  description,
  isActive,
  ...props
}: {
  header: ReactNode;
  description: ReactNode;
  isActive: boolean;
} & BoxProps) {
  return (
    <Card
      padding={5}
      backgroundColor={{ base: "white", md: isActive ? "gray.100" : "white" }}
      cursor={{ base: "default", md: "pointer" }}
      role="button"
      textAlign="left"
      {...props}
    >
      <Heading as="h4" size="sm">
        {header}
      </Heading>
      <Text marginTop={2} fontSize="sm">
        {description}
      </Text>
    </Card>
  );
}

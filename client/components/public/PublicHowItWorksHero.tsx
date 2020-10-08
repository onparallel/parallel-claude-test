import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Image,
  Text,
} from "@chakra-ui/core";
import { useCallback, useState, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import { Card } from "../common/Card";
import { NakedLink } from "../common/Link";
import { Spacer } from "../common/Spacer";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicHowItWorksHero({ ...props }: BoxProps) {
  const intl = useIntl();
  const [index, setIndex] = useState(0);
  const onClick = useCallback(() => setIndex((state) => (state + 1) % 4), []);

  const images = [
    {
      name: "how_it_works_1",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-1",
        defaultMessage:
          "A screenshot of the app showing the creation of a petition.",
      }),
    },
    {
      name: "how_it_works_2",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-2",
        defaultMessage:
          "A screenshot of the app showing how you can schedule the sendout of a petition so the email arrives when the user decides.",
      }),
    },
    {
      name: "how_it_works_3",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-3",
        defaultMessage:
          "A screenshot of the app showing the petitions the user has created with some information for each one so the user can quickly see the overall status.",
      }),
    },
    {
      name: "how_it_works_4",
      alt: intl.formatMessage({
        id: "public.how-it-works-hero.screenshot-3",
        defaultMessage:
          "A screenshot of the app showing the petitions the user has created with some information for each one so the user can quickly see the overall status.",
      }),
    },
  ];

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
      <Flex
        flexDirection={{ base: "column", lg: "row" }}
        alignItems={{ base: "center", md: "stretch" }}
        marginTop={16}
        justifyContent="space-evenly"
      >
        <Flex
          flex="1"
          maxWidth={{ base: "320px", md: "initial", lg: "320px" }}
          flexDirection={{ base: "column", md: "row", lg: "column" }}
          alignItems={{ base: "center", md: "stretch" }}
        >
          <Step
            header={
              <FormattedMessage
                id="public.how-it-works-hero.send-parallel"
                defaultMessage="Send a Parallel"
              />
            }
            description={
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
                    defaultMessage="As simple as creating a form."
                  />
                </Text>
              </>
            }
            isActive={index === 0}
            onClick={() => setIndex(0)}
          />
          <Spacer minHeight={6} minWidth={6} />
          <Step
            header={
              <FormattedMessage
                id="public.how-it-works-hero.let-client-complete"
                defaultMessage="Let them complete at their own peace"
              />
            }
            description={
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
                    defaultMessage="In the meantime, easily track or automate."
                  />
                </Text>
              </>
            }
            isActive={index === 1}
            onClick={() => setIndex(1)}
          />
          <Spacer minHeight={6} minWidth={6} />
          <Step
            header={
              <FormattedMessage
                id="public.how-it-works-hero.receive-inbox"
                defaultMessage="Receive all the information on time"
              />
            }
            description={
              <FormattedMessage
                id="public.how-it-works-hero.review"
                defaultMessage="Review, approve or reject, and communicate within Parallel if necessary."
              />
            }
            isActive={index === 2}
            onClick={() => setIndex(2)}
          />
          <Spacer minHeight={6} minWidth={6} />
          <Step
            header={
              <FormattedMessage
                id="public.how-it-works-hero.share"
                defaultMessage="Share it with your team"
              />
            }
            description={
              <FormattedMessage
                id="public.how-it-works-hero.keep-working"
                defaultMessage="Share the Parallel to keep working with your team."
              />
            }
            isActive={index === 3}
            onClick={() => setIndex(3)}
          />
        </Flex>
        <Flex
          flex="3"
          justifyContent="center"
          display={{ base: "none", md: "flex" }}
          marginTop={{ sm: 6, lg: 0 }}
          marginLeft={{ lg: 6 }}
          maxWidth={{ lg: "720px" }}
          alignItems="center"
        >
          <Box flex="1" maxWidth="720px">
            <Box
              onClick={onClick}
              paddingTop={Math.round((520 / 720) * 10000) / 100 + "%"}
              position="relative"
            >
              <SwitchTransition mode="out-in">
                <CSSTransition
                  key={index}
                  timeout={{ enter: 300, exit: 200 }}
                  addEndListener={(node, done) => {
                    node.addEventListener("transitionend", done, false);
                  }}
                  classNames="fade"
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
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
                    <Card overflow="hidden">
                      <Image
                        src={`/static/images/${images[index].name}.png`}
                        srcSet={[2, 3]
                          .map(
                            (size) =>
                              `/static/images/${images[index].name}@${size}x.png ${size}x`
                          )
                          .join(",")}
                        alt={`${images[index].alt}`}
                      />
                    </Card>
                  </Box>
                </CSSTransition>
              </SwitchTransition>
            </Box>
          </Box>
        </Flex>
      </Flex>
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
      <Text marginTop={4} fontSize="sm">
        {description}
      </Text>
    </Card>
  );
}

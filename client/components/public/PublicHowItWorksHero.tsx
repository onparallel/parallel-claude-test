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
  const onClick = useCallback(() => setIndex((state) => (state + 1) % 3), []);

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
          id="public.how-it-works-hero.description-1"
          defaultMessage="In 3 easy steps you can create a request with the documentation you need your client to send you."
        />
        <br />
        <FormattedMessage
          id="public.how-it-works-hero.description-2"
          defaultMessage="Our platform is secure, so you can focus on what's important until we notify you that your client has already sent everything."
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
                id="public.how-it-works-hero.create-request"
                defaultMessage="Create your request"
              />
            }
            description={
              <FormattedMessage
                id="public.how-it-works-hero.user-friendly"
                defaultMessage="Use our friendly and easy to use interface. Tell us what documentation you need and who has to send it to you."
              />
            }
            isActive={index === 0}
            onClick={() => setIndex(0)}
          />
          <Spacer minHeight={6} minWidth={6} />
          <Step
            header={
              <FormattedMessage
                id="public.how-it-works-hero.set-date"
                defaultMessage="Set a delivery deadline"
              />
            }
            description={
              <FormattedMessage
                id="public.how-it-works-hero.client-timings"
                defaultMessage="We automate the information request process. Your client will not know that it is not you who sends the emails."
              />
            }
            isActive={index === 1}
            onClick={() => setIndex(1)}
          />
          <Spacer minHeight={6} minWidth={6} />
          <Step
            header={
              <FormattedMessage
                id="public.how-it-works-hero.receive-inbox"
                defaultMessage="Receive it on time in your inbox"
              />
            }
            description={
              <FormattedMessage
                id="public.how-it-works-hero.focus-on-work"
                defaultMessage="We will send reminders to your client so you don't have to worry about a thing. When everything is ready, you will receive a notification."
              />
            }
            isActive={index === 2}
            onClick={() => setIndex(2)}
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

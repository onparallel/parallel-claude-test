import { Box, BoxProps, Flex, Heading, Stack, Text } from "@chakra-ui/core";
import { ReactNode, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { animated, useTransition } from "react-spring";
import { PublicContainer } from "./layout/PublicContainer";
import { Spacer } from "../common/Spacer";
import { Card } from "../common/Card";

const IMAGES = [
  { id: 0, url: "/static/images/newrequest.png" },
  { id: 1, url: "/static/images/uploadview.png" },
  { id: 2, url: "/static/images/downloadview.png" },
];

export function PublicHeroHowItWorks({ ...props }: BoxProps) {
  const intl = useIntl();
  const [index, setIndex] = useState(0);
  const onClick = useCallback(() => setIndex((state) => (state + 1) % 3), []);
  const transitions = useTransition(IMAGES[index], (i) => i.id, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return (
    <PublicContainer
      {...props}
      wrapper={{
        paddingY: 16,
        textAlign: "center",
        backgroundColor: "white",
      }}
    >
      <Heading as="h2" fontSize="3xl" fontWeight="light" color="purple.500">
        <FormattedMessage
          id="public.home.hero-how-it-works"
          defaultMessage="How it works"
        ></FormattedMessage>
      </Heading>
      <Heading as="h3" fontSize="xl" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.home.hero-discover-use"
          defaultMessage="Discover what you can do with Parallel"
        ></FormattedMessage>
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
                id="public.popular.create-request"
                defaultMessage="Create your request"
              ></FormattedMessage>
            }
            description={
              <FormattedMessage
                id="public.popular.user-friendly"
                defaultMessage="Use our user-friendly interface to program your information request. We will handle the rest."
              ></FormattedMessage>
            }
            isActive={index === 0}
            onClick={() => setIndex(0)}
          />
          <Spacer minHeight={6} minWidth={6} />
          <Step
            header={
              <FormattedMessage
                id="public.popular.clients-upload"
                defaultMessage="Let clients upload at their pace"
              ></FormattedMessage>
            }
            description={
              <FormattedMessage
                id="public.popular.client-timings"
                defaultMessage="Because real life is asynchronous, allow your clients to work at their own timings. Let us remind them if needed."
              ></FormattedMessage>
            }
            isActive={index === 1}
            onClick={() => setIndex(1)}
          />
          <Spacer minHeight={6} minWidth={6} />
          <Step
            header={
              <FormattedMessage
                id="public.popular.focus"
                defaultMessage="Focus on what really matters"
              ></FormattedMessage>
            }
            description={
              <FormattedMessage
                id="public.popular.focus-on-work"
                defaultMessage="Focus on your work and stop sending emails back and forth. We will let you know when the information is ready."
              ></FormattedMessage>
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
              {transitions.map(({ item, props, key }) => {
                return (
                  <animated.div
                    key={key}
                    style={{
                      ...props,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      willChange: "opacity",
                      backgroundImage: `url(${item.url})`,
                    }}
                  ></animated.div>
                );
              })}
            </Box>
          </Box>
        </Flex>
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
      <Heading as="h4" fontSize="md" color="purple.500">
        {header}
      </Heading>
      <Text marginTop={2} fontSize="sm">
        {description}
      </Text>
    </Card>
  );
}

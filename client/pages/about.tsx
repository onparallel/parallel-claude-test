import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { FormattedMessage, useIntl } from "react-intl";

export default function About() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.about.title",
        defaultMessage: "About",
      })}
      description={intl.formatMessage({
        id: "public.about.meta-description",
        defaultMessage: "Learn more about Parallel's mission and our story",
      })}
    >
      <PublicContainer textAlign="center" wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}>
        <Box maxWidth="700px" marginX="auto">
          <Heading as="h1" fontFamily="hero" size="3xl" fontWeight="light">
            <FormattedMessage
              id="public.about.mission"
              defaultMessage="Our mission is to free the time and minds of professionals"
            />
          </Heading>
          <Text marginTop={12} fontSize="lg">
            <FormattedMessage
              id="public.about.tech-company"
              defaultMessage="Parallel is a technology company that builds the next generation tools for professionals daily tasks."
            />
          </Text>
        </Box>
      </PublicContainer>
      <PublicContainer
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading size="xl" fontWeight="light" color="purple.600">
          <FormattedMessage id="public.about.our-story" defaultMessage="Our story" />
        </Heading>
        <Stack spacing={8} marginTop={8} maxWidth="720px" marginX="auto" textAlign="center">
          <Text>
            <FormattedMessage
              id="public.about.story-1"
              defaultMessage="When we were in our previous jobs, we realized that in almost all the topics we were carrying, it was usual to ask for information, it being usual for customers to take a long time to send the information we needed to work."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public.about.story-2"
              defaultMessage="That information we requested was essential to start working."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public.about.story-3"
              defaultMessage="When asking other professionals, many agreed that this same situation often happened to them. It did not matter if at the time of requesting the information we left it beautiful and easily understood, customers rarely responded to the email with all the information."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public.about.story-4"
              defaultMessage="It was common for customers to send the information with an eyedropper or forget to send certain documents. This forced us to constantly chase customers so that we could have all the information."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public.about.story-5"
              defaultMessage="We began to investigate what tools in the market could solve that situation and not seeing any tool that solved it well and in a simple way we decided to solve it ourselves."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public.about.story-6"
              defaultMessage="At that time Parallel was born."
            />
          </Text>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

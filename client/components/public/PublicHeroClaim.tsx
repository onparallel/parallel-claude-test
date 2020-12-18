import { Box, BoxProps, Heading, Image, Text, Flex } from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicHeroClaim({ ...props }: BoxProps) {
  return (
    <PublicContainer
      {...props}
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },
        textAlign: "center",
      }}
    >
      <Heading as="h2" size="xl" fontWeight="bold">
        <FormattedMessage
          id="public.benefits.title"
          defaultMessage="A powerful and flexible tool for your workflows"
        />
      </Heading>
      <Heading
        as="h3"
        size="md"
        fontWeight="light"
        marginTop={4}
        marginBottom={8}
      >
        <FormattedMessage
          id="public.benefits.description"
          defaultMessage="Obtain the information you need and focus on what really matters."
        />
      </Heading>
      <Flex justifyContent="center" flexWrap="wrap">
        <Feature
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_folder.svg`}
          header={
            <FormattedMessage
              id="public.claim.productivity"
              defaultMessage="Increase productivity"
            />
          }
          description={
            <FormattedMessage
              id="public.claim.obtain-organized-information"
              defaultMessage="Obtain the information organized to optimize your work."
            />
          }
        />
        <Feature
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_progress.svg`}
          header={
            <FormattedMessage
              id="public.claim.speed"
              defaultMessage="Speed up processes"
            />
          }
          description={
            <FormattedMessage
              id="public.claim.processes"
              defaultMessage="Use a tool that scales to work better and make your processes flow."
            />
          }
        />
        <Feature
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_checklist.svg`}
          header={
            <FormattedMessage
              id="public.claim.client-experience"
              defaultMessage="Improve your clients' experience"
            />
          }
          description={
            <FormattedMessage
              id="public.claim.help-your-recipients"
              defaultMessage="Help your recipients complete the information more easily."
            />
          }
        />
      </Flex>
    </PublicContainer>
  );
}

function Feature({
  imageUrl,
  header,
  description,
}: {
  imageUrl: string;
  header: ReactNode;
  description: ReactNode;
}) {
  return (
    <Box
      as="section"
      flex="1"
      textAlign="left"
      maxWidth="360px"
      minWidth="300px"
      margin={4}
    >
      <Flex justifyContent="center" alignItems="bottom" height="180px">
        <Image
          src={imageUrl}
          loading="lazy"
          maxWidth="80%"
          role="presentation"
        />
      </Flex>
      <Heading as="h4" size="sm" marginY={4}>
        {header}
      </Heading>
      <Text fontSize="md">{description}</Text>
    </Box>
  );
}

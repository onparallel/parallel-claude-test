import { Box, BoxProps, Grid, Heading, Image, Text } from "@chakra-ui/core";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicHeroClaim({ ...props }: BoxProps) {
  return (
    <PublicContainer
      {...props}
      paddingY={20}
      wrapper={{
        textAlign: "center",
        // backgroundColor: "gray.50",
      }}
    >
      <Heading as="h2" fontSize="3xl" fontWeight="bold">
        <FormattedMessage
          id="public.home.hero-claim"
          defaultMessage="Free your time and your mind"
        />
      </Heading>
      <Heading as="h3" fontSize="xl" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.home.hero-control"
          defaultMessage="Sending a Parallel gives you control over the progress of the documents and the information you need."
        />
      </Heading>
      <Grid
        marginTop={16}
        justifyContent="space-evenly"
        gridGap="24px"
        templateColumns={{
          base: "minmax(auto, 360px)",
          md: "repeat(2, minmax(auto, 360px))",
          lg: "repeat(3, minmax(auto, 360px))",
        }}
      >
        <Feature
          imagesrc="/static/images/folder_black.svg"
          header={
            <FormattedMessage
              id="public.claim.documents-organized"
              defaultMessage="Documents, organized"
            />
          }
          description={
            <FormattedMessage
              id="public.claim.forget-emails"
              defaultMessage="Forget about unorganized emails, petitions in Parallel helps you find, review and work with the relevant documents quickly."
            />
          }
        />
        <Feature
          imagesrc="/static/images/progress.svg"
          header={
            <FormattedMessage
              id="public.claim.speed"
              defaultMessage="Know the status, speed up transactions"
            />
          }
          description={
            <FormattedMessage
              id="public.claim.follow-up"
              defaultMessage="Parallel makes it simple to follow up on the status and the conversations around the transactions for you and your recipients."
            />
          }
        />
        <Feature
          imagesrc="/static/images/checklist.svg"
          header={
            <FormattedMessage
              id="public.claim.focus"
              defaultMessage="Let control give you peace of mind"
            />
          }
          description={
            <FormattedMessage
              id="public.claim.multiple-recipients"
              defaultMessage="With control, you can decide and start working when you know you can or need to. Let focus help you stay productive."
            />
          }
        />
      </Grid>
    </PublicContainer>
  );
}

function Feature({
  imagesrc,
  header,
  description,
  ...props
}: BoxProps & {
  imagesrc: string;
  header: ReactNode;
  description: ReactNode;
}) {
  return (
    <Box textAlign="left" {...props}>
      <Image src={imagesrc} />
      <Heading as="h4" fontSize="md" marginY={4}>
        {header}
      </Heading>
      <Text fontSize="md">{description}</Text>
    </Box>
  );
}

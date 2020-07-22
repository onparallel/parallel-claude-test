import {
  Box,
  BoxProps,
  Grid,
  Heading,
  Image,
  Text,
  Flex,
} from "@chakra-ui/core";
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
      }}
    >
      <Heading as="h2" fontSize="3xl" fontWeight="bold">
        <FormattedMessage
          id="public.home.hero-claim"
          defaultMessage="Free your time and your mind"
        />
      </Heading>
      <Heading
        as="h3"
        fontSize="xl"
        fontWeight="light"
        marginTop={4}
        marginBottom={8}
      >
        <FormattedMessage
          id="public.home.hero-control"
          defaultMessage="Sending a Parallel gives you control over the progress of the documents and the information you need."
        />
      </Heading>
      <Flex justifyContent="center" flexWrap="wrap">
        <Feature
          imageSrc="/static/images/undraw_folder.svg"
          header={
            <FormattedMessage
              id="public.claim.documents-organized"
              defaultMessage="Documents, organized"
            />
          }
          description={
            <FormattedMessage
              id="public.claim.forget-emails"
              defaultMessage="Forget about unorganized emails. Parallel helps you find, review and work with the relevant documents quickly."
            />
          }
        />
        <Feature
          imageSrc="/static/images/undraw_progress.svg"
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
          imageSrc="/static/images/undraw_checklist.svg"
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
      </Flex>
    </PublicContainer>
  );
}

function Feature({
  imageSrc,
  header,
  description,
}: {
  imageSrc: string;
  header: ReactNode;
  description: ReactNode;
}) {
  return (
    <Box flex="1" textAlign="left" maxWidth="360px" minWidth="300px" margin={4}>
      <Flex justifyContent="center" alignItems="bottom" height="180px">
        <Image src={imageSrc} maxWidth="80%" />
      </Flex>
      <Heading as="h4" fontSize="md" marginY={4}>
        {header}
      </Heading>
      <Text fontSize="md">{description}</Text>
    </Box>
  );
}

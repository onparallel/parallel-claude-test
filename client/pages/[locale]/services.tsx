import {
  Box,
  BoxProps,
  Flex,
  Heading,
  Image,
  List,
  ListIcon,
  ListItem,
  Stack,
  Text,
} from "@chakra-ui/core";
import { CheckIcon } from "@parallel/chakra/icons";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Services() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.services.title",
        defaultMessage: "Professional Services",
      })}
      metaDescription={intl.formatMessage({
        id: "public.services.meta-description",
        defaultMessage:
          "Increase your firm efficiency. Manage documents and information checklists efficiently and improve collaboration with your clients and colleagues.",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" size="xl" fontWeight="bold" color="purple.600">
          <FormattedMessage
            id="public.services.hero-title"
            defaultMessage="Increase the efficiency of your firm with Parallel"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.services.checklists-collaboration"
            defaultMessage="Manage documents and information checklists efficiently and improve collaboration with your clients and between your colleagues."
          />
        </Text>
      </PublicContainer>
      <PublicContainer
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg" fontWeight="bold">
          <FormattedMessage
            id="public.services.automate"
            defaultMessage="Automate the collection of information checklists"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <BenefitClaim image="/static/images/undraw_product_iteration.svg">
            <List listStylePosition="outside" spacing={4}>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.automation.templates"
                  defaultMessage="Use templates to work fast and comfortably."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.automation.control"
                  defaultMessage="Review the uploaded information automatically."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.automation.reminders"
                  defaultMessage="Set up reminders or send them manually with one click."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.automation.activity"
                  defaultMessage="Control deadlines and keep an audit log."
                />
              </ListItem>
            </List>
          </BenefitClaim>
        </Stack>
      </PublicContainer>
      <PublicContainer
        // {...props}
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg" fontWeight="bold">
          <FormattedMessage
            id="public.services.collaboration"
            defaultMessage="Boost collaboration"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <BenefitClaim
            reverse
            image="/static/images/undraw_document_collaboration.svg"
          >
            <List listStylePosition="outside" spacing={4}>
              <ListItem display="flex">
                <Text fontWeight="bold">
                  <FormattedMessage
                    id="public.services.collaboration.between-professionals"
                    defaultMessage="Between your profesionals:"
                  />
                </Text>
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.collaboration.avoid-repeated"
                  defaultMessage="Avoiding requesting the same information more than once."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.collaboration.see-reviewed"
                  defaultMessage="Track what documents have already been reviewed."
                />
              </ListItem>
              <ListItem display="flex">
                <Text fontWeight="bold">
                  <FormattedMessage
                    id="public.services.collaboration.with-clients"
                    defaultMessage="With your clients:"
                  />
                </Text>
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.collaboration.no-install"
                  defaultMessage="In a fast way, without downloads or installations."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.collaboration.centralize-conversations"
                  defaultMessage="Centralizing conversations in one place."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.collaboration.anywhere"
                  defaultMessage="So they can work from a computer or mobile device."
                />
              </ListItem>
            </List>
          </BenefitClaim>
        </Stack>
      </PublicContainer>
      <PublicContainer
        // {...props}
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg" fontWeight="bold">
          <FormattedMessage
            id="public.services.knowledge"
            defaultMessage="Reuse knowledge"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <BenefitClaim image="/static/images/undraw_fast_loading.svg">
            <List listStylePosition="outside" spacing={4}>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.knowledge.templates"
                  defaultMessage="Transform your document and information checklists into reusable templates."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.knowledge.share"
                  defaultMessage="Share and distribute templates with specific people, teams, or the entire organization."
                />
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  as={CheckIcon}
                  boxSize="20px"
                  color="purple.500"
                  marginTop={1}
                />
                <FormattedMessage
                  id="public.services.knowledge.scale"
                  defaultMessage="Standardize projects to scale the business."
                />
              </ListItem>
            </List>
          </BenefitClaim>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

function BenefitClaim({
  reverse,
  image,
  children,
  ...props
}: {
  reverse?: boolean;
  image: string;
  children: ReactNode;
} & BoxProps) {
  return (
    <Flex
      {...props}
      alignItems="center"
      direction={{ base: "column", md: reverse ? "row" : "row-reverse" }}
    >
      <Flex flex="1" justifyContent="center">
        <Image src={image} height="250px" role="presentation" />
      </Flex>
      <Box
        flex="1"
        justifyContent="center"
        marginTop={{ base: 8, md: 0 }}
        {...(reverse
          ? { marginLeft: { base: 0, md: 8 } }
          : { marginRight: { base: 0, md: 8 } })}
      >
        {children}
      </Box>
    </Flex>
  );
}

export function getStaticProps() {
  return { props: {} };
}

export function getStaticPaths() {
  return {
    paths: languages.map(({ locale }) => ({ params: { locale } })),
    fallback: false,
  };
}

export default Services;

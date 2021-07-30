import { gql } from "@apollo/client";
import {
  Avatar,
  Box,
  Center,
  Grid,
  HStack,
  Image,
  ListItem,
  SimpleGrid,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import { useCategories } from "@parallel/components/public/templates/useCategories";
import { FORMATS } from "@parallel/utils/dates";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { FormattedMessage, useIntl } from "react-intl";

function PublicTemplateDetails() {
  const intl = useIntl();

  const template = {
    name: "Identificación de clientes (KYC) para Prevención de Blanqueo de Capitales",
    updatedAt: new Date().getDate(),
  };

  const categories = useCategories();

  const templateCategories = categories.filter((category) =>
    ["LEGAL", "COMPLIANCE", "CUSTOMER_SERVICE"].includes(category.id)
  );

  const hasConditionalFields = true;

  const templates = [];

  const owner = { fullName: "Derek Lou" };

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.templates",
        defaultMessage: "Templates",
      })}
      description={intl.formatMessage({
        id: "public.templates.meta-description",
        defaultMessage: "Learn more about Parallel's templates",
      })}
    >
      <PublicContainer
        maxWidth="container.xl"
        wrapper={{
          paddingY: 16,
        }}
      >
        <Stack spacing={{ base: 20, md: 28 }}>
          <Stack spacing={12} direction={{ base: "column", md: "row" }}>
            <Grid templateRows="auto 1fr auto" width="100%" flex="1" gap={1}>
              <Text fontSize="sm" color="gray.600">
                <FormattedMessage
                  id="public.template-details.last-updated-on"
                  defaultMessage="Last updated on {date}"
                  values={{
                    date: (
                      <DateTime
                        value={template.updatedAt}
                        format={FORMATS.LL}
                        title={intl.formatDate(template.updatedAt, FORMATS.LLL)}
                      />
                    ),
                  }}
                />
              </Text>
              <Stack spacing={4}>
                <Text fontSize="2xl" fontWeight="bold">
                  {template.name}
                </Text>
                <Text fontSize="xl">
                  <FormattedMessage
                    id="public.template-details.designed-for"
                    defaultMessage="Designed for"
                  />{" "}
                  <EnumerateList
                    maxItems={7}
                    values={templateCategories}
                    renderItem={({ value: { href, label } }, index) => {
                      return (
                        <Link key={index} href={href}>
                          {`${label}`}
                        </Link>
                      );
                    }}
                    type="conjunction"
                  />
                </Text>
              </Stack>
              <HStack paddingTop={6} spacing={1}>
                <Avatar
                  boxSize="40px"
                  name={owner.fullName}
                  src={owner?.avatar ?? undefined}
                  marginRight={2}
                />
                <FormattedMessage
                  id="public.template-card.created-by"
                  defaultMessage="Created by {name} on {orgName}"
                  values={{
                    name: owner.fullName,
                    orgName: (
                      <Text marginLeft={1} as="b">
                        {"orgName"}
                      </Text>
                    ),
                  }}
                />
              </HStack>
            </Grid>
            <Center height="min-content" backgroundColor="blue.50" flex="1">
              <Image
                padding={10}
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/input_radio.png`}
              />
            </Center>
          </Stack>
          <Stack spacing={20} direction={{ base: "column", md: "row" }}>
            <Box
              borderRadius="lg"
              backgroundColor="gray.75"
              paddingX={6}
              paddingY={8}
              height="min-content"
            >
              <Text fontSize="xl" fontWeight="bold">
                <FormattedMessage
                  id="public.template-details.list-includes"
                  defaultMessage="This template includes"
                />
              </Text>
              <UnorderedList paddingX={3} spacing={2} paddingTop={5}>
                <ListItem>
                  <FormattedMessage
                    id="public.template-details.list-number-fields"
                    defaultMessage="{fields} question fields"
                    values={{ fields: 24 }}
                  />
                </ListItem>
                {hasConditionalFields ? (
                  <ListItem>
                    <FormattedMessage
                      id="public.template-details.conditional-fields"
                      defaultMessage="Conditional fields"
                    />
                  </ListItem>
                ) : null}
                <ListItem>
                  <FormattedMessage
                    id="public.template-details.possibility-esignature"
                    defaultMessage="Possibility to enable eSignature"
                  />
                </ListItem>
                <ListItem>
                  Personalized message
                  <FormattedMessage
                    id="public.template-details.personalized-message"
                    defaultMessage="Personalized message"
                  />
                </ListItem>
              </UnorderedList>
            </Box>
            <Stack flex="1" spacing={2}>
              <Text fontSize="x-large" fontWeight="bold" paddingBottom={4}>
                <FormattedMessage
                  id="template-details.about"
                  defaultMessage="About this template"
                />
              </Text>
              {template?.descriptionHtml ? (
                <Text
                  dangerouslySetInnerHTML={{ __html: template.descriptionHtml }}
                />
              ) : (
                <Text textStyle="hint">
                  <FormattedMessage
                    id="template-details.no-description-provided"
                    defaultMessage="No description provided."
                  />
                </Text>
              )}
            </Stack>
          </Stack>
          <Stack spacing={12}>
            <Text
              fontSize="x-large"
              fontWeight="bold"
              textAlign={{ base: "left", md: "center" }}
            >
              <FormattedMessage
                id="public.template-details.other-similar-templates"
                defaultMessage="Other similar templates"
              />
            </Text>
            <SimpleGrid minChildWidth="280px" spacing={10}>
              {templates.slice(0, 3).map((template, index) => {
                return <PublicTemplateCard key={index} template={template} />;
              })}
            </SimpleGrid>
          </Stack>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

PublicTemplateDetails.fragments = {
  PetitionTemplate: gql`
    fragment PublicTemplateDetails_PetitionTemplate on PetitionTemplate {
      id
      name
      descriptionHtml
      updatedAt
      fields {
        id
        visibility
      }
      owner {
        id
        fullName
        organization {
          id
          name
        }
      }
    }
  `,
};

export default PublicTemplateDetails;

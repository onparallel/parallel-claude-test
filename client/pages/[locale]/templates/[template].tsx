import { gql } from "@apollo/client";
import {
  Avatar,
  Box,
  Center,
  Grid,
  HStack,
  Image,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link } from "@parallel/components/common/Link";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import { useCategories } from "@parallel/components/public/templates/useCategories";
import {
  landingTemplateBySlugQuery,
  landingTemplatesQuery,
  landingTemplatesSamplesQuery,
  PublicTemplateCard_LandingTemplateFragment,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { FORMATS } from "@parallel/utils/dates";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { GetServerSidePropsContext } from "next";
import { FormattedMessage, useIntl } from "react-intl";

function PublicTemplateDetails({
  data,
  relatedTemplates,
}: {
  data: landingTemplateBySlugQuery;
  relatedTemplates: PublicTemplateCard_LandingTemplateFragment[];
}) {
  const intl = useIntl();

  const categories = useCategories();

  const { landingTemplateBySlug } = data;

  const {
    name,
    slug,
    backgroundColor,
    ownerFullName,
    organizationName,
    fieldCount,
    hasConditionals,
    descriptionHtml,
    shortDescription,
    updatedAt,
    categories: landingTemplateCategories,
  } = landingTemplateBySlug!;

  const templateCategories = categories.filter((category) =>
    landingTemplateCategories?.includes(category.slug)
  );

  return (
    <PublicLayout
      title={name as string}
      description={shortDescription as string}
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
                        value={updatedAt}
                        format={FORMATS.LL}
                        title={intl.formatDate(updatedAt, FORMATS.LLL)}
                      />
                    ),
                  }}
                />
              </Text>
              <Stack spacing={4}>
                <Text fontSize="2xl" fontWeight="bold">
                  {name}
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
                  name={ownerFullName}
                  src={undefined}
                  marginRight={2}
                />
                <FormattedMessage
                  id="public.template-card.created-by"
                  defaultMessage="Created by {name} on {orgName}"
                  values={{
                    name: ownerFullName,
                    orgName: (
                      <Text marginLeft={1} as="b">
                        {organizationName}
                      </Text>
                    ),
                  }}
                />
              </HStack>
            </Grid>
            <Center
              height="min-content"
              backgroundColor={backgroundColor as any}
              flex="1"
              minHeight="140px"
            >
              <Image
                padding={10}
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/${intl.locale}_${slug}.png`}
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
                    values={{ fields: fieldCount }}
                  />
                </ListItem>
                {hasConditionals ? (
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
              {descriptionHtml ? (
                <Box dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
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

            <Grid
              templateColumns={{
                lg: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
              }}
              gap={6}
            >
              {relatedTemplates.slice(0, 3).map((template, index) => {
                return <PublicTemplateCard key={index} template={template} />;
              })}
            </Grid>
          </Stack>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

PublicTemplateDetails.fragments = {
  LandingTemplate: gql`
    fragment PublicTemplateDetails_LandingTemplate on LandingTemplate {
      id
      name
      slug
      backgroundColor
      categories
      ownerFullName
      organizationName
      fieldCount
      hasConditionals
      descriptionHtml
      shortDescription
      updatedAt
    }
  `,
};

export async function getServerSideProps({
  query: { locale, template },
  req,
}: GetServerSidePropsContext) {
  const client = createApolloClient({}, { req });

  const { data } = await client.query<landingTemplateBySlugQuery>({
    query: gql`
      query landingTemplateBySlug($slug: String!) {
        landingTemplateBySlug(slug: $slug) {
          ...PublicTemplateDetails_LandingTemplate
        }
      }
      ${PublicTemplateDetails.fragments.LandingTemplate}
    `,
    variables: {
      slug: template,
    },
  });

  const categories = data.landingTemplateBySlug?.categories ?? [];

  const getCategoryTemplates = async (category: string) => {
    const { data } = await client.query<landingTemplatesQuery>({
      query: gql`
        query landingTemplates(
          $offset: Int!
          $limit: Int!
          $category: String!
          $locale: PetitionLocale!
        ) {
          landingTemplates(
            offset: $offset
            limit: $limit
            category: $category
            locale: $locale
          ) {
            totalCount
            items {
              ...PublicTemplateCard_LandingTemplate
            }
          }
        }
        ${PublicTemplateCard.fragments.LandingTemplate}
      `,
      variables: {
        offset: 0,
        limit: 4,
        category,
        locale,
      },
    });
    return data.landingTemplates.items.filter((item) => item.slug !== template);
  };

  const getAllCategoriesTemplates = async () => {
    const { data } = await client.query<landingTemplatesSamplesQuery>({
      query: gql`
        query landingTemplatesSamples(
          $offset: Int!
          $limit: Int!
          $locale: PetitionLocale!
        ) {
          landingTemplatesSamples {
            category
            templates(offset: $offset, limit: $limit, locale: $locale) {
              items {
                ...PublicTemplateCard_LandingTemplate
              }
              totalCount
            }
          }
        }
        ${PublicTemplateCard.fragments.LandingTemplate}
      `,
      variables: {
        offset: 0,
        limit: 3,
        locale,
      },
    });

    const someTemplates = data.landingTemplatesSamples
      .filter((sample) => sample.category !== categories[0])
      .reduce((acc, sample) => {
        return [...acc, ...(sample.templates.items ?? [])];
      }, [] as PublicTemplateCard_LandingTemplateFragment[]);

    return someTemplates.filter((item) => item.slug !== template);
  };

  let relatedTemplates = await getCategoryTemplates(categories[0]);

  if (relatedTemplates.length < 3) {
    let moreTemplates: PublicTemplateCard_LandingTemplateFragment[] = [];

    if (categories.length > 1) {
      moreTemplates = await getCategoryTemplates(categories[1]);
    } else {
      moreTemplates = [
        ...moreTemplates,
        ...(await getAllCategoriesTemplates()),
      ];
    }

    relatedTemplates = [...relatedTemplates, ...moreTemplates];
  }

  return { props: { data, relatedTemplates } };
}

export default withApolloData(PublicTemplateDetails);

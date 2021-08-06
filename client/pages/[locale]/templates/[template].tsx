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
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import {
  LandingTemplateDetails_landingTemplateBySlugQuery,
  LandingTemplateDetails_landingTemplateBySlugQueryVariables,
  LandingTemplateDetails_landingTemplatesQuery,
  LandingTemplateDetails_landingTemplatesQueryVariables,
  PetitionLocale,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { FORMATS } from "@parallel/utils/dates";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { Assert } from "@parallel/utils/types";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

function LandingTemplateDetails({
  template,
  relatedTemplates,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();

  const {
    name,
    imageUrl,
    backgroundColor,
    ownerFullName,
    organizationName,
    fieldCount,
    hasConditionals,
    descriptionHtml,
    shortDescription,
    updatedAt,
  } = template!;

  const categoryList = usePublicTemplateCategories();
  const categories = (template.categories ?? [])
    .map((c) => categoryList.find((category) => category.slug === c))
    .filter(isDefined);

  return (
    <PublicLayout
      title={name as string}
      description={shortDescription as string}
      og={{ image: template.imageUrl }}
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
                    values={categories}
                    renderItem={({ value }) => (
                      <Link
                        key={value.slug}
                        locale={template.locale}
                        href={`/templates/categories/${value.slug}`}
                      >
                        {`${value.label}`}
                      </Link>
                    )}
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
                src={
                  imageUrl ??
                  `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/${intl.locale}_radio_button.png`
                }
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
                    defaultMessage="{count} question fields"
                    values={{ count: fieldCount }}
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
              {relatedTemplates.items.map((t) => (
                <PublicTemplateCard key={t.id} template={t} showCategories />
              ))}
            </Grid>
          </Stack>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

LandingTemplateDetails.fragments = {
  LandingTemplate: gql`
    fragment LandingTemplateDetails_LandingTemplate on LandingTemplate {
      id
      name
      slug
      locale
      imageUrl
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

export const getServerSideProps: GetServerSideProps<{
  template: Assert<
    LandingTemplateDetails_landingTemplateBySlugQuery["landingTemplateBySlug"]
  >;
  relatedTemplates: LandingTemplateDetails_landingTemplatesQuery["landingTemplates"];
}> = async function getServerSideProps({
  query: { locale, template: slug },
  req,
}) {
  try {
    const client = createApolloClient({}, { req });

    const {
      data: { landingTemplateBySlug: template },
    } = await client.query<
      LandingTemplateDetails_landingTemplateBySlugQuery,
      LandingTemplateDetails_landingTemplateBySlugQueryVariables
    >({
      query: gql`
        query LandingTemplateDetails_landingTemplateBySlug($slug: String!) {
          landingTemplateBySlug(slug: $slug) {
            ...LandingTemplateDetails_LandingTemplate
          }
        }
        ${LandingTemplateDetails.fragments.LandingTemplate}
      `,
      variables: {
        slug: slug as string,
      },
    });
    if (!template) {
      throw new Error();
    }

    const categories = template.categories ?? [];

    const {
      data: { landingTemplates: relatedTemplates },
    } = await client.query<
      LandingTemplateDetails_landingTemplatesQuery,
      LandingTemplateDetails_landingTemplatesQueryVariables
    >({
      query: gql`
        query LandingTemplateDetails_landingTemplates(
          $offset: Int!
          $limit: Int!
          $locale: PetitionLocale!
          $categories: [String!]
        ) {
          landingTemplates(
            offset: $offset
            limit: $limit
            locale: $locale
            categories: $categories
          ) {
            items {
              ...PublicTemplateCard_LandingTemplate
            }
            totalCount
          }
        }
        ${PublicTemplateCard.fragments.LandingTemplate}
      `,
      variables: {
        offset: 0,
        limit: 3,
        locale: locale as PetitionLocale,
        categories,
      },
    });

    return { props: { template, relatedTemplates } };
  } catch (err) {
    return {
      notFound: true,
    };
  }
};

export default LandingTemplateDetails;

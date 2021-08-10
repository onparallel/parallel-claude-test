import { gql } from "@apollo/client";
import { Flex, Grid, Heading, Stack } from "@chakra-ui/react";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import { PublicTemplatesContainer } from "@parallel/components/public/templates/PublicTemplatesContainer";
import { PublicTemplatesHero } from "@parallel/components/public/templates/PublicTemplatesHero";
import {
  LandingTemplatesCategory_landingTemplatesQuery,
  LandingTemplatesCategory_landingTemplatesQueryVariables,
  LandingTemplatesCategory_landingTemplatesSamplesQuery,
  LandingTemplatesCategory_landingTemplatesSamplesQueryVariables,
  PetitionLocale,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { FormattedMessage, useIntl } from "react-intl";
import { indexBy } from "remeda";

function LandingTemplatesCategory({
  samples,
  templates,
  category,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();
  const categories = usePublicTemplateCategories();
  const samplesByCategory = indexBy(samples, (s) => s.category);
  const filteredCategories = categories.filter(
    (c) => samplesByCategory[c.slug]?.templates.totalCount > 0
  );

  const currentCategory = categories.find((c) => c.slug === category)!;

  const description =
    currentCategory?.description ||
    intl.formatMessage({
      id: "public.templates.meta-description",
      defaultMessage: "Learn more about Parallel templates",
    });

  return (
    <PublicLayout
      title={intl.formatMessage(
        {
          id: "public.template-category-preview.templates-for",
          defaultMessage: "Templates for {category}",
        },
        { category: currentCategory.label }
      )}
      description={description}
    >
      <PublicTemplatesHero />
      <PublicTemplatesContainer categories={filteredCategories}>
        <Stack spacing={6}>
          <Flex height="40px" alignItems="center">
            <Heading as="h1" size="lg">
              <FormattedMessage
                id="public.template-category-preview.templates-for"
                defaultMessage="Templates for {category}"
                values={{ category: currentCategory.label }}
              />
            </Heading>
          </Flex>

          <Grid
            templateColumns={{
              lg: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            }}
            gap={6}
          >
            {templates.items.map((t) => (
              <PublicTemplateCard key={t.id} template={t} />
            ))}
          </Grid>
        </Stack>
      </PublicTemplatesContainer>
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<{
  category: string;
  samples: LandingTemplatesCategory_landingTemplatesSamplesQuery["landingTemplatesSamples"];
  templates: LandingTemplatesCategory_landingTemplatesQuery["landingTemplates"];
}> = async function getServerSideProps({ query: { locale, category }, req }) {
  const client = createApolloClient({}, { req });

  try {
    const {
      data: { landingTemplatesSamples },
    } = await client.query<
      LandingTemplatesCategory_landingTemplatesSamplesQuery,
      LandingTemplatesCategory_landingTemplatesSamplesQueryVariables
    >({
      query: gql`
        query LandingTemplatesCategory_landingTemplatesSamples($locale: PetitionLocale!) {
          landingTemplatesSamples {
            category
            templates(locale: $locale) {
              totalCount
            }
          }
        }
      `,
      variables: {
        locale: locale as PetitionLocale,
      },
    });

    const {
      data: { landingTemplates },
    } = await client.query<
      LandingTemplatesCategory_landingTemplatesQuery,
      LandingTemplatesCategory_landingTemplatesQueryVariables
    >({
      query: gql`
        query LandingTemplatesCategory_landingTemplates(
          $offset: Int!
          $limit: Int!
          $category: String!
          $locale: PetitionLocale!
        ) {
          landingTemplates(
            offset: $offset
            limit: $limit
            categories: [$category]
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
        limit: 50,
        category: category as string,
        locale: locale as PetitionLocale,
      },
    });

    if (!landingTemplates.items.length) {
      throw new Error();
    }

    return {
      props: {
        samples: landingTemplatesSamples,
        templates: landingTemplates,
        category: category as string,
      },
    };
  } catch {
    return {
      notFound: true,
    };
  }
};

export default LandingTemplatesCategory;

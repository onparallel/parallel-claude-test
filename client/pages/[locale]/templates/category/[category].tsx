import { gql } from "@apollo/client";
import { Flex, Grid, Stack, Text } from "@chakra-ui/react";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import { PublicTemplatesContainer } from "@parallel/components/public/templates/PublicTemplatesContainer";
import { PublicTemplatesHero } from "@parallel/components/public/templates/PublicTemplatesHero";
import { useCategories } from "@parallel/components/public/templates/useCategories";
import {
  landingTemplatesQuery,
  landingTemplatesSamplesQuery,
  PublicTemplateCard_LandingTemplateFragment,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function TemplateCategory({
  data,
  categoriesData,
}: {
  data: landingTemplatesQuery;
  categoriesData: landingTemplatesSamplesQuery;
}) {
  const intl = useIntl();
  const router = useRouter();
  let categories = useCategories();

  const currentPath = router.pathname.startsWith("/[locale]")
    ? router.asPath.replace(/^\/[^\/]+/, "")
    : router.asPath;

  const currentCategory = categories.find(
    (category) =>
      currentPath.includes(category.href) &&
      !currentPath.includes(category.href + "/")
  );

  categories.forEach((category) => {
    category.templates = [
      ...(categoriesData.landingTemplatesSamples.find(
        (template) => template.category === category.slug
      )?.templates.items ?? []),
    ];
  });

  categories = categories.filter(
    (category) => category.templates.length || category.slug === "all"
  );

  const {
    items: templates,
  }: { items: PublicTemplateCard_LandingTemplateFragment[] } =
    data?.landingTemplates ?? {};

  const title =
    (currentCategory?.title || currentCategory?.label) ??
    intl.formatMessage({
      id: "public.templates",
      defaultMessage: "Templates",
    });

  const description =
    currentCategory?.description ||
    intl.formatMessage({
      id: "public.templates.meta-description",
      defaultMessage: "Learn more about Parallel's templates",
    });

  return (
    <PublicLayout title={title} description={description}>
      <PublicTemplatesHero />
      <PublicTemplatesContainer categories={categories}>
        <Stack spacing={6}>
          <Flex height="40px" alignItems="flex-end">
            <Text fontSize="2xl" fontWeight="bold">
              <FormattedMessage
                id="public.template-category-preview.templates-for"
                defaultMessage="Templates for {category}"
                values={{ category: currentCategory?.label }}
              />
            </Text>
          </Flex>

          <Grid
            templateColumns={{
              lg: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            }}
            gap={6}
          >
            {templates.map((template, index) => {
              return <PublicTemplateCard key={index} template={template} />;
            })}
          </Grid>
        </Stack>
      </PublicTemplatesContainer>
    </PublicLayout>
  );
}

export async function getServerSideProps({
  query: { locale, category },
  req,
}: GetServerSidePropsContext) {
  const client = createApolloClient({}, { req });

  const { data: categoriesData } =
    await client.query<landingTemplatesSamplesQuery>({
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
        limit: 4,
        locale: locale,
      },
    });

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
      limit: 50,
      category,
      locale,
    },
  });

  if (!data || !data.landingTemplates.items.length) {
    return {
      notFound: true,
    };
  }

  return { props: { data, categoriesData } };
}

export default withApolloData(TemplateCategory);

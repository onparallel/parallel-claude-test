import { gql } from "@apollo/client";
import { Button, Flex, Grid, Heading, Stack } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { LandingTemplateCard } from "@parallel/components/public/templates/LandingTemplateCard";
import { PublicTemplatesContainer } from "@parallel/components/public/templates/PublicTemplatesContainer";
import { PublicTemplatesHero } from "@parallel/components/public/templates/PublicTemplatesHero";
import {
  LandingTemplatesCategory_categorySamplesDocument,
  LandingTemplatesCategory_landingTemplatesDocument,
  LandintTemplatesCategory_LandingTemplateCategorySampleFragment,
  PetitionLocale,
  LandingTemplateCard_LandingTemplateFragment,
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

  return (
    <PublicLayout
      title={intl.formatMessage(
        {
          id: "public.template-category-preview.templates-for",
          defaultMessage: "Templates for {category}",
        },
        { category: currentCategory.label }
      )}
      description={intl.formatMessage({
        id: "public.templates.meta-description",
        defaultMessage: "Learn more about Parallel templates",
      })}
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

          {templates.length === 0 ? (
            <FormattedMessage
              id="public.template-category-empty.coming-soon"
              defaultMessage="More templates coming soon"
            />
          ) : null}
          <Grid
            templateColumns={{
              lg: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            }}
            gap={6}
          >
            {templates.map((t) => (
              <LandingTemplateCard key={t.id} template={t} />
            ))}
          </Grid>
        </Stack>
      </PublicTemplatesContainer>
      <PublicContainer
        paddingY={20}
        maxWidth="container.sm"
        textAlign="center"
        wrapper={{
          backgroundColor: "purple.50",
        }}
      >
        <Heading
          as="h2"
          color="gray.900"
          size="lg"
          fontFamily="hero"
          fontWeight="600"
          lineHeight={1.5}
        >
          <FormattedMessage
            id="public.templates.know-more-about"
            defaultMessage="Do you want to know more about our templates?"
          />
          <br />
          <FormattedMessage id="public.templates.we-show-you" defaultMessage="Let us show you!" />
        </Heading>
        <Flex marginTop={10} justifyContent="center">
          <NakedLink href="/book-demo">
            <Button as="a" colorScheme="purple" size="lg">
              <FormattedMessage id="public.book-demo-button" defaultMessage="Book a demo" />
            </Button>
          </NakedLink>
        </Flex>
      </PublicContainer>
    </PublicLayout>
  );
}

LandingTemplatesCategory.fragments = {
  LandingTemplateCategorySample: gql`
    fragment LandintTemplatesCategory_LandingTemplateCategorySample on LandingTemplateCategorySample {
      category
      templates(locale: $locale) {
        totalCount
      }
    }
  `,
};

LandingTemplatesCategory.queries = [
  gql`
    query LandingTemplatesCategory_landingTemplates(
      $offset: Int!
      $limit: Int!
      $category: String!
      $locale: PetitionLocale!
    ) {
      landingTemplates(offset: $offset, limit: $limit, categories: [$category], locale: $locale) {
        totalCount
        items {
          ...LandingTemplateCard_LandingTemplate
        }
      }
    }
    ${LandingTemplateCard.fragments.LandingTemplate}
  `,
  gql`
    query LandingTemplatesCategory_categorySamples($locale: PetitionLocale!) {
      landingTemplateCategorySamples {
        ...LandintTemplatesCategory_LandingTemplateCategorySample
      }
    }
    ${LandingTemplatesCategory.fragments.LandingTemplateCategorySample}
  `,
];

export const getServerSideProps: GetServerSideProps<{
  category: string;
  samples: LandintTemplatesCategory_LandingTemplateCategorySampleFragment[];
  templates: LandingTemplateCard_LandingTemplateFragment[];
}> = async function getServerSideProps({ req, ...ctx }) {
  const client = createApolloClient({}, { req });
  const category = ctx.query.category as string;
  const locale = ctx.locale as PetitionLocale;

  try {
    const {
      data: { landingTemplateCategorySamples: samples },
    } = await client.query({
      query: LandingTemplatesCategory_categorySamplesDocument,
      variables: { locale },
    });

    const {
      data: {
        landingTemplates: { items: templates },
      },
    } = await client.query({
      query: LandingTemplatesCategory_landingTemplatesDocument,
      variables: { offset: 0, limit: 50, category, locale },
    });

    return {
      props: { samples, templates, category },
    };
  } catch {
    return {
      notFound: true,
    };
  }
};

export default LandingTemplatesCategory;

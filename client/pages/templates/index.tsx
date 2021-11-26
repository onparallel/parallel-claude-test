import { gql } from "@apollo/client";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import { PublicTemplateCategoryPreview } from "@parallel/components/public/templates/PublicTemplateCategoryPreview";
import { PublicTemplatesContainer } from "@parallel/components/public/templates/PublicTemplatesContainer";
import { PublicTemplatesHero } from "@parallel/components/public/templates/PublicTemplatesHero";
import {
  LandingTemplates_categorySamplesDocument,
  PetitionLocale,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { FormattedMessage, useIntl } from "react-intl";
import { indexBy } from "remeda";

function Templates({ samples }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();

  const categories = usePublicTemplateCategories();
  const samplesByCategory = indexBy(samples, (s) => s.category);
  const filteredCategories = categories.filter(
    (c) => samplesByCategory[c.slug]?.templates.totalCount > 0
  );

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.templates",
        defaultMessage: "Templates",
      })}
      description={intl.formatMessage({
        id: "public.templates.meta-description",
        defaultMessage: "Learn more about Parallel templates",
      })}
    >
      <PublicTemplatesHero />
      <PublicTemplatesContainer categories={filteredCategories}>
        {filteredCategories.map((category, index) => {
          return (
            <PublicTemplateCategoryPreview
              key={index}
              category={category}
              templates={samplesByCategory[category.slug].templates.items}
            />
          );
        })}
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
          <NakedLink href="/signup">
            <Button as="a" colorScheme="purple" size="lg">
              <FormattedMessage id="public.try-for-free-button" defaultMessage="Try for free" />
            </Button>
          </NakedLink>
        </Flex>
      </PublicContainer>
    </PublicLayout>
  );
}

Templates.queries = [
  gql`
    query LandingTemplates_categorySamples($offset: Int!, $limit: Int!, $locale: PetitionLocale!) {
      landingTemplateCategorySamples {
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
];

export async function getServerSideProps({ req, ...ctx }: GetServerSidePropsContext) {
  const client = createApolloClient({}, { req });
  const locale = ctx.locale as PetitionLocale;

  const {
    data: { landingTemplateCategorySamples: samples },
  } = await client.query({
    query: LandingTemplates_categorySamplesDocument,
    variables: { offset: 0, limit: 3, locale },
  });
  return {
    props: { samples },
  };
}

export default Templates;

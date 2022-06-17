import { gql } from "@apollo/client";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { LandingTemplateCard } from "@parallel/components/public/templates/LandingTemplateCard";
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
import { useIntl } from "react-intl";
import { indexBy } from "remeda";
import { PublicFooterCTA } from "../../components/public/layout/PublicFooterCTA";

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
      <PublicFooterCTA />
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
            ...LandingTemplateCard_LandingTemplate
          }
          totalCount
        }
      }
    }
    ${LandingTemplateCard.fragments.LandingTemplate}
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

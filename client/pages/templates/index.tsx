import { gql } from "@apollo/client";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
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
import { indexBy, isNonNullish } from "remeda";
import { assert } from "ts-essentials";

function Templates({ samples }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();

  const categories = usePublicTemplateCategories();
  const samplesByCategory = indexBy(samples, (s) => s.category);
  const filteredCategories = categories.filter(
    (c) => samplesByCategory[c.slug]?.templates.totalCount > 0,
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
      {/* <PublicFooterCTA /> */}
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
  `,
];

export async function getServerSideProps({ req, ...ctx }: GetServerSidePropsContext) {
  const client = createApolloClient({}, { req });
  const locale = ctx.locale as PetitionLocale;

  const { data } = await client.query({
    query: LandingTemplates_categorySamplesDocument,
    variables: { offset: 0, limit: 3, locale },
  });

  assert(isNonNullish(data), "Result data in LandingTemplates_categorySamplesDocument is missing");

  return {
    props: { samples: data.landingTemplateCategorySamples },
  };
}

export default Templates;

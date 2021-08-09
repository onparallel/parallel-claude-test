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
  LandingTemplates_landingTemplatesSamplesQuery,
  LandingTemplates_landingTemplatesSamplesQueryVariables,
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
          <FormattedMessage id="public.templates.we-show-you" defaultMessage="We show you!" />
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

export async function getServerSideProps({ query: { locale }, req }: GetServerSidePropsContext) {
  const client = createApolloClient({}, { req });

  const { data } = await client.query<
    LandingTemplates_landingTemplatesSamplesQuery,
    LandingTemplates_landingTemplatesSamplesQueryVariables
  >({
    query: gql`
      query LandingTemplates_landingTemplatesSamples(
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
      locale: locale as PetitionLocale,
    },
  });
  return {
    props: {
      samples: data.landingTemplatesSamples,
    },
  };
}

export default Templates;

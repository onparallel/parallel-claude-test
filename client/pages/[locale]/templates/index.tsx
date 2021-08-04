import { gql } from "@apollo/client";
import { Button, Flex, Heading } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import { PublicTemplateCategoryPreview } from "@parallel/components/public/templates/PublicTemplateCategoryPreview";
import { PublicTemplatesContainer } from "@parallel/components/public/templates/PublicTemplatesContainer";
import { PublicTemplatesHero } from "@parallel/components/public/templates/PublicTemplatesHero";
import { useCategories } from "@parallel/components/public/templates/useCategories";
import { landingTemplatesSamplesQuery } from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { GetServerSidePropsContext } from "next";
import { FormattedMessage, useIntl } from "react-intl";

function Templates({ data }: { data: landingTemplatesSamplesQuery }) {
  const intl = useIntl();

  let categories = useCategories();

  const { landingTemplatesSamples } = data;

  categories.forEach((category) => {
    category.templates = [
      ...(landingTemplatesSamples.find(
        (template) => template.category === category.slug
      )?.templates.items ?? []),
    ];
  });

  categories = categories.filter(
    (category) => category.templates.length || category.slug === "all"
  );

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
      <PublicTemplatesHero />
      <PublicTemplatesContainer categories={categories}>
        {categories.map((category, index) => {
          const { href } = category;
          if (href === "/templates") return null;
          return (
            <PublicTemplateCategoryPreview key={index} category={category} />
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
          <FormattedMessage
            id="public.templates.we-show-you"
            defaultMessage="We show you!"
          />
        </Heading>
        <Flex marginTop={10} justifyContent="center">
          <NakedLink href="/book-demo">
            <Button as="a" colorScheme="purple" size="lg">
              <FormattedMessage
                id="public.book-demo-button"
                defaultMessage="Book a demo"
              />
            </Button>
          </NakedLink>
        </Flex>
      </PublicContainer>
    </PublicLayout>
  );
}

export async function getServerSideProps({
  query: { locale },
  req,
}: GetServerSidePropsContext) {
  const client = createApolloClient({}, { req });

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
      limit: 4,
      locale,
    },
  });

  return { props: { data } };
}

export default withApolloData(Templates);

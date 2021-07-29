import { Button, Flex, Heading } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCategoryPreview } from "@parallel/components/public/templates/PublicTemplateCategoryPreview";
import { PublicTemplatesContainer } from "@parallel/components/public/templates/PublicTemplatesContainer";
import { PublicTemplatesHero } from "@parallel/components/public/templates/PublicTemplatesHero";
import { useCategories } from "@parallel/components/public/templates/useCategories";
import languages from "@parallel/lang/languages.json";
import { FormattedMessage, useIntl } from "react-intl";

function Templates() {
  const intl = useIntl();

  const categories = useCategories();

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
      <PublicTemplatesContainer>
        {Object.entries(categories).map(([key, value], index) => {
          const { href } = value;
          if (href === "/templates") return null;
          return <PublicTemplateCategoryPreview key={index} category={value} />;
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

export function getStaticProps() {
  return { props: {} };
}

export function getStaticPaths() {
  return {
    paths: languages.map(({ locale }) => ({ params: { locale } })),
    fallback: false,
  };
}

export default Templates;

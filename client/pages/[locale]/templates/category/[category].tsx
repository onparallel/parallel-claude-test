import { Flex, Grid, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicTemplateCard } from "@parallel/components/public/templates/PublicTemplateCard";
import { PublicTemplatesContainer } from "@parallel/components/public/templates/PublicTemplatesContainer";
import { PublicTemplatesHero } from "@parallel/components/public/templates/PublicTemplatesHero";
import { useCategories } from "@parallel/components/public/templates/useCategories";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function TemplateCategory() {
  const intl = useIntl();

  const router = useRouter();
  const currentPath = router.pathname.startsWith("/[locale]")
    ? router.asPath.replace(/^\/[^\/]+/, "")
    : router.asPath;

  const categories = useCategories();

  const currentCategory = categories.find(
    (category) =>
      currentPath.includes(category.href) &&
      !currentPath.includes(category.href + "/")
  );

  const templates = [];

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

const CATEGORY = [
  "administration",
  "business-development",
  "compliance",
  "customer-service",
  "engineering",
  "finance",
  "general-management",
  "information-technology",
  "human-resources",
  "legal",
  "marketing",
  "operations",
  "procurement",
  "product",
  "sales",
  "other",
];

interface TemplateCategoryParams {
  locale: string;
  category: string;
}

export async function getStaticProps({
  params: { locale, category },
}: {
  params: TemplateCategoryParams;
}) {
  return { props: { category } };
}

export function getStaticPaths() {
  return {
    paths: languages.flatMap(({ locale }) =>
      CATEGORY.map((category) => ({ params: { locale, category } }))
    ),
    fallback: false,
  };
}

export default TemplateCategory;

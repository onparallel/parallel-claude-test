import { Button, Flex, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicTemplateCard_LandingTemplateFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PublicTemplateCategory } from "../../../utils/usePublicTemplateCategories";
import { PublicTemplateCard } from "./PublicTemplateCard";

export function PublicTemplateCategoryPreview({
  category,
  templates,
}: {
  category: PublicTemplateCategory;
  templates: PublicTemplateCard_LandingTemplateFragment[];
}) {
  const { label, slug } = category;

  return (
    <Grid
      gap={6}
      templateColumns="1fr auto"
      templateRows="auto 1fr auto"
      templateAreas={{
        base: `'title title' 'content content' 'actions actions'`,
        md: `'title actions' 'content content'`,
      }}
    >
      <GridItem gridArea="title" as={Flex} alignItems="center">
        <Heading size="lg">
          <FormattedMessage
            id="public.template-category-preview.templates-for"
            defaultMessage="Templates for {category}"
            values={{ category: label }}
          />
        </Heading>
      </GridItem>
      <GridItem gridArea="actions">
        <NakedLink href={`/templates/categories/${slug}`}>
          <Button as="a" variant="outline" cursor="pointer" backgroundColor="white" width={"100%"}>
            <FormattedMessage
              id="public.template-category-preview.view-all"
              defaultMessage="View all"
            />
          </Button>
        </NakedLink>
      </GridItem>
      <GridItem gridArea="content">
        <Grid
          templateColumns={{
            lg: "repeat(2, 1fr)",
            xl: "repeat(3, 1fr)",
          }}
          gap={6}
        >
          {templates.map((t) => (
            <PublicTemplateCard key={t.id} template={t} />
          ))}
        </Grid>
      </GridItem>
    </Grid>
  );
}

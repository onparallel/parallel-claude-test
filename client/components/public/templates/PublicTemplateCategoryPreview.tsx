import { Grid, GridItem, Heading } from "@chakra-ui/react";
import { Button, Flex } from "@parallel/components/ui";
import { LandingTemplateCard_LandingTemplateFragment } from "@parallel/graphql/__types";
import NextLink from "next/link";
import { FormattedMessage } from "react-intl";
import { PublicTemplateCategory } from "../../../utils/usePublicTemplateCategories";
import { LandingTemplateCard } from "./LandingTemplateCard";

export function PublicTemplateCategoryPreview({
  category,
  templates,
}: {
  category: PublicTemplateCategory;
  templates: LandingTemplateCard_LandingTemplateFragment[];
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
        <Button
          as={NextLink}
          href={`/templates/categories/${slug}`}
          variant="outline"
          cursor="pointer"
          backgroundColor="white"
          width={"100%"}
        >
          <FormattedMessage
            id="public.template-category-preview.view-all"
            defaultMessage="View all"
          />
        </Button>
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
            <LandingTemplateCard key={t.id} template={t} />
          ))}
        </Grid>
      </GridItem>
    </Grid>
  );
}

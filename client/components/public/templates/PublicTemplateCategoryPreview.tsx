import {
  Button,
  Flex,
  Grid,
  GridItem,
  SimpleGrid,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicTemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PublicTemplateCard } from "./PublicTemplateCard";
import { CategoryType } from "./useCategories";

export function PublicTemplateCategoryPreview({
  category,
  templates,
}: {
  category: CategoryType;
  templates: PublicTemplateCard_PetitionTemplateFragment[];
}) {
  const displaySideMenu = useBreakpointValue({ base: false, md: true });

  const { href, label } = category;
  const templatesLength = 4;

  return (
    <Grid
      gap={6}
      templateColumns="1fr auto"
      templateRows="auto 1fr auto"
      templateAreas={
        displaySideMenu
          ? `'title actions' 'content content'`
          : `'title title' 'content content' 'actions actions'`
      }
    >
      <GridItem gridArea="title" as={Flex} alignItems="flex-end">
        <Text fontSize="2xl" fontWeight="bold">
          <FormattedMessage
            id="public.template-category-preview.templates-for"
            defaultMessage="Templates for {category}"
            values={{ category: label }}
          />
        </Text>
      </GridItem>
      {templatesLength > 3 ? (
        <GridItem gridArea="actions">
          <NakedLink href={href}>
            <Button
              as="a"
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
          </NakedLink>
        </GridItem>
      ) : null}
      <GridItem gridArea="content">
        <Grid
          templateColumns={{
            lg: "repeat(2, 1fr)",
            xl: "repeat(3, 1fr)",
          }}
          gap={6}
        >
          {templates.slice(0, 3).map((template, index) => {
            return <PublicTemplateCard key={index} template={template} />;
          })}
        </Grid>
      </GridItem>
    </Grid>
  );
}

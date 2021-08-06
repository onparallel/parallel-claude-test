import { gql } from "@apollo/client";
import {
  Center,
  Grid,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { Link, NakedLink } from "@parallel/components/common/Link";
import { PublicTemplateCard_LandingTemplateFragment } from "@parallel/graphql/__types";
import {
  PublicTemplateCategory,
  usePublicTemplateCategories,
} from "@parallel/utils/usePublicTemplateCategories";
import { FormattedMessage, useIntl } from "react-intl";
import { Card } from "../../common/Card";

export interface PublicTemplateCardProps {
  showCategories?: boolean;
  template: PublicTemplateCard_LandingTemplateFragment;
}

export function PublicTemplateCard({
  showCategories,
  template,
}: PublicTemplateCardProps) {
  const intl = useIntl();

  const {
    name,
    slug,
    locale,
    imageUrl,
    backgroundColor,
    ownerFullName,
    organizationName,
  } = template;

  const categoryList = usePublicTemplateCategories();
  const categories = (template.categories ?? [])
    .map((c) => categoryList.find((category) => category.slug === c))
    .filter((c) => c !== undefined) as PublicTemplateCategory[];

  return (
    <LinkBox
      as={Card}
      outline="none"
      transition="all 150ms ease"
      _hover={{
        borderColor: "gray.300",
        boxShadow: "lg",
        transform: "scale(1.025)",
      }}
      _active={{
        transform: "scale(1.01)",
      }}
      _focus={{ boxShadow: "var(--chakra-shadows-outline)" }}
      cursor="pointer"
      overflow="hidden"
    >
      <Stack spacing={0}>
        <Center height="130px" backgroundColor={backgroundColor ?? "gray.200"}>
          <Image
            height="100%"
            padding={5}
            src={
              imageUrl ??
              `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/${intl.locale}_radio_button.png`
            }
          />
        </Center>
        <Grid
          gridTemplateRows={showCategories ? "auto 72px auto" : "72px auto"}
          padding={4}
          gap={2}
        >
          {showCategories ? (
            <Wrap spacing={2}>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/templates/categories/${c.slug}`}
                  fontSize="sm"
                  color="gray.600"
                >
                  {c.label}
                </Link>
              ))}
            </Wrap>
          ) : null}
          <NakedLink locale={locale} passHref href={`/templates/${slug}`}>
            <LinkOverlay display="block" fontWeight="semibold" noOfLines={3}>
              {name}
            </LinkOverlay>
          </NakedLink>
          <Text color="gray.600" fontSize="sm">
            <FormattedMessage
              id="public.template-card.created-by"
              defaultMessage="Created by {name} on {orgName}"
              values={{
                name: ownerFullName,
                orgName: <Text as="b">{organizationName}</Text>,
              }}
            />
          </Text>
        </Grid>
      </Stack>
    </LinkBox>
  );
}

PublicTemplateCard.fragments = {
  LandingTemplate: gql`
    fragment PublicTemplateCard_LandingTemplate on LandingTemplate {
      id
      locale
      name
      slug
      shortDescription
      descriptionHtml
      imageUrl
      backgroundColor
      categories
      ownerFullName
      organizationName
    }
  `,
};

import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Grid,
  HTMLChakraProps,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PublicTemplateCard_LandingTemplateFragment } from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { Card } from "../../common/Card";

export interface PublicTemplateCardProps extends HTMLChakraProps<"section"> {
  template: PublicTemplateCard_LandingTemplateFragment;
}

export function PublicTemplateCard({
  template,
  ...props
}: PublicTemplateCardProps) {
  const router = useRouter();
  const { query } = router;

  const intl = useIntl();

  const {
    name,
    slug,
    imageUrl,
    backgroundColor,
    ownerFullName,
    organizationName,
  } = template ?? {};

  return (
    <Box
      tabIndex={0}
      outline="none"
      transition="all 150ms ease"
      borderRadius="md"
      overflow="hidden"
      _focus={{ boxShadow: "var(--chakra-shadows-outline)" }}
      _hover={{
        transform: "scale(1.025)",
      }}
      _active={{
        transform: "scale(1.01)",
      }}
      aria-label={name ?? ""}
      onClick={() => {
        const url = `/${query.locale ?? "en"}/templates/${slug
          .toString()
          .replace(/^\//, "")}`;

        router.push(url);
      }}
      onKeyDown={(event) => {
        if ((event.key = "enter")) {
          const url = `/${query.locale ?? "en"}/templates/${slug
            .toString()
            .replace(/^\//, "")}`;

          router.push(url);
        }
      }}
    >
      <Card
        outline="none"
        transition="all 150ms ease"
        _hover={{
          borderColor: "gray.300",
          boxShadow: "lg",
        }}
        cursor="pointer"
        {...props}
      >
        <Stack>
          <Center height="130px" backgroundColor={backgroundColor as string}>
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
            minHeight="150px"
            gridTemplateRows="1fr auto"
            padding={4}
            gap={2}
          >
            <Text fontWeight="semibold" noOfLines={3}>
              {name}
            </Text>
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
      </Card>
    </Box>
  );
}

PublicTemplateCard.fragments = {
  LandingTemplate: gql`
    fragment PublicTemplateCard_LandingTemplate on LandingTemplate {
      id
      name
      slug
      imageUrl
      backgroundColor
      categories
      ownerFullName
      organizationName
    }
  `,
};

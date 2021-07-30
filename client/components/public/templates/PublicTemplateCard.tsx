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
import { PublicTemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { Card } from "../../common/Card";

export interface PublicTemplateCardProps extends HTMLChakraProps<"section"> {
  template: PublicTemplateCard_PetitionTemplateFragment;
}

export function PublicTemplateCard({
  template,
  ...props
}: PublicTemplateCardProps) {
  const router = useRouter();
  const { query } = router;

  const { name, owner } = template ?? {};
  const { fullName, organization } = owner ?? {};
  const { name: orgName } = organization ?? {};

  const href = "";

  return (
    <Box
      tabIndex={0}
      maxWidth="360px"
      outline="none"
      transition="all 150ms ease"
      borderRadius="md"
      _focus={{ boxShadow: "var(--chakra-shadows-outline)" }}
      _hover={{
        transform: "scale(1.025)",
      }}
      _active={{
        transform: "scale(1.01)",
      }}
      onClick={() => {
        const url = `/${query.locale ?? "en"}/${href
          .toString()
          .replace(/^\//, "")}`;

        router.push(url);
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
          <Center height="130px" backgroundColor="blue.50">
            <Image
              height="100%"
              objectFit="cover"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/input_fondo.png`}
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
                  name: fullName,
                  orgName: <Text as="b">{orgName}</Text>,
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
  PetitionTemplate: gql`
    fragment PublicTemplateCard_PetitionTemplate on PetitionTemplate {
      id
      name
      owner {
        id
        fullName
        organization {
          id
          name
        }
      }
    }
  `,
};

import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Flex,
  HStack,
  Image,
  Stack,
  Text,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import { PublicTemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { FormattedMessage, useIntl } from "react-intl";
import { StringListPopover } from "../common/StringListPopover";
import { TemplateActiveSettingsIcons } from "./TemplateActiveSettingsIcons";

export interface PublicTemplateCardProps {
  template: PublicTemplateCard_PetitionTemplateFragment;
  onPress: () => void;
}

export const PublicTemplateCard = Object.assign(
  chakraForwardRef<"div", PublicTemplateCardProps>(function TemplateCard(
    { template, onPress, ...props },
    ref
  ) {
    const intl = useIntl();
    const buttonProps = useRoleButton(onPress);

    const categories = usePublicTemplateCategories();

    const templateCategories = template.categories
      ? template.categories.map((category) => {
          return categories.find((c) => c.slug === category)!.label;
        })
      : [];

    const [firstCategorie, ...otherCategories] = templateCategories;

    const styles = useMultiStyleConfig("Avatar", { size: "2xs" });

    return (
      <Card
        ref={ref}
        as={Stack}
        minHeight="160px"
        outline="none"
        transition="all 150ms ease"
        _hover={{
          borderColor: "gray.300",
          boxShadow: "long",
          transform: "scale(1.025)",
        }}
        _focus={{
          boxShadow: "outline",
          borderColor: "gray.200",
        }}
        minWidth={0}
        {...buttonProps}
        {...props}
      >
        <Stack spacing={0} height="100%">
          <Center
            height="130px"
            minHeight="130px"
            paddingX={5}
            paddingY={3}
            backgroundColor={template.backgroundColor ?? "gray.200"}
          >
            <Image
              loading="lazy"
              height="100%"
              objectFit="contain"
              alt={intl.formatMessage({
                id: "public.template-card.image-alt",
                defaultMessage: "Example of question you will find in this template.",
              })}
              src={
                template.imageUrl ??
                `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/${intl.locale}_radio_button.png`
              }
            />
          </Center>
          <Stack padding={4} paddingTop={2.5} height="100%" minHeight="130px" spacing={1}>
            <HStack>
              <Text fontSize="sm" color="gray.600">
                {firstCategorie ?? ""}
              </Text>
              {otherCategories?.length && (
                <StringListPopover items={otherCategories}>
                  <Flex
                    alignItems="center"
                    fontSize="2xs"
                    borderRadius="full"
                    paddingLeft="2px"
                    sx={styles.excessLabel}
                  >
                    <Box as="span">+{otherCategories.length}</Box>
                  </Flex>
                </StringListPopover>
              )}
            </HStack>

            {template.name ? (
              <Text as="h2" fontSize="lg" noOfLines={2} fontWeight="bold">
                {template.name}
              </Text>
            ) : (
              <Text as="h2" fontSize="lg" noOfLines={2} fontWeight="normal" fontStyle="italic">
                <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
              </Text>
            )}
            <Spacer />
            <TemplateActiveSettingsIcons template={template} spacing={2.5} />
          </Stack>
        </Stack>
      </Card>
    );
  }),
  {
    fragments: {
      PetitionTemplate: gql`
        fragment PublicTemplateCard_PetitionTemplate on PetitionTemplate {
          id
          name
          descriptionExcerpt
          backgroundColor
          categories
          imageUrl
          ...TemplateActiveSettingsIcons_PetitionTemplate
        }
        ${TemplateActiveSettingsIcons.fragments.PetitionTemplate}
      `,
    },
  }
);

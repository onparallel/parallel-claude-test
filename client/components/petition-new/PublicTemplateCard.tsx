import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Flex,
  HStack,
  Image,
  Stack,
  Text,
  Tooltip,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { BellSettingsIcon, LinkIcon, LockClosedIcon, SignatureIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { LocaleBadge } from "@parallel/components/common/LocaleBadge";
import { Spacer } from "@parallel/components/common/Spacer";
import { PublicTemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { FormattedMessage, useIntl } from "react-intl";
import { StringListPopover } from "../common/StringListPopover";
import { UserAvatarList } from "../common/UserAvatarList";

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
            paddingX={5}
            paddingY={3}
            backgroundColor={template.backgroundColor ?? "gray.200"}
          >
            <Image
              loading="lazy"
              width="100%"
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
                <FormattedMessage
                  id="generic.untitled-template"
                  defaultMessage="Untitled template"
                />
              </Text>
            )}
            <Spacer />

            <HStack alignItems="center">
              <LocaleBadge locale={template.locale} gridGap={2} />
              {template.isRestricted ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "component.template-card.restricted-edition",
                    defaultMessage: "Restricted edition",
                  })}
                >
                  <LockClosedIcon color="gray.600" boxSize={4} />
                </Tooltip>
              ) : null}
              {template.publicLink?.isActive ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "component.template-card.active-link",
                    defaultMessage: "Link activated",
                  })}
                >
                  <LinkIcon color="gray.600" boxSize={4} />
                </Tooltip>
              ) : null}
              {template.signatureConfig ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "component.template-card.esignature-active",
                    defaultMessage: "eSignature activated",
                  })}
                >
                  <SignatureIcon color="gray.600" boxSize={4} />
                </Tooltip>
              ) : null}
              {template.remindersConfig ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "component.template-card.automatic-reminders-active",
                    defaultMessage: "Automatic reminders activated",
                  })}
                >
                  <BellSettingsIcon color="gray.600" boxSize={4} />
                </Tooltip>
              ) : null}
            </HStack>
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
          locale
          isRestricted
          backgroundColor
          categories
          imageUrl
          signatureConfig {
            title
          }
          publicLink {
            id
            isActive
          }
          remindersConfig {
            time
          }
        }

        ${UserAvatarList.fragments.User}
        ${UserAvatarList.fragments.UserGroup}
      `,
    },
  }
);

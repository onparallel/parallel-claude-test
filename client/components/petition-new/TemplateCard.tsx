import { gql } from "@apollo/client";
import { Avatar, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { LocaleBadge } from "@parallel/components/common/LocaleBadge";
import { Spacer } from "@parallel/components/common/Spacer";
import { TemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { FormattedMessage } from "react-intl";

export interface TemplateCardProps {
  template: TemplateCard_PetitionTemplateFragment;
  onPress: () => void;
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  const buttonProps = useRoleButton(onPress, [onPress]);

  return (
    <Card
      as={Stack}
      padding={4}
      minHeight="160px"
      outline="none"
      transition="all 150ms ease"
      _hover={{
        borderColor: "gray.300",
        boxShadow: "lg",
        transform: "scale(1.025)",
      }}
      _focus={{
        boxShadow: "outline",
        borderColor: "gray.200",
      }}
      minWidth={0}
      {...buttonProps}
    >
      {template.name ? (
        <Heading size="xs" noOfLines={2}>
          {template.name}
        </Heading>
      ) : (
        <Heading size="xs" noOfLines={2} fontWeight="normal" fontStyle="italic">
          <FormattedMessage
            id="generic.untitled-template"
            defaultMessage="Untitled template"
          />
        </Heading>
      )}
      {template.descriptionExcerpt ? (
        <Text fontSize="sm" noOfLines={2}>
          {template.descriptionExcerpt}
        </Text>
      ) : (
        <Text fontSize="sm" textStyle="hint">
          <FormattedMessage
            id="template-details.no-description-provided"
            defaultMessage="No description provided."
          />
        </Text>
      )}
      <Spacer />
      <Flex alignItems="center">
        <LocaleBadge locale={template.locale} />
        <Spacer />
        <Avatar name={template.owner.fullName!} size="xs" role="presentation" />
        <Text fontSize="xs" marginLeft={2}>
          <FormattedMessage
            id="generic.by"
            defaultMessage="by {name}"
            values={{ name: template.owner.fullName }}
          />
        </Text>
      </Flex>
    </Card>
  );
}

TemplateCard.fragments = {
  PetitionTemplate: gql`
    fragment TemplateCard_PetitionTemplate on PetitionTemplate {
      name
      descriptionExcerpt
      locale
      owner {
        id
        fullName
      }
    }
  `,
};

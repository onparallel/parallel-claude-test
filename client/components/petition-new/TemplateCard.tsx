import { gql } from "@apollo/client";
import { Avatar, Flex, Heading, Stack, Text, Tooltip } from "@chakra-ui/react";
import { LinkIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { LocaleBadge } from "@parallel/components/common/LocaleBadge";
import { Spacer } from "@parallel/components/common/Spacer";
import { TemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { FormattedMessage, useIntl } from "react-intl";

export interface TemplateCardProps {
  template: TemplateCard_PetitionTemplateFragment;
  onPress: () => void;
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  const intl = useIntl();
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
        boxShadow: "long",
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
          <FormattedMessage id="generic.untitled-template" defaultMessage="Untitled template" />
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
        {template.publicLink?.isActive ? (
          <Tooltip
            label={intl.formatMessage({
              id: "component.template-card.active-link",
              defaultMessage: "Enabled link",
            })}
          >
            <LinkIcon marginLeft={2} color="gray.500" boxSize={3.5} />
          </Tooltip>
        ) : null}
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
      publicLink {
        id
        isActive
      }
    }
  `,
};

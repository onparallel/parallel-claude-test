import { Avatar, BoxProps, Flex, Heading, Text } from "@chakra-ui/react";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { Card } from "@parallel/components/common/Card";
import { LocaleBadge } from "@parallel/components/common/LocaleBadge";
import { Spacer } from "@parallel/components/common/Spacer";
import { NewPetition_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { memo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export interface TemplateCardProps extends BoxProps {
  template: NewPetition_PetitionTemplateFragment;
  onPress: () => void;
}

export const TemplateCard = memo(function TemplateCard({
  template,
  onPress,
  ...props
}: TemplateCardProps) {
  const intl = useIntl();
  const buttonProps = useRoleButton(onPress, [onPress]);

  return (
    <Card
      display="flex"
      flexDirection="column"
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
      {...props}
    >
      <Heading size="xs" noOfLines={2}>
        {template.name ||
          intl.formatMessage({
            id: "generic.untitled-template",
            defaultMessage: "Untitled template",
          })}
      </Heading>
      {template.description ? (
        <Text fontSize="sm" noOfLines={2}>
          <BreakLines>{template.description}</BreakLines>
        </Text>
      ) : (
        <Text fontSize="sm" fontStyle="italic">
          <FormattedMessage
            id="template-details.no-description-provided"
            defaultMessage="No description provided."
          />
        </Text>
      )}
      <Spacer />
      <Flex alignItems="center" marginTop={2}>
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
});

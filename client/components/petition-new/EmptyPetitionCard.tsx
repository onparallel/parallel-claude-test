import { Heading, BoxProps } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { Card } from "@parallel/components/common/Card";
import { memo } from "react";
import { FormattedMessage } from "react-intl";

export interface EmptyPetitionCardProps extends BoxProps {
  onPress: () => void;
}

export const EmptyPetitionCard = memo(function EmptyPetitionCard({
  onPress,
  ...props
}: EmptyPetitionCardProps) {
  const buttonProps = useRoleButton(onPress, [onPress]);
  return (
    <Card
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
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
      {...buttonProps}
      {...props}
    >
      <Heading size="xs" marginBottom={4}>
        <FormattedMessage
          id="new-petition.empty-petition-header"
          defaultMessage="Not finding what you're looking for?"
        />
      </Heading>
      <AddIcon boxSize="36px" color="purple.500" marginBottom={4} />
      <Heading size="xs">
        <FormattedMessage
          id="new-petition.create-new-template"
          defaultMessage="Create new template"
        />
      </Heading>
    </Card>
  );
});

import { Center, HStack } from "@chakra-ui/react";
import { ArrowBackIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { generateCssStripe } from "@parallel/utils/css";
import { AnimatePresence } from "framer-motion";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";
interface PetitionComposeNewFieldPlaceholderProps {
  isGroupChild?: boolean;
  isTemplate?: boolean;
}

export const PetitionComposeNewFieldPlaceholder = chakraForwardRef<
  "div",
  PetitionComposeNewFieldPlaceholderProps
>(function PetitionComposeNewFieldPlaceholder({ isTemplate, isGroupChild, ...props }, ref) {
  return (
    <AnimatePresence>
      <Center
        ref={ref}
        sx={generateCssStripe({
          size: "1rem",
          color: "gray.50",
        })}
        borderTop="1px solid"
        borderColor="gray.200"
        backgroundColor="white"
        {...props}
      >
        <HStack padding={6} spacing={4}>
          <ArrowBackIcon color="gray.400" />
          <Text color="gray.400" fontWeight={400}>
            {isGroupChild ? (
              <FormattedMessage
                id="component.petition-compose-new-field-placeholder.select-field-group-children"
                defaultMessage="Select the field that you need or drag and drop fields from the {isTemplate, select, true {template} other {petition}}"
                values={{ isTemplate }}
              />
            ) : (
              <FormattedMessage
                id="component.petition-compose-new-field-placeholder.select-field"
                defaultMessage="Select the field that you need"
              />
            )}
          </Text>
        </HStack>
      </Center>
    </AnimatePresence>
  );
});

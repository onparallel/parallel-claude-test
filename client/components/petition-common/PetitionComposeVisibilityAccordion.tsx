import { HStack, Heading } from "@chakra-ui/react";
import { ChevronFilledIcon, ConditionIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import { Accordion } from "../ui";

interface PetitionComposeVisibilityAccordionProps {
  isOpen: boolean;
  popoverContent?: React.ReactNode;
}

export const PetitionComposeVisibilityAccordion = chakraForwardRef<
  "div",
  PetitionComposeVisibilityAccordionProps
>(function PetitionComposeVisibilityAccordion({ isOpen, children, popoverContent }, ref) {
  return (
    <Accordion.Root
      defaultValue={isOpen ? ["0"] : undefined}
      collapsible
      reduceMotion
      borderRadius="md"
      backgroundColor="gray.100"
      border="none"
      ref={ref}
    >
      <Accordion.Item border="none">
        {({ isExpanded }) => {
          return (
            <>
              <Heading>
                <Accordion.ItemTrigger borderRadius="md" paddingY={3}>
                  <HStack as="span" flex="1" textAlign="left" fontSize="sm" spacing={1}>
                    <ChevronFilledIcon
                      color="gray.500"
                      fontSize="xs"
                      transform={isExpanded ? "rotate(90deg)" : undefined}
                      marginEnd={2}
                    />
                    <ConditionIcon />
                    <FormattedMessage
                      id="component.petition-compose-field.visibility-title"
                      defaultMessage="Visibility conditions"
                    />
                    <HelpPopover marginStart={1}>{popoverContent}</HelpPopover>
                  </HStack>
                </Accordion.ItemTrigger>
              </Heading>
              <Accordion.ItemContent padding={0}>
                {isExpanded ? children : null}
              </Accordion.ItemContent>
            </>
          );
        }}
      </Accordion.Item>
    </Accordion.Root>
  );
});

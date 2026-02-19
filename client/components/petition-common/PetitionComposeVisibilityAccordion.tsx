import { Heading } from "@chakra-ui/react";
import { ChevronFilledIcon, ConditionIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { HStack } from "@parallel/components/ui";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import { Accordion } from "../ui";

interface PetitionComposeVisibilityAccordionProps {
  isOpen: boolean;
  popoverContent?: ReactNode;
}

export const PetitionComposeVisibilityAccordion = chakraComponent<
  "div",
  PetitionComposeVisibilityAccordionProps
>(function PetitionComposeVisibilityAccordion({ ref, isOpen, children, popoverContent }) {
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
                  <HStack as="span" flex="1" textAlign="left" fontSize="sm" gap={1}>
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

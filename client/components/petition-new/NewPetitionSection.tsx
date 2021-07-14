import {
  Box,
  BoxProps,
  Collapse,
  Flex,
  Heading,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { memo, ReactNode } from "react";
import { NewPetitionContainer } from "./NewPetitionContainer";

export const NewPetitionSection = memo(function NewPetitionSection({
  header,
  children,
  ...props
}: {
  header: ReactNode;
} & BoxProps) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  return (
    <NewPetitionContainer {...props}>
      <Flex>
        <Flex
          as="button"
          outline="none"
          alignItems="center"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <ChevronDownIcon
            transition="transform 250ms ease"
            transform={isOpen ? "none" : "rotate(-90deg)"}
          />
          <Heading as="h3" size="sm" marginLeft={2}>
            {header}
          </Heading>
        </Flex>
      </Flex>
      <Collapse in={isOpen}>
        <Box>{children}</Box>
      </Collapse>
    </NewPetitionContainer>
  );
});

import { Flex, InputGroup, InputRightElement } from "@chakra-ui/react";
import { EditIcon } from "@parallel/chakra/icons";
import { ReactNode } from "react";

interface ProfileFieldInputGroupProps {
  children: ReactNode;
}

export function ProfileFieldInputGroup({ children }: ProfileFieldInputGroupProps) {
  return (
    <InputGroup
      _hover={{
        "& .edit-icon": {
          opacity: 1,
        },
      }}
      _focusWithin={{
        "& .edit-icon": {
          opacity: 0,
        },
        "& .date-icon": {
          opacity: 1,
        },
      }}
    >
      {children}
      <InputRightElement pointerEvents="none">
        <Flex className="edit-icon" opacity={0} transitionDuration="normal" color="gray.600">
          <EditIcon boxSize={4} />
        </Flex>
      </InputRightElement>
    </InputGroup>
  );
}

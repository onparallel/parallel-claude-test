import {
  List,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ReactNode } from "react";

export function StringListPopover({ items, children }: { items: string[]; children: ReactNode }) {
  if (items.length === 0) {
    return <>{children}</>;
  }

  return (
    <Popover trigger="hover">
      <PopoverTrigger>{children}</PopoverTrigger>
      <Portal>
        <PopoverContent width="fit-content">
          <PopoverArrow />
          <PopoverBody padding={2} overflow="auto" maxHeight="300px">
            <Stack as={List} fontSize="sm">
              {items.map((item, i) => (
                <Text key={i}>{item}</Text>
              ))}
            </Stack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

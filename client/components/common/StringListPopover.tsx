import {
  List,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
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
            <List fontSize="sm">
              {items.map((item, i) => (
                <ListItem key={i}>{item}</ListItem>
              ))}
            </List>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

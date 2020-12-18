import { List, ListIcon, ListItem, ListProps } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";

export interface ClaimsListProps extends ListProps {
  claims: ReactNode[];
}

export const ClaimsList = chakraForwardRef<"ul", ClaimsListProps>(
  function ClaimsList({ claims, ...props }, ref) {
    return (
      <List ref={ref} listStylePosition="outside" spacing={4} {...props}>
        {claims.map((claim, index) => (
          <ListItem display="flex" key={index}>
            <ListIcon
              as={CheckIcon}
              boxSize="20px"
              color="purple.500"
              marginTop={1}
            />
            {claim}
          </ListItem>
        ))}
      </List>
    );
  }
);

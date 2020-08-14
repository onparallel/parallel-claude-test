import { List, ListIcon, ListItem } from "@chakra-ui/core";
import { CheckIcon } from "@parallel/chakra/icons";
import { ReactNode } from "react";
import { ExtendChakra } from "@parallel/chakra/utils";

export function ClaimsList({
  claims,
  ...props
}: ExtendChakra<{ claims: ReactNode[] }>) {
  return (
    <List listStylePosition="outside" spacing={4} {...props}>
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

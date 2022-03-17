import { Grid, GridItem, Icon, Text } from "@chakra-ui/react";
import copy from "clipboard-copy";
import { useState } from "react";
import * as allIcons from "../chakra/icons";

export const Icons = () => {
  const [copied, setCopied] = useState("");
  return (
    <Grid templateColumns="repeat(5, 1fr)" gridGap={8}>
      {Object.entries(allIcons).map(([name, icon]) => (
        <GridItem key={name}>
          <Icon as={icon} />
          <Text
            cursor="pointer"
            onClick={() => {
              setCopied(name);
              copy(`<${name} />`);
            }}
            fontSize="14px"
            color={copied === name ? "black" : "#b8b8b8"}
            fontFamily={`"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif`}
          >
            {name}
          </Text>
        </GridItem>
      ))}
    </Grid>
  );
};

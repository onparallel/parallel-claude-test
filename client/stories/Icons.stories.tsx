import { Grid, HStack, Icon, Stack, Text } from "@chakra-ui/react";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import copy from "clipboard-copy";
import React, { useState } from "react";
import * as allIcons from "../chakra/icons";
import { StoryDecorator } from "./decorators";

function Icons() {
  const [copied, setCopied] = useState("");
  const [search, setSearch] = useState("");
  return (
    <Stack padding={8} spacing={8}>
      <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
      <Grid templateColumns="repeat(5, 1fr)" gridGap={8}>
        {Object.entries(allIcons)
          .filter(([name]) => name.toLowerCase().includes(search))
          .map(([name, icon]) => (
            <Stack key={name} alignItems="center" spacing={2}>
              <Icon as={icon} />
              <HStack justifyContent="center">
                <Text
                  cursor="pointer"
                  onClick={() => {
                    setCopied(name);
                    copy(`<${name} />`);
                  }}
                  fontSize="14px"
                  color={copied === name ? "black" : "#b8b8b8"}
                >
                  {name}
                </Text>
              </HStack>
            </Stack>
          ))}
      </Grid>
    </Stack>
  );
}

export default {
  title: "Icons",
  component: Icons,
  decorators: [StoryDecorator],
} as ComponentMeta<typeof Icons>;

export const All: ComponentStory<typeof Icons> = () => <Icons />;

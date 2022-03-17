import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { Icons } from "./Icons";

export default {
  title: "Icons",
  component: Icons,
} as ComponentMeta<typeof Icons>;

export const All: ComponentStory<typeof Icons> = () => <Icons />;
All.storyName = "Icons";

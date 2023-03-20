import { addons } from "@storybook/addons";
import { themes } from "@storybook/theming";

addons.setConfig({
  theme: themes.light,
  showNav: true,
  showPanel: true,
  panelPosition: "right",
});

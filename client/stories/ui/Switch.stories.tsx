import { Link, Stack, Text } from "@chakra-ui/react";
import { Switch } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6}>
      <Link
        href="https://chakra-ui.com/docs/components/switch"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Switch v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Switches")}</Text>
        <Stack gap={4}>
          <Switch>{untranslated("Default switch")}</Switch>
          <Switch defaultChecked>{untranslated("Default checked")}</Switch>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Switch Sizes")}</Text>
        <Stack gap={4}>
          <Switch size="sm">{untranslated("Small switch")}</Switch>
          <Switch size="md">{untranslated("Medium switch")}</Switch>
          <Switch size="lg">{untranslated("Large switch")}</Switch>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Color Palettes")}</Text>
        <Stack gap={4}>
          <Switch colorPalette="red" defaultChecked>
            {untranslated("Red")}
          </Switch>
          <Switch colorPalette="green" defaultChecked>
            {untranslated("Green")}
          </Switch>
          <Switch colorPalette="blue" defaultChecked>
            {untranslated("Blue")}
          </Switch>
          <Switch colorPalette="purple" defaultChecked>
            {untranslated("Purple")}
          </Switch>
          <Switch colorPalette="primary" defaultChecked>
            {untranslated("Primary")}
          </Switch>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Disabled States")}</Text>
        <Stack gap={4}>
          <Switch disabled>{untranslated("Disabled off")}</Switch>
          <Switch disabled defaultChecked>
            {untranslated("Disabled on")}
          </Switch>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Invalid State")}</Text>
        <Stack gap={4}>
          <Switch _invalid={{ opacity: 0.5 }}>{untranslated("Invalid switch")}</Switch>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Custom Styling")}</Text>
        <Stack gap={4}>
          <Switch
            colorPalette="orange"
            size="lg"
            _checked={{
              bg: "orange.500",
            }}
          >
            {untranslated("Custom styled switch")}
          </Switch>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Switch Group Example")}</Text>
        <Stack gap={2} p={4} border="1px" borderColor="gray.200" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium">
            {untranslated("Notification Settings:")}
          </Text>
          <Switch defaultChecked>{untranslated("Email notifications")}</Switch>
          <Switch>{untranslated("Push notifications")}</Switch>
          <Switch defaultChecked>{untranslated("SMS notifications")}</Switch>
          <Switch>{untranslated("Marketing emails")}</Switch>
        </Stack>
      </Stack>
    </Stack>
  ),
};

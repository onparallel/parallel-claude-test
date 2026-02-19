import { Link } from "@chakra-ui/react";
import { Button, Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={4}>
      <Link
        href="https://chakra-ui.com/docs/components/button"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Button v3")}
      </Link>
      <Text fontWeight="bold">{untranslated("Variants")}</Text>
      <Stack direction="row" gap={4}>
        <Button>{untranslated("Default")}</Button>
        <Button variant="outline">{untranslated("Outline")}</Button>
        <Button variant="ghost">{untranslated("Ghost")}</Button>
        <Button variant="link">{untranslated("Link")}</Button>
        <Button variant="solid" colorPalette="red">
          {untranslated("Red")}
        </Button>
        <Button variant="solid" colorPalette="primary">
          {untranslated("Primary")}
        </Button>
      </Stack>

      <Text fontWeight="bold">{untranslated("Sizes")}</Text>
      <Stack direction="row" gap={4} align="center">
        <Button size="2xs">{untranslated("2xs")}</Button>
        <Button size="xs">{untranslated("xs")}</Button>
        <Button size="sm">{untranslated("sm")}</Button>
        <Button size="md">{untranslated("md")}</Button>
        <Button size="lg">{untranslated("lg")}</Button>
      </Stack>

      <Text fontWeight="bold">{untranslated("States")}</Text>
      <Stack direction="row" gap={4}>
        <Button loading>{untranslated("Loading")}</Button>
        <Button disabled>{untranslated("Disabled")}</Button>
      </Stack>
    </Stack>
  ),
};

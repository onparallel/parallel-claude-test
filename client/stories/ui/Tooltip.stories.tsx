import { Link, Stack } from "@chakra-ui/react";
import { Button, Text, Tooltip } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    placement: {
      control: "select",
      options: [
        "top",
        "bottom",
        "left",
        "right",
        "top-start",
        "top-end",
        "bottom-start",
        "bottom-end",
        "left-start",
        "left-end",
        "right-start",
        "right-end",
      ],
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    label: untranslated("This is a tooltip!"),
    children: <Button>{untranslated("Hover me")}</Button>,
  },
  render: (args) => (
    <Stack gap={8}>
      <Link
        href="https://chakra-ui.com/docs/components/tooltip"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Tooltip v3")}
      </Link>
      <Stack align="center">
        <Text fontWeight="bold">{untranslated("Basic Tooltip")}</Text>
        <Tooltip {...args} />
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Placement")}</Text>
        <Stack direction="row" gap={6} justifyContent="center">
          <Tooltip label={untranslated("This is a tooltip!")} placement="top">
            <Button>{untranslated("Top")}</Button>
          </Tooltip>
          <Tooltip label={untranslated("This is a tooltip!")} placement="right">
            <Button>{untranslated("Right")}</Button>
          </Tooltip>
          <Tooltip label={untranslated("This is a tooltip!")} placement="bottom">
            <Button>{untranslated("Bottom")}</Button>
          </Tooltip>
          <Tooltip label={untranslated("This is a tooltip!")} placement="left">
            <Button>{untranslated("Left")}</Button>
          </Tooltip>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Arrow")}</Text>
        <Stack direction="row" gap={6} justifyContent="center">
          <Tooltip label={untranslated("This is a tooltip!")} hasArrow>
            <Button>{untranslated("With Arrow")}</Button>
          </Tooltip>
          <Tooltip label={untranslated("This is a tooltip!")} hasArrow={false}>
            <Button>{untranslated("No Arrow")}</Button>
          </Tooltip>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Disabled")}</Text>
        <Stack direction="row" gap={6} justifyContent="center">
          <Tooltip label={untranslated("This is a tooltip!")}>
            <Button>{untranslated("Hover me")}</Button>
          </Tooltip>
          <Tooltip label={untranslated("This is a tooltip!")} disabled>
            <Button>{untranslated("Disabled ")}</Button>
          </Tooltip>
        </Stack>
      </Stack>
    </Stack>
  ),
};

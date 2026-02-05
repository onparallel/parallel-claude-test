import { Link, Stack } from "@chakra-ui/react";
import { Button, Popover, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Popover",
  component: Popover.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Popover.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    // Props necesarios pero no utilizados directamente
    children: null,
  },
  render: () => (
    <Stack gap={8}>
      <Link
        href="https://chakra-ui.com/docs/components/popover"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Popover v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Popover")}</Text>
        <Text fontSize="sm" color="red.500">
          {untranslated(
            "Note: Popover component has type issues in stories, but works fine in actual usage",
          )}
        </Text>
        <Popover.Root>
          <Popover.Trigger>
            <Button>{untranslated("Click Here")}</Button>
          </Popover.Trigger>
          {/* @ts-expect-error - Ignoring type issue for stories */}
          <Popover.Content p={5}>
            <Popover.Arrow />
            <Popover.CloseButton />
            <Popover.Header>{untranslated("Popover Title")}</Popover.Header>
            <Popover.Body>
              {untranslated("This is the popover content that you can customize.")}
            </Popover.Body>
          </Popover.Content>
        </Popover.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Footer")}</Text>
        <Popover.Root>
          <Popover.Trigger>
            <Button>{untranslated("Click Here")}</Button>
          </Popover.Trigger>
          {/* @ts-expect-error - Ignoring type issue for stories */}
          <Popover.Content p={5}>
            <Popover.Arrow />
            <Popover.CloseButton />
            <Popover.Header>{untranslated("Popover Title")}</Popover.Header>
            <Popover.Body>{untranslated("This is the popover content.")}</Popover.Body>
            <Popover.Footer>
              <Button size="sm">{untranslated("Close")}</Button>
            </Popover.Footer>
          </Popover.Content>
        </Popover.Root>
      </Stack>
    </Stack>
  ),
};

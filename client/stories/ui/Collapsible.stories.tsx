import { Link } from "@chakra-ui/react";
import { Button, Collapsible, Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

const meta = {
  title: "UI (v3)/Collapsible",
  component: Collapsible.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Collapsible.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

// Collapsible v3 API examples
const CollapsibleExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(true);

  return (
    <Stack gap={6} maxW="400px">
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Collapsible")}</Text>
        <Button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? untranslated("Hide") : untranslated("Show")} {untranslated("Content")}
        </Button>
        <Collapsible.Root open={isOpen} onOpenChange={(details) => setIsOpen(details.open)}>
          <Collapsible.Content>
            <Stack p={4} bg="green.50" borderRadius="md" gap={2}>
              <Text>{untranslated("This uses the v3 Collapsible namespace.")}</Text>
              <Text>
                {untranslated("Notice the component structure with Root and Content components.")}
              </Text>
            </Stack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Collapsible with onOpenChange")}</Text>
        <Button onClick={() => setIsOpen2(!isOpen2)}>
          {isOpen2 ? untranslated("Hide") : untranslated("Show")} {untranslated("Content")}
        </Button>
        <Collapsible.Root
          open={isOpen2}
          onOpenChange={(details) => {
            setIsOpen2(details.open);
            // Handle state change in v3 API
          }}
        >
          <Collapsible.Content>
            <Stack p={4} bg="purple.50" borderRadius="md" gap={2}>
              <Text>{untranslated("This demonstrates the onOpenChange callback.")}</Text>
              <Text>
                {untranslated("The callback receives an object with the new open state.")}
              </Text>
            </Stack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Default Open")}</Text>
        <Collapsible.Root open={true}>
          <Collapsible.Content>
            <Stack p={4} bg="blue.50" borderRadius="md" gap={2}>
              <Text>{untranslated("This collapsible starts open by default.")}</Text>
              <Text>{untranslated("You can set the initial state using the open prop.")}</Text>
            </Stack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Stack>
    </Stack>
  );
};

export const Basic: Story = {
  args: {
    open: false,
    children: null,
  },
  parameters: {
    docs: {
      source: {
        code: "Uses CollapsibleExample component to manage state",
      },
    },
  },
  render: () => (
    <Stack gap={8}>
      <Link
        href="https://chakra-ui.com/docs/components/collapsible"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Collapsible v3")}
      </Link>
      <CollapsibleExample />
    </Stack>
  ),
};

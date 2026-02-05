import { Link, Stack } from "@chakra-ui/react";
import { PinInput, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/PinInput",
  component: PinInput.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof PinInput.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack gap={6} align="center">
      <Link
        href="https://chakra-ui.com/docs/components/pin-input"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de PinInput v3")}
      </Link>
      <Stack align="center">
        <Text fontWeight="bold">{untranslated("Basic Pin Input")}</Text>
        <PinInput.Root>
          <PinInput.Input />
          <PinInput.Input />
          <PinInput.Input />
          <PinInput.Input />
        </PinInput.Root>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("Pin Input Sizes")}</Text>
        <Stack gap={4} align="center">
          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Extra Small")}
            </Text>
            <PinInput.Root size="xs">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Small")}
            </Text>
            <PinInput.Root size="sm">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Medium")}
            </Text>
            <PinInput.Root size="md">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Large")}
            </Text>
            <PinInput.Root size="lg">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>
        </Stack>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("Pin Input Variants")}</Text>
        <Stack gap={4} align="center">
          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Outline")}
            </Text>
            <PinInput.Root variant="outline">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Filled")}
            </Text>
            <PinInput.Root variant="filled">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Flushed")}
            </Text>
            <PinInput.Root variant="flushed">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>
        </Stack>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("Number of Inputs")}</Text>
        <Stack gap={4} align="center">
          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("3 digits")}
            </Text>
            <PinInput.Root>
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("6 digits")}
            </Text>
            <PinInput.Root>
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>
        </Stack>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("Pin Input Types")}</Text>
        <Stack gap={4} align="center">
          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Numbers only")}
            </Text>
            <PinInput.Root type="number">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Alphanumeric")}
            </Text>
            <PinInput.Root type="alphanumeric">
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>
        </Stack>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("States")}</Text>
        <Stack gap={4} align="center">
          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Disabled (v2)")}
            </Text>
            <PinInput.Root disabled>
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Disabled (v3)")}
            </Text>
            <PinInput.Root disabled>
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Invalid (v2)")}
            </Text>
            <PinInput.Root invalid>
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Invalid (v3)")}
            </Text>
            <PinInput.Root invalid>
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
              <PinInput.Input />
            </PinInput.Root>
          </Stack>
        </Stack>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("With Default Value")}</Text>
        <PinInput.Root defaultValue={["1", "2", "3", "4"]}>
          <PinInput.Input />
          <PinInput.Input />
          <PinInput.Input />
          <PinInput.Input />
        </PinInput.Root>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("Mask Characters")}</Text>
        <PinInput.Root mask>
          <PinInput.Input />
          <PinInput.Input />
          <PinInput.Input />
          <PinInput.Input />
        </PinInput.Root>
      </Stack>

      <Stack align="center">
        <Text fontWeight="bold">{untranslated("v3 API - New Component Structure")}</Text>
        <Stack gap={4} align="center">
          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("With Label and Control")}
            </Text>
            <PinInput.Root>
              <PinInput.Label>{untranslated("Enter PIN")}</PinInput.Label>
              <PinInput.Control>
                <PinInput.Input />
                <PinInput.Input />
                <PinInput.Input />
                <PinInput.Input />
              </PinInput.Control>
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("Using string[] value (v3)")}
            </Text>
            <PinInput.Root
              defaultValue={["1", "2", "3", "4"]}
              onValueChange={(details) => {
                // Handle v3 API - receives {value: string[]}
              }}
            >
              <PinInput.Control>
                <PinInput.Input />
                <PinInput.Input />
                <PinInput.Input />
                <PinInput.Input />
              </PinInput.Control>
            </PinInput.Root>
          </Stack>

          <Stack align="center">
            <Text fontSize="sm" color="gray.600">
              {untranslated("colorPalette prop (v3)")}
            </Text>
            <PinInput.Root colorPalette="blue">
              <PinInput.Control>
                <PinInput.Input />
                <PinInput.Input />
                <PinInput.Input />
                <PinInput.Input />
              </PinInput.Control>
            </PinInput.Root>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  ),
};

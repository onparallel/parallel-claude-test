import { Link } from "@chakra-ui/react";
import { NumberInput, Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/NumberInput",
  component: NumberInput.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof NumberInput.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack gap={6} maxW="400px">
      <Link
        href="https://chakra-ui.com/docs/components/number-input"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de NumberInput v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Number Input")}</Text>
        <NumberInput.Root defaultValue={15} min={10} max={20}>
          <NumberInput.Input placeholder={untranslated("Enter number")} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Number Input Sizes")}</Text>
        <Stack gap={4}>
          <NumberInput.Root size="xs" defaultValue={1}>
            <NumberInput.Input />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root size="sm" defaultValue={2}>
            <NumberInput.Input />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root size="md" defaultValue={3}>
            <NumberInput.Input />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root size="lg" defaultValue={4}>
            <NumberInput.Input />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Number Input Variants")}</Text>
        <Stack gap={4}>
          <NumberInput.Root variant="outline" defaultValue={1}>
            <NumberInput.Input placeholder={untranslated("Outline")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root variant="filled" defaultValue={2}>
            <NumberInput.Input placeholder={untranslated("Filled")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root variant="flushed" defaultValue={3}>
            <NumberInput.Input placeholder={untranslated("Flushed")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Number Input States")}</Text>
        <Stack gap={4}>
          <NumberInput.Root defaultValue={15}>
            <NumberInput.Input placeholder={untranslated("Normal")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root defaultValue={15} disabled>
            <NumberInput.Input placeholder={untranslated("Disabled ")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root defaultValue={15} disabled>
            <NumberInput.Input placeholder={untranslated("Disabled ")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root defaultValue={15} invalid>
            <NumberInput.Input placeholder={untranslated("Invalid ")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root defaultValue={15} invalid>
            <NumberInput.Input placeholder={untranslated("Invalid ")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("v3 API - Using New Component Names")}</Text>
        <Stack gap={4}>
          <NumberInput.Root defaultValue={25}>
            <NumberInput.Input placeholder={untranslated("Using NumberInput.Input")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root
            defaultValue={10}
            onValueChange={(details) => {
              // Handle value change in v3 API - receives {value, valueAsNumber}
            }}
          >
            <NumberInput.Input placeholder={untranslated("With onValueChange ")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Constraints")}</Text>
        <Stack gap={4}>
          <NumberInput.Root defaultValue={0} min={0} max={100} step={5}>
            <NumberInput.Input placeholder={untranslated("0-100, step 5")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root defaultValue={1.5} min={0} max={10} step={0.5} precision={1}>
            <NumberInput.Input placeholder={untranslated("Decimal with precision")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>

          <NumberInput.Root
            defaultValue={50}
            min={0}
            max={100}
            keepWithinRange={false}
            clampValueOnBlur={false}
          >
            <NumberInput.Input placeholder={untranslated("Allow out of range")} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
        </Stack>
      </Stack>
    </Stack>
  ),
};

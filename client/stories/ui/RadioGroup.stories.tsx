import { Link, Stack, Text, VStack } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/RadioGroup",
  component: RadioGroup.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof RadioGroup.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack gap={8} maxW="600px">
      <Link
        href="https://chakra-ui.com/docs/components/radio"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de RadioGroup v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Radio Groups")}</Text>
        <VStack gap={4} align="stretch">
          <RadioGroup.Root defaultValue="react">
            <Stack gap={3}>
              <RadioGroup.Item value="react">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("React")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item value="vue">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Vue")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item value="svelte">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Svelte")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>

          <Text fontSize="sm" color="gray.600">
            {untranslated("v2 Compatibility:")}
          </Text>
          <RadioGroup.Root defaultValue="option2">
            <Stack gap={3}>
              <Radio value="option1">{untranslated("Option 1")}</Radio>
              <Radio value="option2">{untranslated("Option 2")}</Radio>
              <Radio value="option3">{untranslated("Option 3")}</Radio>
            </Stack>
          </RadioGroup.Root>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Radio Sizes")}</Text>
        <VStack gap={4} align="stretch">
          <RadioGroup.Root size="sm" defaultValue="small">
            <Stack gap={3}>
              <RadioGroup.Item value="small">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Small Radio")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>

          <RadioGroup.Root size="md" defaultValue="medium">
            <Stack gap={3}>
              <RadioGroup.Item value="medium">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Medium Radio")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>

          <RadioGroup.Root size="lg" defaultValue="large">
            <Stack gap={3}>
              <RadioGroup.Item value="large">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Large Radio")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Color Palettes (v2 & v3 compatibility)")}</Text>
        <VStack gap={4} align="stretch">
          <RadioGroup.Root colorPalette="red" defaultValue="red1">
            <Stack gap={3}>
              <RadioGroup.Item value="red1">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Red colorPalette ")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>

          <RadioGroup.Root colorPalette="green" defaultValue="green1">
            <Stack gap={3}>
              <RadioGroup.Item value="green1">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Green colorPalette (v3)")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>

          <RadioGroup.Root colorPalette="blue" defaultValue="blue1">
            <Stack gap={3}>
              <RadioGroup.Item value="blue1">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Blue colorPalette ")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Radio States")}</Text>
        <VStack gap={4} align="stretch">
          <RadioGroup.Root disabled defaultValue="disabled1">
            <Stack gap={3}>
              <RadioGroup.Item value="disabled1">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Disabled Group ")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item value="disabled2">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Disabled Option 2")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>

          <RadioGroup.Root disabled defaultValue="disabled3">
            <Stack gap={3}>
              <RadioGroup.Item value="disabled3">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Disabled Group (v3)")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item value="disabled4">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Disabled Option 2")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>

          <RadioGroup.Root defaultValue="normal1">
            <Stack gap={3}>
              <RadioGroup.Item value="normal1">
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Normal Option")}</RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item value="invalid1" invalid>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{untranslated("Invalid Option ")}</RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Horizontal Layout")}</Text>
        <RadioGroup.Root defaultValue="horizontal1">
          <Stack direction="row" gap={6}>
            <RadioGroup.Item value="horizontal1">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{untranslated("Option 1")}</RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="horizontal2">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{untranslated("Option 2")}</RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="horizontal3">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{untranslated("Option 3")}</RadioGroup.ItemText>
            </RadioGroup.Item>
          </Stack>
        </RadioGroup.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Form Integration Example")}</Text>
        <RadioGroup.Root name="preference" defaultValue="email">
          <Text fontSize="sm" mb={3}>
            {untranslated("How would you like to receive notifications?")}
          </Text>
          <Stack gap={3}>
            <RadioGroup.Item value="email">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{untranslated("Email")}</RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="sms">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{untranslated("SMS")}</RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="push">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{untranslated("Push Notifications")}</RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="none">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{untranslated("No Notifications")}</RadioGroup.ItemText>
            </RadioGroup.Item>
          </Stack>
        </RadioGroup.Root>
      </Stack>
    </Stack>
  ),
};

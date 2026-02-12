import { Link } from "@chakra-ui/react";
import { Input, Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6} maxW="400px">
      <Link
        href="https://chakra-ui.com/docs/components/input"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Input v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Inputs")}</Text>
        <Stack gap={4}>
          <Input placeholder={untranslated("Basic input")} />
          <Input placeholder={untranslated("With default value")} defaultValue="Hello World" />
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Input Types")}</Text>
        <Stack gap={4}>
          <Input type="text" placeholder={untranslated("Text input")} />
          <Input type="password" placeholder={untranslated("Password input")} />
          <Input type="email" placeholder={untranslated("Email input")} />
          <Input type="number" placeholder={untranslated("Number input")} />
          <Input type="tel" placeholder={untranslated("Phone input")} />
          <Input type="url" placeholder={untranslated("URL input")} />
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Input Sizes")}</Text>
        <Stack gap={4}>
          <Input placeholder={untranslated("Extra small")} size="xs" />
          <Input placeholder={untranslated("Small")} size="sm" />
          <Input placeholder={untranslated("Medium")} size="md" />
          <Input placeholder={untranslated("Large")} size="lg" />
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Input Variants")}</Text>
        <Stack gap={4}>
          <Input placeholder={untranslated("Outline (default)")} variant="outline" />
          <Input placeholder={untranslated("Filled")} variant="filled" />
          <Input placeholder={untranslated("Flushed")} variant="flushed" />
          <Input placeholder={untranslated("Unstyled")} variant="unstyled" />
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Input States")}</Text>
        <Stack gap={4}>
          <Input placeholder={untranslated("Disabled")} disabled />
          <Input placeholder={untranslated("Invalid")} invalid />
          <Input placeholder={untranslated("Read only")} readOnly defaultValue="Read only value" />
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Focus Border Color")}</Text>
        <Stack gap={4}>
          <Input
            placeholder={untranslated("Focus me")}
            focusBorderColor="pink.400"
            _focus={{
              borderColor: "pink.400",
              boxShadow: "0 0 0 1px pink.400",
            }}
          />

          <Input
            placeholder={untranslated("Green focus")}
            focusBorderColor="green.400"
            _focus={{
              borderColor: "green.400",
              boxShadow: "0 0 0 1px green.400",
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  ),
};

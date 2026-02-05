import { Link, Stack } from "@chakra-ui/react";
import { Select, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6} maxW="300px">
      <Link
        href="https://chakra-ui.com/docs/components/select"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Select v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Select")}</Text>
        <Select placeholder={untranslated("Select option")}>
          <option value="option1">{untranslated("Option 1")}</option>
          <option value="option2">{untranslated("Option 2")}</option>
          <option value="option3">{untranslated("Option 3")}</option>
        </Select>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Select Sizes")}</Text>
        <Stack gap={4}>
          <Select size="xs" placeholder={untranslated("Extra Small")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select size="sm" placeholder={untranslated("Small")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select size="md" placeholder={untranslated("Medium")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select size="lg" placeholder={untranslated("Large")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Select Variants")}</Text>
        <Stack gap={4}>
          <Select variant="outline" placeholder={untranslated("Outline")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select variant="filled" placeholder={untranslated("Filled")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select variant="flushed" placeholder={untranslated("Flushed")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Select States")}</Text>
        <Stack gap={4}>
          <Select placeholder={untranslated("Normal")}>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select placeholder={untranslated("Disabled ")} disabled>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select placeholder={untranslated("Disabled ")} disabled>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select placeholder={untranslated("Invalid ")} invalid>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
          <Select placeholder={untranslated("Invalid ")} invalid>
            <option value="1">{untranslated("Option 1")}</option>
            <option value="2">{untranslated("Option 2")}</option>
          </Select>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Default Value")}</Text>
        <Select defaultValue="option2">
          <option value="option1">{untranslated("First Option")}</option>
          <option value="option2">{untranslated("Second Option (Selected)")}</option>
          <option value="option3">{untranslated("Third Option")}</option>
        </Select>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Country Select Example")}</Text>
        <Select placeholder={untranslated("Select country")}>
          <option value="us">{untranslated("United States")}</option>
          <option value="ca">{untranslated("Canada")}</option>
          <option value="mx">{untranslated("Mexico")}</option>
          <option value="uk">{untranslated("United Kingdom")}</option>
          <option value="fr">{untranslated("France")}</option>
          <option value="de">{untranslated("Germany")}</option>
          <option value="jp">{untranslated("Japan")}</option>
          <option value="au">{untranslated("Australia")}</option>
        </Select>
      </Stack>
    </Stack>
  ),
};

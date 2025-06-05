import { Link, Stack, Text } from "@chakra-ui/react";
import { Checkbox } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6}>
      <Link
        href="https://chakra-ui.com/docs/components/checkbox"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Checkbox v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Checkboxes")}</Text>
        <Stack gap={4}>
          <Checkbox>{untranslated("Default checkbox")}</Checkbox>
          <Checkbox defaultChecked>{untranslated("Default checked")}</Checkbox>
          <Checkbox isIndeterminate>{untranslated("Indeterminate")}</Checkbox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Checkbox Sizes")}</Text>
        <Stack gap={4}>
          <Checkbox size="sm">{untranslated("Small checkbox")}</Checkbox>
          <Checkbox size="md">{untranslated("Medium checkbox")}</Checkbox>
          <Checkbox size="lg">{untranslated("Large checkbox")}</Checkbox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Color Schemes")}</Text>
        <Stack gap={4}>
          <Checkbox colorPalette="red" defaultChecked>
            {untranslated("Red")}
          </Checkbox>
          <Checkbox colorPalette="green" defaultChecked>
            {untranslated("Green")}
          </Checkbox>
          <Checkbox colorPalette="blue" defaultChecked>
            {untranslated("Blue")}
          </Checkbox>
          <Checkbox colorPalette="purple" defaultChecked>
            {untranslated("Purple")}
          </Checkbox>
          <Checkbox colorPalette="primary" defaultChecked>
            {untranslated("Primary")}
          </Checkbox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Disabled States")}</Text>
        <Stack gap={4}>
          <Checkbox disabled>{untranslated("Disabled unchecked")}</Checkbox>
          <Checkbox disabled defaultChecked>
            {untranslated("Disabled checked")}
          </Checkbox>
          <Checkbox disabled isIndeterminate>
            {untranslated("Disabled indeterminate")}
          </Checkbox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Invalid State")}</Text>
        <Stack gap={4}>
          <Checkbox invalid>{untranslated("Invalid checkbox")}</Checkbox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Custom Styling")}</Text>
        <Stack gap={4}>
          <Checkbox
            colorPalette="orange"
            size="lg"
            borderColor="orange.300"
            _checked={{
              bg: "orange.500",
              borderColor: "orange.500",
            }}
          >
            {untranslated("Custom styled checkbox")}
          </Checkbox>

          <Checkbox gap="1rem" iconColor="white" iconSize="1rem">
            {untranslated("Custom spacing and icon")}
          </Checkbox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Checkbox Group Example")}</Text>
        <Stack gap={2} p={4} border="1px" borderColor="gray.200" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium">
            {untranslated("Select your interests:")}
          </Text>
          <Checkbox>{untranslated("Technology")}</Checkbox>
          <Checkbox>{untranslated("Design")}</Checkbox>
          <Checkbox>{untranslated("Marketing")}</Checkbox>
          <Checkbox>{untranslated("Business")}</Checkbox>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/* eslint-disable no-restricted-imports */
import { Text as ChakraText, Link } from "@chakra-ui/react";
import { Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Text",
  component: Text,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6}>
      <Link
        href="https://chakra-ui.com/docs/components/text"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Text v3")}
      </Link>
      <Stack>
        <ChakraText fontWeight="bold">{untranslated("Font Sizes")}</ChakraText>
        <Stack gap={2}>
          <Text fontSize="xs">{untranslated("Extra Small Text (xs)")}</Text>
          <Text fontSize="sm">{untranslated("Small Text (sm)")}</Text>
          <Text fontSize="md">{untranslated("Medium Text (md)")}</Text>
          <Text fontSize="lg">{untranslated("Large Text (lg)")}</Text>
          <Text fontSize="xl">{untranslated("Extra Large Text (xl)")}</Text>
          <Text fontSize="2xl">{untranslated("2XL Text (2xl)")}</Text>
        </Stack>
      </Stack>

      <Stack>
        <ChakraText fontWeight="bold">{untranslated("Font Weights")}</ChakraText>
        <Stack gap={2}>
          <Text fontWeight="light">{untranslated("Light weight")}</Text>
          <Text fontWeight="normal">{untranslated("Normal weight")}</Text>
          <Text fontWeight="medium">{untranslated("Medium weight")}</Text>
          <Text fontWeight="semibold">{untranslated("Semibold weight")}</Text>
          <Text fontWeight="bold">{untranslated("Bold weight")}</Text>
          <Text fontWeight="extrabold">{untranslated("Extra bold weight")}</Text>
        </Stack>
      </Stack>

      <Stack>
        <ChakraText fontWeight="bold">{untranslated("Colors")}</ChakraText>
        <Stack gap={2}>
          <Text color="gray.500">{untranslated("Gray text")}</Text>
          <Text color="red.500">{untranslated("Red text")}</Text>
          <Text color="blue.500">{untranslated("Blue text")}</Text>
          <Text color="green.500">{untranslated("Green text")}</Text>
          <Text color="purple.500">{untranslated("Purple text")}</Text>
        </Stack>
      </Stack>

      <Stack>
        <ChakraText fontWeight="bold">{untranslated("Text Styles")}</ChakraText>
        <Stack gap={2}>
          <Text fontStyle="italic">{untranslated("Italic text")}</Text>
          <Text textDecoration="underline">{untranslated("Underlined text")}</Text>
          <Text textDecoration="line-through">{untranslated("Strikethrough text")}</Text>
          <Text textTransform="uppercase">{untranslated("Uppercase text")}</Text>
          <Text textTransform="lowercase">{untranslated("LOWERCASE TEXT")}</Text>
          <Text textTransform="capitalize">{untranslated("capitalize text")}</Text>
        </Stack>
      </Stack>

      <Stack>
        <ChakraText fontWeight="bold">{untranslated("Text Alignment")}</ChakraText>
        <Stack gap={2}>
          <Text textAlign="left">{untranslated("Left aligned text")}</Text>
          <Text textAlign="center">{untranslated("Center aligned text")}</Text>
          <Text textAlign="right">{untranslated("Right aligned text")}</Text>
        </Stack>
      </Stack>

      <Stack>
        <ChakraText fontWeight="bold">{untranslated("Responsive Text")}</ChakraText>
        <Text fontSize={["sm", "md", "lg"]} color={["red.500", "blue.500", "green.500"]}>
          {untranslated("This text changes size and color based on screen size")}
        </Text>
      </Stack>
    </Stack>
  ),
};

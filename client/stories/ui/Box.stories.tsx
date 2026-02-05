import { Link, Stack } from "@chakra-ui/react";
import { Box, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Box",
  component: Box,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6}>
      <Link
        href="https://chakra-ui.com/docs/components/box"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Box v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Box")}</Text>
        <Box p={5} bg="gray.100" borderRadius="md">
          {untranslated("This is a basic Box component")}
        </Box>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Background Colors")}</Text>
        <Stack direction="row" gap={4}>
          <Box p={4} bg="red.100" borderRadius="md">
            {untranslated("Red")}
          </Box>
          <Box p={4} bg="blue.100" borderRadius="md">
            {untranslated("Blue")}
          </Box>
          <Box p={4} bg="green.100" borderRadius="md">
            {untranslated("Green")}
          </Box>
          <Box p={4} bg="purple.100" borderRadius="md">
            {untranslated("Purple")}
          </Box>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Borders")}</Text>
        <Stack direction="row" gap={4}>
          <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
            {untranslated("Border")}
          </Box>
          <Box p={4} border="2px" borderColor="blue.300" borderRadius="lg">
            {untranslated("Thick Border")}
          </Box>
          <Box p={4} borderStart="4px" borderColor="green.500" bg="gray.50">
            {untranslated("Start Border")}
          </Box>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Shadows")}</Text>
        <Stack direction="row" gap={4}>
          <Box p={4} bg="white" shadow="sm" borderRadius="md">
            {untranslated("Small Shadow")}
          </Box>
          <Box p={4} bg="white" shadow="md" borderRadius="md">
            {untranslated("Medium Shadow")}
          </Box>
          <Box p={4} bg="white" shadow="lg" borderRadius="md">
            {untranslated("Large Shadow")}
          </Box>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Responsive Design")}</Text>
        <Box p={[2, 4, 6]} bg={["red.100", "blue.100", "green.100"]} borderRadius="md">
          {untranslated("Responsive padding and background (resize window to see)")}
        </Box>
      </Stack>
    </Stack>
  ),
};

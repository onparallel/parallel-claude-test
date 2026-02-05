import { Box, Link } from "@chakra-ui/react";
import { Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Stack",
  component: Stack,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const DemoBox = ({ children, ...props }: any) => (
  <Box p={4} bg="blue.100" borderRadius="md" textAlign="center" {...props}>
    {children}
  </Box>
);

export const Basic: Story = {
  render: () => (
    <Stack gap={8}>
      <Link
        href="https://chakra-ui.com/docs/components/stack"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Stack v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Vertical Stack (default)")}</Text>
        <Stack gap={4} p={4} bg="gray.50" borderRadius="md">
          <DemoBox>{untranslated("Item 1")}</DemoBox>
          <DemoBox>{untranslated("Item 2")}</DemoBox>
          <DemoBox>{untranslated("Item 3")}</DemoBox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Horizontal Stack")}</Text>
        <Stack direction="row" gap={4} p={4} bg="gray.50" borderRadius="md">
          <DemoBox>{untranslated("Item 1")}</DemoBox>
          <DemoBox>{untranslated("Item 2")}</DemoBox>
          <DemoBox>{untranslated("Item 3")}</DemoBox>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Different Spacings")}</Text>
        <Stack gap={6}>
          <Box>
            <Text fontSize="sm" mb={2}>
              {untranslated("Spacing: 2")}
            </Text>
            <Stack direction="row" gap={2} p={4} bg="gray.50" borderRadius="md">
              <DemoBox bg="red.100">{untranslated("A")}</DemoBox>
              <DemoBox bg="red.100">{untranslated("B")}</DemoBox>
              <DemoBox bg="red.100">{untranslated("C")}</DemoBox>
            </Stack>
          </Box>

          <Box>
            <Text fontSize="sm" mb={2}>
              {untranslated("Spacing: 6")}
            </Text>
            <Stack direction="row" gap={6} p={4} bg="gray.50" borderRadius="md">
              <DemoBox bg="green.100">{untranslated("A")}</DemoBox>
              <DemoBox bg="green.100">{untranslated("B")}</DemoBox>
              <DemoBox bg="green.100">{untranslated("C")}</DemoBox>
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Alignment")}</Text>
        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" mb={2}>
              {untranslated("Left aligned")}
            </Text>
            <Stack align="flex-start" p={4} bg="gray.50" borderRadius="md">
              <DemoBox w="100px">{untranslated("Short")}</DemoBox>
              <DemoBox w="150px">{untranslated("Medium")}</DemoBox>
              <DemoBox w="200px">{untranslated("Longer item")}</DemoBox>
            </Stack>
          </Box>

          <Box>
            <Text fontSize="sm" mb={2}>
              {untranslated("Center aligned")}
            </Text>
            <Stack align="center" p={4} bg="gray.50" borderRadius="md">
              <DemoBox w="100px">{untranslated("Short")}</DemoBox>
              <DemoBox w="150px">{untranslated("Medium")}</DemoBox>
              <DemoBox w="200px">{untranslated("Longer item")}</DemoBox>
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Responsive Direction")}</Text>
        <Stack direction={["column", "row"]} gap={4} p={4} bg="gray.50" borderRadius="md">
          <DemoBox>{untranslated("Responsive 1")}</DemoBox>
          <DemoBox>{untranslated("Responsive 2")}</DemoBox>
          <DemoBox>{untranslated("Responsive 3")}</DemoBox>
        </Stack>
        <Text fontSize="sm" color="gray.600">
          {untranslated("Column on mobile, row on larger screens")}
        </Text>
      </Stack>
    </Stack>
  ),
};

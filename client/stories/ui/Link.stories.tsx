import { Stack, Text } from "@chakra-ui/react";
import { Link } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Link",
  component: Link,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6}>
      <Link
        href="https://chakra-ui.com/docs/components/link"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Link v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Links")}</Text>
        <Stack gap={4}>
          <Link href="#">{untranslated("Basic link")}</Link>
          <Link href="#" isExternal>
            {untranslated("External link ")}
          </Link>
          <Link href="#" target="_blank" rel="noopener noreferrer">
            {untranslated("External link (v3 API - explicit props)")}
          </Link>
          <Text>
            {untranslated("This is a paragraph with an ")}
            <Link href="#">{untranslated("inline link")}</Link>
            {untranslated(" inside it.")}
          </Text>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Link Colors")}</Text>
        <Stack gap={4}>
          <Link href="#" color="blue.500">
            {untranslated("Blue link")}
          </Link>
          <Link href="#" color="red.500">
            {untranslated("Red link")}
          </Link>
          <Link href="#" color="green.500">
            {untranslated("Green link")}
          </Link>
          <Link href="#" color="purple.500">
            {untranslated("Purple link")}
          </Link>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Link Styles")}</Text>
        <Stack gap={4}>
          <Link href="#" textDecoration="underline">
            {untranslated("Underlined link")}
          </Link>
          <Link href="#" textDecoration="none">
            {untranslated("No decoration")}
          </Link>
          <Link href="#" fontWeight="bold">
            {untranslated("Bold link")}
          </Link>
          <Link href="#" fontStyle="italic">
            {untranslated("Italic link")}
          </Link>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Hover Effects")}</Text>
        <Stack gap={4}>
          <Link
            href="#"
            _hover={{
              color: "red.500",
              textDecoration: "underline",
            }}
          >
            {untranslated("Custom hover effect")}
          </Link>
          <Link
            href="#"
            _hover={{
              bg: "yellow.100",
              px: 2,
              py: 1,
              borderRadius: "md",
            }}
          >
            {untranslated("Background on hover")}
          </Link>
        </Stack>
      </Stack>
      <Stack>
        <Text fontWeight="bold">{untranslated("Navigation Examples")}</Text>
        <Stack gap={4} p={4} border="1px" borderColor="gray.200" borderRadius="md">
          <Stack direction="row" gap={6}>
            <Link href="#" fontWeight="medium">
              {untranslated("Home")}
            </Link>
            <Link href="#" fontWeight="medium">
              {untranslated("About")}
            </Link>
            <Link href="#" fontWeight="medium">
              {untranslated("Services")}
            </Link>
            <Link href="#" fontWeight="medium">
              {untranslated("Contact")}
            </Link>
          </Stack>
          <Text fontSize="sm" color="gray.600">
            {untranslated("Example navigation menu")}
          </Text>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Button-like Links")}</Text>
        <Stack gap={4}>
          <Link
            href="#"
            px={4}
            py={2}
            bg="blue.500"
            color="white"
            borderRadius="md"
            textDecoration="none"
            _hover={{
              bg: "blue.600",
            }}
          >
            {untranslated("Primary button link")}
          </Link>
          <Link
            href="#"
            px={4}
            py={2}
            border="1px"
            borderColor="blue.500"
            color="blue.500"
            borderRadius="md"
            textDecoration="none"
            _hover={{
              bg: "blue.50",
            }}
          >
            {untranslated("Outline button link")}
          </Link>
        </Stack>
      </Stack>
    </Stack>
  ),
};

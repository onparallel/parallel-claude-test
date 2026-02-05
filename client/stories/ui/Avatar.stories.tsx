import { Link, Stack } from "@chakra-ui/react";
import { Avatar, AvatarGroup, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Avatar",
  component: Avatar.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Avatar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Stack gap={6}>
      <Link
        href="https://chakra-ui.com/docs/components/avatar"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Avatar v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Avatars with Fallback")}</Text>
        <Stack direction="row" gap={4}>
          <Avatar.Root>
            <Avatar.Fallback name="John Doe" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Jane Smith" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Alice Johnson" />
          </Avatar.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Avatar Sizes")}</Text>
        <Stack direction="row" gap={4} align="center">
          <Avatar.Root size="2xs">
            <Avatar.Fallback name="Extra Small" />
          </Avatar.Root>
          <Avatar.Root size="xs">
            <Avatar.Fallback name="Extra Small" />
          </Avatar.Root>
          <Avatar.Root size="sm">
            <Avatar.Fallback name="Small" />
          </Avatar.Root>
          <Avatar.Root size="md">
            <Avatar.Fallback name="Medium" />
          </Avatar.Root>
          <Avatar.Root size="lg">
            <Avatar.Fallback name="Large" />
          </Avatar.Root>
          <Avatar.Root size="xl">
            <Avatar.Fallback name="Extra Large" />
          </Avatar.Root>
          <Avatar.Root size="2xl">
            <Avatar.Fallback name="2X Large" />
          </Avatar.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("With Images")}</Text>
        <Stack direction="row" gap={4}>
          <Avatar.Root>
            <Avatar.Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <Avatar.Fallback name="John Doe" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Image src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <Avatar.Fallback name="Jane Smith" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Image src="broken-image.jpg" />
            <Avatar.Fallback name="Broken Image" />
          </Avatar.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Avatar Variants")}</Text>
        <Stack direction="row" gap={4}>
          <Avatar.Root variant="solid">
            <Avatar.Fallback name="Solid" />
          </Avatar.Root>
          <Avatar.Root variant="subtle">
            <Avatar.Fallback name="Subtle" />
          </Avatar.Root>
          <Avatar.Root variant="outline">
            <Avatar.Fallback name="Outline" />
          </Avatar.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Avatar Shapes")}</Text>
        <Stack direction="row" gap={4}>
          <Avatar.Root shape="full">
            <Avatar.Fallback name="Full" />
          </Avatar.Root>
          <Avatar.Root shape="rounded">
            <Avatar.Fallback name="Rounded" />
          </Avatar.Root>
          <Avatar.Root shape="square">
            <Avatar.Fallback name="Square" />
          </Avatar.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Color Palettes")}</Text>
        <Stack direction="row" gap={4}>
          <Avatar.Root colorPalette="red">
            <Avatar.Fallback name="Red" />
          </Avatar.Root>
          <Avatar.Root colorPalette="green">
            <Avatar.Fallback name="Green" />
          </Avatar.Root>
          <Avatar.Root colorPalette="blue">
            <Avatar.Fallback name="Blue" />
          </Avatar.Root>
          <Avatar.Root colorPalette="purple">
            <Avatar.Fallback name="Purple" />
          </Avatar.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Avatar Group")}</Text>
        <AvatarGroup size="md" spaceX="-3">
          <Avatar.Root>
            <Avatar.Fallback name="Ryan Florence" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Segun Adebayo" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Kent Dodds" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Prosper Otemuyiwa" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback>+2</Avatar.Fallback>
          </Avatar.Root>
        </AvatarGroup>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Avatar Group with Images")}</Text>
        <AvatarGroup size="lg" gap="-1rem">
          <Avatar.Root>
            <Avatar.Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <Avatar.Fallback name="John Doe" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Image src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <Avatar.Fallback name="Jane Smith" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Alice Johnson" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Bob Wilson" />
          </Avatar.Root>
        </AvatarGroup>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Avatar with Badge")}</Text>
        <Stack direction="row" gap={4}>
          <Avatar.Root>
            <Avatar.Fallback name="John Doe" />
            <Avatar.Badge boxSize="1.25em" bg="green.500" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Image src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <Avatar.Fallback name="Jane Smith" />
            <Avatar.Badge boxSize="1.25em" bg="red.500" />
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback name="Bob Wilson" />
            <Avatar.Badge boxSize="1.25em" bg="yellow.500" />
          </Avatar.Root>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Borderless Avatars")}</Text>
        <Stack direction="row" gap={4}>
          <Avatar.Root borderless>
            <Avatar.Fallback name="Borderless A" />
          </Avatar.Root>
          <Avatar.Root borderless>
            <Avatar.Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <Avatar.Fallback name="Borderless B" />
          </Avatar.Root>
        </Stack>
      </Stack>
    </Stack>
  ),
};

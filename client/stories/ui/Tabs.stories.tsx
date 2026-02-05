import { Link, Stack } from "@chakra-ui/react";
import { Tabs, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Tabs",
  component: Tabs.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Tabs.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack gap={8} w="100%" maxW="600px">
      <Link
        href="https://chakra-ui.com/docs/components/tabs"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Tabs v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Tabs")}</Text>
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Tab>{untranslated("One")}</Tabs.Tab>
            <Tabs.Tab>{untranslated("Two")}</Tabs.Tab>
            <Tabs.Tab>{untranslated("Three")}</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel>
              <Text p={4}>{untranslated("Panel one content. This is the first tab panel.")}</Text>
            </Tabs.Panel>
            <Tabs.Panel>
              <Text p={4}>{untranslated("Panel two content. This is the second tab panel.")}</Text>
            </Tabs.Panel>
            <Tabs.Panel>
              <Text p={4}>{untranslated("Panel three content. This is the third tab panel.")}</Text>
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Tab Variants")}</Text>
        <Stack gap={6}>
          <Stack>
            <Text fontSize="sm" color="gray.600">
              {untranslated("Line variant")}
            </Text>
            <Tabs.Root variant="line">
              <Tabs.List>
                <Tabs.Tab>{untranslated("Tab 1")}</Tabs.Tab>
                <Tabs.Tab>{untranslated("Tab 2")}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panels>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Line variant content 1")}</Text>
                </Tabs.Panel>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Line variant content 2")}</Text>
                </Tabs.Panel>
              </Tabs.Panels>
            </Tabs.Root>
          </Stack>

          <Stack>
            <Text fontSize="sm" color="gray.600">
              {untranslated("Enclosed variant")}
            </Text>
            <Tabs.Root variant="enclosed">
              <Tabs.List>
                <Tabs.Tab>{untranslated("Tab 1")}</Tabs.Tab>
                <Tabs.Tab>{untranslated("Tab 2")}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panels>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Enclosed variant content 1")}</Text>
                </Tabs.Panel>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Enclosed variant content 2")}</Text>
                </Tabs.Panel>
              </Tabs.Panels>
            </Tabs.Root>
          </Stack>

          <Stack>
            <Text fontSize="sm" color="gray.600">
              {untranslated("Soft rounded variant")}
            </Text>
            <Tabs.Root variant="soft-rounded">
              <Tabs.List>
                <Tabs.Tab>{untranslated("Tab 1")}</Tabs.Tab>
                <Tabs.Tab>{untranslated("Tab 2")}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panels>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Soft rounded content 1")}</Text>
                </Tabs.Panel>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Soft rounded content 2")}</Text>
                </Tabs.Panel>
              </Tabs.Panels>
            </Tabs.Root>
          </Stack>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Tab Sizes")}</Text>
        <Stack gap={6}>
          <Stack>
            <Text fontSize="sm" color="gray.600">
              {untranslated("Small size")}
            </Text>
            <Tabs.Root size="sm">
              <Tabs.List>
                <Tabs.Tab>{untranslated("Small")}</Tabs.Tab>
                <Tabs.Tab>{untranslated("Tabs")}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panels>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Small tab content")}</Text>
                </Tabs.Panel>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Small tab content 2")}</Text>
                </Tabs.Panel>
              </Tabs.Panels>
            </Tabs.Root>
          </Stack>

          <Stack>
            <Text fontSize="sm" color="gray.600">
              {untranslated("Large size")}
            </Text>
            <Tabs.Root size="lg">
              <Tabs.List>
                <Tabs.Tab>{untranslated("Large")}</Tabs.Tab>
                <Tabs.Tab>{untranslated("Tabs")}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panels>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Large tab content")}</Text>
                </Tabs.Panel>
                <Tabs.Panel>
                  <Text p={4}>{untranslated("Large tab content 2")}</Text>
                </Tabs.Panel>
              </Tabs.Panels>
            </Tabs.Root>
          </Stack>
        </Stack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Vertical Tabs")}</Text>
        <Tabs.Root orientation="vertical">
          <Tabs.List>
            <Tabs.Tab>{untranslated("Settings")}</Tabs.Tab>
            <Tabs.Tab>{untranslated("Profile")}</Tabs.Tab>
            <Tabs.Tab>{untranslated("Security")}</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel>
              <Text p={4}>
                {untranslated("Settings panel - Configure your application settings here.")}
              </Text>
            </Tabs.Panel>
            <Tabs.Panel>
              <Text p={4}>{untranslated("Profile panel - Update your personal information.")}</Text>
            </Tabs.Panel>
            <Tabs.Panel>
              <Text p={4}>
                {untranslated("Security panel - Manage your security preferences.")}
              </Text>
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs.Root>
      </Stack>
    </Stack>
  ),
};

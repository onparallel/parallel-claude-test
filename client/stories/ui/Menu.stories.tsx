import { Link, Stack, Text } from "@chakra-ui/react";
import { Button, Menu } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

const meta = {
  title: "UI (v3)/Menu",
  component: Menu.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Menu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack gap={8} maxW="800px">
      <Link
        href="https://chakra-ui.com/docs/components/menu"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Menu v3")}
      </Link>
      <Stack gap={6}>
        <Text fontSize="xl" fontWeight="bold">
          {untranslated("Menu Examples")}
        </Text>

        <Stack>
          <Text fontWeight="bold">{untranslated("Basic Menu")}</Text>
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="outline" size="sm">
                {untranslated("Open")}
              </Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="new-txt">{untranslated("New Text File")}</Menu.Item>
                <Menu.Item value="new-file">{untranslated("New File...")}</Menu.Item>
                <Menu.Item value="new-win">{untranslated("New Window")}</Menu.Item>
                <Menu.Item value="open-file">{untranslated("Open File...")}</Menu.Item>
                <Menu.Item value="export">{untranslated("Export")}</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Stack>

        <Stack>
          <Text fontWeight="bold">{untranslated("Menu with Commands")}</Text>
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="outline" size="sm">
                {untranslated("Open")}
              </Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="new-txt-a">
                  <>
                    {untranslated("New Text File")}{" "}
                    <Menu.ItemCommand>{untranslated("⌘E")}</Menu.ItemCommand>
                  </>
                </Menu.Item>
                <Menu.Item value="new-file-a">
                  <>
                    {untranslated("New File...")}{" "}
                    <Menu.ItemCommand>{untranslated("⌘N")}</Menu.ItemCommand>
                  </>
                </Menu.Item>
                <Menu.Item value="new-win-a">
                  <>
                    {untranslated("New Window")}{" "}
                    <Menu.ItemCommand>{untranslated("⌘W")}</Menu.ItemCommand>
                  </>
                </Menu.Item>
                <Menu.Item value="open-file-a">
                  <>
                    {untranslated("Open File...")}{" "}
                    <Menu.ItemCommand>{untranslated("⌘O")}</Menu.ItemCommand>
                  </>
                </Menu.Item>
                <Menu.Item value="export-a">
                  <>
                    {untranslated("Export")}{" "}
                    <Menu.ItemCommand>{untranslated("⌘S")}</Menu.ItemCommand>
                  </>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Stack>

        <Stack>
          <Text fontWeight="bold">{untranslated("Menu with Groups")}</Text>
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="outline">{untranslated("Edit")}</Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>{untranslated("Styles")}</Menu.ItemGroupLabel>
                  <Menu.Item value="bold">{untranslated("Bold")}</Menu.Item>
                  <Menu.Item value="underline">{untranslated("Underline")}</Menu.Item>
                </Menu.ItemGroup>
                <Menu.Separator />
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>{untranslated("Align")}</Menu.ItemGroupLabel>
                  <Menu.Item value="left">{untranslated("Left")}</Menu.Item>
                  <Menu.Item value="middle">{untranslated("Middle")}</Menu.Item>
                  <Menu.Item value="right">{untranslated("Right")}</Menu.Item>
                </Menu.ItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Stack>

        <Stack>
          <Text fontWeight="bold">{untranslated("Radio Items")}</Text>
          <RadioMenuExample />
        </Stack>

        <Stack>
          <Text fontWeight="bold">{untranslated("Checkbox Items")}</Text>
          <CheckboxMenuExample />
        </Stack>

        <Stack>
          <Text fontWeight="bold">{untranslated("Danger Item")}</Text>
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="outline" size="sm">
                {untranslated("Open Menu")}
              </Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="rename">{untranslated("Rename")}</Menu.Item>
                <Menu.Item value="export">{untranslated("Export")}</Menu.Item>
                <Menu.Item
                  value="delete"
                  color="red.500"
                  _hover={{ bg: "red.50", color: "red.600" }}
                >
                  {untranslated("Delete...")}
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Stack>
      </Stack>
    </Stack>
  ),
};

// Radio Menu Example Component
const RadioMenuExample = () => {
  const [value, setValue] = useState("asc");

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="outline" size="sm">
          {untranslated("Sort")}
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content minW="10rem">
          <Menu.RadioItemGroup value={value} onValueChange={(e) => setValue(e.value)}>
            {radioItems.map((item) => (
              <Menu.RadioItem key={item.value} value={item.value}>
                {item.label}
                <Menu.ItemIndicator />
              </Menu.RadioItem>
            ))}
          </Menu.RadioItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

// Checkbox Menu Example Component
const CheckboxMenuExample = () => {
  const [checkedItems, setCheckedItems] = useState(["autosave"]);

  const toggleItem = (value: string) => {
    setCheckedItems((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="outline" size="sm">
          {untranslated("Features")}
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>{untranslated("Features")}</Menu.ItemGroupLabel>
            {checkboxItems.map(({ title, value }) => (
              <Menu.CheckboxItem
                key={value}
                value={value}
                checked={checkedItems.includes(value)}
                onCheckedChange={() => toggleItem(value)}
              >
                {title}
                {checkedItems.includes(value) && <Menu.ItemIndicator />}
              </Menu.CheckboxItem>
            ))}
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

const radioItems = [
  { label: untranslated("Ascending"), value: "asc" },
  { label: untranslated("Descending"), value: "desc" },
];

const checkboxItems = [
  { title: untranslated("Autosave"), value: "autosave" },
  { title: untranslated("Detect Language"), value: "detect-language" },
  { title: untranslated("Spellcheck"), value: "spellcheck" },
];

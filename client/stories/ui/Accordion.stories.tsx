import { Link } from "@chakra-ui/react";
import { Accordion, Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Accordion",
  component: Accordion.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Accordion.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack gap={8} w="100%" maxW="600px">
      <Link
        href="https://chakra-ui.com/docs/components/accordion"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Accordion v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Accordion")}</Text>
        <Accordion.Root>
          <Accordion.Item value="section-1">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("Section 1 title")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated(
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                  )}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>

          <Accordion.Item value="section-2">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("Section 2 title")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated(
                    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
                  )}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>

          <Accordion.Item value="section-3">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("Section 3 title")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated(
                    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
                  )}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Allow Multiple")}</Text>
        <Accordion.Root multiple>
          <Accordion.Item value="faq-1">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("FAQ 1: How do I create an account?")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated(
                    "To create an account, click the 'Sign Up' button and fill out the required information.",
                  )}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>

          <Accordion.Item value="faq-2">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("FAQ 2: How do I reset my password?")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated(
                    "Click 'Forgot Password' on the login page and follow the instructions sent to your email.",
                  )}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Allow Toggle")}</Text>
        <Accordion.Root collapsible>
          <Accordion.Item value="expandable">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("Expandable section")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated(
                    "This section can be toggled on and off. Click the header again to collapse.",
                  )}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Default Value")}</Text>
        <Accordion.Root defaultValue={["open-by-default"]}>
          <Accordion.Item value="closed-by-default-1">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("Closed by default")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>{untranslated("This panel starts closed.")}</Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>

          <Accordion.Item value="open-by-default">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("Open by default")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated("This panel starts open because defaultValue is set to this item.")}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>

          <Accordion.Item value="closed-by-default-2">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("Closed by default")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>{untranslated("This panel also starts closed.")}</Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Reduce Motion")}</Text>
        <Accordion.Root reduceMotion>
          <Accordion.Item value="no-animation">
            <Accordion.ItemTrigger>
              <Text flex="1" textAlign="left">
                {untranslated("No animation")}
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>
                  {untranslated("This accordion has reduced motion for accessibility purposes.")}
                </Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Stack>
    </Stack>
  ),
};

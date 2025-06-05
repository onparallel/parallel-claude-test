import { Box, Grid, GridItem, Link, Stack, Text } from "@chakra-ui/react";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Introduction",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: untranslated(
          "UI component library for Parallel project. These components implement Chakra UI v3 API using v2 underneath, facilitating gradual migration.",
        ),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <Box p={8} maxW="1200px" mx="auto">
      <Stack gap={8}>
        <Stack gap={4}>
          <Text fontSize="4xl" fontWeight="bold" color="primary.600">
            {untranslated("UI Components Library")}
          </Text>
          <Text fontSize="lg" color="gray.600">
            {untranslated(
              "A comprehensive set of UI components for the Parallel project, implementing Chakra UI v3 API for seamless migration.",
            )}
          </Text>
        </Stack>

        <Stack gap={6}>
          <Stack>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">
              {untranslated("Layout Components")}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {untranslated("Basic building blocks for structuring your UI")}
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <Link href="?path=/story/ui-box--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Box")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Container with styling props")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-stack--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Stack")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Vertical and horizontal layouts")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-text--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Text")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Typography component")}
                </Text>
              </GridItem>
            </Grid>
          </Stack>

          <Stack>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">
              {untranslated("Form Components")}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {untranslated("Interactive components for user input and forms")}
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <Link href="?path=/story/ui-button--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Button")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Clickable action elements")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-input--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Input")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Text input fields")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-select--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Select")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Dropdown selection")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-checkbox--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Checkbox")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Binary choice inputs")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-switch--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Switch")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Toggle switches")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-link--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Link")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Navigation links")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-radio--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Radio")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Single choice selection")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-radiogroup--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("RadioGroup")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Grouped radio buttons")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-pininput--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("PinInput")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("PIN code inputs")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-numberinput--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("NumberInput")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Numeric input with steppers")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-field--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Field")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Form field layout and validation")}
                </Text>
              </GridItem>
            </Grid>
          </Stack>

          <Stack>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">
              {untranslated("Overlay Components")}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {untranslated("Components that appear above other content")}
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <Link href="?path=/story/ui-menu--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Menu")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Dropdown menus")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-dialog--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Dialog")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Modal dialogs")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-popover--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Popover")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Content popovers")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-tooltip--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Tooltip")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Hover information")}
                </Text>
              </GridItem>
            </Grid>
          </Stack>

          <Stack>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">
              {untranslated("Navigation Components")}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {untranslated("Components for organizing and navigating content")}
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <Link href="?path=/story/ui-tabs--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Tabs")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Tabbed navigation")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-accordion--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Accordion")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Collapsible content sections")}
                </Text>
              </GridItem>
              <GridItem>
                <Link href="?path=/story/ui-collapsible--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Collapsible")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("Collapsible content")}
                </Text>
              </GridItem>
            </Grid>
          </Stack>

          <Stack>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">
              {untranslated("Data Display")}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {untranslated("Components for displaying data and information")}
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <Link href="?path=/story/ui-avatar--basic" fontSize="sm" fontWeight="medium">
                  {untranslated("Avatar")}
                </Link>
                <Text fontSize="xs" color="gray.500">
                  {untranslated("User profile images")}
                </Text>
              </GridItem>
            </Grid>
          </Stack>

          <Stack>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">
              {untranslated("Migration Strategy")}
            </Text>
            <Box bg="green.50" p={4} borderRadius="md" borderStart="4px" borderColor="green.500">
              <Text fontSize="sm" color="green.800" fontWeight="medium" mb={2}>
                {untranslated("v3 API Only")}
              </Text>
              <Text fontSize="sm" color="green.700">
                {untranslated(
                  "These components implement Chakra UI v3 API exclusively. Use 'disabled' instead of 'isDisabled', 'colorPalette' instead of 'colorScheme', and 'open' instead of 'isOpen'.",
                )}
              </Text>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  ),
};

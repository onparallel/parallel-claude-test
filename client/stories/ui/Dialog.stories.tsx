import { Link } from "@chakra-ui/react";
import { Button, Dialog, Stack, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

const meta = {
  title: "UI (v3)/Dialog",
  component: Dialog.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Dialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

// Dialog v3 API examples
const DialogExample = () => {
  const [basicOpen, setBasicOpen] = useState(false);
  const [centeredOpen, setCenteredOpen] = useState(false);
  const [xsOpen, setXsOpen] = useState(false);
  const [smOpen, setSmOpen] = useState(false);
  const [mdOpen, setMdOpen] = useState(false);
  const [lgOpen, setLgOpen] = useState(false);
  const [xlOpen, setXlOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  return (
    <Stack gap={6}>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Dialog")}</Text>
        <Button onClick={() => setBasicOpen(true)}>{untranslated("Open Dialog")}</Button>

        <Dialog.Root open={basicOpen} onOpenChange={(details) => setBasicOpen(details.open)}>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Dialog Title")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>
                {untranslated(
                  "This is the dialog content using v3 API. Notice the component structure with Root, Backdrop, Positioner, and Content.",
                )}
              </Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setBasicOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Centered Dialog")}</Text>
        <Button onClick={() => setCenteredOpen(true)}>
          {untranslated("Open Centered Dialog")}
        </Button>

        <Dialog.Root
          open={centeredOpen}
          onOpenChange={(details) => setCenteredOpen(details.open)}
          placement="center"
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Centered Dialog")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>
                {untranslated("This dialog is centered using the placement='center' prop.")}
              </Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setCenteredOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Dialog Sizes")}</Text>
        <Stack direction="row" wrap="wrap" gap={4}>
          <Button onClick={() => setXsOpen(true)}>{untranslated("Extra Small")}</Button>
          <Button onClick={() => setSmOpen(true)}>{untranslated("Small")}</Button>
          <Button onClick={() => setMdOpen(true)}>{untranslated("Medium")}</Button>
          <Button onClick={() => setLgOpen(true)}>{untranslated("Large")}</Button>
          <Button onClick={() => setXlOpen(true)}>{untranslated("Extra Large")}</Button>
          <Button onClick={() => setFullOpen(true)}>{untranslated("Full")}</Button>
        </Stack>

        {/* XS Dialog */}
        <Dialog.Root open={xsOpen} onOpenChange={(details) => setXsOpen(details.open)} size="xs">
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Extra Small Dialog")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>
                {untranslated("This is an extra small dialog.")}
              </Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setXsOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* SM Dialog */}
        <Dialog.Root open={smOpen} onOpenChange={(details) => setSmOpen(details.open)} size="sm">
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Small Dialog")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>{untranslated("This is a small dialog.")}</Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setSmOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* MD Dialog */}
        <Dialog.Root open={mdOpen} onOpenChange={(details) => setMdOpen(details.open)} size="md">
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Medium Dialog")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>{untranslated("This is a medium dialog.")}</Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setMdOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* LG Dialog */}
        <Dialog.Root open={lgOpen} onOpenChange={(details) => setLgOpen(details.open)} size="lg">
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Large Dialog")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>{untranslated("This is a large dialog.")}</Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setLgOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* XL Dialog */}
        <Dialog.Root open={xlOpen} onOpenChange={(details) => setXlOpen(details.open)} size="xl">
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Extra Large Dialog")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>
                {untranslated("This is an extra large dialog.")}
              </Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setXlOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Full Dialog */}
        <Dialog.Root
          open={fullOpen}
          onOpenChange={(details) => setFullOpen(details.open)}
          size="full"
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{untranslated("Full Screen Dialog")}</Dialog.Title>
              <Dialog.CloseTrigger />
              <Dialog.Description>
                {untranslated("This dialog takes up the full screen.")}
              </Dialog.Description>
              <Dialog.Footer>
                <Button onClick={() => setFullOpen(false)}>{untranslated("Close")}</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Dialog with onOpenChange")}</Text>
        <Button onClick={() => setBasicOpen(true)}>{untranslated("Open with Callback")}</Button>
        <Text fontSize="sm" color="gray.600">
          {untranslated("Current state:")}{" "}
          {basicOpen ? untranslated("open") : untranslated("closed")}
        </Text>
      </Stack>
    </Stack>
  );
};

export const Basic: Story = {
  args: {
    open: false,
    children: null,
  },
  parameters: {
    docs: {
      source: {
        code: "Uses DialogExample component to manage state with v3 API",
      },
    },
  },
  render: () => (
    <Stack gap={8}>
      <Link
        href="https://chakra-ui.com/docs/components/dialog"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Dialog v3")}
      </Link>
      <DialogExample />
    </Stack>
  ),
};

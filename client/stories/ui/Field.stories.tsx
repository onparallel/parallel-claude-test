import { HStack, Link, Stack, VStack } from "@chakra-ui/react";
import { Button, Checkbox, Field, Input, NumberInput, Select, Text } from "@parallel/components/ui";
import { untranslated } from "@parallel/utils/untranslated";
import { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "UI (v3)/Field",
  component: Field.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Field.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack gap={8} maxW="600px">
      <Link
        href="https://chakra-ui.com/docs/components/field"
        isExternal
        color="blue.500"
        fontWeight="semibold"
        fontSize="sm"
      >
        {untranslated("📖 Documentación oficial de Field v3")}
      </Link>
      <Stack>
        <Text fontWeight="bold">{untranslated("Basic Field Components")}</Text>
        <VStack gap={4} align="stretch">
          <Field.Root>
            <Field.Label>{untranslated("First Name")}</Field.Label>
            <Input type="text" placeholder={untranslated("Enter your first name")} />
            <Field.HelperText>{untranslated("This will be your display name")}</Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Email Address")}</Field.Label>
            <Input type="email" placeholder={untranslated("Enter your email")} />
            <Field.HelperText>{untranslated("We'll never share your email")}</Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Age")}</Field.Label>
            <NumberInput.Root min={18} max={99}>
              <NumberInput.Input placeholder={untranslated("Enter your age")} />
              <NumberInput.Control>
                <NumberInput.IncrementTrigger />
                <NumberInput.DecrementTrigger />
              </NumberInput.Control>
            </NumberInput.Root>
            <Field.HelperText>{untranslated("Must be 18 or older")}</Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Country")}</Field.Label>
            <Select placeholder={untranslated("Select country")}>
              <option value="us">{untranslated("United States")}</option>
              <option value="ca">{untranslated("Canada")}</option>
              <option value="mx">{untranslated("Mexico")}</option>
              <option value="es">{untranslated("Spain")}</option>
            </Select>
          </Field.Root>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Field States")}</Text>
        <VStack gap={4} align="stretch">
          <Field.Root required>
            <Field.Label>{untranslated("Required Field")}</Field.Label>
            <Input type="text" placeholder={untranslated("This field is required")} />
            <Field.HelperText>{untranslated("This field is required")}</Field.HelperText>
          </Field.Root>

          <Field.Root invalid>
            <Field.Label>{untranslated("Invalid Field")}</Field.Label>
            <Input type="text" defaultValue="invalid@value" />
            <Field.ErrorText>{untranslated("This field contains an error")}</Field.ErrorText>
          </Field.Root>

          <Field.Root disabled>
            <Field.Label>{untranslated("Disabled Field")}</Field.Label>
            <Input type="text" placeholder={untranslated("This field is disabled")} />
            <Field.HelperText>{untranslated("This field is disabled")}</Field.HelperText>
          </Field.Root>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Field with Different Input Types")}</Text>
        <VStack gap={4} align="stretch">
          <Field.Root>
            <Field.Label>{untranslated("Text Input")}</Field.Label>
            <Input type="text" placeholder={untranslated("Enter text")} />
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Password Input")}</Field.Label>
            <Input type="password" placeholder={untranslated("Enter password")} />
            <Field.HelperText>
              {untranslated("Password must be at least 8 characters")}
            </Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Number Input")}</Field.Label>
            <NumberInput.Root defaultValue={15} min={0} max={100}>
              <NumberInput.Input />
              <NumberInput.Control>
                <NumberInput.IncrementTrigger />
                <NumberInput.DecrementTrigger />
              </NumberInput.Control>
            </NumberInput.Root>
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Select Dropdown")}</Field.Label>
            <Select>
              <option value="option1">{untranslated("Option 1")}</option>
              <option value="option2">{untranslated("Option 2")}</option>
              <option value="option3">{untranslated("Option 3")}</option>
            </Select>
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Checkbox Options")}</Field.Label>
            <Stack gap={2}>
              <Checkbox defaultChecked>{untranslated("Option A")}</Checkbox>
              <Checkbox>{untranslated("Option B")}</Checkbox>
              <Checkbox>{untranslated("Option C")}</Checkbox>
            </Stack>
          </Field.Root>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Horizontal Field Layout")}</Text>
        <VStack gap={4} align="stretch">
          <HStack gap={4} align="flex-start">
            <Field.Root flex="1">
              <Field.Label>{untranslated("First Name")}</Field.Label>
              <Input type="text" placeholder={untranslated("John")} />
            </Field.Root>
            <Field.Root flex="1">
              <Field.Label>{untranslated("Last Name")}</Field.Label>
              <Input type="text" placeholder={untranslated("Doe")} />
            </Field.Root>
          </HStack>

          <HStack gap={4} align="flex-start">
            <Field.Root flex="2">
              <Field.Label>{untranslated("Street Address")}</Field.Label>
              <Input type="text" placeholder={untranslated("123 Main St")} />
            </Field.Root>
            <Field.Root flex="1">
              <Field.Label>{untranslated("Zip Code")}</Field.Label>
              <Input type="text" placeholder={untranslated("12345")} />
            </Field.Root>
          </HStack>
        </VStack>
      </Stack>

      <Stack>
        <Text fontWeight="bold">{untranslated("Form with Error States")}</Text>
        <VStack gap={4} align="stretch">
          <Field.Root invalid required>
            <Field.Label>{untranslated("Username")}</Field.Label>
            <Input type="text" defaultValue="us" />
            <Field.ErrorText>
              {untranslated("Username must be at least 3 characters long")}
            </Field.ErrorText>
          </Field.Root>

          <Field.Root invalid required>
            <Field.Label>{untranslated("Email")}</Field.Label>
            <Input type="email" defaultValue="invalid-email" />
            <Field.ErrorText>{untranslated("Please enter a valid email address")}</Field.ErrorText>
          </Field.Root>

          <Field.Root>
            <Field.Label>{untranslated("Valid Field")}</Field.Label>
            <Input type="text" defaultValue="valid input" />
            <Field.HelperText>{untranslated("This field is valid")}</Field.HelperText>
          </Field.Root>

          <HStack gap={4}>
            <Button colorPalette="blue">{untranslated("Submit")}</Button>
            <Button variant="outline">{untranslated("Cancel")}</Button>
          </HStack>
        </VStack>
      </Stack>
    </Stack>
  ),
};

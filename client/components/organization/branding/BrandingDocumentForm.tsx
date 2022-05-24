import {
  Box,
  Circle,
  Heading,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { RichTextEditor } from "@parallel/components/common/slate/RichTextEditor";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { FormattedMessage } from "react-intl";
import { noop } from "remeda";

interface BrandingDocumentFormProps {}

export function BrandingDocumentForm(props: BrandingDocumentFormProps) {
  return (
    <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.2xs" }} width="100%">
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage id="organization.branding.margins-header" defaultMessage="Margins" />
        </Heading>
        <HStack spacing={4}>
          <Stack>
            <Text>Parte superior</Text>
            <NumberInput min={1} background="white">
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
          <Stack>
            <Text>Parte inferior</Text>
            <NumberInput min={1} background="white">
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
          <Stack>
            <Text>Laterales</Text>
            <NumberInput min={1} background="white">
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
        </HStack>
        <HStack justifyContent="space-between" alignItems="center">
          <Stack>
            <Heading as="h4" size="md" fontWeight="semibold">
              <FormattedMessage id="organization.branding.show-logo-header" defaultMessage="Logo" />
            </Heading>
            <Text>Muestra el logotipo de la organización en tus documentos.</Text>
          </Stack>
          <Switch />
        </HStack>
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage id="organization.branding.fonts-header" defaultMessage="Fonts" />
        </Heading>
        <HStack align="center" spacing={4}>
          <Stack>
            <Text>Título 1</Text>
            <Select backgroundColor="white" />
          </Stack>
          <Stack>
            <Text>Tamaño</Text>
            <Select backgroundColor="white" />
          </Stack>
          <Stack>
            <Text>Color</Text>
            <Input backgroundColor="white" />
          </Stack>
          <Stack>
            <Text>&nbsp;</Text>
            <Circle size={8} backgroundColor={"red"} />
          </Stack>
        </HStack>
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage id="organization.branding.legal-header" defaultMessage="Legal text" />
        </Heading>
        <Text>
          Este texto se mostrará al final de los documentos que incluyan un proceso de firma.
        </Text>
        <Box backgroundColor="white">
          <RichTextEditor id="legal-text-editor" value={emptyRTEValue()} onChange={noop} />
        </Box>
      </Stack>
    </Stack>
  );
}

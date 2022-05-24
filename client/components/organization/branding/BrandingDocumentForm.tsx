import { gql, useMutation } from "@apollo/client";
import {
  Box,
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
import { ColorInput } from "@parallel/components/common/ColorInput";
import { Divider } from "@parallel/components/common/Divider";
import { RichTextEditor } from "@parallel/components/common/slate/RichTextEditor";
import {
  BrandingDocumentForm_OrganizationFragment,
  BrandingDocumentForm_updateOrganizationDocumentThemeDocument,
  BrandingDocumentForm_updateOrganizationDocumentThemeMutationVariables,
} from "@parallel/graphql/__types";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useState } from "react";
import { IMaskInput } from "react-imask";
import { FormattedMessage } from "react-intl";

interface BrandingDocumentFormProps {
  organization: BrandingDocumentForm_OrganizationFragment;
}

export function BrandingDocumentForm({ organization }: BrandingDocumentFormProps) {
  const [theme, setTheme] = useState(organization.pdfDocumentTheme);

  const FONTS = [
    "Roboto Slab",
    "Merriweather",
    "Playfair Display",
    "Lora",
    "Pt Serif",
    "Source Serif Pro",
    "IBM Plex Serif",
    "Cormorand Garamond",
    "Alegreya",
    "Tinos",
    "Libre Baskerville",
    "Noto Serif Japanese",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Source Sans Pro",
    "Noto Sans",
    "Raleway",
    "Nunito",
    "Rubik",
    "Parisienne",
    "Rubik Wet Paint",
    "Inconsolata",
  ].sort();

  const FONT_SIZES_PT = [20, 18, 16, 14, 12, 10, 8, 6, 4];

  const [updateOrganizationDocumentTheme] = useMutation(
    BrandingDocumentForm_updateOrganizationDocumentThemeDocument
  );

  const updateOrganizationTheme = useDebouncedCallback(
    function (data: BrandingDocumentForm_updateOrganizationDocumentThemeMutationVariables["data"]) {
      updateOrganizationDocumentTheme({
        variables: { data },
      });
    },
    500,
    []
  );

  function handleThemeChange(data: Record<string, any>) {
    setTheme({ ...theme, ...data });
    updateOrganizationTheme(data);
  }

  return (
    <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.2xs" }} width="100%">
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage id="organization.branding.margins-header" defaultMessage="Margins" />
        </Heading>
        <HStack spacing={4}>
          <Stack>
            <Text>Parte superior</Text>
            <NumberInput
              min={0}
              background="white"
              value={`${theme.marginTop} mm`}
              onChange={(value) => handleThemeChange({ marginTop: parseInt(value) })}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
          <Stack>
            <Text>Parte inferior</Text>
            <NumberInput
              min={0}
              background="white"
              value={`${theme.marginBottom} mm`}
              onChange={(value) => handleThemeChange({ marginBottom: parseInt(value) })}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
          <Stack>
            <Text>Laterales</Text>
            <NumberInput
              min={0}
              background="white"
              value={`${theme.marginLeft} mm`}
              onChange={(value) =>
                handleThemeChange({ marginLeft: parseInt(value), marginRight: parseInt(value) })
              }
            >
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
          <Switch
            isChecked={theme.showLogo}
            onChange={(e) => handleThemeChange({ showLogo: e.target.checked })}
          />
        </HStack>
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage id="organization.branding.fonts-header" defaultMessage="Fonts" />
        </Heading>
        {[
          {
            title: "Título 1",
            fontKey: "title1FontFamily",
            colorKey: "title1Color",
            sizeKey: "title1FontSize",
          },
          {
            title: "Título 2",
            fontKey: "title2FontFamily",
            colorKey: "title2Color",
            sizeKey: "title2FontSize",
          },
          {
            title: "Textos",
            fontKey: "textFontFamily",
            colorKey: "textColor",
            sizeKey: "textFontSize",
          },
        ].map((key, i) => (
          <HStack align="center" spacing={4} key={i}>
            <Stack>
              <Text>{key.title}</Text>
              <Select
                backgroundColor="white"
                value={theme[key.fontKey]}
                onChange={(e) => {
                  handleThemeChange({ [key.fontKey]: e.target.value });
                }}
              >
                {FONTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Stack>
            <Stack>
              <Text>Tamaño</Text>
              <Select
                backgroundColor="white"
                width="100px"
                value={theme[key.sizeKey]}
                onChange={(e) => {
                  handleThemeChange({ [key.sizeKey]: parseInt(e.target.value) });
                }}
              >
                {FONT_SIZES_PT.map((v) => (
                  <option key={v} value={v}>
                    {v} pt
                  </option>
                ))}
              </Select>
            </Stack>
            <Stack>
              <Text>Color</Text>
              <HStack>
                <Input
                  as={IMaskInput}
                  {...{
                    mask: "#AAAAAA",
                    definitions: { A: /[0-9A-Fa-f]/ },
                  }}
                  backgroundColor="white"
                  value={theme[key.colorKey]}
                  onChange={(e) => handleThemeChange({ [key.colorKey]: e.target.value })}
                />
                <ColorInput
                  boxSize="40px"
                  borderRadius="100%"
                  value={theme[key.colorKey]}
                  onChange={(value) => handleThemeChange({ [key.colorKey]: value })}
                />
              </HStack>
            </Stack>
          </HStack>
        ))}
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
          <RichTextEditor
            id="legal-text-editor"
            value={isEmptyRTEValue(theme.legalRichText) ? null : theme.legalRichText}
            onChange={(value) => {
              handleThemeChange({ legalRichText: value });
            }}
          />
        </Box>
      </Stack>
    </Stack>
  );
}

BrandingDocumentForm.fragments = {
  Organization: gql`
    fragment BrandingDocumentForm_Organization on Organization {
      pdfDocumentTheme
    }
  `,
};

const _mutations = [
  gql`
    mutation BrandingDocumentForm_updateOrganizationDocumentTheme(
      $data: OrganizationDocumentThemeInput!
    ) {
      updateOrganizationDocumentTheme(data: $data) {
        id
        pdfDocumentTheme
      }
    }
  `,
];

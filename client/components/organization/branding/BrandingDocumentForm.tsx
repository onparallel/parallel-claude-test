import { gql, useApolloClient, useMutation } from "@apollo/client";
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
  BrandingDocumentForm_OrganizationFragmentDoc,
  BrandingDocumentForm_updateOrganizationDocumentThemeDocument,
  BrandingDocumentForm_updateOrganizationDocumentThemeMutationVariables,
} from "@parallel/graphql/__types";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useState } from "react";
import { IMaskInput } from "react-imask";
import { FormattedMessage, useIntl } from "react-intl";
import families from "../../../chakra/pdfDocumentFonts.json";

interface BrandingDocumentFormProps {
  organization: BrandingDocumentForm_OrganizationFragment;
}

export function BrandingDocumentForm({ organization }: BrandingDocumentFormProps) {
  const intl = useIntl();
  const [theme, setTheme] = useState(organization.pdfDocumentTheme);

  const FONT_SIZES_PT = [
    5, 5.5, 6.5, 7.5, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
  ];

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

  const apollo = useApolloClient();
  function handleThemeChange(data: Record<string, any>) {
    // immediately write cache fragment with expected result.
    // this allows us to not wait for the server response in order to update the BrandingDocumentPreview
    apollo.cache.writeFragment({
      fragment: BrandingDocumentForm_OrganizationFragmentDoc,
      data: {
        id: organization.id,
        pdfDocumentTheme: { ...organization.pdfDocumentTheme, ...data },
        __typename: "Organization",
      },
    });
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
            <Text>
              <FormattedMessage id="organization.branding.margins.top" defaultMessage="Top" />
            </Text>
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
            <Text>
              <FormattedMessage id="organization.branding.margins.bottom" defaultMessage="Bottom" />
            </Text>
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
            <Text>
              <FormattedMessage id="organization.branding.margins.sides" defaultMessage="Sides" />
            </Text>
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
            <Text>
              <FormattedMessage
                id="organization.branding.show-logo-description"
                defaultMessage="Display the organization's logo on your documents."
              />
            </Text>
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
            title: intl.formatMessage({
              id: "organization.branding.title1",
              defaultMessage: "Title 1",
            }),
            fontKey: "title1FontFamily",
            colorKey: "title1Color",
            sizeKey: "title1FontSize",
          },
          {
            title: intl.formatMessage({
              id: "organization.branding.title2",
              defaultMessage: "Title 2",
            }),
            fontKey: "title2FontFamily",
            colorKey: "title2Color",
            sizeKey: "title2FontSize",
          },
          {
            title: intl.formatMessage({
              id: "organization.branding.text",
              defaultMessage: "Texts",
            }),
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
                {families.map(({ family }) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </Select>
            </Stack>
            <Stack>
              <Text>
                <FormattedMessage id="generic.size" defaultMessage="Size" />
              </Text>
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
              <Text>
                <FormattedMessage id="generic.color" defaultMessage="Color" />
              </Text>
              <HStack spacing={2}>
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
                  onChange={(color) => {
                    handleThemeChange({ [key.colorKey]: color });
                  }}
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
          <FormattedMessage
            id="organization.branding.legal-description"
            defaultMessage="This text will be displayed at the end of documents that include a signature process."
          />
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
      id
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

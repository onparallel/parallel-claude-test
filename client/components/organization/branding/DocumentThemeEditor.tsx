import { gql, useApolloClient, useMutation } from "@apollo/client";
import { mergeDeep } from "@apollo/client/utilities";
import {
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { ColorInput } from "@parallel/components/common/ColorInput";
import { Divider } from "@parallel/components/common/Divider";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { RichTextEditor } from "@parallel/components/common/slate/RichTextEditor";
import {
  DocumentThemeEditor_OrganizationFragmentDoc,
  DocumentThemeEditor_updateOrganizationDocumentThemeDocument,
  DocumentThemeEditor_updateOrganizationDocumentThemeMutationVariables,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useState } from "react";
import { IMaskInput } from "react-imask";
import { FormattedMessage, useIntl } from "react-intl";
import fonts from "../../../utils/fonts.json";

interface DocumentThemeEditorProps {
  orgId: string;
  theme: any;
  isDisabled?: boolean;
}

export function DocumentThemeEditor({
  orgId,
  theme: _theme,
  isDisabled,
}: DocumentThemeEditorProps) {
  const intl = useIntl();
  const [theme, setTheme] = useState(_theme);
  function updateTheme(partial: any) {
    setTheme((current: any) => mergeDeep(current, partial));
  }

  const FONT_SIZES_PT = [
    5, 5.5, 6.5, 7.5, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
  ];

  const [updateOrganizationDocumentTheme] = useMutation(
    DocumentThemeEditor_updateOrganizationDocumentThemeDocument
  );

  const updateOrganizationTheme = useDebouncedAsync(
    async function (
      data: DocumentThemeEditor_updateOrganizationDocumentThemeMutationVariables["data"]
    ) {
      await updateOrganizationDocumentTheme({
        variables: { data },
      });
    },
    500,
    []
  );

  const apollo = useApolloClient();
  async function handleThemeChange(data: Record<string, any>) {
    // update cache so that the preview is more responsive
    updateTheme(data);
    updateFragment(apollo.cache, {
      fragment: DocumentThemeEditor_OrganizationFragmentDoc,
      id: orgId,
      data: (cached) => {
        const pdfDocumentTheme = mergeDeep(cached!.pdfDocumentTheme, data);
        return {
          ...cached!,
          pdfDocumentTheme,
        };
      },
    });
    try {
      await updateOrganizationTheme(data);
    } catch (error) {
      if (error !== "DEBOUNCED") {
        throw error;
      }
    }
  }

  const [colorError, setColorError] = useState<Record<string, boolean>>({});
  async function handleColorChange(colorKey: string, color: string) {
    try {
      const isError = !/^#[a-f\d]{6}$/i.test(color);
      setColorError({ ...colorError, [colorKey]: isError });
      if (isError) {
        updateTheme({ [colorKey]: color });
        return;
      }
      await handleThemeChange({ [colorKey]: color });
    } catch (error) {
      if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
        if ((error.graphQLErrors[0].extensions.extra as any).code === "INVALID_HEX_VALUE_ERROR") {
          setColorError({ ...colorError, [colorKey]: true });
        }
      }
    }
  }

  const locales = useSupportedLocales();

  return (
    <Stack spacing={8}>
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage
            id="component.document-theme-editor.margins-header"
            defaultMessage="Margins"
          />
        </Heading>
        <HStack spacing={4}>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.document-theme-editor.margin-top"
                defaultMessage="Top"
              />
            </Text>
            <NumeralInput
              background="white"
              decimals={1}
              suffix=" mm"
              value={theme.marginTop}
              onChange={(value) => handleThemeChange({ marginTop: value })}
            />
          </Stack>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.document-theme-editor.margin-bottom"
                defaultMessage="Bottom"
              />
            </Text>
            <NumeralInput
              background="white"
              decimals={1}
              suffix=" mm"
              value={theme.marginBottom}
              onChange={(value) => handleThemeChange({ marginBottom: value })}
            />
          </Stack>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.document-theme-editor.margin-sides"
                defaultMessage="Sides"
              />
            </Text>
            <NumeralInput
              background="white"
              decimals={1}
              suffix=" mm"
              value={theme.marginLeft}
              onChange={(value) => handleThemeChange({ marginLeft: value, marginRight: value })}
            />
          </Stack>
        </HStack>
        <HStack justifyContent="space-between" alignItems="center">
          <Stack>
            <Heading as="h4" size="md" fontWeight="semibold">
              <FormattedMessage
                id="component.document-theme-editor.show-logo-header"
                defaultMessage="Logo"
              />
            </Heading>
            <Text>
              <FormattedMessage
                id="component.document-theme-editor.show-logo-description"
                defaultMessage="Display the organization's logo on your documents."
              />
            </Text>
          </Stack>
          <Switch
            isChecked={theme.showLogo}
            onChange={(e) => handleThemeChange({ showLogo: e.target.checked })}
            isDisabled={isDisabled}
          />
        </HStack>
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage
            id="component.document-theme-editor.fonts-header"
            defaultMessage="Fonts"
          />
        </Heading>
        {[
          {
            title: intl.formatMessage({
              id: "component.document-theme-editor.typography-title1",
              defaultMessage: "Title 1",
            }),
            fontKey: "title1FontFamily",
            colorKey: "title1Color",
            sizeKey: "title1FontSize",
          },
          {
            title: intl.formatMessage({
              id: "component.document-theme-editor.typography-title2",
              defaultMessage: "Title 2",
            }),
            fontKey: "title2FontFamily",
            colorKey: "title2Color",
            sizeKey: "title2FontSize",
          },
          {
            title: intl.formatMessage({
              id: "component.document-theme-editor.typography-text",
              defaultMessage: "Texts",
            }),
            fontKey: "textFontFamily",
            colorKey: "textColor",
            sizeKey: "textFontSize",
          },
        ].map((key, i) => (
          <HStack align="center" spacing={4} key={i}>
            <FormControl>
              <FormLabel fontWeight="normal">{key.title}</FormLabel>
              <Select
                backgroundColor="white"
                value={theme[key.fontKey]}
                onChange={(e) => {
                  handleThemeChange({ [key.fontKey]: e.target.value });
                }}
                isDisabled={isDisabled}
              >
                {fonts.map(({ family }) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontWeight="normal">
                <FormattedMessage
                  id="component.document-theme-editor.font-size"
                  defaultMessage="Size"
                />
              </FormLabel>
              <Select
                backgroundColor="white"
                value={theme[key.sizeKey]}
                onChange={(e) => {
                  handleThemeChange({ [key.sizeKey]: parseFloat(e.target.value) });
                }}
                isDisabled={isDisabled}
              >
                {FONT_SIZES_PT.map((v) => (
                  <option key={v} value={v}>
                    {v} pt
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontWeight="normal">
                <FormattedMessage
                  id="component.document-theme-editor.font-color"
                  defaultMessage="Color"
                />
              </FormLabel>
              <HStack spacing={2}>
                <Input
                  as={IMaskInput}
                  {...({
                    mask: "#AAAAAA",
                    definitions: { A: /[0-9A-Fa-f]/ },
                    onAccept: (value: string) => handleColorChange(key.colorKey, value),
                  } as any)}
                  minWidth="102px"
                  backgroundColor="white"
                  value={theme[key.colorKey]}
                  isDisabled={isDisabled}
                  isInvalid={colorError[key.colorKey]}
                />
                <FormControl height="40px">
                  <ColorInput
                    width="40px"
                    minWidth="40px"
                    borderRadius="100%"
                    value={theme[key.colorKey].length === 7 ? theme[key.colorKey] : "#ffffff"}
                    onChange={(value) => handleColorChange(key.colorKey, value)}
                    isDisabled={isDisabled}
                    isInvalid={colorError[key.colorKey]}
                  />
                </FormControl>
              </HStack>
            </FormControl>
          </HStack>
        ))}
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage
            id="component.document-theme-editor.legal-disclaimer"
            defaultMessage="Legal disclaimer"
          />
        </Heading>
        <Text>
          <FormattedMessage
            id="component.document-theme-editor.legal-disclaimer-description"
            defaultMessage="This text will be displayed at the end of documents that include a signature process. The language will be adapted to the language of the petition."
          />
        </Text>

        <Tabs as={Card} variant="enclosed">
          <TabList margin={"-1px"}>
            {locales.map(({ key, localizedLabel }) => (
              <Tab key={key}>
                <Text fontWeight="500">{localizedLabel}</Text>
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            {locales.map(({ key }) => (
              <TabPanel key={key}>
                <RichTextEditor
                  id={`legal-text-editor-${key}`}
                  value={theme.legalText.en}
                  onChange={(value) => {
                    handleThemeChange({ legalText: { [key]: value } });
                  }}
                  isDisabled={isDisabled}
                  toolbarOpts={{ headingButton: false, listButtons: false }}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Stack>
    </Stack>
  );
}

DocumentThemeEditor.fragments = {
  Organization: gql`
    fragment DocumentThemeEditor_Organization on Organization {
      id
      pdfDocumentTheme
    }
  `,
};

const _mutations = [
  gql`
    mutation DocumentThemeEditor_updateOrganizationDocumentTheme(
      $data: OrganizationDocumentThemeInput!
    ) {
      updateOrganizationDocumentTheme(data: $data) {
        id
        pdfDocumentTheme
      }
    }
  `,
];

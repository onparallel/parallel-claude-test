import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
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
import { DocumentThemeEditor_OrganizationThemeFragment } from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";
import fonts from "../../../utils/fonts.json";

interface DocumentThemeEditorProps {
  theme: DocumentThemeEditor_OrganizationThemeFragment;
  onChange: (data: DocumentThemeEditor_OrganizationThemeFragment["data"]) => Promise<void>;
  onResetFonts: () => Promise<void>;
  isDisabled?: boolean;
}

export function DocumentThemeEditor({
  theme,
  onChange,
  onResetFonts,
  isDisabled,
}: DocumentThemeEditorProps) {
  const intl = useIntl();

  const FONT_SIZES_PT = [
    5, 5.5, 6.5, 7.5, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
  ];

  // use state for colors to be able to show partial input
  const [colorState, setColorState] = useState<Record<string, string>>(
    pick(theme.data, ["textColor", "title1Color", "title2Color"])
  );

  // make sure to update the internal state when selected theme changes
  useEffect(() => {
    setColorState(pick(theme.data, ["textColor", "title1Color", "title2Color"]));
    setColorError({});
  }, [theme.id]);

  const [colorError, setColorError] = useState<Record<string, boolean>>({});
  async function handleColorChange(colorKey: string, color: string) {
    try {
      if (colorState[colorKey] === color) return;
      setColorState({ ...colorState, [colorKey]: color });
      const isError = !/^#[a-f\d]{6}$/i.test(color);
      setColorError({ ...colorError, [colorKey]: isError });
      if (!isError) {
        await onChange({ [colorKey]: color });
      }
    } catch (error) {
      if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
        if ((error.graphQLErrors[0].extensions.extra as any).code === "INVALID_HEX_VALUE_ERROR") {
          setColorError({ ...colorError, [colorKey]: true });
        }
      }
    }
  }

  function handleResetFonts() {
    setColorError({});
    setColorState({ textColor: "#000000", title1Color: "#000000", title2Color: "#000000" });
    onResetFonts();
  }

  const locales = useSupportedLocales();

  const sortedFonts = useMemo(
    () =>
      fonts.sort(function (a, b) {
        return a.family.localeCompare(b.family);
      }),
    [fonts]
  );

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
              value={theme.data.marginTop}
              onChange={(value) => onChange({ marginTop: value })}
              isDisabled={isDisabled}
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
              value={theme.data.marginBottom}
              onChange={(value) => onChange({ marginBottom: value })}
              isDisabled={isDisabled}
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
              value={theme.data.marginLeft}
              onChange={(value) => onChange({ marginLeft: value, marginRight: value })}
              isDisabled={isDisabled}
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
            isChecked={theme.data.showLogo}
            onChange={(e) => onChange({ showLogo: e.target.checked })}
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
            <FormControl isDisabled={isDisabled}>
              <FormLabel fontWeight="normal">{key.title}</FormLabel>
              <Select
                backgroundColor="white"
                value={theme.data[key.fontKey]}
                onChange={(e) => {
                  onChange({ [key.fontKey]: e.target.value });
                }}
              >
                {sortedFonts.map(({ family }) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isDisabled={isDisabled}>
              <FormLabel fontWeight="normal">
                <FormattedMessage
                  id="component.document-theme-editor.font-size"
                  defaultMessage="Size"
                />
              </FormLabel>
              <Select
                backgroundColor="white"
                value={theme.data[key.sizeKey]}
                onChange={(e) => {
                  onChange({ [key.sizeKey]: parseFloat(e.target.value) });
                }}
              >
                {FONT_SIZES_PT.map((v) => (
                  <option key={v} value={v}>
                    {v} pt
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isInvalid={colorError[key.colorKey]} isDisabled={isDisabled}>
              <FormLabel fontWeight="normal">
                <FormattedMessage
                  id="component.document-theme-editor.font-color"
                  defaultMessage="Color"
                />
              </FormLabel>
              <ColorInput
                value={colorState[key.colorKey]}
                onChange={(value) => handleColorChange(key.colorKey, value)}
              />
            </FormControl>
          </HStack>
        ))}
      </Stack>
      <HStack justifyContent="flex-end">
        <Button variant="link" onClick={handleResetFonts} isDisabled={!theme.isDirty}>
          <FormattedMessage
            id="component.document-theme-editor.restore-defaults"
            defaultMessage="Restore defaults"
          />
        </Button>
      </HStack>
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
            defaultMessage="This text will be displayed at the end of documents that include a signature process. The language will be adapted to the language of the parallel."
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
                  id={`legal-text-editor-${theme.id}-${key}`}
                  value={theme.data.legalText[key]}
                  onChange={(value) => {
                    onChange({ legalText: { [key]: value } });
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
  OrganizationTheme: gql`
    fragment DocumentThemeEditor_OrganizationTheme on OrganizationTheme {
      id
      data
      isDirty
    }
  `,
};

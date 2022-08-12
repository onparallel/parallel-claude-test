import {
  Button,
  FormControl,
  FormLabel,
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
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useEffect, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import fonts from "../../../utils/fonts.json";

interface DocumentThemeEditorProps {
  canRestoreFonts: boolean;
  onRestoreFonts: () => Promise<void>;
  isDisabled?: boolean;
  themeId: string;
}

const FONT_SIZES_PT = [
  5, 5.5, 6.5, 7.5, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
];

export interface DocumentThemeEditorData {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  textColor: string;
  title1Color: string;
  title2Color: string;
  textFontFamily: string;
  title1FontFamily: string;
  title2FontFamily: string;
  textFontSize: number;
  title1FontSize: number;
  title2FontSize: number;
  showLogo: boolean;
  legalText: {
    en: any;
    es: any;
  };
}

export function DocumentThemeEditor({
  canRestoreFonts: canResetFonts,
  onRestoreFonts: onResetFonts,
  isDisabled,
  themeId,
}: DocumentThemeEditorProps) {
  const intl = useIntl();

  const { watch, setValue, control, register, formState } =
    useFormContext<DocumentThemeEditorData>();

  useEffect(() => {
    const { unsubscribe } = watch((data, { name }) => {
      if (name === "marginLeft" && isDefined(data["marginLeft"])) {
        setValue("marginRight", data["marginLeft"]);
      }
    });
    return () => unsubscribe();
  }, [watch]);

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
        <Text as="h4" fontSize="lg" fontWeight="semibold">
          <FormattedMessage
            id="component.document-theme-editor.margins-header"
            defaultMessage="Margins"
          />
        </Text>
        <HStack spacing={4}>
          <FormControl isDisabled={isDisabled}>
            <FormLabel fontWeight="normal" width="auto">
              <FormattedMessage
                id="component.document-theme-editor.margin-top"
                defaultMessage="Top"
              />
            </FormLabel>
            <Controller
              name="marginTop"
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <NumeralInput
                  background="white"
                  decimals={1}
                  onlyPositive
                  suffix=" mm"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </FormControl>
          <FormControl isDisabled={isDisabled}>
            <FormLabel fontWeight="normal" width="auto">
              <FormattedMessage
                id="component.document-theme-editor.margin-bottom"
                defaultMessage="Bottom"
              />
            </FormLabel>
            <Controller
              name="marginBottom"
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <NumeralInput
                  background="white"
                  decimals={1}
                  onlyPositive
                  suffix=" mm"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </FormControl>
          <FormControl isDisabled={isDisabled}>
            <FormLabel fontWeight="normal" width="auto">
              <FormattedMessage
                id="component.document-theme-editor.margin-sides"
                defaultMessage="Sides"
              />
            </FormLabel>
            <Controller
              name="marginLeft"
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <NumeralInput
                  background="white"
                  decimals={1}
                  onlyPositive
                  suffix=" mm"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </FormControl>
        </HStack>
        <Stack>
          <Text as="h4" fontSize="lg" fontWeight="semibold">
            <FormattedMessage
              id="component.document-theme-editor.show-logo-header"
              defaultMessage="Logo"
            />
          </Text>
          <FormControl
            as={HStack}
            justifyContent="space-between"
            alignItems="center"
            isDisabled={isDisabled}
          >
            <FormLabel margin={0} fontWeight="normal">
              <FormattedMessage
                id="component.document-theme-editor.show-logo-description"
                defaultMessage="Display your logo on the documents"
              />
            </FormLabel>
            <Switch {...register("showLogo")} />
          </FormControl>
        </Stack>
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <Text as="h4" fontSize="lg" fontWeight="semibold">
          <FormattedMessage
            id="component.document-theme-editor.fonts-header"
            defaultMessage="Fonts"
          />
        </Text>
        {(
          [
            {
              title: intl.formatMessage({
                id: "component.document-theme-editor.typography-title1",
                defaultMessage: "Title 1",
              }),
              key: "title1",
            },
            {
              title: intl.formatMessage({
                id: "component.document-theme-editor.typography-title2",
                defaultMessage: "Title 2",
              }),
              key: "title2",
            },
            {
              title: intl.formatMessage({
                id: "component.document-theme-editor.typography-text",
                defaultMessage: "Texts",
              }),
              key: "text",
            },
          ] as { title: string; key: "text" | "title1" | "title2" }[]
        ).map(({ key, title }, i) => (
          <HStack align="center" spacing={4} key={key}>
            <FormControl isDisabled={isDisabled}>
              <FormLabel fontWeight="normal">{title}</FormLabel>
              <Select {...register(`${key}FontFamily`)} backgroundColor="white">
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
                {...register(`${key}FontSize`, { valueAsNumber: true })}
                backgroundColor="white"
              >
                {FONT_SIZES_PT.map((v) => (
                  <option key={v} value={v}>{`${v} pt`}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl isDisabled={isDisabled} isInvalid={!!formState.errors[`${key}Color`]}>
              <FormLabel fontWeight="normal">
                <FormattedMessage
                  id="component.document-theme-editor.font-color"
                  defaultMessage="Color"
                />
              </FormLabel>
              <Controller
                control={control}
                name={`${key}Color`}
                rules={{ pattern: /^#[a-f\d]{6}$/i }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <ColorInput value={value} onChange={onChange} onBlur={onBlur} />
                )}
              />
            </FormControl>
          </HStack>
        ))}
      </Stack>
      <HStack justifyContent="flex-end">
        <Button variant="link" onClick={onResetFonts} isDisabled={!canResetFonts}>
          <FormattedMessage
            id="component.document-theme-editor.restore-defaults"
            defaultMessage="Restore defaults"
          />
        </Button>
      </HStack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <Text as="h4" fontSize="lg" fontWeight="semibold">
          <FormattedMessage
            id="component.document-theme-editor.legal-disclaimer"
            defaultMessage="Legal disclaimer"
          />
        </Text>
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
                <Controller
                  control={control}
                  name={`legalText.${key as "es" | "en"}`}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <RichTextEditor
                      id={`legal-text-editor-${key}-${themeId}`}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      isDisabled={isDisabled}
                      toolbarOpts={{ headingButton: false, listButtons: false }}
                    />
                  )}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Stack>
    </Stack>
  );
}

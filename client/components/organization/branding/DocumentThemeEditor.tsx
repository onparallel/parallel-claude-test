import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { Select } from "@parallel/chakra/components";
import { Card } from "@parallel/components/common/Card";
import { ColorInput } from "@parallel/components/common/ColorInput";
import { Divider } from "@parallel/components/common/Divider";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { RichTextEditor } from "@parallel/components/common/slate/RichTextEditor";
import { DocumentThemeEditor_UserFragment, PetitionLocale } from "@parallel/graphql/__types";
import { useAvailablePetitionLocales } from "@parallel/utils/locales";
import { untranslated } from "@parallel/utils/untranslated";
import { useEffect, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { isNonNullish, sort, zip } from "remeda";
import fonts from "../../../utils/fonts.json";

interface DocumentThemeEditorProps {
  user: DocumentThemeEditor_UserFragment;
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
  columnGap: number;
  doubleColumn: boolean;
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
  legalText: Record<PetitionLocale, any>;
}

const FONT_PROPERTIES = (["title1", "title2", "text"] as const).flatMap((k) =>
  (["FontFamily", "FontSize", "Color"] as const).map((p) => `${k}${p}` as const),
);

export function DocumentThemeEditor({ user, isDisabled, themeId }: DocumentThemeEditorProps) {
  const intl = useIntl();

  const { watch, setValue, control, register, formState } =
    useFormContext<DocumentThemeEditorData>();

  useEffect(() => {
    const { unsubscribe } = watch((data, { name }) => {
      if (name === "marginLeft" && isNonNullish(data["marginLeft"])) {
        setValue("marginRight", data["marginLeft"]);
      }
    });
    return () => unsubscribe();
  }, [watch]);

  const locales = useAvailablePetitionLocales(user);

  const sortedFonts = useMemo(
    () =>
      sort(fonts, function (a, b) {
        return a.family.localeCompare(b.family);
      }),
    [fonts],
  );

  const data = watch();
  const defaultFontValues = [16, 14, 12].flatMap((s) => ["IBM Plex Sans", s, "#000000"]);
  const canRestoreFonts = zip(
    FONT_PROPERTIES.map((p) => data[p]),
    defaultFontValues,
  ).some(([a, b]) => a !== b);

  async function handleRestoreFonts() {
    for (const [prop, value] of zip(FONT_PROPERTIES, defaultFontValues)) {
      setValue(prop, value, { shouldDirty: true });
    }
  }

  return (
    <Stack spacing={8}>
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Text as="h4" id="layout-label" fontSize="lg" fontWeight="semibold">
            <FormattedMessage
              id="component.document-theme-editor.layout-header"
              defaultMessage="Layout"
            />
          </Text>
          <Controller
            name="doubleColumn"
            control={control}
            render={({ field: { onChange, value, onBlur } }) => (
              <RadioGroup
                value={value ? "double" : "single"}
                onChange={(value) => onChange(value === "double")}
                aria-labelledby="layout-label"
              >
                <Stack spacing={5} direction="row">
                  <Radio value="single" flex={1}>
                    <FormattedMessage
                      id="component.document-theme-editor.layout-single-column"
                      defaultMessage="Single column"
                    />
                  </Radio>
                  <Radio value="double" flex={1}>
                    <FormattedMessage
                      id="component.document-theme-editor.layout-double-column"
                      defaultMessage="Double column"
                    />
                  </Radio>
                </Stack>
              </RadioGroup>
            )}
          />
        </Stack>

        <Stack spacing={2}>
          <Text as="h4" fontSize="lg" fontWeight="semibold">
            <FormattedMessage
              id="component.document-theme-editor.margins-header"
              defaultMessage="Margins"
            />
          </Text>
          <HStack spacing={4}>
            {[
              {
                key: "marginTop" as const,
                label: intl.formatMessage({
                  id: "component.document-theme-editor.margin-top",
                  defaultMessage: "Top",
                }),
              },
              {
                key: "marginLeft" as const,
                label: intl.formatMessage({
                  id: "component.document-theme-editor.margin-sides",
                  defaultMessage: "Sides",
                }),
              },
              {
                key: "marginBottom" as const,
                label: intl.formatMessage({
                  id: "component.document-theme-editor.margin-bottom",
                  defaultMessage: "Bottom",
                }),
              },
              {
                key: "columnGap" as const,
                label: intl.formatMessage({
                  id: "component.document-theme-editor.column-gap",
                  defaultMessage: "Column gap",
                }),
              },
            ].map(({ key, label }) => (
              <FormControl key={key} isDisabled={isDisabled} isInvalid={!!formState.errors[key]}>
                <FormLabel fontWeight="normal" width="auto">
                  {label}
                </FormLabel>
                <Controller
                  name={key}
                  control={control}
                  rules={{ max: 100, min: 0 }}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <NumeralInput
                      background="white"
                      decimals={1}
                      onlyPositive
                      suffix=" mm"
                      value={value}
                      onChange={(value) => onChange(value as number)}
                      onBlur={onBlur}
                    />
                  )}
                />
              </FormControl>
            ))}
          </HStack>
          <FormControl
            isInvalid={(["marginTop", "marginBottom", "marginLeft", "columnGap"] as const).some(
              (k) => !!formState.errors[k],
            )}
          >
            <FormErrorMessage marginTop={0}>
              <FormattedMessage
                id="component.document-theme-editor.margin-range-error"
                defaultMessage="Value must be between 0 and 100mm"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
        <Stack spacing={2}>
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
        <Stack spacing={2}>
          <Text as="h4" fontSize="lg" fontWeight="semibold">
            <FormattedMessage
              id="component.document-theme-editor.fonts-header"
              defaultMessage="Fonts"
            />
          </Text>
          <Stack spacing={4}>
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
                      <option key={v} value={v}>
                        {<FormattedNumber value={v} />} {untranslated("pt")}
                      </option>
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
        </Stack>
        <HStack justifyContent="flex-end">
          <Button
            variant="link"
            onClick={handleRestoreFonts}
            isDisabled={!canRestoreFonts || isDisabled}
          >
            <FormattedMessage
              id="component.document-theme-editor.restore-defaults"
              defaultMessage="Restore defaults"
            />
          </Button>
        </HStack>
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={2}>
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
        <Tabs as={Card} variant="enclosed" key={themeId}>
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
                  name={`legalText.${key}`}
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

const _fragments = {
  User: gql`
    fragment DocumentThemeEditor_User on User {
      ...useAvailablePetitionLocales_User
    }
  `,
};

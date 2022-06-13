import { gql, useApolloClient, useMutation } from "@apollo/client";
import { mergeDeep } from "@apollo/client/utilities";
import {
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
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { RichTextEditor } from "@parallel/components/common/slate/RichTextEditor";
import {
  BrandingDocumentForm_updateOrganizationDocumentThemeDocument,
  BrandingDocumentForm_updateOrganizationDocumentThemeMutationVariables,
  BrandingDocumentForm_UserFragment,
  BrandingDocumentPreview_OrganizationFragmentDoc,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { isAdmin } from "@parallel/utils/roles";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { ChangeEvent, useState } from "react";
import { IMaskInput } from "react-imask";
import { FormattedMessage, useIntl } from "react-intl";
import fonts from "../../../utils/fonts.json";

interface BrandingDocumentFormProps {
  user: BrandingDocumentForm_UserFragment;
}

export function BrandingDocumentForm({ user }: BrandingDocumentFormProps) {
  const intl = useIntl();
  const [theme, setTheme] = useState(user.organization.pdfDocumentTheme);

  const hasAdminRole = isAdmin(user.role);

  const FONT_SIZES_PT = [
    5, 5.5, 6.5, 7.5, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
  ];

  const [updateOrganizationDocumentTheme] = useMutation(
    BrandingDocumentForm_updateOrganizationDocumentThemeDocument
  );

  const updateOrganizationTheme = useDebouncedAsync(
    async function (
      data: BrandingDocumentForm_updateOrganizationDocumentThemeMutationVariables["data"]
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
    // immediately write cache fragment with expected result.
    // this allows us to not wait for the server response in order to update the BrandingDocumentPreview
    updateFragment(apollo.cache, {
      fragment: BrandingDocumentPreview_OrganizationFragmentDoc,
      id: user.organization.id,
      data: (cached) => {
        const pdfDocumentTheme = mergeDeep(cached!.pdfDocumentTheme, data);
        setTheme(pdfDocumentTheme);
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
  function handleColorInputChange(colorKey: string) {
    return async (event: ChangeEvent<HTMLInputElement>) => {
      const color = event.target.value;
      try {
        setColorError({ ...colorError, [colorKey]: false });
        await handleThemeChange({ [colorKey]: color });
      } catch (error) {
        if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
          if ((error.graphQLErrors[0].extensions.extra as any).code === "INVALID_HEX_VALUE_ERROR") {
            setColorError({ ...colorError, [colorKey]: true });
          }
        }
      }
    };
  }

  return (
    <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.2xs" }} width="100%">
      {!hasAdminRole ? <OnlyAdminsAlert /> : null}
      <Stack spacing={4}>
        <Heading as="h4" size="md" fontWeight="semibold">
          <FormattedMessage id="organization.branding.margins-header" defaultMessage="Margins" />
        </Heading>
        <HStack spacing={4}>
          <Stack>
            <Text>
              <FormattedMessage id="organization.branding.margins.top" defaultMessage="Top" />
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
              <FormattedMessage id="organization.branding.margins.bottom" defaultMessage="Bottom" />
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
              <FormattedMessage id="organization.branding.margins.sides" defaultMessage="Sides" />
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
            isDisabled={!hasAdminRole}
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
                isDisabled={!hasAdminRole}
              >
                {fonts.map(({ family }) => (
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
                  handleThemeChange({ [key.sizeKey]: parseFloat(e.target.value) });
                }}
                isDisabled={!hasAdminRole}
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
                  onChange={handleColorInputChange(key.colorKey)}
                  isDisabled={!hasAdminRole}
                  isInvalid={colorError[key.colorKey]}
                />
                <ColorInput
                  boxSize="40px"
                  borderRadius="100%"
                  value={theme[key.colorKey].length === 7 ? theme[key.colorKey] : "#ffffff"}
                  onChange={(color) => {
                    setColorError({ ...colorError, [key.colorKey]: false });
                    handleThemeChange({ [key.colorKey]: color });
                  }}
                  isDisabled={!hasAdminRole}
                  isInvalid={colorError[key.colorKey]}
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
            defaultMessage="This text will be displayed at the end of documents that include a signature process. The language will be adapted to the language of the petition."
          />
        </Text>

        <Tabs as={Card} variant="enclosed">
          <TabList margin={"-1px"}>
            <Tab>
              <Text fontWeight="500">
                <FormattedMessage id="generic.english" defaultMessage="English" />
              </Text>
            </Tab>
            <Tab>
              <Text fontWeight="500">
                <FormattedMessage id="generic.spanish" defaultMessage="Spanish" />
              </Text>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <RichTextEditor
                id="legal-text-editor-en"
                value={theme.legalText.en}
                onChange={(value) => {
                  handleThemeChange({ legalText: { en: value } });
                }}
                isDisabled={!hasAdminRole}
                toolbarOpts={{ headingButton: false, listButtons: false }}
              />
            </TabPanel>
            <TabPanel>
              <RichTextEditor
                id="legal-text-editor-es"
                value={theme.legalText.es}
                onChange={(value) => {
                  handleThemeChange({ legalText: { es: value } });
                }}
                isDisabled={!hasAdminRole}
                toolbarOpts={{ headingButton: false, listButtons: false }}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Stack>
  );
}

BrandingDocumentForm.fragments = {
  User: gql`
    fragment BrandingDocumentForm_User on User {
      id
      role
      organization {
        id
        pdfDocumentTheme
      }
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

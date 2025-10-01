import { gql } from "@apollo/client";
import { Box, Center, Flex, Image, Stack, Text } from "@chakra-ui/react";
import { Fonts } from "@parallel/components/organization/branding/DocumentFont";
import { DocumentThemePreview_OrganizationFragment } from "@parallel/graphql/__types";
import { untranslated } from "@parallel/utils/untranslated";
import { CSSProperties } from "react";
import { FormattedMessage } from "react-intl";
import { unique } from "remeda";
import { DocumentThemeEditorData } from "./DocumentThemeEditor";

interface DocumentThemePreviewProps {
  organization: DocumentThemePreview_OrganizationFragment;
  theme: DocumentThemeEditorData;
}

const mm = (value: number) => `calc(${value} * var(--page-width) / 210)`;
const pt = (value: number) => `calc(${value} * 25.4/72 * var(--page-width) / 210)`;

export function DocumentThemePreview({ organization, theme }: DocumentThemePreviewProps) {
  const styles: Record<string, CSSProperties> = {
    title1: {
      fontFamily: theme.title1FontFamily,
      fontSize: pt(theme.title1FontSize),
      color: theme.title1Color,
    },
    title2: {
      fontFamily: theme.title2FontFamily,
      fontSize: pt(theme.title2FontSize),
      color: theme.title2Color,
    },
    text: {
      fontFamily: theme.textFontFamily,
      fontSize: pt(theme.textFontSize),
      color: theme.textColor,
      textAlign: "justify",
    },
  };

  const logoSrc =
    organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/emails/logo.png`;

  return (
    <Box width="100%" paddingBottom={8}>
      <>
        {unique([theme.title1FontFamily, theme.title2FontFamily, theme.textFontFamily])
          .filter((font) => font !== "IBM Plex Sans" && font !== "Source Sans Pro")
          .map((font) => (
            <Fonts key={font} family={font} />
          ))}
      </>
      <Box
        backgroundColor="white"
        rounded="md"
        boxShadow="short"
        width={{ base: "327px", sm: "500px" }}
        border="1px solid"
        borderColor="gray.200"
        margin="0 auto"
        position="relative"
        overflow="hidden"
        aspectRatio={210 / 297}
        sx={{
          "--page-width": { base: "327px", sm: "500px" },
        }}
      >
        <Box
          position="absolute"
          insetEnd="0"
          top="0"
          paddingX={5}
          paddingY={1.5}
          backgroundColor="gray.700"
          borderBottomStartRadius="md"
        >
          <Text color="white" fontSize="sm">
            <FormattedMessage
              id="component.branding-document-preview.preview-label"
              defaultMessage="Preview"
            />
          </Text>
        </Box>
        <Box
          position="absolute"
          insetEnd={mm(theme.marginRight)}
          top={`calc(100% - ${mm(theme.marginBottom)})`}
          style={{ ...styles.pageNumber, ...styles.text }}
        >
          1
        </Box>
        <Flex
          direction="column"
          position="absolute"
          overflow="hidden"
          top={0}
          insetEnd={0}
          insetStart={0}
          paddingTop={mm(theme.marginTop)}
          paddingEnd={mm(theme.marginRight)}
          paddingStart={mm(theme.marginLeft)}
          bottom={mm(theme.marginBottom)}
        >
          <Box marginBottom={mm(10)}>
            {theme.showLogo ? (
              <Center>
                <Image
                  alt={organization.name}
                  src={logoSrc}
                  width={mm(84)}
                  maxHeight={mm(55)}
                  objectFit="contain"
                />
              </Center>
            ) : null}
            <Center fontWeight="bold" style={styles.title1} marginTop={mm(10)}>
              <FormattedMessage
                id="component.branding-document-preview.document-title"
                defaultMessage="Document title"
              />
            </Center>
          </Box>
          <Box
            flex="1"
            minHeight={0}
            sx={
              theme.doubleColumn
                ? { columnCount: 2, columnFill: "auto", columnGap: mm(theme.columnGap) }
                : {}
            }
            overflow="hidden"
          >
            <Text fontWeight="bold" style={styles.title2}>
              {untranslated("Lorem ipsum")}
            </Text>
            <Text style={styles.text} marginTop={mm(2)}>
              {untranslated(
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
              )}
            </Text>
            <Stack
              border="1px solid"
              borderColor="gray.200"
              borderRadius={mm(1.5)}
              padding={mm(4.2)}
              spacing={mm(2)}
              marginTop={mm(5)}
            >
              <Text fontWeight="bold" style={styles.text}>
                {untranslated("Lorem ipsum")}
              </Text>
              <Text style={styles.text}> {untranslated("Lorem ipsum")}</Text>
            </Stack>
            <Text fontWeight="bold" style={styles.title2} marginTop={mm(5)}>
              {untranslated("Lorem ipsum")}
            </Text>
            <Text style={styles.text} marginTop={mm(2)}>
              {untranslated(
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              )}
            </Text>
            <Stack
              border="1px solid"
              borderColor="gray.200"
              borderRadius={mm(1.5)}
              padding={mm(4.2)}
              spacing={mm(2)}
              marginTop={mm(5)}
            >
              <Text fontWeight="bold" style={styles.text}>
                {untranslated("Lorem ipsum")}
              </Text>
              <Text style={styles.text}> {untranslated("Lorem ipsum")}</Text>
            </Stack>
            <Text fontWeight="bold" style={styles.title2} marginTop={mm(5)}>
              {untranslated("Lorem ipsum")}
            </Text>
            <Text style={styles.text} marginTop={mm(2)}>
              {untranslated(
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
              )}
            </Text>
            <Text fontWeight="bold" style={styles.title2} marginTop={mm(5)}>
              {untranslated("Lorem ipsum")}
            </Text>
            <Text style={styles.text} marginTop={mm(2)}>
              {untranslated(
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              )}
            </Text>
          </Box>
        </Flex>
      </Box>
      <Text width="full" textAlign="center" fontSize="sm" color="gray.600" mt={4}>
        <FormattedMessage
          id="component.branding-document-preview.footer"
          defaultMessage="An example of a document."
        />
      </Text>
    </Box>
  );
}

DocumentThemePreview.fragments = {
  Organization: gql`
    fragment DocumentThemePreview_Organization on Organization {
      id
      name
      logoUrl(options: { resize: { width: 600 }, toFormat: png })
    }
  `,
};

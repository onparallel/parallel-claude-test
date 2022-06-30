import { gql } from "@apollo/client";
import { Box, Center, Flex, Image, Stack, Text } from "@chakra-ui/react";
import { Fonts } from "@parallel/components/organization/branding/DocumentFont";
import {
  DocumentThemePreview_OrganizationFragment,
  DocumentThemePreview_OrganizationThemeFragment,
} from "@parallel/graphql/__types";
import { CSSProperties } from "react";
import { FormattedMessage } from "react-intl";
import { uniq } from "remeda";

interface DocumentThemePreviewProps {
  organization: DocumentThemePreview_OrganizationFragment;
  theme: DocumentThemePreview_OrganizationThemeFragment;
}

export function DocumentThemePreview({
  organization,
  theme: { data: theme },
}: DocumentThemePreviewProps) {
  const mmRatio = "var(--page-width)/210";
  const ptRatio = "25.4/72*var(--page-width)/210";
  const styles: Record<string, CSSProperties> = {
    page: {
      paddingTop: `calc(${mmRatio}*${theme.marginTop})`,
      paddingRight: `calc(${mmRatio}*${theme.marginRight})`,
      paddingLeft: `calc(${mmRatio}*${theme.marginLeft})`,
      bottom: `calc(${mmRatio}*${theme.marginBottom})`,
    },
    logo: {
      width: `calc(${mmRatio}*84)`,
      maxHeight: `calc(${mmRatio}*55)`,
      objectFit: "contain",
    },
    pageNumber: {
      right: `calc(${mmRatio}*${theme.marginRight})`,
      top: `calc(100% - ${mmRatio}*${theme.marginBottom})`,
    },
    title1: {
      fontFamily: theme.title1FontFamily,
      fontSize: `calc(${ptRatio}*${theme.title1FontSize})`,
      color: theme.title1Color,
    },
    title2: {
      fontFamily: theme.title2FontFamily,
      fontSize: `calc(${ptRatio}*${theme.title2FontSize})`,
      color: theme.title2Color,
    },
    text: {
      fontFamily: theme.textFontFamily,
      fontSize: `calc(${ptRatio}*${theme.textFontSize})`,
      color: theme.textColor,
      textAlign: "justify",
    },
  };

  const logoSrc =
    organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;

  return (
    <Box width="100%" paddingBottom={8}>
      <>
        {uniq([theme.title1FontFamily, theme.title2FontFamily, theme.textFontFamily]).map(
          (font) => (
            <Fonts key={font} family={font} />
          )
        )}
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
        _before={{
          height: 0,
          content: "''",
          display: "block",
          paddingBottom: `${(279 / 210) * 100}%`,
        }}
        sx={{
          "--page-width": { base: "327px", sm: "500px" },
        }}
      >
        <Box
          position="absolute"
          right="0"
          top="0"
          paddingX={5}
          paddingY={1.5}
          backgroundColor="gray.700"
          borderBottomLeftRadius="md"
        >
          <Text color="white" fontSize="sm">
            <FormattedMessage
              id="component.branding-document-preview.preview-label"
              defaultMessage="Preview"
            />
          </Text>
        </Box>
        <Box position="absolute" style={{ ...styles.pageNumber, ...styles.text }}>
          1
        </Box>
        <Flex
          direction="column"
          position="absolute"
          overflow="hidden"
          top={0}
          right={0}
          left={0}
          style={styles.page}
        >
          <Box marginBottom={`calc(${mmRatio}*10)`}>
            {theme.showLogo ? (
              <Center>
                <Image alt={organization.name} src={logoSrc} style={styles.logo} />
              </Center>
            ) : null}
            <Center fontWeight="bold" style={styles.title1} marginTop={`calc(${mmRatio}*10)`}>
              <FormattedMessage
                id="component.branding-document-preview.document-title"
                defaultMessage="Document title"
              />
            </Center>
          </Box>
          <Stack spacing={`calc(${mmRatio}*5)`}>
            <Stack spacing={`calc(${mmRatio}*2)`}>
              <Text fontWeight="bold" style={styles.title2}>
                Lorem ipsum
              </Text>
              <Text style={styles.text}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
            <Stack
              border="1px solid"
              borderColor="gray.200"
              borderRadius={`calc(${mmRatio}*1.5)`}
              padding={`calc(${mmRatio}*4.2)`}
              spacing={`calc(${mmRatio}*2)`}
            >
              <Text fontWeight="bold" style={styles.text}>
                Lorem ipsum
              </Text>
              <Text style={styles.text}>Lorem</Text>
            </Stack>
            <Stack spacing={`calc(${mmRatio}*2)`}>
              <Text fontWeight="bold" style={styles.title2}>
                Lorem ipsum
              </Text>
              <Text style={styles.text}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </Text>
            </Stack>
            <Stack spacing={`calc(${mmRatio}*2)`}>
              <Text fontWeight="bold" style={styles.title2}>
                Lorem ipsum
              </Text>
              <Text style={styles.text}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
          </Stack>
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
      logoUrl(options: { resize: { width: 600 } })
    }
  `,
  OrganizationTheme: gql`
    fragment DocumentThemePreview_OrganizationTheme on OrganizationTheme {
      id
      data
    }
  `,
};

import { gql } from "@apollo/client";
import { Box, Center, Image, Stack, Text } from "@chakra-ui/react";
import { BrandingDocumentPreview_OrganizationFragment } from "@parallel/graphql/__types";
import { CSSProperties } from "react";
import { FormattedMessage } from "react-intl";

interface BrandingDocumentPreviewProps {
  organization: BrandingDocumentPreview_OrganizationFragment;
}

export function BrandingDocumentPreview({ organization }: BrandingDocumentPreviewProps) {
  const theme = organization.pdfDocumentTheme;
  const styles: Record<string, CSSProperties> = {
    page: {
      paddingTop: `${theme.marginTop}mm`,
      paddingRight: `${theme.marginRight}mm`,
      paddingBottom: `${theme.marginBottom}mm`,
      paddingLeft: `${theme.marginLeft}mm`,
    },
    title1: { fontSize: theme.title1FontSize, color: theme.title1Color },
    title2: { fontSize: theme.title2FontSize, color: theme.title2Color },
    text: { fontSize: theme.textFontSize, color: theme.textColor },
  };

  const logoSrc =
    organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;

  return (
    <Box width="100%" paddingBottom={8}>
      <Box
        backgroundColor="white"
        rounded="md"
        boxShadow="short"
        maxWidth="container.sm"
        width="100%"
        border="1px solid"
        borderColor="gray.200"
        position="relative"
        overflow="hidden"
        margin="0 auto"
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
              id="component.branding-general-preview.label"
              defaultMessage="Preview"
            />
          </Text>
        </Box>
        <Stack style={styles.page} spacing={5}>
          <Stack>
            {theme.showLogo ? (
              <Center minHeight="100px">
                <Image
                  boxSize="200px"
                  height="100px"
                  objectFit="contain"
                  alt={organization.name}
                  src={logoSrc}
                />
              </Center>
            ) : null}
            <Center fontWeight="bold" style={styles.title1}>
              TITULO DEL DOCUMENTO
            </Center>
          </Stack>
          <Stack>
            <Text fontWeight="bold" style={styles.title2}>
              Lorem ipsum
            </Text>
            <Text style={styles.text}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Text>
          </Stack>
          <Stack border="1px solid" borderColor="gray.200" borderRadius="md" padding={4}>
            <Text fontWeight="bold" style={styles.title2}>
              Lorem ipsum
            </Text>
            <Text style={styles.text}>Lorem</Text>
          </Stack>
          <Stack>
            <Text fontWeight="bold" style={styles.title2}>
              Lorem ipsum
            </Text>
            <Text style={styles.text}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </Text>
          </Stack>
          <Stack>
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

BrandingDocumentPreview.fragments = {
  Organization: gql`
    fragment BrandingDocumentPreview_Organization on Organization {
      id
      name
      logoUrl(options: { resize: { width: 600 } })
      pdfDocumentTheme
    }
  `,
};

import { Box, Center, Image, Stack, Text } from "@chakra-ui/react";
import { CSSProperties } from "react";
import { FormattedMessage } from "react-intl";

interface BrandingDocumentPreviewProps {
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;

  showLogo: boolean;
  logoSrc?: string;
  organizationName?: string;

  title1Font?: string;
  title1Size?: string;
  title1Color?: string;

  title2Font?: string;
  title2Size?: string;
  title2Color?: string;

  textFont?: string;
  textSize?: string;
  textColor?: string;

  legalText?: string;
}

export function BrandingDocumentPreview(props: BrandingDocumentPreviewProps) {
  const styles: Record<string, CSSProperties> = {
    page: {
      paddingTop: props.marginTop,
      paddingRight: props.marginRight,
      paddingBottom: props.marginBottom,
      paddingLeft: props.marginLeft,
    },
    title1: { fontSize: props.title1Size, color: props.title1Color },
    title2: { fontSize: props.title2Size, color: props.title2Color },
    text: { fontSize: props.textSize, color: props.textColor },
  };

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
            {props.showLogo ? (
              <Center minHeight="100px">
                <Image
                  boxSize="200px"
                  height="100px"
                  objectFit="contain"
                  alt={props.organizationName}
                  src={props.logoSrc}
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

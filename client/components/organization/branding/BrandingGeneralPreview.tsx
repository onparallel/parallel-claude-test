import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Image,
  ListItem,
  SkeletonText,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import {
  OrganizationBrandTheme,
  OverrideWithOrganizationTheme,
} from "@parallel/components/common/OverrideWithOrganizationTheme";
import { BrandingGeneralPreview_UserFragment, Maybe, Tone } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";

interface BrandingGeneralPreviewProps {
  user: BrandingGeneralPreview_UserFragment;
  brand: OrganizationBrandTheme;
  tone: Tone;
  logo: Maybe<File> | string;
}

export function BrandingGeneralPreview({ user, brand, tone, logo }: BrandingGeneralPreviewProps) {
  const objectUrl = useMemo(() => {
    return logo && typeof logo !== "string"
      ? URL.createObjectURL(logo)
      : logo ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;
  }, [logo]);

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

        <Stack padding={8} spacing={5} id="branding-preview" fontFamily="body">
          <OverrideWithOrganizationTheme cssVarsRoot="#branding-preview" brandTheme={brand}>
            <Stack>
              <Center minHeight="100px">
                <Image
                  boxSize="200px"
                  height="100px"
                  objectFit="contain"
                  alt={user.organization.name}
                  src={objectUrl}
                />
              </Center>
              <Text>
                <FormattedMessage
                  id="component.branding-general-preview.greetings"
                  defaultMessage="{tone, select, INFORMAL{Hello <b>[Recipient Name]</b>!} other{Dear <b>[Recipient Name]</b>,}}"
                  values={{ tone }}
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="component.branding-general-preview.body"
                  defaultMessage="We remind you that <b>{name}</b> sent you a parallel and some of the requested information has not yet been submitted."
                  values={{ tone, name: user.fullName }}
                />
              </Text>
            </Stack>

            <Stack padding={4} spacing={2.5} backgroundColor="gray.100" borderRadius="md">
              <SkeletonText noOfLines={1} width="20%" speed={0} endColor="gray.400" />
              <SkeletonText noOfLines={1} width="100%" speed={0} endColor="gray.400" />
              <SkeletonText
                noOfLines={1}
                width="70%"
                paddingBottom={3}
                speed={0}
                endColor="gray.400"
              />

              <SkeletonText noOfLines={1} width="10%" speed={0} endColor="gray.400" />
              <SkeletonText noOfLines={1} width="30%" speed={0} endColor="gray.400" />
            </Stack>
            <UnorderedList paddingLeft={4}>
              <ListItem>
                <FormattedMessage
                  id="component.branding-general-preview.pending-fields"
                  defaultMessage="{tone, select, INFORMAL{You have 12/40 fields pending} other{There are currently 12/40 fields pending}}"
                  values={{ tone }}
                />
              </ListItem>
            </UnorderedList>

            <Stack
              width="100%"
              justifyContent="center"
              align="center"
              spacing={2.5}
              paddingBottom={6}
            >
              <Button colorScheme="primary" marginY={3}>
                <FormattedMessage
                  id="component.branding-general-preview.complete-information"
                  defaultMessage="Complete the information"
                />
              </Button>

              <SkeletonText noOfLines={1} width="95%" speed={0} endColor="gray.300" />
              <SkeletonText noOfLines={1} width="40%" speed={0} endColor="gray.300" />
            </Stack>
          </OverrideWithOrganizationTheme>
        </Stack>
      </Box>
      <Text width="full" textAlign="center" fontSize="sm" color="gray.600" mt={4}>
        <FormattedMessage
          id="component.branding-general-preview.footer"
          defaultMessage="An example of the emails your customers will receive."
        />
      </Text>
    </Box>
  );
}

BrandingGeneralPreview.fragments = {
  User: gql`
    fragment BrandingGeneralPreview_User on User {
      fullName
      organization {
        name
        preferredTone
        logoUrl(options: { resize: { width: 600 } })
        ...OverrideWithOrganizationTheme_Organization
      }
    }
    ${OverrideWithOrganizationTheme.fragments.Organization}
  `,
};

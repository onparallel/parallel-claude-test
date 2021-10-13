import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  Image,
  ListItem,
  Radio,
  RadioGroup,
  SkeletonText,
  Spinner,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { FileSize } from "@parallel/components/common/FileSize";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  OrgPreferedTone,
  useOrganizationBrandingQuery,
  useOrganizationBranding_changeOrganizationPreferedToneMutation,
  useOrganizationBranding_updateOrgLogoMutation,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useRef, useState } from "react";
import { DropzoneRef, FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
const MAX_FILE_SIZE = 50 * 1024;

function OrganizationBranding() {
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQueryOrPreviousData(useOrganizationBrandingQuery());

  const sections = useOrganizationSections(me);
  const dropzoneRef = useRef<DropzoneRef>(null);

  const [logoSrc, setLogoSrc] = useState<string>(
    me.organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`
  );

  const tone = me.organization.preferedTone;

  const showErrorDialog = useErrorDialog();
  const [updateLogo, { loading }] = useOrganizationBranding_updateOrgLogoMutation();
  const handleLogoUpload = async (files: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      await showErrorDialog({
        message: intl.formatMessage(
          {
            id: "organization.branding.logo-error",
            defaultMessage: "The logo must be a PNG file of size up to {size}.",
          },
          { size: <FileSize value={MAX_FILE_SIZE} /> }
        ),
      });
    } else {
      await updateLogo({
        variables: {
          orgId: me.organization.id,
          file: files[0],
        },
        update(_, { data }) {
          setLogoSrc(data!.updateOrganizationLogo.logoUrl!);
        },
      });
    }
  };

  const [changePreferedTone] = useOrganizationBranding_changeOrganizationPreferedToneMutation();

  const handleToneChange = async (tone: OrgPreferedTone) => {
    changePreferedTone({
      variables: {
        orgId: me.organization.id,
        tone,
      },
    });
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.branding.title",
        defaultMessage: "Branding",
      })}
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.branding.title" defaultMessage="Branding" />
        </Heading>
      }
    >
      <Stack
        padding={6}
        flexDirection={{ base: "column", xl: "row" }}
        gridGap={{ base: 8, xl: 16 }}
        w="100%"
      >
        <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.2xs" }} width="100%">
          <Stack spacing={4}>
            <Heading as="h4" size="md" fontWeight="semibold">
              <FormattedMessage
                id="organization.branding.logo-header"
                defaultMessage="Organization logo"
              />
            </Heading>
            <Stack spacing={1}>
              <Text fontSize="sm">
                <FormattedMessage
                  id="organization.branding.logo-atach-help"
                  defaultMessage="Attach an image that you would like us to display in your emails."
                  values={{
                    size: <FileSize value={MAX_FILE_SIZE} />,
                  }}
                />
              </Text>
              <Text fontSize="sm">
                <FormattedMessage
                  id="organization.branding.logo-atach-requirements-help"
                  defaultMessage="Requirements: PNG image, max. {size}"
                  values={{
                    size: <FileSize value={MAX_FILE_SIZE} />,
                  }}
                />
              </Text>
            </Stack>
            <Card padding={4}>
              <Dropzone
                ref={dropzoneRef}
                as={Center}
                onDrop={handleLogoUpload}
                accept={["image/png"]}
                maxSize={MAX_FILE_SIZE}
                multiple={false}
                maxHeight="200px"
                maxWidth="100%"
                textAlign="center"
              >
                {loading ? (
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="purple.500"
                    size="xl"
                  />
                ) : (
                  <Image
                    boxSize="300px"
                    height="150px"
                    objectFit="contain"
                    alt={me.organization.name}
                    src={logoSrc}
                    fallback={
                      <FormattedMessage
                        id="organization.branding.image-error"
                        defaultMessage="Error loading image. Please upload again."
                      />
                    }
                  />
                )}
              </Dropzone>

              <Flex marginTop={4}>
                <Button flex="1" colorScheme="purple" onClick={() => dropzoneRef.current?.open()}>
                  <FormattedMessage
                    id="organization.branding.upload-logo"
                    defaultMessage="Upload a new logo"
                  />
                </Button>
              </Flex>
              <Center marginTop={2}>
                <Text fontSize="sm" color="gray.600">
                  <FormattedMessage
                    id="organization.branding.logo-atach-requirements-dropbox"
                    defaultMessage="(PNG image, max. {size})"
                    values={{
                      size: <FileSize value={MAX_FILE_SIZE} />,
                    }}
                  />
                </Text>
              </Center>
            </Card>
          </Stack>
          <Divider borderColor="gray.300" />
          <Stack spacing={4}>
            <Heading as="h4" size="md" fontWeight="semibold">
              <FormattedMessage
                id="organization.branding.tone-header"
                defaultMessage="Tone of the messages"
              />
            </Heading>
            <RadioGroup onChange={handleToneChange} value={tone}>
              <Stack spacing={4}>
                <Radio backgroundColor="white" value="INFORMAL">
                  <Text fontWeight="semibold">
                    <FormattedMessage
                      id="organization.branding.tone-informal"
                      defaultMessage="Informal"
                    />
                  </Text>
                </Radio>
                <Radio backgroundColor="white" value="FORMAL">
                  <Text fontWeight="semibold">
                    <FormattedMessage
                      id="organization.branding.tone-formal"
                      defaultMessage="Formal"
                    />
                  </Text>
                </Radio>
              </Stack>
            </RadioGroup>
          </Stack>
          <Divider borderColor="gray.300" />
        </Stack>
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
                <FormattedMessage id="organization.branding.preview" defaultMessage="Preview" />
              </Text>
            </Box>
            <Stack padding={8} spacing={5}>
              <Stack>
                <Center minHeight="100px">
                  <Image
                    boxSize="200px"
                    height="100px"
                    objectFit="contain"
                    alt={me.organization.name}
                    src={logoSrc}
                  />
                </Center>
                <Text>
                  <FormattedMessage
                    id="organization.branding.preview-grettings"
                    defaultMessage="{tone, select, INFORMAL{Hello <b>[Recipient Name]</b>,} other{Dear <b>[Recipient Name]</b>,}}"
                    values={{ tone }}
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="organization.branding.preview-body"
                    defaultMessage="We remind you that <b>[Your name]</b> sent you a petition and some of the requested information has not yet been submitted."
                    values={{ tone }}
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
                    id="organization.branding.preview-fields-pending"
                    defaultMessage="{tone, select, INFORMAL{There are currently 12/40 fields pending} other{You have 12/40 fields pending}}"
                    values={{ tone }}
                  />
                </ListItem>
              </UnorderedList>

              <Stack width="100%" justifyContent="center" align="center" spacing={2.5}>
                <Box
                  backgroundColor="purple.500"
                  paddingX={5}
                  paddingY={3}
                  maxWidth="140px"
                  width="100%"
                  rounded="md"
                  marginY={4}
                >
                  <SkeletonText noOfLines={1} width="100%" speed={0} endColor="white" />
                </Box>

                <SkeletonText noOfLines={1} width="95%" speed={0} endColor="gray.300" />
                <SkeletonText noOfLines={1} width="40%" speed={0} endColor="gray.300" />
              </Stack>
            </Stack>
          </Box>
          <Text width="full" textAlign="center" fontSize="sm" color="gray.600" mt={4}>
            <FormattedMessage
              id="organization.branding.preview-footer"
              defaultMessage="An example of the emails your customers will receive."
            />
          </Text>
        </Box>
      </Stack>
    </SettingsLayout>
  );
}

OrganizationBranding.mutations = [
  gql`
    mutation OrganizationBranding_updateOrgLogo($orgId: GID!, $file: Upload!) {
      updateOrganizationLogo(orgId: $orgId, file: $file) {
        id
        logoUrl
      }
    }
  `,
  gql`
    mutation OrganizationBranding_changeOrganizationPreferedTone(
      $orgId: GID!
      $tone: OrgPreferedTone!
    ) {
      changeOrganizationPreferedTone(orgId: $orgId, tone: $tone) {
        id
        preferedTone
      }
    }
  `,
];

OrganizationBranding.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(
    gql`
      query OrganizationBranding {
        me {
          ...SettingsLayout_User
          organization {
            id
            logoUrl
            name
            preferedTone
          }
        }
      }
      ${SettingsLayout.fragments.User}
    `
  );
};

export default compose(
  withDialogs,
  withAdminOrganizationRole,
  withApolloData
)(OrganizationBranding);

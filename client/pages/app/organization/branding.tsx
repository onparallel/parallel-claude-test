import { gql } from "@apollo/client";
import {
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  Image,
  Spinner,
  Stack,
  Radio,
  RadioGroup,
  Text,
  Box,
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
  useOrganizationBrandingQuery,
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

  const [tone, setTone] = useState<string>("formal");

  const handleToneChange = () => {};

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
      <Box padding={6}>
        <Stack paddingBottom={6} spacing={8} maxWidth="container.2xs" width="100%">
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
            <RadioGroup onChange={(tone: string) => setTone(tone)} value={tone}>
              <Stack spacing={4}>
                <Box>
                  <Radio backgroundColor="white" value="informal">
                    <Text fontWeight="semibold">
                      <FormattedMessage
                        id="organization.branding.tone-informal"
                        defaultMessage="Informal"
                      />
                    </Text>
                  </Radio>
                  <Text fontSize="sm" color="gray.600" pl={6}>
                    <FormattedMessage
                      id="organization.branding.tone-informal-description"
                      defaultMessage="For example: Hello [Recipient’s name], remember that Harvey Specter shared an access to Parallel with you."
                    />
                  </Text>
                </Box>
                <Box>
                  <Radio backgroundColor="white" value="formal">
                    <Text fontWeight="semibold">
                      <FormattedMessage
                        id="organization.branding.tone-formal"
                        defaultMessage="Formal"
                      />
                    </Text>
                  </Radio>
                  <Text fontSize="sm" color="gray.600" pl={6}>
                    <FormattedMessage
                      id="organization.branding.tone-formal-description"
                      defaultMessage="For example: Dear [Recipient’s name], we remind you that Harvey Specter has shared an access to Parallel with you."
                    />
                  </Text>
                </Box>
                <Button
                  type="button"
                  colorScheme="purple"
                  width="min-content"
                  onClick={handleToneChange}
                >
                  <FormattedMessage
                    id="settings.account.update-name-button"
                    defaultMessage="Save changes"
                  />
                </Button>
              </Stack>
            </RadioGroup>
          </Stack>
          <Divider borderColor="gray.300" />
        </Stack>
      </Box>
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

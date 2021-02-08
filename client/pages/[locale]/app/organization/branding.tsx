import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { FileSize } from "@parallel/components/common/FileSize";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  useOrganizationBrandingQuery,
  useOrganizationBranding_updateOrgLogoMutation,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useRef, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";

const MAX_FILE_SIZE = 50000;

function OrganizationBranding() {
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQueryOrPreviousData(useOrganizationBrandingQuery());

  const sections = useOrganizationSections();
  const imageRef = useRef<HTMLImageElement>(null);

  const [logoSrc, setLogoSrc] = useState<string>(
    me.organization.logoUrl ??
      `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`
  );
  const showErrorDialog = useErrorDialog();
  const [
    updateLogo,
    { loading },
  ] = useOrganizationBranding_updateOrgLogoMutation();
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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleLogoUpload,
    accept: ["image/png"],
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });
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
        <FormattedMessage
          id="organization.title"
          defaultMessage="Organization"
        />
      }
      header={
        <FormattedMessage
          id="organization.branding.title"
          defaultMessage="Branding"
        />
      }
    >
      <Box padding={4}>
        <Heading as="h4" size="md" fontWeight="normal" marginBottom={2}>
          <FormattedMessage
            id="organization.branding.logo-header"
            defaultMessage="Organization logo"
          />
          <HelpPopover marginLeft={2}>
            <FormattedMessage
              id="organization.branding.logo-help"
              defaultMessage="We will use this logo in all communications with your clients. Must be a PNG file of size up to {kb}Kb."
              values={{
                kb: MAX_FILE_SIZE / 1000,
              }}
            />
          </HelpPopover>
        </Heading>
        <Card padding={4}>
          <Box
            border="1px dashed gray"
            borderRadius="md"
            padding={4}
            {...getRootProps()}
          >
            {loading ? (
              <Center height="150px" width="300px">
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="purple.500"
                  size="xl"
                />
              </Center>
            ) : (
              <Image
                ref={imageRef}
                boxSize="300px"
                height="150px"
                objectFit="contain"
                borderRadius="md"
                alt={me.organization.identifier}
                src={logoSrc}
                fallback={<Box height="150px" width="300px" />}
              />
            )}
            <input {...getInputProps()} />
          </Box>

          <Flex marginTop={4}>
            <Button
              flex="1"
              colorScheme="purple"
              onClick={() => imageRef.current?.click()}
            >
              <FormattedMessage
                id="organization.branding.upload-logo"
                defaultMessage="Upload a new logo"
              />
            </Button>
          </Flex>
        </Card>
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

OrganizationBranding.getInitialProps = async ({
  fetchQuery,
}: WithApolloDataContext) => {
  await fetchQuery(
    gql`
      query OrganizationBranding {
        me {
          ...SettingsLayout_User
          organization {
            id
            logoUrl
            identifier
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

import { gql } from "@apollo/client";
import { Box, Button, Center, Flex, Heading, Image, Spinner } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { FileSize } from "@parallel/components/common/FileSize";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
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
      <Box padding={4}>
        <Heading as="h4" size="md" fontWeight="normal" marginBottom={2}>
          <FormattedMessage
            id="organization.branding.logo-header"
            defaultMessage="Organization logo"
          />
          <HelpPopover marginLeft={2}>
            <FormattedMessage
              id="organization.branding.logo-help"
              defaultMessage="We will use this logo in all communications with your clients. Must be a PNG file of size up to {size}."
              values={{
                size: <FileSize value={MAX_FILE_SIZE} />,
              }}
            />
          </HelpPopover>
        </Heading>
        <Card padding={4} width="fit-content">
          <Dropzone
            ref={dropzoneRef}
            as={Center}
            onDrop={handleLogoUpload}
            accept={["image/png"]}
            maxSize={MAX_FILE_SIZE}
            multiple={false}
            height="150px"
            width="300px"
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

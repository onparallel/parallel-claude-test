import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Heading,
  HStack,
  Image,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { ContactSupportAlert } from "@parallel/components/common/ContactSupportAlert";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileSize } from "@parallel/components/common/FileSize";
import { Logo } from "@parallel/components/common/Logo";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  OrganizationGeneral_updateOrgLogoDocument,
  OrganizationGeneral_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { isAtLeast } from "@parallel/utils/roles";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useRef } from "react";
import { DropzoneRef, FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
const MAX_FILE_SIZE = 1024 * 1024;

function OrganizationGeneral() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationGeneral_userDocument);

  const hasAdminRole = isAtLeast("ADMIN", me.role);

  const sections = useOrganizationSections(me);
  const dropzoneRef = useRef<DropzoneRef>(null);

  const iconSrc = me.organization.iconUrl240;
  const { customHost } = me.organization;
  const parallelUrl = customHost
    ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${customHost}`
    : process.env.NEXT_PUBLIC_PARALLEL_URL;

  const showErrorDialog = useErrorDialog();
  const [updateIcon, { loading }] = useMutation(OrganizationGeneral_updateOrgLogoDocument);
  const handleIconUpload = async (files: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      await showErrorDialog({
        message: intl.formatMessage(
          {
            id: "organization.branding.logo-error",
            defaultMessage: "The logo must be an image file of size up to {size}.",
          },
          { size: <FileSize value={MAX_FILE_SIZE} /> }
        ),
      });
    } else {
      await updateIcon({ variables: { file: files[0], isIcon: true } });
    }
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.general.title",
        defaultMessage: "General",
      })}
      basePath="/app/organization"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.general.title" defaultMessage="General" />
        </Heading>
      }
    >
      <Stack
        padding={6}
        flexDirection={{ base: "column", xl: "row" }}
        gridGap={{ base: 8, xl: 16 }}
        paddingBottom={16}
      >
        <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.xs" }} width="100%">
          {!hasAdminRole ? <OnlyAdminsAlert /> : null}
          <Stack spacing={4}>
            <Stack>
              <Text>
                <FormattedMessage
                  id="organization.general.organization-name"
                  defaultMessage="Organization name"
                />
              </Text>
              <HStack>
                <Input value={me.organization.name} isReadOnly isDisabled backgroundColor="white" />
                <Box>
                  <SupportButton
                    message={intl.formatMessage({
                      id: "organization.general.change-organization-name-message",
                      defaultMessage: "Hi, I would like to change my organization name.",
                    })}
                  >
                    <FormattedMessage
                      id="organization.general.request-change"
                      defaultMessage="Request change"
                    />
                  </SupportButton>
                </Box>
              </HStack>
            </Stack>
            <Stack>
              <HStack>
                <Text>
                  <FormattedMessage
                    id="organization.general.subdomain"
                    defaultMessage="Subdomain"
                  />
                </Text>
                {me.hasCustomHost ? null : (
                  <Badge colorScheme="purple">
                    <FormattedMessage id="generic.plans.enterprise" defaultMessage="Enterprise" />
                  </Badge>
                )}
              </HStack>

              <HStack>
                <Input value={parallelUrl} isReadOnly isDisabled backgroundColor="white" />
                <Box>
                  <SupportButton
                    isDisabled={!me.hasCustomHost}
                    message={intl.formatMessage({
                      id: "organization.general.change-subdomain-message",
                      defaultMessage:
                        "Hi, I would like to change the subdomain of my organization.",
                    })}
                  >
                    <FormattedMessage
                      id="organization.general.request-change"
                      defaultMessage="Request change"
                    />
                  </SupportButton>
                </Box>
              </HStack>
            </Stack>
            {me.hasCustomHost ? null : (
              <ContactSupportAlert
                body={
                  <Text>
                    {intl.formatMessage({
                      id: "organization.general.upgrade-subdomain",
                      defaultMessage:
                        "This is an Enterprise feature. Contact us for more information.",
                    })}
                  </Text>
                }
                contactMessage={intl.formatMessage({
                  id: "organization.general.upgrade-subdomain-message",
                  defaultMessage: "Hi, I would like more information about setting a subdomain.",
                })}
              />
            )}
          </Stack>
          <Divider borderColor="gray.300" />
          <Stack spacing={4}>
            <Heading as="h4" size="md" fontWeight="semibold">
              <FormattedMessage
                id="organization.general.icon-header"
                defaultMessage="Organization icon"
              />
            </Heading>
            <Card padding={4}>
              <HStack spacing={4}>
                <Dropzone
                  ref={dropzoneRef}
                  as={Center}
                  onDrop={handleIconUpload}
                  accept={["image/gif", "image/png", "image/jpeg"]}
                  maxSize={MAX_FILE_SIZE}
                  multiple={false}
                  height="120px"
                  maxWidth="120px"
                  width="100%"
                  textAlign="center"
                  disabled={!hasAdminRole}
                >
                  {loading ? (
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="purple.500"
                      size="xl"
                    />
                  ) : iconSrc ? (
                    <Image
                      boxSize="120px"
                      height="120px"
                      objectFit="contain"
                      alt={me.organization.name}
                      src={iconSrc}
                      fallback={
                        <Spinner
                          thickness="4px"
                          speed="0.65s"
                          emptyColor="gray.200"
                          color="purple.500"
                          size="xl"
                        />
                      }
                    />
                  ) : (
                    <Logo width="74px" hideText={true} color="gray.800" />
                  )}
                </Dropzone>
                <Stack spacing={4}>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="organization.branding.square-logo-description"
                      defaultMessage="This logo will be displayed internally to differentiate your organizations."
                    />
                  </Text>
                  <Button
                    colorScheme="purple"
                    onClick={() => dropzoneRef.current?.open()}
                    isDisabled={!hasAdminRole}
                  >
                    <FormattedMessage
                      id="organization.branding.upload-logo"
                      defaultMessage="Upload a new logo"
                    />
                  </Button>
                </Stack>
              </HStack>
            </Card>
          </Stack>
        </Stack>
      </Stack>
    </SettingsLayout>
  );
}

OrganizationGeneral.mutations = [
  gql`
    mutation OrganizationGeneral_updateOrgLogo($file: Upload!, $isIcon: Boolean) {
      updateOrganizationLogo(file: $file, isIcon: $isIcon) {
        id
        iconUrl92: iconUrl(options: { resize: { width: 92 } })
        iconUrl240: iconUrl(options: { resize: { width: 240 } })
      }
    }
  `,
];

OrganizationGeneral.queries = [
  gql`
    query OrganizationGeneral_user {
      ...SettingsLayout_Query
      me {
        id
        role
        hasCustomHost: hasFeatureFlag(featureFlag: CUSTOM_HOST_UI)
        organization {
          id
          iconUrl240: iconUrl(options: { resize: { width: 240 } })
          name
          customHost
        }
      }
    }
    ${SettingsLayout.fragments.Query}
  `,
];

OrganizationGeneral.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationGeneral_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationGeneral);

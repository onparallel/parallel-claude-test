import { gql } from "@apollo/client";
import {
  Alert,
  AlertIcon,
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
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileSize } from "@parallel/components/common/FileSize";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { OrganizationGeneral_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useRef } from "react";
import { DropzoneRef } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
const MAX_FILE_SIZE = 1025 * 1024;

function OrganizationGeneral() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationGeneral_userDocument);

  const sections = useOrganizationSections(me);
  const dropzoneRef = useRef<DropzoneRef>(null);

  const iconSrc =
    me.organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;

  const handleIconUpload = () => {};
  const loading = false;

  const subdomain = me.organization.customHost;

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
                <Badge colorScheme="purple">
                  <FormattedMessage id="generic.plans.enterprise" defaultMessage="Enterprise" />
                </Badge>
              </HStack>

              <HStack>
                <Input
                  value={
                    subdomain
                      ? `https://www.${subdomain}.onparallel.com`
                      : "https://www.onparallel.com"
                  }
                  isReadOnly
                  isDisabled
                  backgroundColor="white"
                />
                <Box>
                  <SupportButton
                    isDisabled={!subdomain}
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
            {subdomain ? null : (
              <Alert status="info" rounded="md">
                <AlertIcon />
                <HStack spacing={3}>
                  <Text flex="1">
                    <FormattedMessage
                      id="organization.general.upgrade-subdomain"
                      defaultMessage="This is an Enterprise feature. Contact us for more information."
                    />
                  </Text>
                  <SupportButton
                    variant="outline"
                    colorScheme="blue"
                    backgroundColor="white"
                    message={intl.formatMessage({
                      id: "organization.general.upgrade-subdomain-message",
                      defaultMessage:
                        "Hi, I would like more information about setting a subdomain.",
                    })}
                  >
                    <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                  </SupportButton>
                </HStack>
              </Alert>
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
            <Text fontSize="sm">
              <FormattedMessage
                id="organization.general.icon-attach-requirements-help"
                defaultMessage="Requirements: Square image in PNG, max. {size}"
                values={{
                  size: <FileSize value={MAX_FILE_SIZE} />,
                }}
              />
            </Text>
            <Card padding={4}>
              <HStack spacing={4}>
                <Dropzone
                  ref={dropzoneRef}
                  as={Center}
                  onDrop={handleIconUpload}
                  accept={["image/png"]}
                  maxSize={MAX_FILE_SIZE}
                  multiple={false}
                  maxHeight="120px"
                  maxWidth="120px"
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
                      src={iconSrc}
                      fallback={
                        <FormattedMessage
                          id="organization.branding.image-error"
                          defaultMessage="Error loading image. Please upload again."
                        />
                      }
                    />
                  )}
                </Dropzone>
                <Stack>
                  <Heading as="h5" size="sm" fontWeight="semibold">
                    <FormattedMessage
                      id="organization.general.square-logo-header"
                      defaultMessage="Square logo"
                    />
                  </Heading>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="organization.branding.square-logo-description"
                      defaultMessage="This logo will be displayed internally to differentiate your organizations."
                    />
                  </Text>
                  <Button colorScheme="purple" onClick={() => dropzoneRef.current?.open()}>
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

OrganizationGeneral.queries = [
  gql`
    query OrganizationGeneral_user {
      ...SettingsLayout_Query
      me {
        id
        organization {
          id
          logoUrl
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

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(OrganizationGeneral);

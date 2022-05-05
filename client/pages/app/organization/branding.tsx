import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Badge,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  HStack,
  Image,
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileSize } from "@parallel/components/common/FileSize";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { BrandingPreview } from "@parallel/components/organization/BrandingPreview";
import {
  OrganizationBranding_updateOrganizationPreferredToneDocument,
  OrganizationBranding_updateOrgLogoDocument,
  OrganizationBranding_userDocument,
  Tone,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useRef } from "react";
import { DropzoneRef, FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
const MAX_FILE_SIZE = 1024 * 1024;

function OrganizationBranding() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationBranding_userDocument);

  const sections = useOrganizationSections(me);
  const dropzoneRef = useRef<DropzoneRef>(null);

  const logoSrc =
    me.organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;

  const tone = me.organization.preferredTone;

  const showErrorDialog = useErrorDialog();
  const [updateLogo, { loading }] = useMutation(OrganizationBranding_updateOrgLogoDocument);
  const handleLogoUpload = async (files: File[], rejected: FileRejection[]) => {
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
      await updateLogo({ variables: { file: files[0] } });
    }
  };

  const [changePreferredTone] = useMutation(
    OrganizationBranding_updateOrganizationPreferredToneDocument
  );

  const handleToneChange = async (tone: Tone) => {
    changePreferredTone({
      variables: {
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
      me={me}
      realMe={realMe}
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
        paddingBottom={16}
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
                  id="organization.branding.logo-attach-help"
                  defaultMessage="Attach an image that you would like us to display in your emails."
                />
              </Text>
            </Stack>
            <Card padding={4}>
              <Dropzone
                ref={dropzoneRef}
                as={Center}
                onDrop={handleLogoUpload}
                accept={["image/gif", "image/png", "image/jpeg"]}
                maxSize={MAX_FILE_SIZE}
                multiple={false}
                height="200px"
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
                    height="200px"
                    objectFit="contain"
                    alt={me.organization.name}
                    src={logoSrc}
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
                    <FormattedMessage id="generic.tone-informal" defaultMessage="Informal" />
                  </Text>
                </Radio>
                <Radio backgroundColor="white" value="FORMAL">
                  <Text fontWeight="semibold">
                    <FormattedMessage id="generic.tone-formal" defaultMessage="Formal" />
                  </Text>
                </Radio>
              </Stack>
            </RadioGroup>
          </Stack>
          <Divider borderColor="gray.300" />
          <Stack spacing={4}>
            <HStack spacing={3}>
              <Stack flex="1" spacing={2}>
                <HStack alignItems="center">
                  <Heading as="h4" size="md" fontWeight="semibold">
                    <FormattedMessage
                      id="organization.branding.parallel-branding-header"
                      defaultMessage="Parallel Branding"
                    />
                  </Heading>
                  {me.hasRemovedParallelBranding ? null : (
                    <Badge colorScheme="purple">
                      <FormattedMessage id="generic.plans.enterprise" defaultMessage="Enterprise" />
                    </Badge>
                  )}
                </HStack>
                <Text>
                  <FormattedMessage
                    id="organization.branding.parallel-branding-description"
                    defaultMessage="Displays the Parallel branding on all emails and requests that are sent."
                  />
                </Text>
              </Stack>
              <Switch size="md" isChecked={!me.hasRemovedParallelBranding} isDisabled={true} />
            </HStack>
            {me.hasRemovedParallelBranding ? null : (
              <Alert status="info" rounded="md">
                <AlertIcon />
                <HStack spacing={3} width="100%">
                  <Text flex="1">
                    <FormattedMessage
                      id="generic.upgrade-to-enable"
                      defaultMessage="Upgrade to enable this feature."
                    />
                  </Text>
                  <SupportButton
                    variant="outline"
                    colorScheme="blue"
                    backgroundColor="white"
                    message={intl.formatMessage({
                      id: "organization.branding.parallel-branding-message",
                      defaultMessage:
                        "Hi, I would like to get more information about how to upgrade my plan to hide Parallel branding.",
                    })}
                  >
                    <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                  </SupportButton>
                </HStack>
              </Alert>
            )}
          </Stack>
        </Stack>
        <BrandingPreview
          tone={tone}
          logoSrc={logoSrc}
          organizationName={me.organization.name}
          userFullName={me.fullName!}
        />
      </Stack>
    </SettingsLayout>
  );
}

OrganizationBranding.mutations = [
  gql`
    mutation OrganizationBranding_updateOrgLogo($file: Upload!) {
      updateOrganizationLogo(file: $file) {
        id
        logoUrl(options: { resize: { width: 600 } })
      }
    }
  `,
  gql`
    mutation OrganizationBranding_updateOrganizationPreferredTone($tone: Tone!) {
      updateOrganizationPreferredTone(tone: $tone) {
        id
        preferredTone
      }
    }
  `,
];

OrganizationBranding.queries = [
  gql`
    query OrganizationBranding_user {
      ...SettingsLayout_Query
      me {
        fullName
        hasRemovedParallelBranding: hasFeatureFlag(featureFlag: REMOVE_PARALLEL_BRANDING)
        organization {
          id
          logoUrl(options: { resize: { width: 600 } })
          name
          preferredTone
        }
      }
    }
    ${SettingsLayout.fragments.Query}
  `,
];

OrganizationBranding.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationBranding_userDocument);
};

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(OrganizationBranding);

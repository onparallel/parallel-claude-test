import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Button,
  Center,
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
import { ContactSupportAlert } from "@parallel/components/common/ContactSupportAlert";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Divider } from "@parallel/components/common/Divider";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileSize } from "@parallel/components/common/FileSize";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import {
  BrandingGeneralForm_updateOrganizationPreferredToneDocument,
  BrandingGeneralForm_updateOrgLogoDocument,
  BrandingGeneralForm_UserFragment,
  Tone,
} from "@parallel/graphql/__types";
import { isAtLeast } from "@parallel/utils/roles";
import { useRef } from "react";
import { DropzoneRef, FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";

interface BrandingGeneralFormProps {
  user: BrandingGeneralForm_UserFragment;
}

const MAX_FILE_SIZE = 1024 * 1024;

export function BrandingGeneralForm({ user }: BrandingGeneralFormProps) {
  const intl = useIntl();
  const dropzoneRef = useRef<DropzoneRef>(null);
  const hasAdminRole = isAtLeast("ADMIN", user.role);

  const logoSrc =
    user.organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;

  const tone = user.organization.preferredTone;

  const showErrorDialog = useErrorDialog();
  const [updateLogo, { loading }] = useMutation(BrandingGeneralForm_updateOrgLogoDocument);
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
    BrandingGeneralForm_updateOrganizationPreferredToneDocument
  );

  const handleToneChange = async (tone: Tone) => {
    changePreferredTone({
      variables: {
        tone,
      },
    });
  };

  return (
    <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.2xs" }} width="100%">
      {!hasAdminRole ? <OnlyAdminsAlert /> : null}
      <Stack spacing={4}>
        <Stack>
          <Heading as="h4" size="md" fontWeight="semibold">
            <FormattedMessage
              id="organization.branding.logo-header"
              defaultMessage="Organization logo"
            />
          </Heading>
          <Text>
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
            ) : (
              <Image
                boxSize="300px"
                height="200px"
                objectFit="contain"
                alt={user.organization.name}
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
            <Button
              flex="1"
              colorScheme="purple"
              onClick={() => dropzoneRef.current?.open()}
              isDisabled={!hasAdminRole}
            >
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
        <RadioGroup
          as={Stack}
          spacing={4}
          onChange={handleToneChange}
          value={tone}
          isDisabled={!hasAdminRole}
        >
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
              {user.hasRemovedParallelBranding ? null : (
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
          <Switch size="md" isChecked={!user.hasRemovedParallelBranding} isDisabled={true} />
        </HStack>
        {user.hasRemovedParallelBranding ? null : (
          <ContactSupportAlert
            body={
              <Text>
                {intl.formatMessage({
                  id: "generic.upgrade-to-enable",
                  defaultMessage: "Upgrade to enable this feature.",
                })}
              </Text>
            }
            contactMessage={intl.formatMessage({
              id: "organization.branding.parallel-branding-message",
              defaultMessage:
                "Hi, I would like to get more information about how to upgrade my plan to hide Parallel branding.",
            })}
          />
        )}
      </Stack>
    </Stack>
  );
}

BrandingGeneralForm.mutations = [
  gql`
    mutation BrandingGeneralForm_updateOrgLogo($file: Upload!) {
      updateOrganizationLogo(file: $file) {
        id
        logoUrl(options: { resize: { width: 600 } })
      }
    }
  `,
  gql`
    mutation BrandingGeneralForm_updateOrganizationPreferredTone($tone: Tone!) {
      updateOrganizationPreferredTone(tone: $tone) {
        id
        preferredTone
      }
    }
  `,
];

BrandingGeneralForm.fragments = {
  User: gql`
    fragment BrandingGeneralForm_User on User {
      id
      role
      hasRemovedParallelBranding: hasFeatureFlag(featureFlag: REMOVE_PARALLEL_BRANDING)
      organization {
        id
        name
        preferredTone
        logoUrl(options: { resize: { width: 600 } })
      }
    }
  `,
};

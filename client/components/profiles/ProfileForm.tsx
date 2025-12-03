import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Spinner,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { ExternalLinkIcon, SearchIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Divider } from "@parallel/components/common/Divider";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import {
  ProfileForm_PetitionBaseFragment,
  ProfileForm_ProfileFieldPropertyFragment,
  ProfileForm_ProfileFragment,
  ProfileTypeFieldType,
  UpdateProfileFieldValueInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { MaybePromise } from "@parallel/utils/types";
import { uploadFile } from "@parallel/utils/uploadFile";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Link } from "../common/Link";
import { ProfileReference } from "../common/ProfileReference";
import { RestrictedFeatureAlert } from "../common/RestrictedFeatureAlert";
import { Spacer } from "../common/Spacer";
import { useImportFromExternalSourceDialog } from "./dialogs/ImportFromExternalSourceDialog";
import { ProfileFormInner, ProfileFormInnerInstance } from "./ProfileFormInner";

export interface ProfileFormData {
  fields: Record<string, { type: ProfileTypeFieldType } & UpdateProfileFieldValueInput>;
}

interface ProfileFormProps {
  profile: ProfileForm_ProfileFragment;
  overlapsIntercomBadge?: boolean;
  petition?: ProfileForm_PetitionBaseFragment;
  petitionId?: string;
  onRecover?: () => void;
  onRefetch: () => MaybePromise<void>;
  filterProperties?: (property: ProfileForm_ProfileFieldPropertyFragment) => boolean;
  includeLinkToProfile?: boolean;
  omitProfileTabNavigation?: boolean;
}

export const ProfileForm = Object.assign(
  chakraForwardRef<"div", ProfileFormProps>(function ProfileForm(
    {
      profile,
      onRefetch,
      overlapsIntercomBadge,
      petition,
      petitionId,
      onRecover,
      filterProperties = () => true,
      includeLinkToProfile,
      ...props
    },
    ref,
  ) {
    const intl = useIntl();
    const formInnerRef = useRef<ProfileFormInnerInstance>(null);
    const [formState, setFormState] = useState<{
      isSubmitting: boolean;
      errors: Record<string, any>;
      dirtyFields: { fields?: Record<string, any> };
    }>({
      isSubmitting: false,
      errors: {},
      dirtyFields: {},
    });
    const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");
    const isFormDisabled = !userCanCreateProfiles || profile.status !== "OPEN";

    const showSelectProfileExternalSourceDialog = useImportFromExternalSourceDialog();
    const toast = useToast();
    async function handleCheckExternalSourcesClick() {
      try {
        await showSelectProfileExternalSourceDialog({
          profileType: profile.profileType,
          profileId: profile.id,
        });
        toast({
          title: intl.formatMessage({
            id: "component.profile-form.success-toast-header",
            defaultMessage: "Information imported successfully",
          }),
          description: intl.formatMessage({
            id: "component.profile-form.success-toast-description",
            defaultMessage:
              "The profile has been updated with the information from the external source",
          }),
          status: "success",
          isClosable: true,
        });
        await onRefetch();
      } catch (e) {
        if (!isDialogError(e)) {
          throw e;
        }
      }
    }

    const editedFieldsCount = formState.dirtyFields.fields
      ? Object.values(formState.dirtyFields.fields).filter((f) => isNonNullish(f)).length
      : 0;

    return (
      <Flex
        ref={ref}
        direction="column"
        as="form"
        height="100%"
        flex={1}
        {...props}
        onSubmit={(e) => {
          e.preventDefault();
          formInnerRef.current?.handleSubmit(async () => {
            // Form submission handled by ProfileFormInner
          })(e);
        }}
      >
        <Stack
          spacing={0}
          paddingX={4}
          paddingY={2}
          borderBottom="1px solid"
          borderColor="gray.200"
          minHeight="65px"
          justifyContent="center"
        >
          <HStack alignItems="center">
            <OverflownText as="h2" fontSize="xl" fontWeight={400}>
              <ProfileReference profile={profile} />
            </OverflownText>
            {profile.status === "CLOSED" ? (
              <Badge>
                <FormattedMessage
                  id="component.profile-form.closed-status"
                  defaultMessage="Closed"
                />
              </Badge>
            ) : profile.status === "DELETION_SCHEDULED" ? (
              <Badge colorScheme="red">
                <FormattedMessage
                  id="component.profile-form.deleted-status"
                  defaultMessage="Deleted"
                />
              </Badge>
            ) : null}
            {includeLinkToProfile ? (
              <Link href={`/app/profiles/${profile.id}/general`} display="flex">
                <ExternalLinkIcon fontSize="lg" />
              </Link>
            ) : null}
            <Spacer />
            {profile.profileType.standardType === "INDIVIDUAL" ||
            profile.profileType.standardType === "LEGAL_ENTITY" ? (
              <IconButtonWithTooltip
                isDisabled={isFormDisabled}
                onClick={handleCheckExternalSourcesClick}
                icon={<SearchIcon />}
                size="sm"
                label={intl.formatMessage({
                  id: "component.profile-form.check-external-sources-tooltip",
                  defaultMessage: "Check external data sources",
                })}
              />
            ) : null}
          </HStack>
          <HStack
            divider={<Divider isVertical height={3.5} color="gray.500" />}
            fontSize="sm"
            color="gray.600"
            lineHeight="18px"
          >
            <OverflownText>
              <LocalizableUserTextRender
                value={profile.profileType.name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                })}
              />
            </OverflownText>
            <Box whiteSpace="nowrap">
              <FormattedMessage
                id="component.profile-form.associated-profiles-count"
                defaultMessage="{count, plural, =1 {# association} other {# associations}}"
                values={{ count: profile.relationships.length }}
              />
            </Box>
            <Box whiteSpace="nowrap">
              <FormattedMessage
                id="generic.petition-count"
                defaultMessage="{count, plural, =1 {# parallel} other {# parallels}}"
                values={{ count: profile.petitionsTotalCount.totalCount }}
              />
            </Box>
          </HStack>
        </Stack>
        {profile.status === "DELETION_SCHEDULED" ? (
          <ProfileDeletedAlert
            onRecoverClick={onRecover}
            permanentDeletionAt={profile.permanentDeletionAt!}
          />
        ) : null}
        {!userCanCreateProfiles && profile.status === "OPEN" ? (
          <RestrictedFeatureAlert rounded="none">
            <FormattedMessage
              id="component.profile-form.cant-edit-profiles"
              defaultMessage="You don't have permission to edit profiles."
            />
          </RestrictedFeatureAlert>
        ) : null}
        {editedFieldsCount ? (
          <EditedFieldsAlert
            editedFieldsCount={editedFieldsCount}
            isSubmitting={formState.isSubmitting}
            hasErrors={Object.keys(formState.errors).length !== 0}
            onCancel={() => {
              formInnerRef.current?.reset();
            }}
          />
        ) : null}
        <Stack
          divider={<Divider />}
          padding={4}
          paddingBottom={overlapsIntercomBadge ? 24 : 4}
          spacing={4}
          overflow="auto"
        >
          <ProfileFormInner
            ref={formInnerRef}
            profile={profile}
            petition={petition}
            petitionId={petitionId}
            onRefetch={onRefetch}
            filterProperties={filterProperties}
            showHiddenProperties={true}
            enableRouterHooks={true}
            onFormStateChange={(state) => {
              setFormState({
                isSubmitting: state.isSubmitting,
                errors: state.errors,
                dirtyFields: state.dirtyFields,
              });
            }}
          />
        </Stack>
      </Flex>
    );
  }),
  {
    fragments: {
      get ProfileTypeField() {
        return gql`
          fragment ProfileForm_ProfileTypeField on ProfileTypeField {
            id
            ...ProfileFormInner_ProfileTypeField
          }
          ${ProfileFormInner.fragments.ProfileTypeField}
        `;
      },
      get ProfileFieldFile() {
        return gql`
          fragment ProfileForm_ProfileFieldFile on ProfileFieldFile {
            ...ProfileFormInner_ProfileFieldFile
          }
          ${ProfileFormInner.fragments.ProfileFieldFile}
        `;
      },
      get ProfileFieldValue() {
        return gql`
          fragment ProfileForm_ProfileFieldValue on ProfileFieldValue {
            ...ProfileFormInner_ProfileFieldValue
          }
          ${ProfileFormInner.fragments.ProfileFieldValue}
        `;
      },
      get ProfileFieldProperty() {
        return gql`
          fragment ProfileForm_ProfileFieldProperty on ProfileFieldProperty {
            ...ProfileFormInner_ProfileFieldProperty
          }
          ${ProfileFormInner.fragments.ProfileFieldProperty}
        `;
      },
      get Profile() {
        return gql`
          fragment ProfileForm_Profile on Profile {
            id
            status
            ...ProfileReference_Profile
            profileType {
              id
              name
              standardType
              ...useImportFromExternalSourceDialog_ProfileType
            }
            ...ProfileFormInner_Profile
          }
          ${ProfileReference.fragments.Profile}
          ${ProfileFormInner.fragments.Profile}
          ${useImportFromExternalSourceDialog.fragments.ProfileType}
        `;
      },
      get PetitionBase() {
        return gql`
          fragment ProfileForm_PetitionBase on PetitionBase {
            id
            ...ProfileFormInner_PetitionBase
          }
          ${ProfileFormInner.fragments.PetitionBase}
        `;
      },
    },
  },
);

function ProfileDeletedAlert({
  permanentDeletionAt,
  onRecoverClick,
}: {
  permanentDeletionAt: string;
  onRecoverClick?: () => void;
}) {
  const intl = useIntl();

  const userCanRecoverProfile = useHasPermission("PROFILES:CLOSE_PROFILES");
  return (
    <Alert status="error">
      <AlertIcon />
      <HStack>
        <AlertDescription fontSize="sm">
          <FormattedMessage
            id="component.profile-form.recover-profile-alert"
            defaultMessage="This profile will be permanently deleted on {date}."
            values={{
              date: intl.formatDate(permanentDeletionAt, FORMATS.LL),
            }}
          />
        </AlertDescription>
        {userCanRecoverProfile ? (
          <Center>
            <Button backgroundColor="white" onClick={onRecoverClick} fontWeight={500}>
              <FormattedMessage
                id="component.profile-form.recover-button"
                defaultMessage="Recover"
              />
            </Button>
          </Center>
        ) : null}
      </HStack>
    </Alert>
  );
}

function EditedFieldsAlert({
  isSubmitting,
  hasErrors,
  editedFieldsCount,
  onCancel,
}: {
  isSubmitting: boolean;
  hasErrors: boolean;
  editedFieldsCount: number;
  onCancel: () => void;
}) {
  return (
    <Alert>
      <HStack flex={1}>
        {isSubmitting ? (
          <AlertDescription flex={1} fontSize="sm">
            <HStack>
              <Spinner
                thickness="3px"
                speed="0.65s"
                emptyColor="transparent"
                color="blue.500"
                width={4}
                height={4}
              />
              <Box flex={1}>
                <FormattedMessage
                  id="page.profile-details.saving-changes"
                  defaultMessage="Saving {count, plural, =1 {# change} other{# changes}}..."
                  values={{
                    count: editedFieldsCount,
                  }}
                />
              </Box>
            </HStack>
          </AlertDescription>
        ) : (
          <AlertDescription flex={1} fontSize="sm">
            <FormattedMessage
              id="page.profile-details.n-fields-edited"
              defaultMessage="{count, plural, =1 {# property} other{# properties}} changed"
              values={{
                count: editedFieldsCount,
              }}
            />
          </AlertDescription>
        )}
        <HStack>
          {isSubmitting ? null : (
            <Button size="sm" bgColor="white" onClick={onCancel}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          )}
          <Button
            size="sm"
            colorScheme="purple"
            type="submit"
            isDisabled={isSubmitting || hasErrors}
          >
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          </Button>
        </HStack>
      </HStack>
    </Alert>
  );
}

const _mutations = [
  gql`
    mutation ProfileForm_copyFileReplyToProfileFieldFile(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $petitionId: GID!
      $fileReplyIds: [GID!]!
      $expiryDate: Date
    ) {
      copyFileReplyToProfileFieldFile(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        petitionId: $petitionId
        fileReplyIds: $fileReplyIds
        expiryDate: $expiryDate
      ) {
        ...ProfileForm_ProfileFieldFile
      }
    }
    ${ProfileForm.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileForm_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        ...ProfileForm_Profile
      }
    }
    ${ProfileForm.fragments.Profile}
  `,
  gql`
    mutation ProfileForm_createProfileFieldFileUploadLink(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $data: [FileUploadInput!]!
      $expiryDate: Date
    ) {
      createProfileFieldFileUploadLink(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        data: $data
        expiryDate: $expiryDate
      ) {
        uploads {
          presignedPostData {
            ...uploadFile_AWSPresignedPostData
          }
          file {
            ...ProfileForm_ProfileFieldFile
          }
        }
        property {
          ...ProfileForm_ProfileFieldProperty
        }
      }
    }
    ${uploadFile.fragments.AWSPresignedPostData}
    ${ProfileForm.fragments.ProfileFieldProperty}
    ${ProfileForm.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileForm_profileFieldFileUploadComplete(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $profileFieldFileIds: [GID!]!
    ) {
      profileFieldFileUploadComplete(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        profileFieldFileIds: $profileFieldFileIds
      ) {
        id
        ...ProfileForm_ProfileFieldFile
      }
    }
    ${ProfileForm.fragments.ProfileFieldFile}
  `,
  gql`
    mutation ProfileForm_deleteProfileFieldFile(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $profileFieldFileIds: [GID!]!
    ) {
      deleteProfileFieldFile(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        profileFieldFileIds: $profileFieldFileIds
      )
    }
  `,
];

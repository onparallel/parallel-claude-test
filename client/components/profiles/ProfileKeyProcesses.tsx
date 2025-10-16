import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Center, Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { AddIcon, LockClosedIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import {
  ProfileKeyProcesses_associateProfileToPetitionDocument,
  ProfileKeyProcesses_createPetitionFromProfileDocument,
  ProfileKeyProcesses_ProfileFragment,
  ProfileKeyProcesses_ProfileTypeProcessFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { mapSignatureRequestStatusToFilter } from "@parallel/utils/mapSignatureRequestStatusToFilter";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, unique } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { DateTime } from "../common/DateTime";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Link, NakedLink } from "../common/Link";
import {
  localizableUserTextRender,
  LocalizableUserTextRender,
} from "../common/LocalizableUserTextRender";
import { OverflownText } from "../common/OverflownText";
import { PetitionSignatureStatusLabel } from "../common/PetitionSignatureStatusLabel";
import { PetitionStatusLabel } from "../common/PetitionStatusLabel";
import { RestrictedFeaturePopover } from "../common/RestrictedFeaturePopover";
import { useAssociateNewPetitionToProfileDialog } from "./dialogs/AssociateNewPetitionToProfileDialog";
import { useAssociatePetitionToProfileDialog } from "./dialogs/AssociatePetitionToProfileDialog";

const MIN_CARD_H = "180px";
const MIN_CARD_W = "300px";

export function ProfileKeyProcesses({ profile }: { profile: ProfileKeyProcesses_ProfileFragment }) {
  const profileTypeId = profile.profileType.id;
  const keyProcesses = profile.profileType.keyProcesses;

  const goToPetition = useGoToPetition();
  const showErrorToast = useGenericErrorToast();

  const [associateProfileToPetition] = useMutation(
    ProfileKeyProcesses_associateProfileToPetitionDocument,
  );
  const showAssociatePetitionToProfileDialog = useAssociatePetitionToProfileDialog();
  const handleAssociate = async (keyProcess: ProfileKeyProcesses_ProfileTypeProcessFragment) => {
    try {
      const petitionId = await showAssociatePetitionToProfileDialog({
        excludePetitions: profile.associatedPetitions.items.map((petition) => petition.id),
        fromTemplateId: keyProcess.templates.map((t) => t.id),
      });

      await associateProfileToPetition({
        variables: { petitionId, profileId: profile.id },
      });
    } catch {}
  };

  const [createPetitionFromProfile] = useMutation(
    ProfileKeyProcesses_createPetitionFromProfileDocument,
  );
  const showAssociateNewPetitionToProfileDialog = useAssociateNewPetitionToProfileDialog();
  const handleCreateNewPetition = async (
    keyProcess: ProfileKeyProcesses_ProfileTypeProcessFragment,
  ) => {
    try {
      const template = keyProcess.templates[0];

      if (keyProcess.templates.length !== 1 || !template.myEffectivePermission) {
        const petitionId = await showAssociateNewPetitionToProfileDialog({
          profile,
          keyProcess,
        });
        goToPetition(petitionId, "preview");
        return;
      }

      const compatibleFieldGroups = template.fields.filter(
        (f) =>
          f.type === "FIELD_GROUP" &&
          f.isLinkedToProfileType &&
          f.profileType?.id === profile.profileType.id,
      );

      if (compatibleFieldGroups.length) {
        const petitionId = await showAssociateNewPetitionToProfileDialog({
          profile,
          keyProcess,
        });
        goToPetition(petitionId, "preview");
        return;
      }

      const { data } = await createPetitionFromProfile({
        variables: {
          profileId: profile.id,
          templateId: template.id,
          petitionFieldId: compatibleFieldGroups[0]?.id,
          prefill: compatibleFieldGroups.map((field) => ({
            petitionFieldId: field.id,
            profileIds: [profile.id],
          })),
        },
      });

      if (data?.createPetitionFromProfile?.id) {
        goToPetition(data.createPetitionFromProfile.id, "preview");
      }
    } catch (error) {
      if (isDialogError(error) && error.message === "ERROR") {
        showErrorToast();
      }
    }
  };

  return (
    <Flex gap={4} minHeight={MIN_CARD_H} flexWrap="wrap">
      {keyProcesses.length === 0 ? (
        <PlaceholderEmpty profileTypeId={profileTypeId} />
      ) : (
        <>
          {keyProcesses.map((keyProcess) => {
            const { id } = keyProcess;
            return (
              <KeyProcessCard
                key={id}
                keyProcess={keyProcess}
                profile={profile}
                onAssociate={() => {
                  handleAssociate(keyProcess);
                }}
                onCreate={() => {
                  handleCreateNewPetition(keyProcess);
                }}
              />
            );
          })}
          {keyProcesses.length !== 3 ? (
            <PlaceholderAddNewProcess
              showAlways={keyProcesses.length === 1}
              profileTypeId={profileTypeId}
            />
          ) : null}
        </>
      )}
    </Flex>
  );
}

ProfileKeyProcesses.fragments = {
  get PetitionBaseMini() {
    return gql`
      fragment ProfileKeyProcesses_PetitionBaseMini on PetitionBaseMini {
        id
        name
        status
        currentSignatureRequest {
          id
          status
        }
        myEffectivePermission {
          permissionType
        }
        lastActivityAt
      }
    `;
  },
  get ProfileTypeProcess() {
    return gql`
      fragment ProfileKeyProcesses_ProfileTypeProcess on ProfileTypeProcess {
        id
        name
        position
        latestPetition(profileId: $profileId) {
          ...ProfileKeyProcesses_PetitionBaseMini
        }
        templates {
          id
          fields {
            id
            type
            isLinkedToProfileType
            profileType {
              id
            }
          }
        }
        ...useAssociateNewPetitionToProfileDialog_ProfileTypeProcess
      }
      ${this.PetitionBaseMini}
      ${useAssociateNewPetitionToProfileDialog.fragments.ProfileTypeProcess}
    `;
  },
  get Profile() {
    return gql`
      fragment ProfileKeyProcesses_Profile on Profile {
        id
        profileType {
          id
          keyProcesses {
            ...ProfileKeyProcesses_ProfileTypeProcess
          }
        }
        associatedPetitions(offset: 0, limit: 100) {
          items {
            id
            fromTemplate {
              id
            }
          }
        }
        ...useAssociateNewPetitionToProfileDialog_Profile
      }
      ${this.PetitionBaseMini}
      ${this.ProfileTypeProcess}
      ${useAssociateNewPetitionToProfileDialog.fragments.Profile}
    `;
  },
};

const _mutations = [
  gql`
    mutation ProfileKeyProcesses_associateProfileToPetition($petitionId: GID!, $profileId: GID!) {
      associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
        profile {
          ...ProfileKeyProcesses_Profile
        }
      }
    }
    ${ProfileKeyProcesses.fragments.Profile}
  `,
  gql`
    mutation ProfileKeyProcesses_createPetitionFromProfile(
      $profileId: GID!
      $templateId: GID!
      $prefill: [CreatePetitionFromProfilePrefillInput!]!
      $petitionFieldId: GID
    ) {
      createPetitionFromProfile(
        profileId: $profileId
        templateId: $templateId
        prefill: $prefill
        petitionFieldId: $petitionFieldId
      ) {
        id
      }
    }
  `,
];

function KeyProcessCard({
  keyProcess,
  profile,
  onCreate,
  onAssociate,
}: {
  keyProcess: ProfileKeyProcesses_ProfileTypeProcessFragment;
  profile: ProfileKeyProcesses_ProfileFragment;
  onCreate: () => void;
  onAssociate: () => void;
}) {
  const intl = useIntl();
  const profileId = profile.id;
  const { name, latestPetition, templates } = keyProcess;

  const showViewOthers = useMemo(() => {
    const associatedTemplateIds = unique(
      profile.associatedPetitions.items
        .filter((p) => isNonNullish(p.fromTemplate) && p.id !== latestPetition?.id)
        .map((petition) => petition.fromTemplate!.id),
    );

    return keyProcess.templates.some((template) => associatedTemplateIds.includes(template.id));
  }, [profile.id, keyProcess.id]);

  const userCanCreatePetition = useHasPermission("PETITIONS:CREATE_PETITIONS");
  const userHasAccessToPetition = isNonNullish(
    latestPetition?.myEffectivePermission?.permissionType,
  );

  const parallelName =
    latestPetition?.name ??
    intl.formatMessage({
      id: "generic.unnamed-parallel",
      defaultMessage: "Unnamed parallel",
    });

  return (
    <Card
      display="flex"
      flexDirection="column"
      minHeight={MIN_CARD_H}
      minWidth={MIN_CARD_W}
      flex="4"
    >
      <CardHeader
        omitDivider
        rightAction={
          isNonNullish(latestPetition) ? (
            <HStack>
              {showViewOthers ? (
                <NakedLink
                  href={`/app/profiles/${profileId}/parallels?${new URLSearchParams({ p_fromTemplateId: templates.map((t) => t.id).join(",") })}`}
                >
                  <Button as="a" variant="outline" size="sm" fontSize="md" fontWeight={500}>
                    <FormattedMessage
                      id="component.profile-key-process.view-others"
                      defaultMessage="View others"
                    />
                  </Button>
                </NakedLink>
              ) : null}

              <IconButtonWithTooltip
                size="sm"
                icon={<AddIcon />}
                label={intl.formatMessage(
                  { id: "generic.create-name", defaultMessage: "Create {name}" },
                  {
                    name: localizableUserTextRender({
                      intl,
                      value: name,
                      default: "",
                    }),
                  },
                )}
                onClick={onCreate}
                isDisabled={!userCanCreatePetition}
              />
            </HStack>
          ) : null
        }
        headingMinWidth={0}
      >
        <OverflownText>
          <LocalizableUserTextRender value={name} default="" />
        </OverflownText>
      </CardHeader>
      {isNonNullish(latestPetition) ? (
        <Stack padding={4} paddingTop={0} flex="1">
          <Stack flex="1">
            {userHasAccessToPetition ? (
              <Link
                width="fit-content"
                noOfLines={2}
                href={`/app/petitions/${latestPetition.id}/preview`}
                fontWeight={500}
                textStyle={isNullish(latestPetition?.name) ? "hint" : undefined}
              >
                {parallelName}
              </Link>
            ) : (
              <Text
                noOfLines={2}
                fontWeight={500}
                textStyle={isNullish(latestPetition?.name) ? "hint" : undefined}
              >
                {parallelName}
              </Text>
            )}

            <HStack spacing={0} rowGap={2} columnGap={3} flexWrap="wrap">
              {isNonNullish(latestPetition.status) ? (
                <PetitionStatusLabel status={latestPetition.status} fontSize="md" />
              ) : null}
              {isNonNullish(latestPetition.currentSignatureRequest) ? (
                <PetitionSignatureStatusLabel
                  status={mapSignatureRequestStatusToFilter(
                    latestPetition.currentSignatureRequest.status,
                  )}
                />
              ) : null}
            </HStack>
          </Stack>
          {userHasAccessToPetition ? (
            <Text fontSize="sm" color="gray.600">
              <FormattedMessage
                id="component.profile-key-process.last-activity-parallel"
                defaultMessage="Last activity: {timeAgo}"
                values={{
                  timeAgo: (
                    <DateTime
                      value={latestPetition.lastActivityAt ?? new Date().toISOString()}
                      format={FORMATS.LLL}
                      useRelativeTime="always"
                    />
                  ),
                }}
              />
            </Text>
          ) : (
            <HStack fontSize="sm" color="gray.600">
              <LockClosedIcon />
              <Text as="span">
                <FormattedMessage
                  id="component.profile-key-process.no-access-parallel"
                  defaultMessage="You don't have access to this parallel"
                />
              </Text>
            </HStack>
          )}
        </Stack>
      ) : (
        <Center as={Stack} padding={4} paddingTop={0} flex="1">
          <Text color="gray.400" fontStyle="italic">
            <FormattedMessage
              id="component.profile-key-process.no-associated-parallels"
              defaultMessage="No associated parallels"
            />
          </Text>
          <HStack
            flexWrap="wrap"
            paddingX={8}
            justify="center"
            spacing={0}
            rowGap={2}
            columnGap={4}
            minWidth={0}
          >
            <Button
              colorScheme="primary"
              size="sm"
              fontSize="md"
              fontWeight={500}
              display="grid"
              onClick={onCreate}
              isDisabled={!userCanCreatePetition}
            >
              <OverflownText>
                <FormattedMessage
                  id="generic.create-name"
                  defaultMessage="Create {name}"
                  values={{
                    name: localizableUserTextRender({
                      intl,
                      value: name,
                      default: "",
                    }),
                  }}
                />
              </OverflownText>
            </Button>
            <Button variant="link" size="sm" fontSize="md" fontWeight={500} onClick={onAssociate}>
              <FormattedMessage
                id="component.profile-key-process.associate-existing"
                defaultMessage="Associate existing"
              />
            </Button>
          </HStack>
        </Center>
      )}
    </Card>
  );
}

function PlaceholderEmpty({ profileTypeId }: { profileTypeId: string }) {
  const userCanAccessProfileTypes = useHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES");

  const addProcessButton = (
    <Button as="a" variant="link" isDisabled={!userCanAccessProfileTypes}>
      <FormattedMessage
        id="component.profile-key-processes.add-process-button"
        defaultMessage="Add process"
      />
    </Button>
  );

  return (
    <Center
      as={Stack}
      padding={6}
      border="2px dashed"
      borderColor="gray.200"
      borderRadius="md"
      flex="1"
      minHeight={MIN_CARD_H}
      minWidth={MIN_CARD_W}
    >
      <Image
        color="transparent"
        alt=""
        width={100}
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/profiles/empty-key-processes.png`}
      />
      <Text color="gray.500" fontStyle="italic">
        <FormattedMessage
          id="component.profile-key-processes.placeholder"
          defaultMessage="Highlight main processes of this profile"
        />
      </Text>
      {userCanAccessProfileTypes ? (
        <NakedLink href={`/app/organization/profiles/types/${profileTypeId}`}>
          {addProcessButton}
        </NakedLink>
      ) : (
        <RestrictedFeaturePopover isRestricted={true}>{addProcessButton}</RestrictedFeaturePopover>
      )}
    </Center>
  );
}

function PlaceholderAddNewProcess({
  showAlways,
  profileTypeId,
}: {
  showAlways: boolean;
  profileTypeId: string;
}) {
  const userCanAccessProfileTypes = useHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES");

  const addProcessButton = (
    <Button
      as="a"
      variant="outline"
      fontSize="md"
      size="sm"
      fontWeight={500}
      isDisabled={!userCanAccessProfileTypes}
    >
      <FormattedMessage
        id="component.profile-key-processes.add-process-button"
        defaultMessage="Add process"
      />
    </Button>
  );

  return (
    <Center
      as={Stack}
      spacing={3}
      padding={6}
      border="2px dashed"
      borderColor="gray.200"
      borderRadius="md"
      flex="2"
      minHeight={MIN_CARD_H}
      minWidth={MIN_CARD_W}
      display={showAlways ? undefined : { base: "none", "2xl": "flex" }}
    >
      <PlusCircleIcon boxSize={8} color="gray.400" />
      {userCanAccessProfileTypes ? (
        <NakedLink href={`/app/organization/profiles/types/${profileTypeId}`}>
          {addProcessButton}
        </NakedLink>
      ) : (
        <RestrictedFeaturePopover isRestricted={true}>{addProcessButton}</RestrictedFeaturePopover>
      )}
    </Center>
  );
}

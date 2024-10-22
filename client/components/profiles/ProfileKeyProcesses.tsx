import { gql, useMutation } from "@apollo/client";
import { Button, Center, Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { AddIcon, LockClosedIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import {
  ProfileKeyProcesses_associateProfileToPetitionDocument,
  ProfileKeyProcesses_ProfileFragment,
  ProfileKeyProcesses_ProfileTypeProcessFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { DateTime } from "../common/DateTime";
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

  const [associateProfileToPetition] = useMutation(
    ProfileKeyProcesses_associateProfileToPetitionDocument,
  );
  const showAssociatePetitionToProfileDialog = useAssociatePetitionToProfileDialog();
  const handleAssociate = async (profileTypeProcessId: string) => {
    try {
      const petitionId = await showAssociatePetitionToProfileDialog({
        excludePetitions: profile.associatedPetitions.items.map((petition) => petition.id),
      });

      await associateProfileToPetition({
        variables: { petitionId, profileId: profile.id, profileTypeProcessId },
      });
    } catch {}
  };

  const showAssociateNewPetitionToProfileDialog = useAssociateNewPetitionToProfileDialog();
  const handleCreateNewPetition = async (
    keyProcess: ProfileKeyProcesses_ProfileTypeProcessFragment,
  ) => {
    try {
      await showAssociateNewPetitionToProfileDialog({
        profile,
        keyProcess,
      });
    } catch {}
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
                profileId={profile.id}
                onAssociate={() => {
                  handleAssociate(keyProcess.id);
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
        latestSignatureStatus
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
        latestPetition {
          ...ProfileKeyProcesses_PetitionBaseMini
        }
        templates {
          id
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
    mutation ProfileKeyProcesses_associateProfileToPetition(
      $petitionId: GID!
      $profileId: GID!
      $profileTypeProcessId: GID
    ) {
      associateProfileToPetition(
        petitionId: $petitionId
        profileId: $profileId
        profileTypeProcessId: $profileTypeProcessId
      ) {
        profile {
          ...ProfileKeyProcesses_Profile
        }
      }
    }
    ${ProfileKeyProcesses.fragments.Profile}
  `,
];

function KeyProcessCard({
  keyProcess,
  profileId,
  onCreate,
  onAssociate,
}: {
  keyProcess: ProfileKeyProcesses_ProfileTypeProcessFragment;
  profileId: string;
  onCreate: () => void;
  onAssociate: () => void;
}) {
  const intl = useIntl();
  const { name, latestPetition } = keyProcess;

  // TODO Handle all permission cases
  const showAsociateExisting = true;

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
              {/* TODO redirect with filter once implemented in table */}
              <NakedLink href={`/app/profiles/${profileId}/parallels`}>
                <Button as="a" variant="outline" size="sm" fontSize="md" fontWeight={500}>
                  <FormattedMessage
                    id="component.profile-key-process.view-others"
                    defaultMessage="View others"
                  />
                </Button>
              </NakedLink>
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
                noOfLines={2}
                href={`/app/petitions/${latestPetition.id}/preview`}
                fontWeight={500}
              >
                {parallelName}
              </Link>
            ) : (
              <Text noOfLines={2} fontWeight={500}>
                {parallelName}
              </Text>
            )}

            <HStack spacing={0} rowGap={2} columnGap={3} flexWrap="wrap">
              {isNonNullish(latestPetition.status) ? (
                <PetitionStatusLabel status={latestPetition.status} fontSize="md" />
              ) : null}
              {isNonNullish(latestPetition.latestSignatureStatus) ? (
                <PetitionSignatureStatusLabel status={latestPetition.latestSignatureStatus} />
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
            {showAsociateExisting ? (
              <Button variant="link" size="sm" fontSize="md" fontWeight={500} onClick={onAssociate}>
                <FormattedMessage
                  id="component.profile-key-process.associate-existing"
                  defaultMessage="Associate existing"
                />
              </Button>
            ) : null}
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

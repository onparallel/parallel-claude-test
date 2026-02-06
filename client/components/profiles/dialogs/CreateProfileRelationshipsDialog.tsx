import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  FormControl,
  FormErrorMessage,
  Grid,
  Heading,
  List,
  ListItem,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon, RelationshipIcon } from "@parallel/chakra/icons";
import { ContactSupportAlert } from "@parallel/components/common/ContactSupportAlert";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { NoElement } from "@parallel/components/common/NoElement";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { ProfileRelationshipTypeWithDirectionSelect } from "@parallel/components/common/ProfileRelationshipTypeWithDirectionSelect";
import { ProfileSelect, ProfileSelectSelection } from "@parallel/components/common/ProfileSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import {
  CreateProfileRelationshipInput,
  useCreateProfileRelationshipsDialog_ProfileFragment,
  useCreateProfileRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment,
  useCreateProfileRelationshipsDialog_profileRelationshipTypesWithDirectionDocument,
} from "@parallel/graphql/__types";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { groupBy, isNonNullish, unique } from "remeda";

interface CreateProfileRelationshipsDialogProps {
  profile: useCreateProfileRelationshipsDialog_ProfileFragment;
}

interface CreateProfileRelationshipsDialogData {
  relationships: {
    profile: ProfileSelectSelection | null;
    profileRelationshipTypeWithDirection: useCreateProfileRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment | null;
  }[];
}

type CreateProfileRelationshipsDialogResult = CreateProfileRelationshipInput[];

function CreateProfileRelationshipsDialog({
  profile,
  ...props
}: DialogProps<CreateProfileRelationshipsDialogProps, CreateProfileRelationshipsDialogResult>) {
  const intl = useIntl();
  const isUpdating = false; // TODO: Implement updating in v2
  const form = useForm<CreateProfileRelationshipsDialogData>({
    mode: "onChange",
    defaultValues: {
      relationships: [
        {
          profile: null,
          profileRelationshipTypeWithDirection: null,
        },
      ],
    },
  });
  const { data, loading } = useQuery(
    useCreateProfileRelationshipsDialog_profileRelationshipTypesWithDirectionDocument,
    {
      variables: {
        otherSideProfileTypeId: profile.profileType.id,
      },
    },
  );

  const { handleSubmit, control, watch, setError } = form;

  const { fields, append, remove } = useFieldArray({
    name: "relationships",
    control,
  });

  const handleCreateRelationship = () => {
    append({
      profile: null,
      profileRelationshipTypeWithDirection: null,
    });
  };

  const relationships = watch("relationships");

  const setRelationships = relationships.filter(
    (v) => isNonNullish(v.profile) && isNonNullish(v.profileRelationshipTypeWithDirection),
  );

  return (
    <ConfirmDialog
      size="3xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ relationships }) => {
            // validate no duplicate rows, we group by unique key, is a group has more than one item, it's duplicated
            const groups = groupBy(
              [
                // existing relationships
                ...profile.relationships.map((r) => {
                  const [otherProfile, direction] =
                    r.leftSideProfile.id === profile.id
                      ? ([r.rightSideProfile, "RIGHT_LEFT"] as const)
                      : ([r.leftSideProfile, "LEFT_RIGHT"] as const);
                  return [
                    [
                      r.relationshipType.id,
                      otherProfile.id,
                      r.relationshipType.isReciprocal ? "" : direction,
                    ].join(","),
                    -1,
                  ] as const;
                }),
                // added relationships
                ...relationships.map(
                  (r, i) =>
                    [
                      [
                        r.profileRelationshipTypeWithDirection!.profileRelationshipType.id,
                        r.profile!.id,
                        r.profileRelationshipTypeWithDirection!.profileRelationshipType.isReciprocal
                          ? ""
                          : r.profileRelationshipTypeWithDirection?.direction,
                      ].join(","),
                      i,
                    ] as const,
                ),
              ],

              ([key]) => key,
            );
            let valid = true;
            for (const group of Object.values(groups)) {
              if (group.length > 1) {
                for (const [_, i] of group.slice(1)) {
                  setError(`relationships.${i}`, {
                    type: group[0][1] === -1 ? "existing" : "duplicated",
                  });
                  valid = false;
                }
              }
            }
            if (valid) {
              props.onResolve(
                relationships.map((r) => ({
                  profileId: r.profile!.id,
                  profileRelationshipTypeId:
                    r.profileRelationshipTypeWithDirection!.profileRelationshipType.id,
                  direction: r.profileRelationshipTypeWithDirection!.direction,
                })),
              );
            }
          }),
        },
      }}
      {...props}
      header={
        <Heading size="md" noOfLines={1}>
          {isUpdating ? (
            <FormattedMessage
              id="component.create-profile-relationships-dialog.header-updating"
              defaultMessage="Edit association with {profileName}"
              values={{ profileName: <ProfileReference profile={profile} /> }}
            />
          ) : (
            <FormattedMessage
              id="component.create-profile-relationships-dialog.header"
              defaultMessage="Associate profiles with {profileName}"
              values={{ profileName: <ProfileReference profile={profile} /> }}
            />
          )}
        </Heading>
      }
      body={
        <>
          {data?.profileRelationshipTypesWithDirection.length === 0 ? (
            <ContactSupportAlert
              marginBottom={4}
              body={intl.formatMessage({
                id: "component.create-profile-relationships-dialog.no-relationships-contact-alert",
                defaultMessage:
                  "This profile cannot be associated because it does not have compatible relationships. Please contact us for more information.",
              })}
              contactMessage={intl.formatMessage({
                id: "component.create-profile-relationships-dialog.no-relationships-contact-message-alert",
                defaultMessage:
                  "Hi, I would like to get more information about associations between profiles.",
              })}
            />
          ) : null}
          <Grid gap={2} templateColumns="2fr 3fr auto">
            <Text>
              <FormattedMessage
                id="component.create-profile-relationships-dialog.profile"
                defaultMessage="Profile"
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.create-profile-relationships-dialog.relationship"
                defaultMessage="Relationship"
              />
            </Text>
            <Box></Box>

            <FormProvider {...form}>
              {fields.map(({ id }, index) => {
                return (
                  <ProfileRelationshipRow
                    key={id}
                    index={index}
                    profile={profile}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                    isUpdating={isUpdating}
                    isDisabled={loading}
                    profileRelationshipTypesWithDirection={
                      data?.profileRelationshipTypesWithDirection ?? []
                    }
                  />
                );
              })}
            </FormProvider>
          </Grid>

          {isUpdating || fields.length >= 100 ? null : (
            <Box marginTop={2}>
              <Button onClick={handleCreateRelationship}>
                <FormattedMessage
                  id="component.create-profile-relationships-dialog.add-profile"
                  defaultMessage="Add profile"
                />
              </Button>
            </Box>
          )}

          <Stack
            border="1px solid"
            borderColor="gray.300"
            borderRadius="md"
            paddingY={2}
            paddingX={4}
            marginTop={4}
            fontSize="sm"
            gap={1}
          >
            <Text>
              <FormattedMessage
                id="component.create-profile-relationships-dialog.preview"
                defaultMessage="Preview"
              />
              :
            </Text>
            {setRelationships.length === 0 ? (
              <Text color="gray.500">
                <FormattedMessage
                  id="component.create-profile-relationships-dialog.no-relationships-selected"
                  defaultMessage="There are no profiles associated. Select a profile to preview the association."
                />
              </Text>
            ) : (
              <List>
                {setRelationships.map(
                  ({ profile: selectedProfile, profileRelationshipTypeWithDirection }, index) => {
                    const { direction, profileRelationshipType } =
                      profileRelationshipTypeWithDirection!;
                    return (
                      <ListItem key={index}>
                        <ProfileReference profile={selectedProfile} fontWeight={600} /> &nbsp;(
                        {direction === "LEFT_RIGHT" ? (
                          <LocalizableUserTextRender
                            value={profileRelationshipType.leftRightName}
                            default={<></>}
                          />
                        ) : (
                          <LocalizableUserTextRender
                            value={profileRelationshipType.rightLeftName}
                            default={<></>}
                          />
                        )}
                        ) &nbsp;
                        <RelationshipIcon />
                        &nbsp;
                        <ProfileReference profile={profile} fontWeight={600} /> &nbsp;(
                        {direction === "LEFT_RIGHT" ? (
                          <LocalizableUserTextRender
                            value={profileRelationshipType.rightLeftName}
                            default={<></>}
                          />
                        ) : (
                          <LocalizableUserTextRender
                            value={profileRelationshipType.leftRightName}
                            default={<></>}
                          />
                        )}
                        )
                      </ListItem>
                    );
                  },
                )}
              </List>
            )}
          </Stack>
        </>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
          <FormattedMessage id="generic.add" defaultMessage="Add" />
        </Button>
      }
    />
  );
}

interface ProfileRelationshipRowProps {
  index: number;
  profile: useCreateProfileRelationshipsDialog_ProfileFragment;
  profileRelationshipTypesWithDirection: useCreateProfileRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment[];
  onRemove: () => void;
  canRemove: boolean;
  isUpdating: boolean;
  isDisabled: boolean;
}

function ProfileRelationshipRow({
  index,
  profile,
  profileRelationshipTypesWithDirection,
  onRemove,
  canRemove,
  isUpdating,
  isDisabled,
}: ProfileRelationshipRowProps) {
  const intl = useIntl();

  const {
    control,
    watch,
    formState: { errors },
    clearErrors,
  } = useFormContext<CreateProfileRelationshipsDialogData>();

  const selectedProfile = watch(`relationships.${index}.profile`);
  const selectedProfileRelationshipTypeWithDirection = watch(
    `relationships.${index}.profileRelationshipTypeWithDirection`,
  );

  const compatibleProfileTypeIds = isNonNullish(selectedProfileRelationshipTypeWithDirection)
    ? selectedProfileRelationshipTypeWithDirection.profileRelationshipType[
        selectedProfileRelationshipTypeWithDirection.direction === "LEFT_RIGHT"
          ? "allowedLeftRightProfileTypeIds"
          : "allowedRightLeftProfileTypeIds"
      ]
    : unique(
        profileRelationshipTypesWithDirection?.flatMap(({ direction, profileRelationshipType }) => {
          return profileRelationshipType[
            direction === "LEFT_RIGHT"
              ? "allowedLeftRightProfileTypeIds"
              : "allowedRightLeftProfileTypeIds"
          ];
        }) ?? [],
      );

  const options = isNonNullish(selectedProfile)
    ? profileRelationshipTypesWithDirection.filter((prtwd) =>
        prtwd.profileRelationshipType[
          prtwd.direction === "LEFT_RIGHT"
            ? "allowedLeftRightProfileTypeIds"
            : "allowedRightLeftProfileTypeIds"
        ].includes(selectedProfile.profileType.id),
      )
    : profileRelationshipTypesWithDirection;

  const hasProfileError =
    isNonNullish(errors.relationships?.[index]?.type) ||
    isNonNullish(errors.relationships?.[index]?.profile);

  const hasRelationsShipError =
    isNonNullish(errors.relationships?.[index]?.type) ||
    isNonNullish(errors.relationships?.[index]?.profileRelationshipTypeWithDirection);

  return (
    <FormControl as={NoElement} isInvalid={true}>
      <FormControl isInvalid={hasProfileError} isDisabled={isDisabled || isUpdating} minWidth={0}>
        <Controller
          name={`relationships.${index}.profile` as const}
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange, ...rest } }) => {
            return (
              <ProfileSelect
                isClearable
                excludeProfiles={[profile.id]}
                profileTypeId={compatibleProfileTypeIds}
                defaultOptions
                canCreateProfiles
                onChange={(v) => {
                  if (hasProfileError) {
                    clearErrors(`relationships.${index}`);
                  }
                  onChange(v);
                }}
                {...rest}
              />
            );
          }}
        />
      </FormControl>
      <FormControl isInvalid={hasRelationsShipError} isDisabled={isDisabled} minWidth={0}>
        <Controller
          name={`relationships.${index}.profileRelationshipTypeWithDirection` as const}
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange, ...rest } }) => {
            return (
              <ProfileRelationshipTypeWithDirectionSelect
                isClearable
                options={options}
                onChange={(v) => {
                  if (hasRelationsShipError) {
                    clearErrors(`relationships.${index}`);
                  }
                  onChange(v);
                }}
                {...rest}
              />
            );
          }}
        />
      </FormControl>
      {isUpdating ? (
        <Box></Box>
      ) : (
        <IconButtonWithTooltip
          onClick={onRemove}
          icon={<DeleteIcon />}
          variant="outline"
          label={intl.formatMessage({
            id: "generic.remove",
            defaultMessage: "Remove",
          })}
          disabled={!canRemove}
        />
      )}

      {isNonNullish(errors.relationships?.[index]?.type) ? (
        <FormErrorMessage gridColumn={"1 / -1"} margin={0}>
          {errors.relationships?.[index]?.type === "duplicated" ? (
            <FormattedMessage
              id="component.create-profile-relationships-dialog.duplicated-relationship"
              defaultMessage="This association is duplicated"
            />
          ) : errors.relationships?.[index]?.type === "existing" ? (
            <FormattedMessage
              id="component.create-profile-relationships-dialog.existing-relationship"
              defaultMessage="This association already exists"
            />
          ) : null}
        </FormErrorMessage>
      ) : null}
    </FormControl>
  );
}

export function useCreateProfileRelationshipsDialog() {
  return useDialog(CreateProfileRelationshipsDialog);
}

const _fragments = {
  Profile: gql`
    fragment useCreateProfileRelationshipsDialog_Profile on Profile {
      id
      ...ProfileSelect_Profile
      ...ProfileReference_Profile
      relationships {
        leftSideProfile {
          id
        }
        rightSideProfile {
          id
        }
        relationshipType {
          id
          isReciprocal
        }
      }
    }
  `,
  ProfileRelationshipTypeWithDirection: gql`
    fragment useCreateProfileRelationshipsDialog_ProfileRelationshipTypeWithDirection on ProfileRelationshipTypeWithDirection {
      ...ProfileRelationshipTypeWithDirectionSelect_ProfileRelationshipTypeWithDirection
    }
  `,
};

const _queries = [
  gql`
    query useCreateProfileRelationshipsDialog_profileRelationshipTypesWithDirection(
      $otherSideProfileTypeId: GID
    ) {
      profileRelationshipTypesWithDirection(otherSideProfileTypeId: $otherSideProfileTypeId) {
        ...useCreateProfileRelationshipsDialog_ProfileRelationshipTypeWithDirection
      }
    }
  `,
];

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Box, Button, Flex, HStack, IconButton } from "@chakra-ui/react";
import { AddIcon, CloseIcon } from "@parallel/chakra/icons";
import { ProfileForm } from "@parallel/components/profiles/ProfileForm";
import {
  ProfileDrawer_PetitionBaseFragment,
  ProfileDrawer_ProfileFragment,
  ProfileDrawer_profileDocument,
} from "@parallel/graphql/__types";
import { useRerender } from "@parallel/utils/useRerender";
import { forwardRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MenuListProps, components } from "react-select";
import {
  ProfileSelect,
  ProfileSelectInstance,
  ProfileSelectSelection,
} from "../common/ProfileSelect";

interface ProfileDrawerProps {
  profileId: string;
  petitionId: string;
  profiles: ProfileDrawer_ProfileFragment[];
  petition: ProfileDrawer_PetitionBaseFragment;
  onChangeProfile: (profileId: string | null) => void;
  onAssociateProfile: () => void;
  isReadOnly?: boolean;
  canAddProfiles?: boolean;
}

export const ProfileDrawer = Object.assign(
  forwardRef<ProfileSelectInstance<false>, ProfileDrawerProps>(function ProfileDrawer(
    {
      profileId,
      petitionId,
      profiles,
      onChangeProfile,
      onAssociateProfile,
      isReadOnly,
      canAddProfiles,
      petition,
    },
    ref,
  ) {
    const intl = useIntl();

    const { data: profileData, refetch: refetchProfile } = useQuery(ProfileDrawer_profileDocument, {
      fetchPolicy: "cache-and-network",
      variables: {
        profileId,
      },
    });

    const [key, rerender] = useRerender();

    const handleRefetchProfile = async () => {
      try {
        await refetchProfile();
        rerender();
      } catch {}
    };

    return (
      <Flex direction="column" background="white" height="100%">
        <HStack
          borderBottom="1px solid"
          borderColor="gray.200"
          height="53px"
          alignItems="center"
          paddingY={2}
          paddingX={4}
          justifyContent="space-between"
        >
          <Box flex="1" fontWeight={400} fontSize="md">
            <ProfileSelect
              ref={ref}
              key={key}
              isSync
              value={profileId}
              onChange={(profile) => onChangeProfile(profile?.id ?? profileId)}
              options={profiles}
              isDisabled={isReadOnly}
              components={{ MenuList }}
              {...({ onAssociateProfile, canAddProfiles } as any)}
            />
          </Box>
          <IconButton
            aria-label={intl.formatMessage({ id: "generic.close", defaultMessage: "Close" })}
            variant="ghost"
            onClick={() => onChangeProfile(null)}
            icon={<CloseIcon boxSize={4} />}
          />
        </HStack>
        {profileData?.profile ? (
          <ProfileForm
            key={profileData.profile.id}
            overlapsIntercomBadge
            profile={profileData.profile}
            onRefetch={handleRefetchProfile}
            flex={1}
            minHeight={0}
            petition={petition}
            petitionId={petitionId}
            includeLinkToProfile
          />
        ) : null}
      </Flex>
    );
  }),
  {
    fragments: {
      Profile: gql`
        fragment ProfileDrawer_Profile on Profile {
          id
          profileType {
            id
            name
          }
          ...ProfileSelect_Profile
        }
        ${ProfileSelect.fragments.Profile}
      `,
      PetitionBase: gql`
        fragment ProfileDrawer_PetitionBase on PetitionBase {
          ...ProfileForm_PetitionBase
        }
        ${ProfileForm.fragments.PetitionBase}
      `,
    },
  },
);

function MenuList(props: MenuListProps<ProfileSelectSelection>) {
  const canAddProfiles = (props.selectProps as any).canAddProfiles as boolean;
  return (
    <components.MenuList
      {...props}
      innerProps={canAddProfiles ? { style: { paddingBottom: 0 } } : {}}
    >
      {props.children}

      {canAddProfiles && (
        <Box position="sticky" bottom="0" padding={2} backgroundColor="white">
          <Button
            width="100%"
            size="md"
            variant="outline"
            fontWeight="normal"
            leftIcon={<AddIcon position="relative" top="-1px" />}
            onClick={() => (props.selectProps as any).onAssociateProfile()}
          >
            <FormattedMessage
              id="component.profile-select.add-profile"
              defaultMessage="Add profile"
            />
          </Button>
        </Box>
      )}
    </components.MenuList>
  );
}

const _queries = [
  gql`
    query ProfileDrawer_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...ProfileForm_Profile
      }
    }
    ${ProfileForm.fragments.Profile}
  `,
];

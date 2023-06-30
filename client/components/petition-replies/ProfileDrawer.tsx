import { gql, useQuery } from "@apollo/client";
import { Box, Button, Flex, HStack, IconButton } from "@chakra-ui/react";
import { AddIcon, CloseIcon } from "@parallel/chakra/icons";
import { ProfileForm } from "@parallel/components/profiles/ProfileForm";
import {
  ProfileDrawer_ProfileFragment,
  ProfileDrawer_profileDocument,
} from "@parallel/graphql/__types";
import { forwardRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MenuListProps, components } from "react-select";
import {
  ProfileSelect,
  ProfileSelectInstance,
  ProfileSelectSelection,
} from "../common/ProfileSelect";

interface ProfileDrawerProps {
  profileId: string;
  profiles: ProfileDrawer_ProfileFragment[];
  onChangeProfile: (profileId: string | null) => void;
  onAssociateProfile: () => void;
  isReadOnly?: boolean;
}

export const ProfileDrawer = Object.assign(
  forwardRef<ProfileSelectInstance<false>, ProfileDrawerProps>(function ProfileDrawer(
    { profileId, profiles, onChangeProfile, onAssociateProfile, isReadOnly },
    ref
  ) {
    const intl = useIntl();

    const { data: profileData, refetch: refetchProfile } = useQuery(ProfileDrawer_profileDocument, {
      fetchPolicy: "cache-and-network",
      variables: {
        profileId,
      },
    });

    const [counter, setCounter] = useState(0);

    const handleRefetchProfile = async () => {
      try {
        await refetchProfile();
        setCounter((c) => c + 1);
      } catch {}
    };

    return (
      <Flex direction="column" background="white" height="100%">
        <HStack
          borderBottom="1px solid"
          borderColor="gray.200"
          height="57px"
          alignItems="center"
          paddingY={2}
          paddingX={4}
          justifyContent="space-between"
        >
          <Box flex="1" fontWeight={400} fontSize="md">
            <ProfileSelect
              ref={ref}
              key={counter}
              isSync
              value={profileId}
              onChange={(profile) => onChangeProfile(profile?.id ?? profileId)}
              options={profiles}
              isDisabled={isReadOnly}
              components={{ MenuList }}
              {...({ onAssociateProfile } as any)}
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
            profile={profileData!.profile}
            refetch={handleRefetchProfile}
            flex={1}
            minHeight={0}
          />
        ) : null}
      </Flex>
    );
  }),
  {
    fragments: {
      get Profile() {
        return gql`
          fragment ProfileDrawer_Profile on Profile {
            id
            name
            profileType {
              id
              name
            }
            ...ProfileSelect_Profile
          }
          ${ProfileSelect.fragments.Profile}
        `;
      },
    },
  }
);

function MenuList(props: MenuListProps<ProfileSelectSelection>) {
  return (
    <components.MenuList {...props} innerProps={{ style: { paddingBottom: 0 } }}>
      {props.children}

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

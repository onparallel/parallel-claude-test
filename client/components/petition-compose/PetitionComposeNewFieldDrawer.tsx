import { gql } from "@apollo/client";
import {
  Box,
  HStack,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBreakpointValue,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Divider } from "@parallel/components/common/Divider";
import {
  PetitionComposeNewFieldDrawer_PetitionBaseFragment,
  PetitionComposeNewFieldDrawer_ProfileTypeFragment,
  PetitionComposeNewFieldDrawer_UserFragment,
  PetitionFieldType,
  ProfileTypeStandardType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useCallback, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CloseButton } from "../common/CloseButton";
import { PetitionComposeNewFieldDrawerPetitionFields } from "./PetitionComposeNewFieldDrawerPetitionFields";
import { PetitionComposeNewFieldDrawerProfileTypeFields } from "./PetitionComposeNewFieldDrawerProfileTypeFields";
import { Text } from "@parallel/components/ui";

interface PetitionComposeNewFieldDrawerProps {
  user: PetitionComposeNewFieldDrawer_UserFragment;
  onClose: () => void;
  onAddField: (props: {
    type: PetitionFieldType;
    profileTypeFieldId?: string;
  }) => Promise<string | undefined>;
  onAddProfileTypeFieldGroup: (props: {
    type: ProfileTypeStandardType;
    profileTypeId: string;
  }) => Promise<void>;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  petition: PetitionComposeNewFieldDrawer_PetitionBaseFragment;
  profileTypes: PetitionComposeNewFieldDrawer_ProfileTypeFragment[];
  newFieldPlaceholderParentFieldId?: string;
}

export const PetitionComposeNewFieldDrawer = chakraForwardRef<
  "div",
  PetitionComposeNewFieldDrawerProps
>(function PetitionComposeNewFieldDrawer(
  {
    user,
    profileTypes,
    onClose,
    onAddField,
    onAddProfileTypeFieldGroup,
    onFieldEdit,
    petition,
    newFieldPlaceholderParentFieldId,
  },
  ref,
) {
  const intl = useIntl();

  const isFieldGroupChild = Boolean(newFieldPlaceholderParentFieldId);

  const fieldsWithIndices = useFieldsWithIndices(petition);

  const isFullScreen = useBreakpointValue({ base: true, lg: false });
  const isAddingFieldRef = useRef(false);
  const handleAddField = useCallback(
    async (type: PetitionFieldType, profileTypeFieldId?: string) => {
      if (isAddingFieldRef.current) {
        return;
      }
      isAddingFieldRef.current = true;
      await onAddField({ type, profileTypeFieldId });
      isAddingFieldRef.current = false;
      if (isFullScreen) {
        onClose();
      }
    },
    [onAddField, isFullScreen, onClose],
  );

  const handleAddProfileTypeFieldGroup = useCallback(
    async (type: ProfileTypeStandardType, profileTypeId: string) => {
      if (isAddingFieldRef.current) {
        return;
      }
      isAddingFieldRef.current = true;
      await onAddProfileTypeFieldGroup({ type, profileTypeId });
      isAddingFieldRef.current = false;
      if (isFullScreen) {
        onClose();
      }
    },
    [onAddProfileTypeFieldGroup, isFullScreen, onClose],
  );

  const parentFieldWithIndex = fieldsWithIndices.find(
    ([f]) => f.id === newFieldPlaceholderParentFieldId,
  );

  const [parentField, parentFieldIndex] = parentFieldWithIndex ?? [];

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <Box {...extendFlexColumn} ref={ref}>
      <HStack paddingX={4}>
        <Heading flex={1} size="sm" paddingY={4}>
          {parentField ? (
            <>
              {parentFieldIndex}.{" "}
              <Text
                as="span"
                textStyle={parentField.title ? undefined : "hint"}
                fontWeight={parentField.title ? 600 : 500}
              >
                {parentField.title ??
                  intl.formatMessage({
                    id: "generic.untitled-field",
                    defaultMessage: "Untitled field",
                  })}
              </Text>
            </>
          ) : (
            <FormattedMessage
              id="component.petition-compose-new-field.what-do-you-need"
              defaultMessage="What do you need?"
            />
          )}
        </Heading>
        <CloseButton size="sm" variant="ghost" onClick={onClose} />
      </HStack>
      <Divider />
      {parentField && user.hasProfilesAccess ? (
        <Tabs variant="enclosed" {...extendFlexColumn} overflow="hidden">
          <TabList marginX="-1px" marginTop="-1px">
            <Tab
              paddingX={3}
              fontWeight="500"
              flex={1}
              whiteSpace="nowrap"
              borderTopRadius={0}
              _focusVisible={{ boxShadow: "inline" }}
              fontSize="sm"
              data-action="select-profile-linked-fields-tab"
            >
              <FormattedMessage
                id="component.petition-compose-new-field.profile-fields"
                defaultMessage="Profile fields"
              />
            </Tab>
            <Tab
              paddingX={3}
              fontWeight="500"
              flex={1}
              whiteSpace="nowrap"
              borderTopRadius={0}
              _focusVisible={{ boxShadow: "inline" }}
              fontSize="sm"
              data-action="select-regular-fields-tab"
            >
              <FormattedMessage
                id="component.petition-compose-new-field.new-field"
                defaultMessage="New field"
              />
            </Tab>
          </TabList>
          <TabPanels {...extendFlexColumn}>
            <TabPanel padding={0} {...extendFlexColumn}>
              <PetitionComposeNewFieldDrawerProfileTypeFields
                petition={petition}
                petitionField={parentField}
                onAddField={handleAddField}
                onFieldEdit={onFieldEdit}
              />
            </TabPanel>
            <TabPanel padding={0} {...extendFlexColumn}>
              <PetitionComposeNewFieldDrawerPetitionFields
                user={user}
                profileTypes={profileTypes}
                onAddField={handleAddField}
                onAddProfileTypeFieldGroup={handleAddProfileTypeFieldGroup}
                isFieldGroupChild={isFieldGroupChild}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        <PetitionComposeNewFieldDrawerPetitionFields
          user={user}
          profileTypes={profileTypes}
          onAddField={handleAddField}
          onAddProfileTypeFieldGroup={handleAddProfileTypeFieldGroup}
          isFieldGroupChild={isFieldGroupChild}
        />
      )}
    </Box>
  );
});

const _fragments = {
  ProfileType: gql`
    fragment PetitionComposeNewFieldDrawer_ProfileType on ProfileType {
      id
      ...PetitionComposeNewFieldDrawerPetitionFields_ProfileType
    }
  `,
  User: gql`
    fragment PetitionComposeNewFieldDrawer_User on User {
      id
      hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
      ...PetitionComposeNewFieldDrawerPetitionFields_User
    }
  `,
  PetitionBase: gql`
    fragment PetitionComposeNewFieldDrawer_PetitionBase on PetitionBase {
      fields {
        id
        title
        type
      }
      ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionBase
      ...useFieldsWithIndices_PetitionBase
    }
  `,
};

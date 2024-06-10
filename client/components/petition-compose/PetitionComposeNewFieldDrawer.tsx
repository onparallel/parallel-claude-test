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
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Divider } from "@parallel/components/common/Divider";
import {
  PetitionComposeNewFieldDrawer_PetitionBaseFragment,
  PetitionComposeNewFieldDrawer_UserFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useCallback, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CloseButton } from "../common/CloseButton";
import { PetitionComposeNewFieldDrawerPetitionFields } from "./PetitionComposeNewFieldDrawerPetitionFields";
import { PetitionComposeNewFieldDrawerProfileTypeFields } from "./PetitionComposeNewFieldDrawerProfileTypeFields";

interface PetitionComposeNewFieldDrawerProps {
  user: PetitionComposeNewFieldDrawer_UserFragment;
  onClose: () => void;
  onAddField: (type: PetitionFieldType, profileTypeFieldId?: string) => Promise<void>;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  petition: PetitionComposeNewFieldDrawer_PetitionBaseFragment;
  newFieldPlaceholderParentFieldId?: string;
}

export const PetitionComposeNewFieldDrawer = Object.assign(
  chakraForwardRef<"div", PetitionComposeNewFieldDrawerProps>(
    function PetitionComposeNewFieldDrawer(
      { user, onClose, onAddField, onFieldEdit, petition, newFieldPlaceholderParentFieldId },
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
          await onAddField(type, profileTypeFieldId);
          isAddingFieldRef.current = false;
          if (isFullScreen) {
            onClose();
          }
        },
        [onAddField, isFullScreen, onClose],
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
                    onAddField={handleAddField}
                    isFieldGroupChild={isFieldGroupChild}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : (
            <PetitionComposeNewFieldDrawerPetitionFields
              user={user}
              onAddField={handleAddField}
              isFieldGroupChild={isFieldGroupChild}
            />
          )}
        </Box>
      );
    },
  ),
  {
    fragments: {
      User: gql`
        fragment PetitionComposeNewFieldDrawer_User on User {
          hasEsTaxDocumentsField: hasFeatureFlag(featureFlag: ES_TAX_DOCUMENTS_FIELD)
          hasDowJonesField: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
          hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
          hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
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
        ${PetitionComposeNewFieldDrawerProfileTypeFields.fragments.PetitionBase}
        ${useFieldsWithIndices.fragments.PublicPetition}
      `,
    },
  },
);

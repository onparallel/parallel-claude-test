import { gql } from "@apollo/client";
import { Flex, Heading, HStack, MenuDivider, MenuItem, MenuList } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, EditSimpleIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { WhenOrgRole } from "@parallel/components/common/WhenOrgRole";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { useCreateOrEditProfileTypeDialog } from "@parallel/components/organization/profiles/dialogs/CreateOrEditProfileTypeDialog";
import { OrganizationProfileType_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useDeleteProfileType } from "@parallel/utils/mutations/useDeleteProfileType";
import { UnwrapPromise } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";

type OrganizationProfileTypeProps = UnwrapPromise<
  ReturnType<typeof OrganizationProfileType.getInitialProps>
>;

function OrganizationProfileType({ profileTypeId }: OrganizationProfileTypeProps) {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationProfileType_userDocument);

  const name = { en: "some porfile type", es: "algún tipo de perfil" };

  const showCreateOrEditProfileTypeDialog = useCreateOrEditProfileTypeDialog();
  const handleChangeProfileTypeName = async () => {
    try {
      const data = await showCreateOrEditProfileTypeDialog({ isEditing: true, name });
      console.log("handleChangeProfileTypeName data: ", data);
    } catch {}
  };

  const handleCloneProfileType = async () => {
    try {
      const data = await showCreateOrEditProfileTypeDialog({ isEditing: false, name });
      console.log("handleCloneProfileType data: ", data);
    } catch {}
  };

  const deleteProfileType = useDeleteProfileType();
  const handleDeleteProfileType = async () => {
    try {
      await deleteProfileType({
        profileTypes: [
          {
            id: "12313",
            name: "some Profile Type",
          },
        ],
      });
    } catch {}
  };

  return (
    <OrganizationSettingsLayout
      title={localizableUserTextRender({
        value: name,
        intl,
        default: intl.formatMessage({
          id: "generic.unnamed-profile-type",
          defaultMessage: "Unnamed profile type",
        }),
      })}
      basePath="/app/organization/profiles/types"
      me={me}
      realMe={realMe}
      header={
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <HStack paddingRight={2}>
            <Heading as="h3" size="md" noOfLines={1} wordBreak="break-all">
              <LocalizableUserTextRender
                value={name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                })}
              />
            </Heading>
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "view.group.edit-name",
                defaultMessage: "Edit name",
              })}
              size="sm"
              variant="ghost"
              icon={<EditSimpleIcon />}
              onClick={handleChangeProfileTypeName}
            />
          </HStack>
          <WhenOrgRole role="ADMIN">
            <MoreOptionsMenuButton
              variant="outline"
              options={
                <MenuList>
                  <MenuItem
                    onClick={handleCloneProfileType}
                    icon={<CopyIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.profile-type-header.clone-label"
                      defaultMessage="Clone profile type"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    color="red.500"
                    onClick={handleDeleteProfileType}
                    icon={<DeleteIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.profile-type-header.delete-label"
                      defaultMessage="Delete profile type"
                    />
                  </MenuItem>
                </MenuList>
              }
            />
          </WhenOrgRole>
        </Flex>
      }
      showBackButton={true}
    ></OrganizationSettingsLayout>
  );
}

const _queries = [
  gql`
    query OrganizationProfileType_user {
      ...OrganizationSettingsLayout_Query
    }
    ${OrganizationSettingsLayout.fragments.Query}
  `,
];

OrganizationProfileType.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const profileTypeId = query.profileTypeId as string;
  await Promise.all([fetchQuery(OrganizationProfileType_userDocument)]);
  return { profileTypeId };
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/organization"),
  withApolloData
)(OrganizationProfileType);

import { gql } from "@apollo/client";
import { SidebarLayout, SidebarLayoutProps } from "@parallel/components/layout/SidebarLayout";
import { UserSettingsLayout_QueryFragment } from "@parallel/graphql/__types";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { FormattedMessage } from "react-intl";

export interface UserSettingsLayoutProps
  extends Omit<SidebarLayoutProps, "basePath" | "sectionsHeader" | "sections"> {
  me: UserSettingsLayout_QueryFragment["me"];
  basePath?: string;
}

export function UserSettingsLayout({ me, children, basePath, ...props }: UserSettingsLayoutProps) {
  const sections = useSettingsSections(me);

  return (
    <SidebarLayout
      {...props}
      basePath={basePath ?? "/app/settings"}
      sectionsHeader={<FormattedMessage id="settings.title" defaultMessage="Settings" />}
      sections={sections}
      me={me}
    >
      {children}
    </SidebarLayout>
  );
}

UserSettingsLayout.fragments = {
  Query: gql`
    fragment UserSettingsLayout_Query on Query {
      ...SidebarLayout_Query
      me {
        id
        ...useSettingsSections_User
      }
    }
    ${SidebarLayout.fragments.Query}
    ${useSettingsSections.fragments.User}
  `,
};

import { gql } from "@apollo/client";
import { SettingsTabsInnerLayout } from "@parallel/components/layout/SettingsTabsInnerLayout";
import { DevelopersLayout_QueryFragment } from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { UserSettingsLayout } from "./UserSettingsLayout";

type DevelopersSection = "subscriptions" | "tokens";

interface DevelopersLayoutProps extends DevelopersLayout_QueryFragment {
  currentTabKey: DevelopersSection;
  children: ReactNode;
}

export function DevelopersLayout({ currentTabKey, me, realMe, children }: DevelopersLayoutProps) {
  const intl = useIntl();
  const tabs = useMemo(
    () => [
      {
        key: "subscriptions" as const,
        title: intl.formatMessage({
          id: "component.developers-layout.subscriptions",
          defaultMessage: "Subscriptions",
        }),
        href: "/app/settings/developers",
      },
      {
        key: "tokens" as const,
        title: intl.formatMessage({
          id: "component.developers-layout.tokens",
          defaultMessage: "Tokens",
        }),
        href: "/app/settings/developers/tokens",
      },
    ],
    [intl.locale],
  );
  const currentTab = tabs.find((t) => t.key === currentTabKey)!;

  return (
    <UserSettingsLayout title={`${currentTab.title}`} me={me} realMe={realMe}>
      <SettingsTabsInnerLayout tabs={tabs} currentTabKey={currentTabKey}>
        {children}
      </SettingsTabsInnerLayout>
    </UserSettingsLayout>
  );
}

DevelopersLayout.fragments = {
  get Query() {
    return gql`
      fragment DevelopersLayout_Query on Query {
        ...UserSettingsLayout_Query
      }
      ${UserSettingsLayout.fragments.Query}
    `;
  },
};

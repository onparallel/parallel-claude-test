import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import { SidebarLayout, SidebarLayoutProps } from "@parallel/components/layout/SidebarLayout";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export interface UserSettingsLayoutProps
  extends Omit<SidebarLayoutProps, "basePath" | "sectionsHeader" | "sections" | "title"> {
  title?: string;
  basePath?: string;
}

export function UserSettingsLayout({
  children,
  basePath,
  isBase,
  header,
  title,
  queryObject,
  ...props
}: UserSettingsLayoutProps) {
  const intl = useIntl();
  const { me } = queryObject;
  const hasDeveloperPermissions = useHasPermission("INTEGRATIONS:CRUD_API");
  const sections = useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: "component.user-settings-layout.account-section",
          defaultMessage: "Account",
        }),
        path: "/app/settings/account",
      },
      {
        title: intl.formatMessage({
          id: "component.user-settings-layout.security-section",
          defaultMessage: "Security",
        }),
        path: "/app/settings/security",
      },
      ...(hasDeveloperPermissions
        ? [
            {
              title: intl.formatMessage({
                id: "component.user-settings-layout.developers-section",
                defaultMessage: "Developers",
              }),
              path: "/app/settings/developers",
            },
          ]
        : []),
    ],
    [me, intl.locale],
  );
  const { pathname } = useRouter();
  const currentSection = sections.find((s) => pathname.startsWith(s.path));

  return (
    <SidebarLayout
      basePath={basePath ?? "/app/settings"}
      sectionsHeader={
        <FormattedMessage
          id="component.user-settings-layout.page-title"
          defaultMessage="Settings"
        />
      }
      sections={sections}
      isBase={isBase}
      title={
        (title ?? isBase)
          ? intl.formatMessage({
              id: "component.user-settings-layout.page-title",
              defaultMessage: "Settings",
            })
          : currentSection!.title
      }
      header={
        (header ?? isBase) ? undefined : (
          <Heading as="h3" size="md">
            {currentSection?.title}
          </Heading>
        )
      }
      queryObject={queryObject}
      {...props}
    >
      {children}
    </SidebarLayout>
  );
}

const _fragments = {
  Query: gql`
    fragment UserSettingsLayout_Query on Query {
      ...SidebarLayout_Query
    }
  `,
};

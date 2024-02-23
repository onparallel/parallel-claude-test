import { Tab, TabList, TabPanel, TabPanels, Tabs, useSafeLayoutEffect } from "@chakra-ui/react";
import { Fragment, ReactNode, useRef } from "react";
import { NakedLink } from "../common/Link";

export interface TabDefinition<T extends string> {
  key: T;
  href?: string;
  title: string;
  isDisabled?: boolean;
  decorate?: (children: ReactNode) => ReactNode;
}

interface SettingsTabsInnerLayoutProps<T extends string> {
  currentTabKey: T;
  tabs: TabDefinition<T>[];
  children: ReactNode;
}

export function SettingsTabsInnerLayout<T extends string>({
  currentTabKey,
  tabs,
  children,
}: SettingsTabsInnerLayoutProps<T>) {
  const currentTabRef = useRef<HTMLAnchorElement>(null);
  useSafeLayoutEffect(() => {
    // trigger :focus-visible
    currentTabRef.current!.contentEditable = "true";
    currentTabRef.current!.focus();
    currentTabRef.current!.contentEditable = "false";
  }, [currentTabKey]);

  return (
    <Tabs
      variant="enclosed"
      index={tabs.findIndex((t) => t.key === currentTabKey)!}
      flex={1}
      display="flex"
      flexDirection="column"
      minHeight={0}
    >
      <TabList paddingLeft={6} background="white" paddingTop={2} marginBottom={0}>
        {tabs.map(({ key, title, href, isDisabled, decorate }) => {
          const tab = isDisabled ? (
            <Tab fontWeight="500" color="gray.400" cursor="not-allowed" isDisabled>
              {title}
            </Tab>
          ) : (
            <NakedLink href={href!}>
              <Tab
                ref={key === currentTabKey ? currentTabRef : undefined}
                as="a"
                fontWeight="500"
                _selected={{
                  backgroundColor: "gray.50",
                  borderColor: "gray.200",
                  borderBottom: "1px solid transparent",
                  color: "blue.600",
                }}
              >
                {title}
              </Tab>
            </NakedLink>
          );
          return <Fragment key={key}>{decorate ? decorate(tab) : tab}</Fragment>;
        })}
      </TabList>
      <TabPanels flex={1} display="flex" flexDirection="column" minHeight={0}>
        {tabs.map((t) => (
          <TabPanel
            padding={0}
            key={t.key}
            flex={1}
            display="flex"
            flexDirection="column"
            minHeight={0}
            overflow="auto"
          >
            {t.key === currentTabKey ? children : null}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}

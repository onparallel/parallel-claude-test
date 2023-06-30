import { Tab, TabList, TabPanel, TabPanels, Tabs, useSafeLayoutEffect } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useRef } from "react";
import { NakedLink } from "../common/Link";

export interface TabDefinition<T extends string> {
  key: T;
  href?: string;
  title: string;
  isDisabled?: boolean;
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
  const router = useRouter();
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
      onChange={(index) => {
        if (index >= 0 && !tabs[index].isDisabled) {
          router.push(tabs[index].href!);
        }
      }}
    >
      <TabList paddingLeft={6} background="white" paddingTop={2}>
        {tabs.map(({ key, title, href, isDisabled }) =>
          isDisabled ? (
            <Tab key={key} fontWeight="500" color="gray.400" cursor="not-allowed" isDisabled>
              {title}
            </Tab>
          ) : (
            <NakedLink key={key} href={href!}>
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
          )
        )}
      </TabList>
      <TabPanels>
        {tabs.map((t) => (
          <TabPanel padding={0} key={t.key} tabIndex={-1}>
            {t.key === currentTabKey ? children : null}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}

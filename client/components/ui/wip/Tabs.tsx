import {
  Tabs as ChakraTabs,
  Tab,
  TabList,
  TabListProps,
  TabPanel,
  TabPanelProps,
  TabPanels,
  TabPanelsProps,
  TabProps,
  TabsProps,
} from "@chakra-ui/react";
import { RefAttributes } from "react";

// Docs: https://chakra-ui.com/docs/components/tabs

// v3 API only - no v2 compatibility
export interface ExtendedTabsProps extends Omit<TabsProps, "isManual" | "isLazy"> {
  defaultIndex?: TabsProps["defaultIndex"];
  manual?: boolean;
  lazy?: boolean;
}

// Tabs.Root component
export function TabsRoot({
  manual,
  lazy,
  ref,
  ...props
}: ExtendedTabsProps & RefAttributes<HTMLDivElement>) {
  return <ChakraTabs ref={ref} isManual={manual} isLazy={lazy} {...props} />;
}

// Tabs.List component
export function TabsList({ ref, ...props }: TabListProps & RefAttributes<HTMLDivElement>) {
  return <TabList ref={ref} {...props} />;
}

// Tabs.Tab component
export function TabsTab({ ref, ...props }: TabProps & RefAttributes<HTMLButtonElement>) {
  return <Tab ref={ref} {...props} />;
}

// Tabs.Panels component
export function TabsPanels({ ref, ...props }: TabPanelsProps & RefAttributes<HTMLDivElement>) {
  return <TabPanels ref={ref} {...props} />;
}

// Tabs.Panel component
export function TabsPanel({ ref, ...props }: TabPanelProps & RefAttributes<HTMLDivElement>) {
  return <TabPanel ref={ref} {...props} />;
}

// Namespace to use as Tabs.XXX
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Panels: TabsPanels,
  Panel: TabsPanel,
};

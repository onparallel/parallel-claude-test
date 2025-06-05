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
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/tabs

// v3 API only - no v2 compatibility
export interface ExtendedTabsProps extends Omit<TabsProps, "isManual" | "isLazy"> {
  defaultIndex?: TabsProps["defaultIndex"];
  manual?: boolean;
  lazy?: boolean;
}

// Tabs.Root component
export const TabsRoot = forwardRef<HTMLDivElement, ExtendedTabsProps>(
  ({ manual, lazy, ...props }, ref) => {
    return <ChakraTabs ref={ref} isManual={manual} isLazy={lazy} {...props} />;
  },
);

// Tabs.List component
export const TabsList = forwardRef<HTMLDivElement, TabListProps>((props, ref) => {
  return <TabList ref={ref} {...props} />;
});

// Tabs.Tab component
export const TabsTab = forwardRef<HTMLButtonElement, TabProps>((props, ref) => {
  return <Tab ref={ref} {...props} />;
});

// Tabs.Panels component
export const TabsPanels = forwardRef<HTMLDivElement, TabPanelsProps>((props, ref) => {
  return <TabPanels ref={ref} {...props} />;
});

// Tabs.Panel component
export const TabsPanel = forwardRef<HTMLDivElement, TabPanelProps>((props, ref) => {
  return <TabPanel ref={ref} {...props} />;
});

// Namespace to use as Tabs.XXX
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Panels: TabsPanels,
  Panel: TabsPanel,
};

// Assign display names for debugging
TabsRoot.displayName = "Tabs.Root";
TabsList.displayName = "Tabs.List";
TabsTab.displayName = "Tabs.Tab";
TabsPanels.displayName = "Tabs.Panels";
TabsPanel.displayName = "Tabs.Panel";

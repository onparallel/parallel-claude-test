import { gql } from "@apollo/client";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Icon,
  Image,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { AddIcon, ArrowBackIcon, SettingsIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { Box, Button, HStack, Stack, Text } from "@parallel/components/ui";
import { DashboardModuleDrawer_DashboardModuleFragment } from "@parallel/graphql/__types";
import { RefObject, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleForm } from "./DashboardModuleForm";
import { useDashboardModuleCategories, useDashboardModules } from "./hooks/useDashboardModules";

interface DashboardModuleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  finalFocusRef: RefObject<HTMLElement | null>;
  dashboardId: string;
  module: DashboardModuleDrawer_DashboardModuleFragment | null;
}

export function DashboardModuleDrawer({
  isOpen,
  onClose,
  finalFocusRef,
  dashboardId,
  module,
}: DashboardModuleDrawerProps) {
  const intl = useIntl();
  const modules = useDashboardModules();
  const categories = useDashboardModuleCategories();
  const [selectedModuleType, setSelectedModuleType] = useState(module?.__typename ?? null);
  const selectedModule = selectedModuleType
    ? modules.find((m) => m.type === selectedModuleType)!
    : null;
  const selectedCategory =
    selectedModule && categories.find((c) => c.category === selectedModule.category)!;
  const isUpdating = selectedModuleType && isNonNullish(module);

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  const handleClose = () => {
    setSelectedModuleType(null);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={handleClose}
      finalFocusRef={finalFocusRef}
      size="sm"
      closeOnOverlayClick={false}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton top={4} onClick={onClose} />
        <DrawerHeader
          paddingX={4}
          paddingY={0}
          minHeight="68px"
          display="flex"
          alignItems="center"
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          {selectedModule ? (
            isUpdating ? (
              <HStack paddingY={2}>
                <SettingsIcon marginEnd={2} />
                <Stack gap={0}>
                  <Box>{selectedModule.name}</Box>
                  <Box color="gray.500" fontSize="sm" fontWeight={500}>
                    {selectedCategory!.name}
                  </Box>
                </Stack>
              </HStack>
            ) : (
              <HStack>
                <IconButtonWithTooltip
                  variant="ghost"
                  size="sm"
                  icon={<ArrowBackIcon boxSize={4} />}
                  label={intl.formatMessage({ id: "generic.go-back", defaultMessage: "Go back" })}
                  onClick={() => setSelectedModuleType(null)}
                />

                <FormattedMessage id="page.home.add-module" defaultMessage="Add module" />
              </HStack>
            )
          ) : (
            <FormattedMessage id="page.home.add-module" defaultMessage="Add module" />
          )}
        </DrawerHeader>
        {selectedModuleType ? (
          <DashboardModuleForm
            module={module}
            onBack={() => setSelectedModuleType(null)}
            onClose={handleClose}
            moduleType={selectedModuleType}
            dashboardId={dashboardId}
          />
        ) : (
          <DrawerBody padding={0} overflow="hidden">
            <Tabs {...extendFlexColumn} height="100%">
              <TabList>
                {categories.map((category) => {
                  return (
                    <Tab paddingY={3} key={category.category}>
                      <Stack align="center" gap={1}>
                        <Icon as={category.icon} boxSize={5} />
                        <Box textTransform="uppercase" fontSize="xs" fontWeight={500}>
                          {category.name}
                        </Box>
                      </Stack>
                    </Tab>
                  );
                })}
              </TabList>
              <TabPanels {...extendFlexColumn}>
                {categories.map((category) => {
                  return (
                    <TabPanel
                      key={category.category}
                      as={ScrollShadows}
                      {...extendFlexColumn}
                      overflow="auto"
                    >
                      <Stack gap={3}>
                        {modules
                          .filter((module) => module.category === category.category)
                          .map((module) => {
                            return (
                              <Stack
                                key={module.type}
                                padding={4}
                                gap={3}
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                              >
                                <HStack justify="space-between">
                                  <Text fontWeight={600} fontSize="lg">
                                    {module.name}
                                  </Text>
                                  <Button
                                    leftIcon={<AddIcon />}
                                    onClick={() => setSelectedModuleType(module.type)}
                                    size="sm"
                                    fontSize="md"
                                    fontWeight={500}
                                  >
                                    <FormattedMessage id="generic.add" defaultMessage="Add" />
                                  </Button>
                                </HStack>
                                <Image
                                  pointerEvents="none"
                                  alt={module.name}
                                  src={module.imageUrl}
                                  width="100%"
                                />
                              </Stack>
                            );
                          })}
                      </Stack>
                    </TabPanel>
                  );
                })}
              </TabPanels>
            </Tabs>
          </DrawerBody>
        )}
      </DrawerContent>
    </Drawer>
  );
}

const _fragments = {
  DashboardModule: gql`
    fragment DashboardModuleDrawer_DashboardModule on DashboardModule {
      ...DashboardModuleForm_DashboardModule
    }
  `,
};

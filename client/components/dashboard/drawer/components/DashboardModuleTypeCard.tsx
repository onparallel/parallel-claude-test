import { Button, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
import { ModuleCategory } from "../DashboardModuleDrawer";

interface DashboardModuleTypeCardProps {
  onAdd: () => void;
  module: {
    name: string;
    category: ModuleCategory;
  };
}

export function DashboardModuleTypeCard({ module, onAdd }: DashboardModuleTypeCardProps) {
  return (
    <Stack padding={4} spacing={3} border="1px solid" borderColor="gray.200" borderRadius="md">
      <HStack justify="space-between">
        <Text fontWeight={600} fontSize="lg">
          {module.name}
        </Text>
        <Button leftIcon={<AddIcon />} onClick={onAdd} size="sm" fontSize="md" fontWeight={500}>
          <FormattedMessage id="generic.add" defaultMessage="Add" />
        </Button>
      </HStack>
      <Image
        pointerEvents="none"
        alt={module.name}
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/modules/${module.category}_MODULE.png`}
        width="100%"
      />
    </Stack>
  );
}

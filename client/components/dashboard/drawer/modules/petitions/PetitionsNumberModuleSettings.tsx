import { FormattedMessage } from "react-intl";
import { PetitionsModuleFilterEditor } from "../../components/PetitionsModuleFilterEditor";
import { Text } from "@parallel/components/ui";

export function PetitionsNumberModuleSettings({ isUpdating }: { isUpdating?: boolean }) {
  return (
    <>
      <Text textTransform="uppercase" color="gray.600" fontSize="sm" fontWeight={500}>
        <FormattedMessage id="generic.dashboard-module-filters" defaultMessage="Filters" />:
      </Text>
      <PetitionsModuleFilterEditor field="settings.filters.0" isUpdating={isUpdating} />
    </>
  );
}

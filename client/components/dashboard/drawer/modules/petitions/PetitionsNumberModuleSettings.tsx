import { Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { FormattedMessage } from "react-intl";
import { PetitionsFiltersModuleSettings } from "./PetitionsFiltersModuleSettings";

export function PetitionsNumberModuleSettings() {
  return (
    <>
      <Divider />
      <Text fontWeight={600}>
        <FormattedMessage id="component.dashboard-module-form.filters" defaultMessage="Filters" />:
      </Text>
      <PetitionsFiltersModuleSettings />
    </>
  );
}

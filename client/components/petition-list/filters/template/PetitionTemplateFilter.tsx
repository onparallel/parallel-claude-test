import { Box } from "@chakra-ui/react";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { TableColumnFilterProps } from "@parallel/components/common/Table";

export function PetitionTemplateFilter({ value, onChange }: TableColumnFilterProps<string[]>) {
  return (
    <Box padding={2} maxWidth="520px">
      <PetitionSelect
        isMulti
        usePortal={false}
        size="sm"
        defaultOptions
        type="TEMPLATE"
        value={value ?? []}
        onChange={(v) => {
          const templateIds = v?.map((p) => p.id) ?? [];
          onChange(templateIds);
        }}
      />
    </Box>
  );
}

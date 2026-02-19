import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { TableColumnFilterProps } from "@parallel/components/common/Table";
import { Stack } from "@parallel/components/ui";

export function PetitionTemplateFilter({
  value,
  onChange,
}: TableColumnFilterProps<any, any, string[]>) {
  return (
    <Stack width="240px">
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
        noOfLines={2}
      />
    </Stack>
  );
}

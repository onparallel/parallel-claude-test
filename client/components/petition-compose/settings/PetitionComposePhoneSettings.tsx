import { Stack } from "@chakra-ui/react";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useState } from "react";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRowPlaceholder } from "./SettingsRowPlaceholder";

export function PhoneSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["PHONE"];
  const [placeholder, setPlaceholder] = useState(options.placeholder ?? "");

  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 100, [field.id]);

  const handlePlaceholderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPlaceholder(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        placeholder: value || null,
      },
    });
  };

  return (
    <Stack spacing={4}>
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
        isReadOnly={isReadOnly}
      />
    </Stack>
  );
}

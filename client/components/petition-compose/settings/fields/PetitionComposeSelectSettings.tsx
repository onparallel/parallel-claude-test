import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { ImportOptionsSettingsRow } from "../rows/ImportOptionsSettingsRow";

export function PetitionComposeSelectSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "petition" | "field" | "onFieldEdit" | "isReadOnly">) {
  const handleFieldEdit = (data: UpdatePetitionFieldInput) => {
    onFieldEdit(field.id, data);
  };
  return (
    <>
      <ImportOptionsSettingsRow field={field} onChange={handleFieldEdit} isDisabled={isReadOnly} />
    </>
  );
}

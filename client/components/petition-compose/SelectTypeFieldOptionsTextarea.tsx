import { gql } from "@apollo/client";
import { TextareaProps } from "@chakra-ui/core";
import {
  UpdatePetitionFieldInput,
  SelectTypeFieldOptionsTextarea_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useRef, useState } from "react";
import { useIntl } from "react-intl";
import { GrowingTextarea } from "../common/GrowingTextarea";

type SelectTypeFieldOptionsTextareaProps = {
  field: SelectTypeFieldOptionsTextarea_PetitionFieldFragment;
  showError: boolean;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
} & TextareaProps;

export function SelectTypeFieldOptionsTextarea({
  field,
  showError,
  onFieldEdit,
  ...props
}: SelectTypeFieldOptionsTextareaProps) {
  const intl = useIntl();

  const [options, setOptions] = useState<string[]>(field.options?.values ?? []);
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <GrowingTextarea
      id={`field-select-options-${field.id}`}
      ref={ref}
      placeholder={intl.formatMessage(
        {
          id: "petition-field.select.options-placeholder",
          defaultMessage: "- Option 1<br></br>- Option 2",
        },
        { br: () => `\n` }
      )}
      _placeholder={{
        color: showError && options.length < 2 ? "red.500" : "placeholder",
      }}
      fontSize="sm"
      color={showError && options.length < 2 ? "red.500" : "none"}
      background="transparent"
      border="none"
      height="20px"
      paddingX={2}
      paddingY={0}
      minHeight={0}
      rows={1}
      _focus={{
        boxShadow: "none",
      }}
      value={options.join("\n")}
      onChange={(event) => {
        setOptions(event.target.value.split("\n"));
      }}
      onBlur={() => {
        const curedOptions = options
          .filter((o) => o !== "")
          .map((o) => o.trim());
        setNativeValue(ref.current!, curedOptions.join("\n"));
        onFieldEdit({ options: { values: curedOptions } });
      }}
      {...props}
    />
  );
}

SelectTypeFieldOptionsTextarea.fragments = {
  PetitionField: gql`
    fragment SelectTypeFieldOptionsTextarea_PetitionField on PetitionField {
      id
      options
    }
  `,
};

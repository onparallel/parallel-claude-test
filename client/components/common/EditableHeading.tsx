import {
  Editable,
  EditableInput,
  EditablePreview,
  Heading,
  Text,
  useEditableControls,
} from "@chakra-ui/react";
import { EditSimpleIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";

const EditableControls = ({ ...props }) => {
  const { isEditing, getEditButtonProps } = useEditableControls();

  return isEditing ? null : (
    <IconButtonWithTooltip
      label={props.label}
      size="sm"
      icon={<EditSimpleIcon />}
      {...getEditButtonProps()}
      {...props}
    />
  );
};

interface EditableHeadingProps extends ValueProps<string, false> {
  isDisabled?: boolean;
  maxLength?: number;
}

export function EditableHeading({ isDisabled, value, maxLength, onChange }: EditableHeadingProps) {
  const intl = useIntl();
  const [name, setName] = useState(value);
  const [inputWidth, setInputWidth] = useState(0);
  const previewRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(value);
    setInputWidth(previewRef?.current?.offsetWidth ?? 0);
  }, [value]);

  return (
    <Heading as="h3" size="md">
      {isDisabled ? (
        <Text as="span" paddingX={2} paddingY={1}>
          {name}
        </Text>
      ) : (
        <Editable
          value={name}
          onChange={setName}
          onSubmit={onChange}
          display="flex"
          alignItems="center"
          submitOnBlur
        >
          <EditablePreview
            paddingY={1}
            paddingX={1.5}
            ref={previewRef}
            borderRadius="md"
            borderWidth="2px"
            borderColor="transparent"
            transitionProperty="border"
            transitionDuration="normal"
            _hover={{
              borderColor: "gray.300",
            }}
            noOfLines={1}
            wordBreak="break-all"
            maxWidth={655}
          />

          <EditableInput
            paddingY={1}
            paddingX={2}
            minWidth={255}
            width={inputWidth}
            maxLength={maxLength}
          />
          <EditableControls
            marginLeft={1}
            background={"white"}
            color={"gray.400"}
            fontSize={18}
            _hover={{ backgroundColor: "white", color: "gray.600" }}
            label={intl.formatMessage({
              id: "generic.edit-name",
              defaultMessage: "Edit name",
            })}
          />
        </Editable>
      )}
    </Heading>
  );
}

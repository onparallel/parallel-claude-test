import {
  FormControl,
  FormControlProps,
  FormErrorMessage,
  FormErrorMessageProps,
  FormHelperText,
  FormHelperTextProps,
  FormLabel,
  FormLabelProps,
} from "@chakra-ui/react";
import { Box, BoxProps } from "@parallel/components/ui";
import { RefAttributes } from "react";

// Docs: https://chakra-ui.com/docs/components/field

// v3 API only - no v2 compatibility
export interface ExtendedFormControlProps
  extends Omit<FormControlProps, "isInvalid" | "isRequired" | "isDisabled"> {
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
}

// Field.Root wrapper
export function FieldRoot({
  invalid,
  required,
  disabled,
  ref,
  ...props
}: ExtendedFormControlProps & RefAttributes<HTMLDivElement>) {
  return (
    <FormControl
      ref={ref}
      isInvalid={invalid}
      isRequired={required}
      isDisabled={disabled}
      {...props}
    />
  );
}

// Field.Label wrapper
export function FieldLabelWrapper({
  as,
  width,
  height,
  textAlign,
  color,
  bg,
  ref,
  ...props
}: FormLabelProps & BoxProps & RefAttributes<HTMLLabelElement>) {
  // In v2: styles are applied directly
  // In v3: we need to wrap with a Box to maintain compatibility
  const styleProps = { width, height, textAlign, color, bg };
  const hasStyleProps = Object.values(styleProps).some((value) => value !== undefined);

  if (hasStyleProps) {
    return (
      <Box as="span" {...styleProps}>
        <FormLabel ref={ref} {...props} />
      </Box>
    );
  }

  return <FormLabel ref={ref} {...props} />;
}

// Field.ErrorText wrapper
export function FieldErrorText({
  ref,
  ...props
}: FormErrorMessageProps & RefAttributes<HTMLDivElement>) {
  return <FormErrorMessage ref={ref} {...props} />;
}

// Field.HelperText wrapper
export function FieldHelperTextWrapper({
  ref,
  ...props
}: FormHelperTextProps & RefAttributes<HTMLDivElement>) {
  return <FormHelperText ref={ref} {...props} />;
}

// Namespace to use as Field.Root, Field.Label, etc.
export const Field = {
  Root: FieldRoot,
  Label: FieldLabelWrapper,
  ErrorText: FieldErrorText,
  HelperText: FieldHelperTextWrapper,
};

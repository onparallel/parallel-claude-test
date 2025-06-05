import {
  Box,
  BoxProps,
  FormControl,
  FormControlProps,
  FormErrorMessage,
  FormErrorMessageProps,
  FormHelperText,
  FormHelperTextProps,
  FormLabel,
  FormLabelProps,
} from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/field

// v3 API only - no v2 compatibility
export interface ExtendedFormControlProps
  extends Omit<FormControlProps, "isInvalid" | "isRequired" | "isDisabled"> {
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
}

// Field.Root wrapper
export const FieldRoot = forwardRef<HTMLDivElement, ExtendedFormControlProps>(
  ({ invalid, required, disabled, ...props }, ref) => {
    return (
      <FormControl
        ref={ref}
        isInvalid={invalid}
        isRequired={required}
        isDisabled={disabled}
        {...props}
      />
    );
  },
);

// Field.Label wrapper
export const FieldLabelWrapper = forwardRef<HTMLLabelElement, FormLabelProps & BoxProps>(
  ({ as, width, height, textAlign, color, bg, ...props }, ref) => {
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
  },
);

// Field.ErrorText wrapper
export const FieldErrorText = forwardRef<HTMLDivElement, FormErrorMessageProps>((props, ref) => {
  return <FormErrorMessage ref={ref} {...props} />;
});

// Field.HelperText wrapper
export const FieldHelperTextWrapper = forwardRef<HTMLDivElement, FormHelperTextProps>(
  (props, ref) => {
    return <FormHelperText ref={ref} {...props} />;
  },
);

// Namespace to use as Field.Root, Field.Label, etc.
export const Field = {
  Root: FieldRoot,
  Label: FieldLabelWrapper,
  ErrorText: FieldErrorText,
  HelperText: FieldHelperTextWrapper,
};

FieldRoot.displayName = "Field.Root";
FieldLabelWrapper.displayName = "Field.Label";
FieldErrorText.displayName = "Field.ErrorText";
FieldHelperTextWrapper.displayName = "Field.HelperText";

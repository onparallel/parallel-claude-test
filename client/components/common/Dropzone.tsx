import { Box, useFormControl } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { generateCssStripe } from "@parallel/utils/css";
import { InputHTMLAttributes, ReactNode, useImperativeHandle } from "react";
import { DropzoneOptions, DropzoneRef, DropzoneState, useDropzone } from "react-dropzone";
import { pick } from "remeda";

export interface DropzoneProps
  extends DropzoneOptions,
    Pick<InputHTMLAttributes<HTMLInputElement>, "required" | "readOnly"> {
  children?:
    | ReactNode
    | ((state: Omit<DropzoneState, "open" | "getRootProps" | "getInputProps">) => ReactNode);
}

export const Dropzone = chakraForwardRef<"div", DropzoneProps, DropzoneRef>(function (props, ref) {
  const {
    accept,
    minSize,
    maxSize,
    maxFiles,
    multiple = false,
    preventDropOnDocument,
    noClick,
    noKeyboard,
    noDrag,
    noDragEventsBubbling,
    onDrop,
    onDropAccepted,
    onDropRejected,
    getFilesFromEvent,
    onFileDialogCancel,
    validator,
    children,
    ...other
  } = props;
  const inputProps = useFormControl(
    pick(props, ["id", "onFocus", "onBlur", "disabled", "readOnly", "required"])
  );
  const dropZoneOptions = {
    accept,
    minSize,
    maxSize,
    maxFiles,
    preventDropOnDocument,
    noClick,
    noKeyboard,
    noDrag,
    noDragEventsBubbling,
    disabled: inputProps.disabled,
    onDrop,
    onDropAccepted,
    onDropRejected,
    getFilesFromEvent,
    onFileDialogCancel,
    validator,
    multiple,
  };
  // delete undefined props to avoid overriding react-dropzone defaults
  for (const [key, value] of Object.entries(dropZoneOptions)) {
    if (value === undefined) {
      delete dropZoneOptions[key as keyof typeof dropZoneOptions];
    }
  }
  const { open, getRootProps, getInputProps, ...state } = useDropzone(dropZoneOptions);
  useImperativeHandle(ref, () => ({ open }), [open]);
  return (
    <Box
      color={state.isDragActive ? (state.isDragReject ? "red.500" : "gray.600") : "gray.500"}
      border="2px dashed"
      borderRadius="md"
      borderColor={state.isDragActive ? (state.isDragReject ? "red.500" : "gray.400") : "gray.200"}
      padding={4}
      {...(inputProps.disabled
        ? {
            opacity: 0.4,
            cursor: "not-allowed",
          }
        : { cursor: "pointer" })}
      sx={
        state.isDragActive
          ? generateCssStripe({
              size: "1rem",
              color: state.isDragReject ? "red.50" : "gray.50",
            })
          : {}
      }
      {...other}
      {...(getRootProps() as any)}
    >
      <input {...inputProps} {...getInputProps()} />
      {typeof children === "function" ? (children as any)(state) : children}
    </Box>
  );
});

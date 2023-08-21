import { Box, Center, Text, useFormControl, useMultiStyleConfig } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ValueProps } from "@parallel/utils/ValueProps";
import {
  ELEMENT_PLACEHOLDER_INPUT,
  PlaceholderCombobox,
  PlaceholderElement,
  PlaceholderInputElement,
  PlaceholderOption,
  PlaceholdersProvider,
  createPlaceholderPlugin,
} from "@parallel/utils/slate/PlaceholderPlugin";
import { createSingleLinePlugin } from "@parallel/utils/slate/SingleLinePlugin";
import {
  slateNodesToTextWithPlaceholders,
  textWithPlaceholderToSlateNodes,
} from "@parallel/utils/slate/textWithPlaceholder";
import { CustomEditor, SlateElement, SlateText } from "@parallel/utils/slate/types";
import { useConstant } from "@parallel/utils/useConstant";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { createComboboxPlugin } from "@udecode/plate-combobox";
import {
  PlatePluginComponent,
  PlateProvider,
  createHistoryPlugin,
  createPlugins,
  createReactPlugin,
  focusEditor,
  getEndPoint,
  withProps,
} from "@udecode/plate-common";
import { ELEMENT_MENTION_INPUT } from "@udecode/plate-mention";
import { ELEMENT_PARAGRAPH, createParagraphPlugin } from "@udecode/plate-paragraph";
import { useImperativeHandle, useMemo, useRef } from "react";
import { omit, pick } from "remeda";
import { Editor, Transforms } from "slate";
import { EditableProps } from "slate-react/dist/components/editable";
import { PlateWithEditorRef } from "./PlateWithEditorRef";
import { ToolbarPlaceholderButton } from "./ToolbarPlaceholderButton";

export type PlaceholderInputValue = [PlaceholderInputBlock];

interface PlaceholderInputBlock extends SlateElement<"paragraph", PlaceholderInputBlockContent> {}

type PlaceholderInputBlockContent = SlateText | PlaceholderElement | PlaceholderInputElement;

type PlaceholderInputEditor = CustomEditor<PlaceholderInputValue>;

export interface PlaceholderInputProps
  extends ValueProps<string, false>,
    Omit<EditableProps, "value" | "onChange"> {
  placeholders: PlaceholderOption[];
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
}

export interface PlaceholderInputInstance {
  focus: () => void;
  clear(): void;
}

const components = {
  [ELEMENT_PARAGRAPH]: withProps(RenderElement, { as: "p" }),
} as Record<string, PlatePluginComponent>;

function RenderElement({ attributes, nodeProps, styles, element, editor, ...props }: any) {
  return <Text {...attributes} {...props} />;
}

export const PlaceholderInput = chakraForwardRef<
  "div",
  PlaceholderInputProps,
  PlaceholderInputInstance
>(
  (
    {
      id,
      placeholder,
      placeholders,
      value,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
      onChange,
      ...props
    },
    ref,
  ) => {
    const placeholdersRef = useUpdatingRef(placeholders);
    const plugins = useConstant(() =>
      createPlugins<PlaceholderInputValue, PlaceholderInputEditor>(
        [
          createReactPlugin(),
          createHistoryPlugin(),
          createParagraphPlugin(),
          createSingleLinePlugin(),
          createComboboxPlugin(),
          createPlaceholderPlugin({ placeholdersRef }),
        ],
        {
          components,
          overrideByKey: {
            [ELEMENT_PARAGRAPH]: { type: "paragraph" },
            [ELEMENT_MENTION_INPUT]: { type: ELEMENT_PLACEHOLDER_INPUT },
          },
        },
      ),
    );
    const formControl = useFormControl({
      id,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
    });
    const editorRef = useRef<PlaceholderInputEditor>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        focusEditor(editorRef.current!, getEndPoint(editorRef.current!, []));
      },
      clear: () => {
        const editor = editorRef.current! as any;
        Transforms.delete(editor, {
          at: {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
          },
        });
      },
    }));

    const initialValue = useMemo(
      () => textWithPlaceholderToSlateNodes(value, placeholders) as PlaceholderInputValue,
      [placeholders],
    );

    const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
    const inputStyles = {
      ...omit(inputStyleConfig as any, ["px", "_focusVisible", "bg"]),
      backgroundColor: "white",
      _focusWithin: (inputStyleConfig as any)._focusVisible,
    } as any;

    const editableProps = {
      readOnly: formControl.disabled,
      "aria-disabled": formControl.disabled,
      placeholder,
      "aria-multiline": undefined,
      disableDefaultStyles: true,
      ...props,
    };

    return (
      <PlateProvider<PlaceholderInputValue, PlaceholderInputEditor>
        id={formControl.id}
        plugins={plugins}
        initialValue={initialValue}
        onChange={(value) => onChange(slateNodesToTextWithPlaceholders(value, placeholders))}
      >
        <Box
          overflow="hidden"
          position="relative"
          aria-disabled={formControl.disabled}
          {...(pick(formControl, [
            "aria-invalid",
            "aria-required",
            "aria-readonly",
            "aria-describedby",
          ]) as any)}
          display="flex"
          sx={{
            ...inputStyles,
            "[data-slate-placeholder]": {
              top: "unset !important",
              width: "auto !important",
              opacity: "1 !important",
              color: "gray.400",
            },
            "[data-slate-editor]": {
              position: "relative",
              outline: "none",
              flex: 1,
              ...pick(inputStyleConfig, ["px"]),
              whiteSpace: "pre",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
            },
          }}
        >
          <PlaceholdersProvider placeholders={placeholders}>
            <PlateWithEditorRef<PlaceholderInputValue, PlaceholderInputEditor>
              id={formControl.id}
              editorRef={editorRef}
              editableProps={editableProps}
            >
              <PlaceholderCombobox placeholders={placeholders} />
            </PlateWithEditorRef>
          </PlaceholdersProvider>
          <Center paddingRight={1} height="full">
            <ToolbarPlaceholderButton
              isDisabled={formControl.disabled}
              variant="outline"
              size="sm"
            />
          </Center>
        </Box>
      </PlateProvider>
    );
  },
);

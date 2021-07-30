import {
  Box,
  BoxProps,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Portal,
  Stack,
  Text,
  useFormControl,
  useId,
  useMultiStyleConfig,
  usePopper,
} from "@chakra-ui/react";
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  SharpIcon,
  UnderlineIcon,
} from "@parallel/chakra/icons";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import {
  Placeholder,
  PlaceholderMenu,
  usePlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import {
  CustomEditor,
  CustomElement,
  LinkElement,
} from "@parallel/utils/slate/types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { createAutoformatPlugin } from "@udecode/plate-autoformat";
import {
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  DEFAULTS_BOLD,
  DEFAULTS_ITALIC,
  DEFAULTS_UNDERLINE,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
} from "@udecode/plate-basic-marks";
import {
  getAbove,
  getNode,
  getParent,
  insertNodes,
  isCollapsed,
  isMarkActive,
  someNode,
  toggleMark,
  withProps,
} from "@udecode/plate-common";
import {
  createHistoryPlugin,
  createReactPlugin,
  isElement,
  Plate,
  PlatePluginOptions,
  withPlate,
} from "@udecode/plate-core";
import {
  createLinkPlugin,
  ELEMENT_LINK,
  upsertLinkAtSelection,
} from "@udecode/plate-link";
import {
  createListPlugin,
  ELEMENT_LI,
  ELEMENT_LIC,
  ELEMENT_OL,
  ELEMENT_UL,
  toggleList,
  unwrapList,
} from "@udecode/plate-list";
import {
  createParagraphPlugin,
  ELEMENT_PARAGRAPH,
} from "@udecode/plate-paragraph";
import React, {
  CSSProperties,
  forwardRef,
  KeyboardEvent,
  memo,
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { omit, pick, pipe } from "remeda";
import { createEditor, Editor, Transforms } from "slate";
import { ReactEditor, useSlate } from "slate-react";
import { EditableProps } from "slate-react/dist/components/editable";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

function RenderElement({
  attributes,
  nodeProps,
  styles,
  element,
  ...props
}: any) {
  return <Text {...attributes} {...props} />;
}

function RenderLink({ attributes, nodeProps, styles, element, ...props }: any) {
  return (
    <Text
      as="a"
      cursor="text"
      target="_blank"
      href={element.url}
      color="purple.600"
      rel="noopener noreferrer"
      {...attributes}
      {...props}
    />
  );
}

const components = {
  [ELEMENT_PARAGRAPH]: withProps(RenderElement, { as: "p" }),
  [ELEMENT_OL]: withProps(RenderElement, { as: "ol", paddingInlineStart: 6 }),
  [ELEMENT_UL]: withProps(RenderElement, { as: "ul", paddingInlineStart: 6 }),
  [ELEMENT_LI]: withProps(RenderElement, { as: "li" }),
  [ELEMENT_LIC]: withProps(RenderElement, {}),
  [ELEMENT_LINK]: RenderLink,
  [MARK_BOLD]: withProps(RenderElement, { as: "strong" }),
  [MARK_ITALIC]: withProps(RenderElement, { as: "em" }),
  [MARK_UNDERLINE]: withProps(RenderElement, { as: "u" }),
};

const options = {
  [ELEMENT_PARAGRAPH]: { type: "paragraph" },
  [ELEMENT_OL]: { type: "numbered-list" },
  [ELEMENT_UL]: { type: "bulleted-list" },
  [ELEMENT_LI]: { type: "list-item" },
  [ELEMENT_LIC]: { type: "list-item-child" },
  [MARK_BOLD]: DEFAULTS_BOLD,
  [MARK_ITALIC]: DEFAULTS_ITALIC,
  [MARK_UNDERLINE]: DEFAULTS_UNDERLINE,
  [ELEMENT_LINK]: { type: "link" },
} as Record<string, PlatePluginOptions>;

export interface RichTextEditorProps
  extends ValueProps<RichTextEditorValue, false>,
    Omit<EditableProps, "value" | "onChange"> {
  // we need an id to pass it to the Plate element
  id: string;
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  placeholderOptions?: Placeholder[];
}

export type RichTextEditorValue = CustomElement[];

export interface RichTextEditorInstance {
  focus(): void;
}

export const RichTextEditor = forwardRef<
  RichTextEditorInstance,
  RichTextEditorProps
>(function RichTextEditor(
  {
    id,
    value,
    onChange,
    isDisabled,
    isInvalid,
    isRequired,
    isReadOnly,
    onKeyDown,
    placeholder,
    placeholderOptions = [],
    ...props
  },
  ref
) {
  const {
    plugin,
    onAddPlaceholder,
    onChangePlaceholder,
    onKeyDownPlaceholder,
    onHighlightOption,
    selectedIndex,
    search,
    target,
    values,
  } = usePlaceholderPlugin(placeholderOptions);
  const plugins = useMemo(
    () => [
      createReactPlugin(),
      createHistoryPlugin(),
      createParagraphPlugin(),
      createBoldPlugin(),
      createItalicPlugin(),
      createUnderlinePlugin(),
      createListPlugin(),
      createAutoformatPlugin({
        rules: [
          {
            type: "list-item" as any,
            markup: ["*", "-"],
            preFormat: (editor: CustomEditor) => unwrapList(editor),
            format: (editor: CustomEditor) => {
              if (editor.selection) {
                const parentEntry = getParent(editor, editor.selection);
                if (!parentEntry) return;
                const [node] = parentEntry;
                if (isElement(node)) {
                  toggleList(editor, { type: "bulleted-list" });
                }
              }
            },
          },
        ],
      }),
      plugin,
      createLinkPlugin(),
    ],
    [plugin]
  );
  const formControl = useFormControl({
    id,
    isDisabled,
    isInvalid,
    isRequired,
    isReadOnly,
  });
  const editor = useMemo<CustomEditor>(
    () => pipe(createEditor(), withPlate({ id, plugins, options, components })),
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        ReactEditor.focus(editor);
      },
    }),
    [editor]
  );

  const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
  const inputStyles = {
    ...omit(inputStyleConfig as any, [
      "px",
      "pl",
      "pr",
      "paddingX",
      "paddingRight",
      "paddingLeft",
      "paddingY",
      "h",
      "height",
      "_focus",
      "_invalid",
    ]),
    _focusWithin: (inputStyleConfig as any)._focus,
    _invalid: (inputStyleConfig as any)._invalid,
  } as any;
  const style = useMemo(
    () =>
      ({
        padding: "12px 16px",
        maxHeight: "250px",
        overflow: "auto",
      } as CSSProperties),
    []
  );

  const isMenuOpen = Boolean(target && values.length > 0);
  const selected = isMenuOpen ? values[selectedIndex] : undefined;

  const handleChange = useCallback(
    (value: CustomElement[]) => {
      onChangePlaceholder(editor);
      onChange(value);
    },
    [onChange, onChangePlaceholder]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDownPlaceholder(event, editor);
      onKeyDown?.(event);
    },
    [onKeyDown, onKeyDownPlaceholder, editor]
  );

  const placeholderMenuId = useId(undefined, "rte-placeholder-menu");
  const itemIdPrefix = useId(undefined, "rte-placeholder-menu-item");

  const { referenceRef, popperRef, forceUpdate } = usePopper({
    placement: "bottom-start",
    enabled: isMenuOpen,
  });
  useEffect(() => {
    if (isMenuOpen && target) {
      reposition();
      document.addEventListener("scroll", reposition, true);
      return () => document.removeEventListener("scroll", reposition, true);
    }
    function reposition() {
      /**
       * The main idea of this function is to place the placeholders menu next to the #.
       * This function gets the node of the piece of text where the anchor is.
       * This node will always be a span.
       * We create a "fake" paragraph and we insert the text of the node but:
       * - We insert a span with all the previous text before and including the #.
       * - We add a marginLeft to this span to ensure it overlaps the text in the real editor.
       * - We add an empty span which we will use as the needle to position the menu
       * We insert this fake paragraph and we compute the boundingClientRect of the second
       * children which we will use to create a popper virtual element.
       */
      const { path, offset } = target!.anchor;

      const node = ReactEditor.toDOMNode(editor, getNode(editor, path)!);
      const parentRect = (
        node.parentNode! as HTMLElement
      ).getBoundingClientRect();
      const fake = document.createElement("div");
      fake.style.visibility = "hidden";
      const prefix = document.createElement("span");
      const style = window.getComputedStyle(node.offsetParent!);
      prefix.style.marginLeft = `${
        node.offsetLeft - parseInt(style.paddingLeft)
      }px`;
      prefix.innerText = node.textContent!.slice(0, offset + 1);
      fake.appendChild(prefix);
      const _target = document.createElement("span");
      fake.appendChild(_target);
      fake.style.position = "fixed";
      fake.style.top = `${parentRect.top}px`;
      fake.style.left = `${parentRect.left}px`;
      fake.style.width = `${parentRect.width}px`;
      node.parentElement!.appendChild(fake);
      const rect = _target.getBoundingClientRect();
      node.parentElement!.removeChild(fake);
      referenceRef({ getBoundingClientRect: () => rect, contextElement: node });
      forceUpdate?.();
    }
  }, [isMenuOpen, target?.anchor.offset]);

  return (
    <Box
      role="application"
      {...pick(formControl, [
        "id",
        "aria-invalid",
        "aria-required",
        "aria-readonly",
        "aria-describedby",
      ])}
      overflow="hidden"
      aria-disabled={formControl.disabled}
      {...inputStyles}
    >
      <Plate
        id={id}
        editor={editor}
        plugins={plugins}
        options={options}
        components={components}
        value={value}
        onChange={handleChange}
        editableProps={{
          readOnly: isDisabled,
          placeholder,
          style,
          onKeyDown: handleKeyDown,
          "aria-controls": placeholderMenuId,
          "aria-autocomplete": "list",
          "aria-activedescendant": selected
            ? `${itemIdPrefix}-${selected.value}`
            : undefined,
          ...props,
        }}
        renderEditable={(editable) => (
          <Box
            sx={{
              '[contenteditable="false"]': {
                width: "auto !important",
              },
              "> div": {
                minHeight: "120px !important",
              },
            }}
          >
            {editable}
          </Box>
        )}
      >
        <Toolbar
          height="40px"
          isDisabled={formControl.disabled || formControl.readOnly}
          hasPlaceholders={placeholderOptions.length > 0}
        />
      </Plate>
      <Portal>
        <PlaceholderMenu
          ref={popperRef}
          menuId={placeholderMenuId}
          itemIdPrefix={itemIdPrefix}
          search={search}
          values={values}
          selectedIndex={selectedIndex}
          hidden={!isMenuOpen}
          onAddPlaceholder={(placeholder) =>
            onAddPlaceholder(editor, placeholder)
          }
          onHighlightOption={onHighlightOption}
          width="fit-content"
          position="relative"
          opacity={isMenuOpen ? 1 : 0}
        />
      </Portal>
    </Box>
  );
});

interface ToolbarProps extends BoxProps {
  isDisabled?: boolean;
  hasPlaceholders?: boolean;
}

const Toolbar = memo(function _Toolbar({
  isDisabled,
  hasPlaceholders,
  ...props
}: ToolbarProps) {
  const intl = useIntl();
  return (
    <Stack
      direction="row"
      {...props}
      borderBottom="1px solid"
      borderColor="gray.200"
      padding={1}
    >
      <MarkButton
        type="bold"
        icon={<BoldIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "component.rich-text-editor.bold",
          defaultMessage: "Bold",
        })}
      />
      <MarkButton
        type="italic"
        icon={<ItalicIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "component.rich-text-editor.italic",
          defaultMessage: "Italic",
        })}
      />
      <MarkButton
        type="underline"
        icon={<UnderlineIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "component.rich-text-editor.underline",
          defaultMessage: "Underline",
        })}
      />
      <ListButton
        type="bulleted-list"
        icon={<ListIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "component.rich-text-editor.list",
          defaultMessage: "Bullet list",
        })}
      />
      {hasPlaceholders ? <PlaceholderButton isDisabled={isDisabled} /> : null}
      <LinkButton isDisabled={isDisabled} />
    </Stack>
  );
});

interface ToolbarButtonProps {
  type: string;
  icon: ReactElement;
  label: string;
  isDisabled?: boolean;
}

function ListButton({ type, ...props }: ToolbarButtonProps) {
  const editor = useSlate();
  const isActive = someNode(editor, { match: { type } });
  return (
    <IconButtonWithTooltip
      size="sm"
      placement="bottom"
      variant={isActive ? "solid" : "ghost"}
      tabIndex={-1}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
        toggleList(editor as any, { type, ...options });
      }}
      {...props}
    />
  );
}

function MarkButton({ type, ...props }: ToolbarButtonProps) {
  const editor = useSlate();
  const isActive = isMarkActive(editor, type);
  return (
    <IconButtonWithTooltip
      size="sm"
      placement="bottom"
      variant={isActive ? "solid" : "ghost"}
      tabIndex={-1}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
        toggleMark(editor, type);
      }}
      {...props}
    />
  );
}

function PlaceholderButton(props: Pick<ToolbarButtonProps, "isDisabled">) {
  const editor = useSlate();
  const intl = useIntl();
  return (
    <IconButtonWithTooltip
      size="sm"
      placement="bottom"
      variant="ghost"
      tabIndex={-1}
      icon={<SharpIcon fontSize="16px" />}
      label={intl.formatMessage({
        id: "component.rich-text-editor.personalize",
        defaultMessage: "Personalize",
      })}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
        if (!editor.selection) {
          ReactEditor.focus(editor as any);
        }
        setTimeout(() => {
          Transforms.insertText(editor, "#", { at: editor.selection?.anchor });
        }, 0);
      }}
      {...props}
    />
  );
}

function LinkButton(props: Pick<ToolbarButtonProps, "isDisabled">) {
  const editor = useSlate();
  const intl = useIntl();
  const showAddLinkDialog = useAddLinkDialog();
  return (
    <IconButtonWithTooltip
      size="sm"
      placement="bottom"
      variant="ghost"
      icon={<LinkIcon />}
      tabIndex={-1}
      label={intl.formatMessage({
        id: "component.rich-text-editor.link",
        defaultMessage: "Link",
      })}
      onMouseDown={async (event) => {
        const selection = editor.selection;
        const endOfEditor = Editor.range(editor, Editor.end(editor, []));
        event.preventDefault();
        const linkNode = editor.selection
          ? getAbove(editor, {
              match: { type: "link" },
            })
          : null;
        let defaultValues: RTELink | undefined;
        if (linkNode) {
          const url = (linkNode[0] as LinkElement).url;
          const text = (linkNode[0] as LinkElement).children
            .map((c) => (c as any).text as string)
            .join("");
          defaultValues = { text, url };
        }
        const [_, link] = await withError(
          showAddLinkDialog({
            defaultValues,
            showTextInput: !linkNode && (!selection || isCollapsed(selection)),
          })
        );
        ReactEditor.focus(editor as any);
        Transforms.select(editor, selection ?? endOfEditor);
        if (!link) {
          return;
        }
        if (linkNode || (selection && !isCollapsed(selection))) {
          upsertLinkAtSelection(editor, { url: link.url, wrap: true });
        } else {
          const text = link.text || link.url;
          insertNodes(
            editor,
            {
              type: "link",
              url: link.url,
              children: [{ text }],
            },
            { at: selection ?? endOfEditor }
          );
          Transforms.move(editor, { distance: text.length });
        }
      }}
      {...props}
    />
  );
}

type RTELink = {
  url: string;
  text?: string;
};

function AddLinkDialog({
  showTextInput,
  defaultValues = {},
  ...props
}: DialogProps<
  { showTextInput: boolean; defaultValues?: Partial<RTELink> },
  RTELink
>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<RTELink>({
    defaultValues,
  });
  const urlRef = useRef<HTMLInputElement>(null);
  const urlProps = useRegisterWithRef(urlRef, register, "url", {
    required: true,
    validate: (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch (_) {
        return false;
      }
    },
  });
  return (
    <ConfirmDialog
      initialFocusRef={urlRef}
      content={
        {
          as: "form",
          onSubmit: handleSubmit((link) => props.onResolve(link)),
          noValidate: true,
        } as any
      }
      {...props}
      header={
        <FormattedMessage
          id="component.rich-text-editor.add-link-header"
          defaultMessage="Add link"
        />
      }
      body={
        <Stack>
          <FormControl id="url" isInvalid={!!errors.url}>
            <FormLabel>
              <FormattedMessage
                id="component.rich-text-editor.add-link-url"
                defaultMessage="URL link"
              />
            </FormLabel>
            <Input type="url" {...urlProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="component.rich-text-editor.add-link-required-url"
                defaultMessage="A valid link is required"
              />
            </FormErrorMessage>
          </FormControl>
          {showTextInput ? (
            <FormControl id="text">
              <FormLabel>
                <FormattedMessage
                  id="component.rich-text-editor.add-link-text-to-show"
                  defaultMessage="Text to show (optional)"
                />
              </FormLabel>
              <Input {...register("text")} />
            </FormControl>
          ) : null}
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple">
          <FormattedMessage id="generic.done" defaultMessage="Done" />
        </Button>
      }
    />
  );
}

function useAddLinkDialog() {
  return useDialog(AddLinkDialog);
}

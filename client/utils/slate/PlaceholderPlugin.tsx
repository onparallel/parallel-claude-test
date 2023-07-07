import { gql } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import {
  ComboboxItemProps,
  ComboboxProps,
  PlateCombobox,
} from "@parallel/components/common/slate/PlateCombobox";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  createPlaceholderPlugin_PetitionBaseFragment,
  createPlaceholderPlugin_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { TComboboxItem } from "@udecode/plate-combobox";
import {
  PlateEditor,
  TRenderElementProps,
  Value,
  getEditorString,
  getPluginOptions,
  getPointAfter,
  getPointBefore,
  getRange,
  insertNodes,
  usePlateEditorRef,
} from "@udecode/plate-common";
import {
  ELEMENT_MENTION_INPUT,
  MentionPlugin,
  createMentionPlugin,
  getMentionOnSelectItem,
  isSelectionInMentionInput,
  withMention,
} from "@udecode/plate-mention";
import { ReactNode, RefObject, createContext, useCallback, useContext } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { Node } from "slate";
import { useFocused, useSelected } from "slate-react";
import { usePetitionFieldTypeColor } from "../petitionFields";
import { parseTextWithPlaceholders } from "./textWithPlaceholder";
import { SlateElement, SlateText } from "./types";

type ComboboxItemData =
  | undefined
  | { group: string }
  | {
      group: string;
      field: createPlaceholderPlugin_PetitionFieldFragment;
      petition: createPlaceholderPlugin_PetitionBaseFragment;
      index: number;
    };

export type PlaceholderOption = TComboboxItem<ComboboxItemData>;

export const ELEMENT_PLACEHOLDER = "placeholder" as const;
export const ELEMENT_PLACEHOLDER_INPUT = "placeholder_input" as const;
export interface PlaceholderElement extends SlateElement<typeof ELEMENT_PLACEHOLDER, SlateText> {
  placeholder: string;
}
export interface PlaceholderInputElement
  extends SlateElement<typeof ELEMENT_PLACEHOLDER_INPUT, SlateText> {
  trigger: "{";
}

export function createPlaceholderPlugin<
  TValue extends Value = Value,
  TEditor extends PlateEditor<TValue> = PlateEditor<TValue>,
>({ placeholdersRef }: { placeholdersRef: RefObject<PlaceholderOption[]> }) {
  const trigger = "{";
  return createMentionPlugin<MentionPlugin<PlaceholderOption>, TValue, TEditor>({
    key: ELEMENT_PLACEHOLDER,
    options: {
      trigger,
      insertSpaceAfterMention: true,
      createMentionNode(item) {
        return {
          type: ELEMENT_PLACEHOLDER,
          placeholder: item.key,
          children: [{ text: "" }],
        };
      },
    },
    overrideByKey: {
      [ELEMENT_MENTION_INPUT]: {
        type: ELEMENT_PLACEHOLDER_INPUT,
        component: PlaceholderInputElement,
      },
    },
    component: PlaceholderElement,
    withOverrides: function (_editor, plugin) {
      const { trigger, query } = plugin.options;
      const { insertText: _insertText } = _editor;
      const editor = withMention<TValue, TEditor>(_editor, plugin as any);

      editor.insertText = (text, options) => {
        if (
          !editor.selection ||
          text !== trigger ||
          (query && !query(editor as PlateEditor)) ||
          isSelectionInMentionInput(editor)
        ) {
          for (const part of parseTextWithPlaceholders(text)) {
            if (part.type === "placeholder") {
              const placeholder = placeholdersRef.current?.find(
                (p) =>
                  p.key === part.value ||
                  ("data" in p && "field" in p.data && p.data.field.alias === part.value),
              );
              if (isDefined(placeholder)) {
                editor.insertNode({
                  type: ELEMENT_PLACEHOLDER,
                  placeholder: placeholder.key,
                  children: [{ text: "" }],
                });
              }
            } else {
              _insertText(part.text, options);
            }
          }
          return;
        }

        // Make sure a mention input is created at the beginning of line or after a whitespace
        const previousChar = getEditorString(
          editor,
          getRange(editor, editor.selection, getPointBefore(editor, editor.selection)),
        );

        const nextChar = getEditorString(
          editor,
          getRange(editor, editor.selection, getPointAfter(editor, editor.selection)),
        );

        const beginningOfLine = previousChar === "";
        const endOfLine = nextChar === "";
        const data = {
          type: ELEMENT_PLACEHOLDER_INPUT,
          children: [{ text: "" }],
          trigger,
        };
        return insertNodes(
          editor,
          beginningOfLine && !endOfLine ? [{ text: "" }, data] : (data as any),
        );
      };

      const { insertNodes: _insertNodes } = editor;
      editor.insertNodes = (nodes, options) => {
        // remove invalid nodes
        _insertNodes(visitNodes(nodes), options);
      };
      function filterNodes(nodes: Node[]) {
        return nodes.filter((node) => {
          if ("type" in node && node.type === ELEMENT_PLACEHOLDER) {
            const placeholder = placeholdersRef.current?.find(
              (n) => n.key === (node as PlaceholderElement).placeholder,
            );
            return isDefined(placeholder);
          }
          return true;
        });
      }
      function visitNodes(node: Node | Node[]): Node | Node[] {
        return Array.isArray(node)
          ? filterNodes(node).map((n) => visitNodes(n) as Node)
          : "children" in node
          ? { ...node, children: filterNodes(node.children).map((n) => visitNodes(n) as Node) }
          : node;
      }
      return editor;
    },
  });
}

export interface PlaceholderComboboxProps
  extends Pick<Partial<ComboboxProps<PlaceholderOption>>, "id"> {
  placeholders: PlaceholderOption[];
  pluginKey?: string;
}

export function PlaceholderCombobox({
  placeholders,
  pluginKey = ELEMENT_PLACEHOLDER,
  id = pluginKey,
}: PlaceholderComboboxProps) {
  const editor = usePlateEditorRef()!;
  const { trigger } = getPluginOptions<MentionPlugin>(editor, pluginKey);

  const handleSearchItems = useCallback(
    async (search: string) => {
      return placeholders.filter((p) => p.text.toLowerCase().includes(search.toLowerCase()));
    },
    [placeholders],
  );

  return (
    <PlateCombobox<ComboboxItemData>
      id={id}
      inputType={ELEMENT_PLACEHOLDER_INPUT}
      trigger={trigger!}
      controlled
      defaultItems={placeholders}
      onSearchItems={handleSearchItems}
      onRenderItem={RenderPlaceholderOption}
      onRenderNoItems={RenderNoItems}
      onSelectItem={getMentionOnSelectItem({ key: pluginKey })}
    />
  );
}

function RenderPlaceholderOption({ item, search }: ComboboxItemProps<ComboboxItemData>) {
  if ("data" in item && "field" in item.data && item.data.field) {
    return (
      <Flex alignItems="center" flex="1" minWidth={0}>
        <PetitionFieldTypeIndicator
          as="div"
          isTooltipDisabled
          marginRight={2}
          fieldIndex={item.data.index!}
          type={item.data.field.type}
        />
        {item.data.field.title ? (
          <HighlightText
            textAlign="left"
            as="div"
            flex={1}
            minWidth={0}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            search={search ?? ""}
          >
            {item.text}
          </HighlightText>
        ) : (
          <Text as="div" textStyle="hint">
            <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
          </Text>
        )}
      </Flex>
    );
  }
  return (
    <HighlightText as="div" whiteSpace="nowrap" search={search ?? ""} textTransform="capitalize">
      {item.text}
    </HighlightText>
  );
}

function RenderNoItems({}: { search: string }) {
  return (
    <Box textStyle="hint" textAlign="center" paddingY={2} paddingX={3}>
      <FormattedMessage id="generic.no-results" defaultMessage="No results" />
    </Box>
  );
}

const PlaceholdersContext = createContext<PlaceholderOption[] | null>(null);

export function PlaceholdersProvider({
  placeholders,
  children,
}: {
  placeholders: PlaceholderOption[];
  children?: ReactNode;
}) {
  return (
    <PlaceholdersContext.Provider value={placeholders}>{children}</PlaceholdersContext.Provider>
  );
}

function PlaceholderElement({
  attributes,
  children,
  element,
}: TRenderElementProps<Value, PlaceholderElement>) {
  const intl = useIntl();
  const placeholders = useContext(PlaceholdersContext);
  if (placeholders === null) {
    throw new Error("PlaceholdersProvider must be used surrounding <Plate/>");
  }
  const placeholder = placeholders.find((p) => p.key === element.placeholder);
  const color = usePetitionFieldTypeColor(
    isDefined(placeholder) && "data" in placeholder && "field" in placeholder.data
      ? placeholder.data.field.type
      : (undefined as any),
  );
  const isSelected = useSelected();
  const isFocused = useFocused();

  const hasNoReplies =
    isDefined(placeholder) &&
    "data" in placeholder &&
    "field" in placeholder.data &&
    placeholder.data.petition.__typename === "Petition" &&
    placeholder.data.field.replies.length === 0;

  return (
    <SmallPopover
      isDisabled={!(hasNoReplies || !isDefined(placeholder))}
      content={
        !isDefined(placeholder) ? (
          <Text fontSize="sm">
            <FormattedMessage
              id="placeholder-plugin.deleted-field"
              defaultMessage="This field has been deleted. Nothing will show here."
            />
          </Text>
        ) : hasNoReplies ? (
          <Text fontSize="sm">
            <FormattedMessage
              id="placeholder-plugin.field-without-replies"
              defaultMessage="This field has no replies. Nothing will show here."
            />
          </Text>
        ) : null
      }
    >
      <Box
        className="slate-placeholder"
        contentEditable={false}
        data-placeholder={element.placeholder}
        data-selected={(isSelected && isFocused) || undefined}
        {...attributes}
        as="span"
        display="inline-block"
        fontSize="sm"
        height="21px"
        marginX="1px"
        {...(!isDefined(placeholder)
          ? {
              backgroundColor: "gray.100",
              color: "gray.800",
            }
          : hasNoReplies
          ? {
              backgroundColor: "yellow.200",
              color: "yellow.800",
            }
          : {
              backgroundColor: "blue.100",
              color: "blue.800",
            })}
        whiteSpace="nowrap"
        fontWeight="semibold"
        borderRadius="sm"
        _selected={{
          boxShadow: "outline",
          position: "relative",
          zIndex: 1,
        }}
        paddingX={1}
      >
        {!isDefined(placeholder) ? (
          <>
            <Box
              as="span"
              data-placeholder-label={intl.formatMessage({
                id: "generic.deleted-field",
                defaultMessage: "Deleted field",
              })}
              _before={{
                content: `attr(data-placeholder-label)`,
                fontStyle: "italic",
                fontWeight: "normal",
              }}
            />
            {children}
          </>
        ) : "data" in placeholder &&
          "field" in placeholder.data &&
          isDefined(placeholder.data.field) ? (
          <>
            <Box
              as="span"
              data-placeholder-label={
                placeholder.text.length > 30
                  ? placeholder.text.slice(0, 30) + "..."
                  : placeholder.text
              }
              data-placeholder-field-index={placeholder.data.index}
              _after={{
                content: `attr(data-placeholder-label)`,
                ...(placeholder.data.field.title
                  ? {}
                  : {
                      fontStyle: "italic",
                      fontWeight: "normal",
                    }),
              }}
              _before={{
                content: `attr(data-placeholder-field-index)`,
                position: "relative",
                top: "-1.5px",
                backgroundColor: color,
                borderRadius: "sm",
                color: "white",
                fontSize: "2xs",
                height: 3.5,
                paddingX: 1,
                marginRight: 1,
              }}
            />
            <Box as="span" fontSize={0} aria-hidden>
              {`{{ ${placeholder.key} }}`}
            </Box>
            {children}
          </>
        ) : (
          <>
            <Box
              as="span"
              data-placeholder-label={placeholder.text}
              _before={{ content: `attr(data-placeholder-label)` }}
            />
            <Box as="span" fontSize={0} aria-hidden>
              {`{{ ${placeholder.key} }}`}
            </Box>
            {children}
          </>
        )}
      </Box>
    </SmallPopover>
  );
}

export const PlaceholderInputElement = (props: any) => {
  const { attributes, children } = props;

  return (
    <Box
      as="span"
      display="inline-block"
      fontSize="sm"
      height="21px"
      backgroundColor="blue.100"
      borderRadius="sm"
      paddingX={1}
      marginX="1px"
      _before={{ content: '"{{ "' }}
      {...attributes}
    >
      {children}
    </Box>
  );
};

export function removePlaceholderInputElements<T extends SlateElement<any, any>[]>(value: T): T {
  return value
    .filter((e) => e.type !== ELEMENT_PLACEHOLDER_INPUT)
    .map((e) =>
      "children" in e ? { ...e, children: removePlaceholderInputElements(e.children as any) } : e,
    ) as T;
}

createPlaceholderPlugin.fragments = {
  get PetitionBase() {
    return gql`
      fragment createPlaceholderPlugin_PetitionBase on PetitionBase {
        id
        fields {
          ...createPlaceholderPlugin_PetitionField
        }
      }
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment createPlaceholderPlugin_PetitionField on PetitionField {
        id
        title
        alias
        type
        replies {
          id
        }
      }
    `;
  },
};

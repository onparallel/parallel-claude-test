import { Box } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import {
  ComboboxItemProps,
  ComboboxProps,
  PlateCombobox,
} from "@parallel/components/common/slate/PlateCombobox";
import {
  getPluginOptions,
  PlateEditor,
  RenderFunction,
  TRenderElementProps,
  usePlateEditorRef,
  Value,
} from "@udecode/plate-core";
import {
  createMentionPlugin,
  ELEMENT_MENTION_INPUT,
  getMentionOnSelectItem,
  MentionPlugin,
} from "@udecode/plate-mention";
import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { useFocused, useSelected } from "slate-react";
import { SlateElement, SlateText } from "./types";

export interface PlaceholderOption {
  value: string;
  label: string;
}

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
  TEditor extends PlateEditor<TValue> = PlateEditor<TValue>
>() {
  return createMentionPlugin<MentionPlugin<PlaceholderOption>, TValue, TEditor>({
    key: ELEMENT_PLACEHOLDER,
    options: {
      trigger: "{",
      insertSpaceAfterMention: true,
      createMentionNode(item) {
        const option = item.data;
        return {
          type: ELEMENT_PLACEHOLDER,
          placeholder: option.value,
          children: [{ text: option.label }],
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
  });
}

export interface PlaceholderComboboxProps
  extends Pick<Partial<ComboboxProps<PlaceholderOption>>, "id"> {
  placeholders: PlaceholderOption[];
  pluginKey?: string;
}

function mapPlaceholderOption(option: PlaceholderOption) {
  return {
    key: option.value,
    text: option.label,
    data: option,
  };
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
      return placeholders
        .filter((p) => p.label.toLowerCase().includes(search.toLowerCase()))
        .map(mapPlaceholderOption);
    },
    [placeholders]
  );

  const defaultItems = useMemo(() => {
    return placeholders?.map(mapPlaceholderOption) ?? [];
  }, [placeholders]);

  return (
    <PlateCombobox<PlaceholderOption>
      id={id}
      inputType={ELEMENT_PLACEHOLDER_INPUT}
      trigger={trigger!}
      controlled
      defaultItems={defaultItems as any}
      onSearchItems={handleSearchItems as any}
      onRenderItem={RenderPlaceholderOption}
      onRenderNoItems={RenderNoItems}
      onSelectItem={getMentionOnSelectItem({ key: pluginKey })}
    />
  );
}

const RenderPlaceholderOption: RenderFunction<ComboboxItemProps<PlaceholderOption>> =
  function RenderPlaceholderOption({ item, search }) {
    return (
      <HighlightText as="div" whiteSpace="nowrap" search={search ?? ""} textTransform="capitalize">
        {item.data.label}
      </HighlightText>
    );
  };

const RenderNoItems: RenderFunction<{ search: string }> = function RenderNoItems() {
  return (
    <Box textStyle="hint" textAlign="center" paddingY={2} paddingX={3}>
      <FormattedMessage id="generic.no-results" defaultMessage="No results" />
    </Box>
  );
};

const PlaceholdersContext = createContext<PlaceholderOption[] | null>(null);

export function PlaceholdersProvider({
  placeholders,
  children,
}: {
  placeholders: PlaceholderOption[];
  children?: ReactNode;
}) {
  return (
    <PlaceholdersContext.Provider value={placeholders}>{children} </PlaceholdersContext.Provider>
  );
}

function PlaceholderElement({
  attributes,
  children,
  element,
}: TRenderElementProps<Value, PlaceholderElement>) {
  const placeholders = useContext(PlaceholdersContext);
  if (placeholders === null) {
    throw new Error("PlaceholdersProvider must be used surrounding <Plate/>");
  }
  const label = placeholders.find((p) => p.value === element.placeholder)!.label;
  const isSelected = useSelected();
  const isFocused = useFocused();

  return (
    <Box
      className="slate-placeholder"
      contentEditable={false}
      data-placeholder={element.placeholder}
      {...attributes}
      as="span"
      display="inline-block"
      fontSize="sm"
      height="21px"
      backgroundColor="blue.100"
      color="blue.800"
      fontWeight="semibold"
      textTransform="capitalize"
      borderRadius="sm"
      boxShadow={isSelected && isFocused ? "outline" : "none"}
      paddingX={1}
    >
      <Box
        as="span"
        data-placeholder-label={label}
        _before={{ content: `attr(data-placeholder-label)` }}
      />
      <Box as="span" fontSize={0} aria-hidden>
        {`{{ ${label} }}`}
      </Box>
      {children}
    </Box>
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
      marginX="0.1em"
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
      "children" in e ? { ...e, children: removePlaceholderInputElements(e.children as any) } : e
    ) as T;
}

import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import {
  ComboboxItemProps,
  ComboboxProps,
  PlateCombobox,
} from "@parallel/components/common/slate/PlateCombobox";
import { UserDropdownEmpty } from "@parallel/components/common/UserDropdownEmpty";
import { UserSelectOption } from "@parallel/components/common/UserSelectOption";
import { createMentionPlugin_UserOrUserGroupFragment } from "@parallel/graphql/__types";
import {
  getPluginOptions,
  PlateEditor,
  RenderFunction,
  TRenderElementProps,
  usePlateEditorRef,
  Value,
} from "@udecode/plate-core";
import {
  createMentionPlugin as _createMentionPlugin,
  ELEMENT_MENTION_INPUT,
  getMentionOnSelectItem,
  MentionPlugin,
} from "@udecode/plate-mention";
import { useCallback } from "react";
import { useFocused, useSelected } from "slate-react";
import { MaybePromise } from "../types";
import { SlateElement, SlateText } from "./types";

export type Mentionable = createMentionPlugin_UserOrUserGroupFragment;

export const MENTION_TYPE = "mention" as const;
export interface MentionElement extends SlateElement<typeof MENTION_TYPE, SlateText> {
  mention: string;
}
export interface MentionInputElement extends SlateElement<typeof ELEMENT_MENTION_INPUT, SlateText> {
  mention: string;
  trigger: "@";
}

export function createMentionPlugin<
  TValue extends Value = Value,
  TEditor extends PlateEditor<TValue> = PlateEditor<TValue>
>() {
  return _createMentionPlugin<MentionPlugin<Mentionable>, TValue, TEditor>({
    options: {
      insertSpaceAfterMention: true,
      createMentionNode(item) {
        const mentionable = item.data;
        return {
          type: MENTION_TYPE,
          mention: mentionable.id,
          children: [
            {
              text:
                mentionable.__typename === "User"
                  ? mentionable.fullName
                  : mentionable.__typename === "UserGroup"
                  ? mentionable.name
                  : "",
            },
          ],
        };
      },
    },
    component: MentionElement,
  });
}

export interface MentionComboboxProps extends Pick<Partial<ComboboxProps<Mentionable>>, "id"> {
  onSearchMentionables: (
    search: string
  ) => MaybePromise<createMentionPlugin_UserOrUserGroupFragment[]>;
  pluginKey?: string;
}

export function MentionCombobox({
  onSearchMentionables,
  pluginKey = MENTION_TYPE,
  id = pluginKey,
}: MentionComboboxProps) {
  const editor = usePlateEditorRef()!;

  const { trigger } = getPluginOptions<MentionPlugin>(editor, pluginKey);

  const handleSearchItems = useCallback(
    async (search: string) => {
      const mentionables = await onSearchMentionables(search);
      return mentionables.map((m) => {
        const text =
          m.__typename === "User" ? m.fullName! : m.__typename === "UserGroup" ? m.name : "";
        return {
          key: m.id,
          text,
          data: m,
        };
      });
    },
    [onSearchMentionables]
  );

  return (
    <PlateCombobox<Mentionable>
      id={id}
      inputType={ELEMENT_MENTION_INPUT}
      trigger={trigger!}
      controlled
      onSearchItems={handleSearchItems as any}
      onRenderItem={RenderMentionable}
      onRenderNoItems={RenderNoItems}
      onSelectItem={getMentionOnSelectItem({ key: pluginKey })}
    />
  );
}

const RenderMentionable: RenderFunction<ComboboxItemProps<Mentionable>> =
  function RenderMentionable({ item, search }) {
    return <UserSelectOption data={item.data} highlight={search} isDisabled={item.disabled} />;
  };

const RenderNoItems: RenderFunction<{ search: string }> = function RenderNoItems({ search }) {
  return <UserDropdownEmpty search={search} includeGroups={true} />;
};

function MentionElement({
  attributes,
  children,
  element,
}: TRenderElementProps<Value, MentionElement>) {
  const label = element.children[0].text;

  const isSelected = useSelected();
  const isFocused = useFocused();

  return (
    <Box
      className="slate-mention"
      contentEditable={false}
      data-mention-id={element.mentionId}
      {...attributes}
      as="span"
      display="inline-block"
      backgroundColor="gray.75"
      borderRadius="sm"
      boxShadow={isSelected && isFocused ? "outline" : "none"}
      paddingX={1}
      marginX="0.1em"
    >
      <Box
        as="span"
        data-mention-label={`@${label}`}
        _before={{ content: `attr(data-mention-label)` }}
      />
      <Box as="span" fontSize={0} aria-hidden>
        @{label}
      </Box>
      {children}
    </Box>
  );
}

export const MentionInputElement = (props: any) => {
  const { attributes, children } = props;

  const isSelected = useSelected();
  const isFocused = useFocused();

  return (
    <Box
      as="span"
      display="inline-block"
      backgroundColor="gray.75"
      borderRadius="sm"
      boxShadow={isSelected && isFocused ? "outline" : "none"}
      paddingX={1}
      marginX="0.1em"
      _before={{ content: '"@"' }}
      {...attributes}
    >
      {children}
    </Box>
  );
};

createMentionPlugin.fragments = {
  UserOrUserGroup: gql`
    fragment createMentionPlugin_UserOrUserGroup on UserOrUserGroup {
      ... on User {
        id
        fullName
        email
        ...UserSelectOption_User
      }
      ... on UserGroup {
        id
        name
        memberCount
        ...UserSelectOption_UserGroup
      }
    }
    ${UserSelectOption.fragments.User}
    ${UserSelectOption.fragments.UserGroup}
  `,
};

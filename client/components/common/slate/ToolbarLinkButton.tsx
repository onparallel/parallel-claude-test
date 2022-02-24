import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { LinkIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { CustomEditor, SlateElement, SlateText } from "@parallel/utils/slate/types";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import {
  getAbove,
  getPreventDefaultHandler,
  insertNodes,
  isCollapsed,
} from "@udecode/plate-common";
import { upsertLinkAtSelection } from "@udecode/plate-link";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { Editor, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../dialogs/DialogProvider";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarLinkButtonProps
  extends Omit<ToolbarButtonProps, "isToggeable" | "type" | "label" | "icon"> {
  editor: CustomEditor;
}

interface LinkNode extends SlateElement<"link", SlateText> {
  url: string;
}

export const ToolbarLinkButton = chakraForwardRef<"button", ToolbarLinkButtonProps>(
  function ToolbarLinkButton({ editor, ...props }, ref) {
    const intl = useIntl();
    const showAddLinkDialog = useAddLinkDialog();
    const editorRef = useUpdatingRef(editor);
    const handleMouseDown = useCallback(
      getPreventDefaultHandler(async () => {
        const selection = editorRef.current.selection;
        const endOfEditor = Editor.range(editorRef.current, Editor.end(editor, []));
        const linkNode = editorRef.current.selection
          ? getAbove<LinkNode>(editorRef.current, { match: { type: "link" } })
          : undefined;
        const [_, link] = await withError(
          showAddLinkDialog({
            defaultValues: linkNode && {
              url: linkNode[0].url,
              text: linkNode[0].children.map((c) => c.text).join(""),
            },
            showTextInput: !linkNode && (!selection || isCollapsed(selection)),
          })
        );
        ReactEditor.focus(editorRef.current as any);
        Transforms.select(editorRef.current, selection ?? endOfEditor);
        if (!link) {
          return;
        }
        if (linkNode || (selection && !isCollapsed(selection))) {
          upsertLinkAtSelection(editorRef.current, { url: link.url, wrap: true });
        } else {
          const text = link.text || link.url;
          insertNodes(
            editorRef.current,
            {
              type: "link",
              url: link.url,
              children: [{ text }],
            },
            { at: selection ?? endOfEditor }
          );
          Transforms.move(editorRef.current, { distance: text.length });
        }
      }),
      []
    );
    return (
      <ToolbarButton
        icon={<LinkIcon />}
        label={intl.formatMessage({
          id: "component.rich-text-editor.link",
          defaultMessage: "Link",
        })}
        onMouseDown={handleMouseDown}
        {...props}
      />
    );
  }
);

type RTELink = {
  url: string;
  text?: string;
};

function AddLinkDialog({
  showTextInput,
  defaultValues = {},
  ...props
}: DialogProps<{ showTextInput: boolean; defaultValues?: Partial<RTELink> }, RTELink>) {
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

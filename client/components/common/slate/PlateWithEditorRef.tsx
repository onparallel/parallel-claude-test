import { assignRef } from "@parallel/utils/assignRef";
import { Plate, PlateEditor, PlateProps, usePlateEditorRef, Value } from "@udecode/plate-common";
import { Ref } from "react";

interface PlateWithEditorRefProps<
  V extends Value = Value,
  E extends PlateEditor<V> = PlateEditor<V>
> extends PlateProps<V, E> {
  editorRef: Ref<E>;
}

export function PlateWithEditorRef<
  V extends Value = Value,
  E extends PlateEditor<V> = PlateEditor<V>
>({ editorRef, ...props }: PlateWithEditorRefProps<V, E>) {
  const editor = usePlateEditorRef<V, E>();
  assignRef(editorRef, editor);
  return <Plate<V, E> {...props} />;
}

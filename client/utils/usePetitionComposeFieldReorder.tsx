import { gql } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { usePetitionComposeFieldReorder_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { indexBy, isDefined } from "remeda";
import { PetitionFieldVisibility } from "./fieldVisibility/types";
import { Maybe } from "./types";
import { useEffectSkipFirst } from "./useEffectSkipFirst";
import { useUpdatingRef } from "./useUpdatingRef";

export function usePetitionComposeFieldReorder<
  T extends usePetitionComposeFieldReorder_PetitionFieldFragment,
>({
  fields,
  onUpdateFieldPositions,
}: {
  fields: T[];
  onUpdateFieldPositions: (fieldIds: string[]) => void;
}) {
  const [fieldIds, setFieldIds] = useState(fields.map((f) => f.id));
  useEffectSkipFirst(
    () => setFieldIds(fields.map((f) => f.id)),
    [fields.map((f) => f.id).join(",")],
  );
  const depsRef = useUpdatingRef({ fieldIds, fields, onUpdateFieldPositions });
  const showError = useErrorDialog();
  const startDragIndex = useRef<number | null>();

  return {
    fields: useMemo(() => {
      const byId = indexBy(fields, (f) => f.id);
      return fieldIds.map((id) => byId[id]).filter(isDefined);
    }, [fields, fieldIds.join(",")]),
    onFieldMove: useCallback(async (dragIndex: number, hoverIndex: number, dropped?: boolean) => {
      startDragIndex.current = startDragIndex.current ?? dragIndex;
      const { fieldIds, fields, onUpdateFieldPositions } = depsRef.current;
      const byId = indexBy(fields, (f) => f.id);
      const newFieldIds = [...fieldIds];
      const [fieldId] = newFieldIds.splice(dragIndex, 1);
      newFieldIds.splice(hoverIndex, 0, fieldId);
      if (dropped) {
        const startIndex = startDragIndex.current!;
        startDragIndex.current = null;
        const endIndex = hoverIndex;

        if (startIndex === endIndex) {
          // if dropping field on same position, do nothing
          return;
        }

        let fieldsToCheck: string[] = [];
        if (endIndex > startIndex) {
          // moving a field down, so make sure that field is not being referenced by a field that is being moved up
          // check every field that ends above the field being moved, not including the field being moved
          fieldsToCheck = fieldIds.slice(startIndex, endIndex);
        } else if (startIndex > endIndex) {
          // moving a field up, so make sure that field is not referencing a field that is being moved down
          // only need to check the field that is being moved up
          fieldsToCheck = fieldIds.slice(endIndex, endIndex + 1);
        }

        // check that this order of fields is respecting that visibility only refers to previous fields
        for (const fieldId of fieldsToCheck) {
          const position = fieldIds.indexOf(fieldId);
          const visibility = byId[fieldId].visibility as Maybe<PetitionFieldVisibility>;
          if (
            visibility &&
            visibility.conditions.some((c) => newFieldIds.indexOf(c.fieldId) > position)
          ) {
            try {
              setFieldIds(fields.map((f) => f.id));
              await showError({
                message: (
                  <FormattedMessage
                    id="util.use-petition-compose-field-reorder.move-referenced-field-error"
                    defaultMessage="You can only move fields so that visibility conditions refer only to previous fields."
                  />
                ),
              });
            } catch {}
            return;
          }
        }
        setFieldIds(newFieldIds);
        setTimeout(() => onUpdateFieldPositions(newFieldIds));
      } else {
        setFieldIds(newFieldIds);
      }
    }, []),
  };
}

usePetitionComposeFieldReorder.fragments = {
  PetitionField: gql`
    fragment usePetitionComposeFieldReorder_PetitionField on PetitionField {
      id
      visibility
    }
  `,
};

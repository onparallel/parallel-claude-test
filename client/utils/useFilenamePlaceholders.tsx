import { gql } from "@apollo/client";
import {
  useFilenamePlaceholdersRename_PetitionBaseFragment,
  useFilenamePlaceholdersRename_PetitionFieldFragment,
  useFilenamePlaceholdersRename_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { flatMap, isNonNullish, pipe, zip } from "remeda";
import { sanitizeFilenameWithSuffix } from "./sanitizeFilenameWithSuffix";
import { PlaceholderOption } from "./slate/PlaceholderPlugin";
import { parseTextWithPlaceholders } from "./slate/textWithPlaceholder";

export function useFilenamePlaceholders(): PlaceholderOption[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "field-number",
        text: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-number",
          defaultMessage: "Field number",
        }),
      },
      {
        key: "field-title",
        text: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-title",
          defaultMessage: "Field title",
        }),
      },
      {
        key: "file-name",
        text: intl.formatMessage({
          id: "component.download-dialog.placeholder-file-name",
          defaultMessage: "File name",
        }),
      },
    ],
    [intl.locale],
  );
}

export function useFilenamePlaceholdersRename(
  petition: useFilenamePlaceholdersRename_PetitionBaseFragment,
) {
  const placeholders = useFilenamePlaceholders();
  const fieldsWithIndices = useFieldsWithIndices(petition);
  const indicesById: Record<string, string> = useMemo(() => {
    return pipe(
      fieldsWithIndices,
      flatMap(([field, fieldIndex, childrenFieldIndices]) => [
        [field.id, fieldIndex] as const,
        ...(isNonNullish(field.children)
          ? zip(
              field.children.map((f) => f.id),
              childrenFieldIndices!,
            )
          : []),
      ]),
      Object.fromEntries,
    );
  }, [fieldsWithIndices]);

  return useCallback(
    (
      field: useFilenamePlaceholdersRename_PetitionFieldFragment,
      reply: useFilenamePlaceholdersRename_PetitionFieldReplyFragment,
      pattern: string,
      reset?: boolean,
    ) => {
      const seen = new Set<string>();

      if (reset) {
        seen.clear();
      }
      const extension = (reply.content.filename as string).match(/\.[a-z0-9]+$/)?.[0] ?? "";
      const name = parseTextWithPlaceholders(pattern)
        .map((part) => {
          if (part.type === "placeholder") {
            switch (part.value) {
              case "field-number":
                return indicesById[field.id];
              case "field-title":
                return field.title ?? "";
              case "file-name":
                // remove file extension since it's added back later
                return reply.content.filename.replace(/\.[a-z0-9]+$/, "");
              default:
                return "";
            }
          } else {
            return part.text;
          }
        })
        .join("");

      let filename = sanitizeFilenameWithSuffix(name, extension.toLowerCase());
      let counter = 1;
      while (seen.has(filename)) {
        filename = sanitizeFilenameWithSuffix(name, ` ${counter++}${extension.toLowerCase()}`);
      }
      seen.add(filename);
      return filename;
    },
    [placeholders, indicesById],
  );
}

useFilenamePlaceholdersRename.fragments = {
  PetitionBase: gql`
    fragment useFilenamePlaceholdersRename_PetitionBase on PetitionBase {
      ...useFieldsWithIndices_PetitionBase
      fields {
        id
      }
    }
    ${useFieldsWithIndices.fragments.PetitionBase}
  `,
  PetitionField: gql`
    fragment useFilenamePlaceholdersRename_PetitionField on PetitionField {
      id
      type
      title
    }
  `,
  PetitionFieldReply: gql`
    fragment useFilenamePlaceholdersRename_PetitionFieldReply on PetitionFieldReply {
      content
    }
  `,
};

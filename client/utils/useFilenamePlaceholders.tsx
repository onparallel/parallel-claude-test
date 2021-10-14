import { gql } from "@apollo/client";
import {
  useFilenamePlaceholdersRename_PetitionFieldFragment,
  useFilenamePlaceholdersRename_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { getFieldIndices } from "@parallel/utils/fieldIndices";
import escapeStringRegexp from "escape-string-regexp";
import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { sanitizeFilenameWithSuffix } from "./sanitizeFilenameWithSuffix";

export function useFilenamePlaceholders() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        value: "field-number",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-number",
          defaultMessage: "Field number",
        }),
      },
      {
        value: "field-title",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-title",
          defaultMessage: "Field title",
        }),
      },
      {
        value: "file-name",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-file-name",
          defaultMessage: "File name",
        }),
      },
    ],
    [intl.locale]
  );
}

export function useFilenamePlaceholdersRename() {
  const placeholders = useFilenamePlaceholders();
  return useCallback(
    (fields: useFilenamePlaceholdersRename_PetitionFieldFragment[]) => {
      const seen = new Set<string>();
      const indices = getFieldIndices(fields);
      return (
        field: useFilenamePlaceholdersRename_PetitionFieldFragment,
        reply: useFilenamePlaceholdersRename_PetitionFieldReplyFragment,
        pattern: string,
        reset?: boolean
      ) => {
        if (reset) {
          seen.clear();
        }
        const index = indices[fields.findIndex((f) => f.id === field.id)];
        const extension = (reply.content.filename as string).match(/\.[a-z0-9]+$/)?.[0] ?? "";
        const parts = pattern.split(
          new RegExp(
            `(#(?:${placeholders.map((p) => escapeStringRegexp(p.value)).join("|")})#)`,
            "g"
          )
        );
        const name = parts
          .map((part) => {
            if (part.startsWith("#") && part.endsWith("#")) {
              const value = part.slice(1, -1);
              switch (value) {
                case "field-number":
                  return index;
                case "field-title":
                  return field.title ?? "";
                case "file-name":
                  // remove file extension since it's added back later
                  return reply.content.filename.replace(/\.[a-z0-9]+$/, "");
              }
            }
            return part;
          })
          .join("");

        let filename = sanitizeFilenameWithSuffix(name, extension.toLowerCase());
        let counter = 1;
        while (seen.has(filename)) {
          filename = sanitizeFilenameWithSuffix(name, ` ${counter++}${extension.toLowerCase()}`);
        }
        seen.add(filename);
        return filename;
      };
    },
    [placeholders]
  );
}

useFilenamePlaceholdersRename.fragments = {
  get PetitionField() {
    return gql`
      fragment useFilenamePlaceholdersRename_PetitionField on PetitionField {
        id
        type
        title
      }
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment useFilenamePlaceholdersRename_PetitionFieldReply on PetitionFieldReply {
        content
      }
    `;
  },
};

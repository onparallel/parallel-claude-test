import { unique } from "remeda";
import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

const validCategories = [
  "administration",
  "business-development",
  "compliance",
  "customer-service",
  "engineering",
  "finance",
  "general-management",
  "it",
  "hr",
  "legal",
  "marketing",
  "operations",
  "procurement",
  "product",
  "real-estate",
  "sales",
  "other",
];

export function validatePublicTemplateCategories<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [categories, argName] = getArgWithPath(args, prop);
    if (!categories) return true;

    const categoriesArray = unique(
      categories
        .trim()
        .split(",")
        .map((c) => c.trim()),
    );
    const invalid = categoriesArray.filter((c) => !validCategories.includes(c));
    if (invalid.length > 0) {
      throw new ArgValidationError(
        info,
        argName,
        `Invalid categories: ${invalid.join(", ")}. Expected: ${validCategories.join(", ")}`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

import { core } from "nexus";
import { uniq } from "remeda";
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
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const categories = prop(args);
    if (!categories) return true;

    const categoriesArray = uniq(
      categories
        .trim()
        .split(",")
        .map((c) => c.trim())
    );
    const invalid = categoriesArray.filter((c) => !validCategories.includes(c));
    if (invalid.length > 0) {
      throw new ArgValidationError(
        info,
        argName,
        `Invalid categories: ${invalid.join(", ")}. Expected: ${validCategories.join(", ")}`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

import { GraphQLResolveInfo } from "graphql";
import { plugin, core } from "@nexus/schema";

const fieldDefTypes = core.printedGenTyping({
  optional: true,
  name: "validateArgs",
  description: `
    Run validation for the args of this type. Any errors thrown here will
    prevent the resolve method from executing.
  `,
  type: "FieldValidateArgsResolver<TypeName, FieldName>",
  imports: [
    core.printedGenTypingImport({
      module: "./helpers/validateArgsPlugin",
      bindings: ["FieldValidateArgsResolver"],
    }),
  ],
});

export type FieldValidateArgsResolver<
  TypeName extends string,
  FieldName extends string
> = (
  root: core.RootValue<TypeName>,
  args: core.ArgsValue<TypeName, FieldName>,
  context: core.GetGen<"context">,
  info: GraphQLResolveInfo
) => core.MaybePromise<void>;

export type ValidateArgsPluginConfig = {};

export const validateArgsPlugin = () => {
  return plugin({
    name: "NexusValidateArgs",
    description:
      "The authorize plugin provides field-level authorization for a schema.",
    fieldDefTypes: fieldDefTypes,
    onCreateFieldResolver(config) {
      const validateArgs =
        config.fieldConfig.extensions?.nexus?.config.validateArgs;
      if (typeof validateArgs === "function") {
        // The validateArgs wrapping resolver.
        return async function (root, args, ctx, info, next) {
          await validateArgs(root, args, ctx, info);
          return await next(root, args, ctx, info);
        };
      } else if (validateArgs === null || validateArgs === undefined) {
        // If the field doesn't have a validateArgs field, don't worry about wrapping the resolver
        return;
      } else {
        // If it does have this field, but it's not a function, it's wrong - let's provide a warning
        const { name, type } = config.fieldConfig;
        console.warn(
          `The validateArgs property provided to ${name} with type ${type} should be a function, saw ${typeof validateArgs}`
        );
        return;
      }
    },
  });
};

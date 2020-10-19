// eslint-disable-next-line @typescript-eslint/no-var-requires
const { introspectionFromSchema } = require("graphql");

module.exports = {
  plugin(schema, documents, config) {
    const introspection = introspectionFromSchema(schema, {
      descriptions: true,
      schemaDescription: true,
    });

    const mutationTypeName = introspection.__schema.mutationType.name;
    const mutation = introspection.__schema.types.find(
      (t) => t.name === mutationTypeName
    );

    const queryTypeName = introspection.__schema.queryType.name;
    const query = introspection.__schema.types.find(
      (t) => t.name === queryTypeName
    );

    const supportMethods = [
      ...mutation.fields.map((field) => ({
        field,
        queryType: "mutation",
      })),
      ...query.fields.map((field) => ({
        field,
        queryType: "query",
      })),
    ]
      .filter(
        ({ field }) =>
          field.type.kind === "NON_NULL" &&
          field.type.ofType.name === "SupportMethodResponse"
      )
      .sort((a, b) => a.field.name.localeCompare(b.field.name));

    const types = Object.fromEntries(
      introspection.__schema.types.map((t) => [t.name, t])
    );

    const usedTypes = new Set();
    function walkTypes(type) {
      switch (type.kind) {
        case "NON_NULL":
        case "LIST":
          walkTypes(type.ofType);
          break;
        case "ENUM":
          if (!usedTypes.has(type.name)) {
            usedTypes.add(types[type.name]);
          }
          break;
        case "INPUT_OBJECT":
        case "OBJECT":
          if (!usedTypes.has(type.name)) {
            usedTypes.add(types[type.name]);
            types[type.name].fields.forEach((f) => walkTypes(f.type));
          }
          break;
      }
    }
    supportMethods.forEach(({ field }) => {
      field.args.forEach((arg) => walkTypes(arg.type));
      walkTypes(field.type);
    });
    return /* ts */ `
      import { IntrospectionField, IntrospectionType } from "graphql";

      export const supportMethods: {
        field: IntrospectionField;
        queryType: "mutation" | "query";
      }[] = ${JSON.stringify(supportMethods)} as any;

      export const schemaTypes: IntrospectionType[] = ${JSON.stringify(
        Array.from(usedTypes)
      )} as any;
    `;
  },
};

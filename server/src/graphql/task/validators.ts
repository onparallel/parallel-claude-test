import Ajv from "ajv";
import { core } from "nexus";
import { TaskInput } from "../../db/repositories/TaskRepository";
import { TaskName } from "../../db/__types";
import { fromGlobalId } from "../../util/globalId";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

const schema = {
  definitions: {
    root: {
      type: "object",
      anyOf: [{ $ref: "#/definitions/printPdf" }, { $ref: "#/definitions/exportReplies" }],
    },
    printPdf: {
      type: "object",
      additionalProperties: false,
      required: ["petitionId"],
      properties: {
        petitionId: { type: "string", globalIdPrefix: "Petition" },
      },
    },
    exportReplies: {
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {},
    },
  },
  $ref: "#/definitions/root",
};

export function validTaskInput<TypeName extends string, FieldName extends string>(
  taskNameProp: (args: core.ArgsValue<TypeName, FieldName>) => TaskName,
  taskInputProp: (args: core.ArgsValue<TypeName, FieldName>) => any,
  taskInputArgName: string
) {
  return (async (_, args, ctx, info) => {
    const taskName = taskNameProp(args);
    const taskInput = taskInputProp(args);

    try {
      const validator = new Ajv();
      validator.addKeyword({
        keyword: "globalIdPrefix",
        validate: function (prefix: string, value: string) {
          try {
            return fromGlobalId(value).type === prefix;
          } catch {}
          return false;
        },
        error: { message: "Invalid ID" },
      });
      let validateFunction;
      if (taskName === "PRINT_PDF") {
        validateFunction = validator.compile<TaskInput<"PRINT_PDF">>(schema.definitions.printPdf);
      } else if (taskName === "EXPORT_REPLIES") {
        validateFunction = validator.compile<TaskInput<"EXPORT_REPLIES">>(
          schema.definitions.exportReplies
        );
      } else {
        throw new Error(`Schema not defined for validating task input for task ${taskName}`);
      }

      if (!validateFunction(taskInput)) {
        throw new Error(JSON.stringify(validateFunction.errors));
      }
    } catch (e: any) {
      throw new ArgValidationError(info, taskInputArgName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

import gql from "graphql-tag";
import { Drop } from "liquidjs";
import { indexBy, mapValues, pipe } from "remeda";
import { FieldLogicResult } from "../../../util/fieldLogic";
import { LiquidPetitionVariableProvider_PetitionVariableFragment } from "../../__types";

class PetitionVariableValueLabel extends Drop {
  constructor(
    private value: number | string,
    public label: string | null,
  ) {
    super();
  }

  public override valueOf() {
    return this.value;
  }
}

class PetitionVariableDrop extends Drop {
  public final: PetitionVariableValueLabel;
  public after: PetitionVariableValueLabel;
  public before: PetitionVariableValueLabel;

  constructor(
    private _final: [value: number | string, label: string | null],
    private _after: [value: number | string, label: string | null],
    private _before: [value: number | string, label: string | null],
  ) {
    super();
    this.final = new PetitionVariableValueLabel(..._final);
    this.after = new PetitionVariableValueLabel(..._after);
    this.before = new PetitionVariableValueLabel(..._before);
  }

  public get label() {
    return this._final[1];
  }

  public override valueOf() {
    return this._final[0];
  }
}

export function buildPetitionVariablesLiquidScope(
  logic: FieldLogicResult,
  variables: LiquidPetitionVariableProvider_PetitionVariableFragment[],
) {
  const variableLabelsByName = pipe(
    variables,
    indexBy((v) => v.name),
    mapValues((v) =>
      v.__typename === "PetitionVariableNumber"
        ? Object.fromEntries(v.valueLabels.map((l) => [l.value, l.label]))
        : Object.fromEntries(v.enumValueLabels.map((l) => [l.value, l.label])),
    ),
  );
  return Object.fromEntries(
    Object.keys(logic.finalVariables).map((key) => {
      const final = logic.finalVariables[key];
      const current = logic.currentVariables[key];
      const previous = logic.previousVariables[key];
      return [
        key,
        new PetitionVariableDrop(
          [final, variableLabelsByName[key]?.[final] ?? null],
          [current, variableLabelsByName[key]?.[current] ?? null],
          [previous, variableLabelsByName[key]?.[previous] ?? null],
        ),
      ];
    }),
  );
}

export const LiquidPetitionVariableProvider = {
  fragments: {
    PetitionVariable: gql`
      fragment LiquidPetitionVariableProvider_PetitionVariable on PetitionVariable {
        __typename
        name
        ... on PetitionVariableNumber {
          valueLabels {
            value
            label
          }
        }
        ... on PetitionVariableEnum {
          enumValueLabels: valueLabels {
            value
            label
          }
        }
      }
    `,
  },
};

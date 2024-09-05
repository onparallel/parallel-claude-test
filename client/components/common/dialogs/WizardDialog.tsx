import { ModalProps } from "@chakra-ui/react";
import { ComponentType, useCallback, useMemo, useState } from "react";
import { BaseDialogPropsProvider } from "./BaseDialog";
import { DialogCallbacks, DialogProps, useDialog } from "./DialogProvider";

export function useWizardDialog<TSteps extends Record<string, object>>(steps: {
  [K in keyof TSteps]: ComponentType<TSteps[K]>;
}): TSteps[keyof TSteps] extends DialogCallbacks<infer TResult>
  ? <const TStep extends string & keyof TSteps>(
      step: TStep,
      props: Omit<TSteps[TStep], keyof DialogCallbacks | WizardStepDialogPropsKeys>,
    ) => Promise<TResult>
  : never;
export function useWizardDialog<
  TSteps extends Record<string, object>,
  const TInitial extends string & keyof TSteps,
>(
  steps: {
    [K in keyof TSteps]: ComponentType<TSteps[K]>;
  },
  initialStep: TInitial,
): TSteps[keyof TSteps] extends DialogCallbacks<infer TResult>
  ? (
      props: Omit<TSteps[TInitial], keyof DialogCallbacks | WizardStepDialogPropsKeys>,
    ) => Promise<TResult>
  : never;
export function useWizardDialog<
  TSteps extends Record<string, object>,
  const TInitial extends string & keyof TSteps,
>(
  steps: {
    [K in keyof TSteps]: ComponentType<TSteps[K]>;
  },
  initialStep?: TInitial,
): any {
  const showDialog = useDialog(WizardDialog);
  return useCallback(
    (stepOrProps: any, maybeProps?: any) => {
      const [step, props] =
        typeof stepOrProps === "string" ? [stepOrProps, maybeProps] : [initialStep!, stepOrProps];
      return showDialog({ steps, initialStep: step, initialProps: props } as any) as any;
    },
    [showDialog],
  ) as any;
}

export interface WizardDialogProps<
  TSteps extends Record<string, object>,
  TIinitialStep extends string & keyof TSteps,
  TResult = void,
> extends DialogCallbacks<TResult> {
  steps: { [K in keyof TSteps]: ComponentType<TSteps[K]> };
  initialStep: TIinitialStep;
  initialProps: Omit<
    WizardStepDialogProps<TSteps, TIinitialStep, TResult>,
    WizardStepDialogPropsKeys | keyof DialogCallbacks
  >;
}

interface WizardDialogState<TSteps extends Record<string, object>> {
  init: boolean;
  stack: { step: keyof TSteps; props: any }[];
}

function WizardDialog<
  TSteps extends Record<string, object>,
  TIinitialStep extends string & keyof TSteps,
  TResult = void,
>({
  steps,
  initialStep,
  initialProps,
  onReject,
  onResolve,
}: WizardDialogProps<TSteps, TIinitialStep, TResult>) {
  const [{ init, stack }, setState] = useState<WizardDialogState<TSteps>>({
    init: false,
    stack: [{ step: initialStep, props: initialProps }],
  });
  const { step, props: stepProps } = stack.at(-1)!;
  const fromStep = stack.at(-2)?.step;
  const Component = steps[step];
  function onStep<TNext extends string & keyof TSteps, TCurrent extends string & keyof TSteps>(
    next: TNext,
    props: TSteps[TNext],
    current?: Partial<TSteps[TCurrent]>,
  ) {
    setState(({ stack }) => {
      const rest = stack.slice(0, -1);
      const currentStep = stack.at(-1)!;
      return {
        init: true,
        stack: [
          ...rest,
          { step: currentStep.step, props: { ...currentStep.props, ...current } },
          { step: next, props },
        ],
      };
    });
  }
  function onBack() {
    setState(({ init, stack }) => ({
      init,
      stack: stack.length > 1 ? stack.slice(0, -1) : stack,
    }));
  }
  const commonDialogProps = useMemo<Partial<ModalProps>>(
    () => ({ motionPreset: init ? "none" : "scale" }),
    [init],
  );
  return (
    <BaseDialogPropsProvider value={commonDialogProps}>
      <Component {...{ ...stepProps, onReject, onResolve, onStep, fromStep, onBack }} />
    </BaseDialogPropsProvider>
  );
}

interface _WizardStepDialogProps<
  TSteps extends Record<string, object>,
  TStep extends string & keyof TSteps,
> {
  onStep: <TNext extends string & keyof TSteps>(
    next: Exclude<TNext, TStep>,
    props: TSteps[TNext],
    current?: Partial<TSteps[TStep]>,
  ) => void;
  fromStep: keyof TSteps;
  onBack: () => void;
}

type WizardStepDialogPropsKeys = keyof _WizardStepDialogProps<any, any>;

export type WizardStepDialogProps<
  TSteps extends Record<string, object>,
  TStep extends string & keyof TSteps,
  TResult = void,
> = DialogProps<TSteps[TStep], TResult> & _WizardStepDialogProps<TSteps, TStep>;

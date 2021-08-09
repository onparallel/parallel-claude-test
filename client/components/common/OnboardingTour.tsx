import { gql } from "@apollo/client";
import { Box, Button, ChakraProvider, CloseButton, Heading, Stack, useId } from "@chakra-ui/react";
import { theme } from "@parallel/chakra/theme";
import { OnboardingKey, OnboardingStatus } from "@parallel/graphql/__types";
import { NoSSR } from "@parallel/utils/NoSSR";
import { ComponentType, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import ReactJoyride, {
  CallBackProps,
  Locale as ReactJoyrideLocale,
  Step,
  TooltipRenderProps,
} from "react-joyride";
import { Card } from "./Card";
import { Spacer } from "./Spacer";

export type Onboarding = {
  key: OnboardingKey | null;
  steps: Step[];
};

export const OnboardingTourContext = createContext<
  Onboarding & { isRunning: boolean; toggle: (isRunning: boolean) => void }
>({
  isRunning: false,
  key: null,
  steps: [],
  toggle: () => {},
});

export function withOnboarding(value: Onboarding) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return function <P>(Component: ComponentType<P>): ComponentType<P> {
    const WithTourSteps = function (props: P) {
      const [isRunning, setIsRunning] = useState(false);
      return (
        <OnboardingTourContext.Provider value={{ ...value, isRunning, toggle: setIsRunning }}>
          <Component {...props} />
        </OnboardingTourContext.Provider>
      );
    };
    const { displayName, ...rest } = Component;
    return Object.assign(WithTourSteps, rest, {
      displayName: `WithOnboarding(${displayName || Component.name})`,
    });
  };
}

const TourStep = ({
  continuous,
  index,
  step,
  backProps,
  skipProps,
  isLastStep,
  closeProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) => {
  const headerId = useId(undefined, "step-header");
  const bodyId = useId(undefined, "step-body");
  return (
    <ChakraProvider theme={theme}>
      <Card
        id="pw-onboarding-dialog"
        position="relative"
        width={
          step.target === "#__next" && step.placement === "center"
            ? "container.2xs"
            : "container.3xs"
        }
        border="none"
        maxWidth="100%"
        paddingY={4}
        paddingX={6}
        aria-labelledby={headerId}
        aria-describedby={bodyId}
        {...tooltipProps}
      >
        {step.hideCloseButton === false && (
          <CloseButton position="absolute" top={2} right={3} {...closeProps} />
        )}
        {step.title && (
          <Box as="header" id={headerId} paddingRight={4} marginBottom={4}>
            <Heading size="md">{step.title}</Heading>
          </Box>
        )}
        <Box id={bodyId}>{step.content}</Box>
        <Stack as="footer" direction="row" marginTop={4}>
          {skipProps && !isLastStep && (
            <Button {...skipProps} variant="outline">
              {step.locale!.skip}
            </Button>
          )}
          <Spacer />
          {index > 0 && <Button {...backProps}>{step.locale!.back}</Button>}
          {continuous && (
            <Button {...primaryProps} colorScheme="purple" id="pw-onboarding-next">
              {continuous
                ? isLastStep
                  ? step.locale!.last
                  : step.locale!.next
                : step.locale!.close}
            </Button>
          )}
        </Stack>
      </Card>
    </ChakraProvider>
  );
};

export type OnboardingTourProps = {
  status: Record<OnboardingKey, Record<OnboardingStatus, boolean>>;
  onUpdateTour: (key: OnboardingKey, status: OnboardingStatus) => void;
};

export function OnboardingTour({ status, onUpdateTour }: OnboardingTourProps) {
  const intl = useIntl();
  const { isRunning, toggle, key, steps } = useContext(OnboardingTourContext);
  const locale = useMemo(
    () =>
      ({
        last: intl.formatMessage({
          id: "tour.last",
          defaultMessage: "Ok. Let me try it!",
        }),
        next: intl.formatMessage({
          id: "generic.next",
          defaultMessage: "Next",
        }),
        back: intl.formatMessage({
          id: "generic.go-back",
          defaultMessage: "Go back",
        }),
        skip: intl.formatMessage({
          id: "generic.skip",
          defaultMessage: "Skip",
        }),
        close: intl.formatMessage({
          id: "generic.close",
          defaultMessage: "Close",
        }),
      } as ReactJoyrideLocale),
    [intl.locale]
  );
  useEffect(() => {
    if (key && !status[key]) {
      toggle(true);
    }
  }, [key && status[key]]);

  function handleCallback(data: CallBackProps) {
    if (
      (data.status === "skipped" || data.status === "finished") &&
      data.lifecycle === "complete"
    ) {
      toggle(false);
      if (key && status[key]?.SKIPPED && data.status === "finished") {
        onUpdateTour(key, "FINISHED");
      } else if (key && !status[key]) {
        onUpdateTour(key, data.status === "finished" ? "FINISHED" : "SKIPPED");
      }
    }
  }

  return (
    <NoSSR>
      <ReactJoyride
        steps={steps}
        tooltipComponent={TourStep}
        run={isRunning}
        continuous={true}
        scrollToFirstStep={true}
        showSkipButton={true}
        spotlightClicks={false}
        locale={locale}
        callback={handleCallback}
        // floater is adding some weird css filter which is making the tooltip look blurry sometimes
        floaterProps={{
          styles: {
            arrow: {
              length: 12,
              spread: 20,
            },
            floater: {
              filter: "none",
            },
          },
        }}
      />
    </NoSSR>
  );
}

OnboardingTour.fragments = {
  User: gql`
    fragment OnboardingTour_User on User {
      onboardingStatus
    }
  `,
};

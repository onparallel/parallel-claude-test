import {
  Box,
  Button,
  CloseButton,
  Stack,
  ThemeProvider,
} from "@chakra-ui/core";
import { OnboardingKey, OnboardingStatus } from "@parallel/graphql/__types";
import { NoSSR } from "@parallel/utils/NoSSR";
import { theme } from "@parallel/utils/theme";
import { useId } from "@reach/auto-id";
import { gql } from "apollo-boost";
import {
  ComponentType,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useIntl } from "react-intl";
import ReactJoyride, {
  CallBackProps,
  Locale as ReactJoyrideLocale,
  Step,
  TooltipRenderProps,
} from "react-joyride";
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
        <OnboardingTourContext.Provider
          value={{ ...value, isRunning, toggle: setIsRunning }}
        >
          <Component {...props} />
        </OnboardingTourContext.Provider>
      );
    };
    const { displayName, ...rest } = Component;
    return Object.assign(WithTourSteps, rest, {
      displayName: `WithTourSteps(${displayName || Component.name})`,
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
  const headerId = `step-header-${useId()}`;
  const bodyId = `step-body-${useId()}`;
  return (
    <ThemeProvider theme={theme}>
      <Box
        as="section"
        position="relative"
        background="white"
        width="380px"
        maxWidth="100%"
        rounded="md"
        shadow="0 7px 14px 0 rgba(0,0,0, 0.1), 0 3px 6px 0 rgba(0, 0, 0, .07)"
        aria-labelledby={headerId}
        aria-describedby={bodyId}
        {...tooltipProps}
      >
        {!step.hideCloseButton && (
          <CloseButton
            position="absolute"
            top={2}
            right={3}
            zIndex={1}
            {...closeProps}
          />
        )}
        {step.title && (
          <Box
            as="header"
            id={headerId}
            paddingLeft={6}
            paddingRight={12}
            paddingY={4}
            fontSize="xl"
            fontWeight="semibold"
          >
            {step.title}
          </Box>
        )}
        <Box paddingX={6} paddingY={2} id={bodyId}>
          {step.content}
        </Box>
        <Stack as="footer" paddingX={6} paddingY={4} direction="row">
          {skipProps && !isLastStep && (
            <Button {...skipProps} variant="outline">
              {step.locale!.skip}
            </Button>
          )}
          <Spacer />
          {index > 0 && <Button {...backProps}>{step.locale!.back}</Button>}
          {continuous && (
            <Button {...primaryProps} variantColor="purple">
              {continuous
                ? isLastStep
                  ? step.locale!.last
                  : step.locale!.next
                : step.locale!.close}
            </Button>
          )}
        </Stack>
      </Box>
    </ThemeProvider>
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
          id: "tour.next",
          defaultMessage: "Next",
        }),
        back: intl.formatMessage({
          id: "tour.back",
          defaultMessage: "Back",
        }),
        skip: intl.formatMessage({
          id: "tour.skip",
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
        spotlightClicks={true}
        locale={locale}
        callback={handleCallback}
        // floater is adding some weird css filter which is making the tooltip look blurry sometimes
        floaterProps={{
          styles: {
            floater: {
              filter: null,
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

import { Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import MotionNumber from "motion-number";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface DashboardNumberValueProps extends TextProps {
  value?: number;
  isPercentage?: boolean;
}

export const DashboardNumberValue = chakraForwardRef<"span", DashboardNumberValueProps>(
  ({ value, isPercentage, ...props }, ref) => {
    const intl = useIntl();

    return isNonNullish(value) && !Number.isNaN(value) ? (
      <Text
        ref={ref}
        as={MotionNumber}
        locales={intl.locale}
        value={value}
        {...(value > 10_000 && !isPercentage
          ? { title: intl.formatNumber(value, { maximumFractionDigits: 2 }) }
          : {})}
        format={
          isPercentage
            ? { style: "percent", maximumFractionDigits: 2 }
            : value >= 10_000
              ? { notation: "compact", compactDisplay: "short", maximumSignificantDigits: 3 }
              : {
                  maximumFractionDigits: 2,
                  minimumSignificantDigits: 4,
                  maximumSignificantDigits: 4,
                  trailingZeroDisplay: "stripIfInteger",
                }
        }
        {...props}
      />
    ) : (
      <Text as="span" ref={ref} {...props}>
        {"-"}
      </Text>
    );
  },
);

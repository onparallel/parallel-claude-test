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
        format={{ style: isPercentage ? "percent" : "decimal", maximumFractionDigits: 2 }}
        {...props}
      />
    ) : (
      <Text as="span" ref={ref} {...props}>
        {"-"}
      </Text>
    );
  },
);

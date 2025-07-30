import { Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import MotionNumber from "motion-number";
import { FormatNumberOptions, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
interface DashboardNumberValueProps extends TextProps {
  value?: number;
  isPercentage?: boolean;
  isEditing?: boolean;
}

export const DashboardNumberValue = chakraForwardRef<"span", DashboardNumberValueProps>(
  ({ value, isPercentage, isEditing, ...props }, ref) => {
    const intl = useIntl();

    const format =
      isNonNullish(value) && !Number.isNaN(value)
        ? isPercentage
          ? { style: "percent", maximumFractionDigits: 1 }
          : value >= 10_000
            ? {
                notation: "compact",
                compactDisplay: "short",
                maximumSignificantDigits: 3,
              }
            : {
                maximumFractionDigits: 2,
                minimumSignificantDigits: 4,
                maximumSignificantDigits: 4,
                trailingZeroDisplay: "stripIfInteger",
              }
        : {};

    return isNonNullish(value) && !Number.isNaN(value) ? (
      isEditing ? (
        <Text ref={ref} as="span" lineHeight="1.3" {...props}>
          {intl.formatNumber(value, format as FormatNumberOptions)}
        </Text>
      ) : (
        <Text
          ref={ref}
          as={MotionNumber}
          locales={intl.locale}
          value={value}
          {...(value > 10_000 && !isPercentage
            ? { title: intl.formatNumber(value, { maximumFractionDigits: 2 }) }
            : {})}
          format={format}
          {...props}
        />
      )
    ) : (
      <Text as="span" ref={ref} {...props}>
        {"-"}
      </Text>
    );
  },
);

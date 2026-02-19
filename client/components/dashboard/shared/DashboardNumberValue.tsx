import { chakra, TextProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Text } from "@parallel/components/ui";
import { AnimateNumber, type AnimateNumberProps } from "motion-number";
import { FormatNumberOptions, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

const StyledMotionNumber = chakra(AnimateNumber);
interface DashboardNumberValueProps extends TextProps {
  value?: number;
  isPercentage?: boolean;
  isEditing?: boolean;
}

export const DashboardNumberValue = chakraComponent<"span", DashboardNumberValueProps>(
  ({ ref, value, isPercentage, isEditing, ...props }) => {
    const intl = useIntl();
    const format: AnimateNumberProps["format"] =
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
        <StyledMotionNumber
          ref={ref}
          locales={intl.locale}
          {...(value > 10_000 && !isPercentage
            ? { title: intl.formatNumber(value, { maximumFractionDigits: 2 }) }
            : {})}
          format={format}
          {...props}
        >
          {value}
        </StyledMotionNumber>
      )
    ) : (
      <Text as="span" ref={ref} {...props}>
        {"-"}
      </Text>
    );
  },
);

import { SparklesIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  IconButtonWithTooltip,
  IconButtonWithTooltipProps,
} from "@parallel/components/common/IconButtonWithTooltip";
import { useIntl } from "react-intl";

interface SuggestionsButtonProps extends Omit<IconButtonWithTooltipProps, "label"> {
  areSuggestionsVisible: boolean;
  onClick: () => void;
}

export const SuggestionsButton = chakraForwardRef<"button", SuggestionsButtonProps>(
  function ASuggestionsButton({ areSuggestionsVisible, ...props }, ref) {
    const intl = useIntl();
    return (
      <IconButtonWithTooltip
        ref={ref}
        color={areSuggestionsVisible ? "purple.600" : undefined}
        icon={<SparklesIcon />}
        label={
          areSuggestionsVisible
            ? intl.formatMessage({
                id: "component.profile-field-input-group.hide-suggestions-button",
                defaultMessage: "Hide suggestions",
              })
            : intl.formatMessage({
                id: "component.profile-field-input-group.show-suggestions-button",
                defaultMessage: "Show suggestions",
              })
        }
        placement="left"
        size="sm"
        variant="ghost"
        {...props}
      />
    );
  },
);

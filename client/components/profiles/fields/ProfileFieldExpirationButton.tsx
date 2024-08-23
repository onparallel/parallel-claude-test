import { ButtonGroup, Circle } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import {
  IconButtonWithTooltip,
  IconButtonWithTooltipProps,
} from "@parallel/components/common/IconButtonWithTooltip";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { Duration } from "date-fns";
import { useIntl } from "react-intl";
import { useUpdateProfileFieldExpirationDialog } from "../dialogs/UpdateProfileFieldExpirationDialog";

interface ProfileFieldExpirationButtonProps
  extends Omit<IconButtonWithTooltipProps, "onChange" | "label"> {
  isDisabled: boolean;
  onChange: (expiryDate: string | null) => void;
  fieldName: LocalizableUserText;
  expiryDate?: string | null;
  expiryAlertAheadTime?: Duration | null;
}

export function ProfileFieldExpirationButton({
  onChange,
  isDisabled,
  fieldName,
  expiryDate,
  expiryAlertAheadTime,
  ...props
}: ProfileFieldExpirationButtonProps) {
  const intl = useIntl();

  const showUpdateExpiration = useUpdateProfileFieldExpirationDialog();
  const onEditVisibilityClick = async () => {
    try {
      const { expiryDate: expiration } = await showUpdateExpiration({
        expiryDate,
        expiryAlertAheadTime,
        fieldName,
      });
      onChange(expiration);
    } catch {}
  };

  const showDot = !isDisabled && !expiryDate;

  return (
    <ButtonGroup>
      <IconButtonWithTooltip
        {...props}
        leftIcon={
          showDot ? (
            <Circle background="primary.500" size={2} marginStart={1.5} marginEnd={-0.5} />
          ) : undefined
        }
        isDisabled={isDisabled}
        size="xs"
        minHeight={7}
        minWidth={7}
        icon={<FieldDateIcon boxSize={3.5} marginEnd={showDot ? 1.5 : undefined} />}
        label={intl.formatMessage({
          id: "component.profile-field.set-expiration-button-label",
          defaultMessage: "Set expiration",
        })}
        onClick={onEditVisibilityClick}
        placement="left"
      />
    </ButtonGroup>
  );
}

import { IManageIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "./IconButtonWithTooltip";
import { RestrictedFeaturePopover } from "./RestrictedFeaturePopover";

export const FileExportAccessIconButton = chakraForwardRef<
  "button",
  { url: string | null } & Omit<IconButtonWithTooltipProps, "label">
>(function FileExportAccessIconButton({ url, ...props }, ref) {
  const intl = useIntl();

  const isRestricted = !url;

  return (
    <RestrictedFeaturePopover
      isRestricted={isRestricted}
      content={
        <FormattedMessage
          id="component.file-export-access-icon-button.error-message-popover"
          defaultMessage="There was an error uploading the file. Please try again."
        />
      }
    >
      <IconButtonWithTooltip
        ref={ref}
        as="a"
        href={url}
        target="_href"
        rel="noopener"
        isDisabled={isRestricted}
        icon={<IManageIcon />}
        label={intl.formatMessage(
          {
            id: "component.file-export-access-icon-button.access-file",
            defaultMessage: "Access file in {provider}",
          },
          { provider: "iManage" },
        )}
        {...props}
      />
    </RestrictedFeaturePopover>
  );
});

import { NetDocumentsIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "./IconButtonWithTooltip";
import { NormalLink } from "./Link";

interface NetDocumentsLinkProps {
  externalId: string;
}

export const NetDocumentsLink = chakraForwardRef<"a", NetDocumentsLinkProps>(
  function NetDocumentsLink({ externalId, ...props }, ref) {
    return (
      <NormalLink
        ref={ref}
        href={`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${externalId}`}
        isExternal
        {...props}
      >
        <FormattedMessage
          id="component.netdocuments-link.open-file"
          defaultMessage="Open file in NetDocuments"
        />
      </NormalLink>
    );
  }
);

export const NetDocumentsIconButton = chakraForwardRef<
  "button",
  { externalId: string } & Omit<IconButtonWithTooltipProps, "label">
>(function NetDocumentsIconButton({ externalId, ...props }, ref) {
  const intl = useIntl();
  return (
    <IconButtonWithTooltip
      ref={ref}
      as="a"
      href={`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${externalId}`}
      target="_href"
      rel="noopener noreferer"
      icon={<NetDocumentsIcon />}
      label={intl.formatMessage({
        id: "component.netdocuments-iconbutton.open-file",
        defaultMessage: "Access file in NetDocuments",
      })}
      {...props}
    />
  );
});

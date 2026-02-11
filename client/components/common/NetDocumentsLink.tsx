import { NetDocumentsIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "./IconButtonWithTooltip";
import { NormalLink } from "./Link";

interface NetDocumentsLinkProps {
  externalId: string;
}

export const NetDocumentsLink = chakraComponent<"a", NetDocumentsLinkProps>(
  function NetDocumentsLink({ ref, externalId, ...props }) {
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
  },
);

export const NetDocumentsIconButton = chakraComponent<
  "button",
  { externalId: string } & Omit<IconButtonWithTooltipProps, "label">
>(function NetDocumentsIconButton({ ref, externalId, ...props }) {
  const intl = useIntl();
  return (
    <IconButtonWithTooltip
      ref={ref}
      as="a"
      href={`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${externalId}`}
      target="_href"
      rel="noopener"
      icon={<NetDocumentsIcon />}
      label={intl.formatMessage({
        id: "component.netdocuments-iconbutton.open-file",
        defaultMessage: "Access file in NetDocuments",
      })}
      {...props}
    />
  );
});

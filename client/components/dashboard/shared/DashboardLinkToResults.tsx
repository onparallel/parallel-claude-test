import { TableIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import NextLink from "next/link";

export function DashboardLinkToResults({ href, label }: { href: string; label: string }) {
  return (
    <IconButtonWithTooltip
      as={NextLink}
      href={href}
      size="sm"
      variant="ghost"
      icon={<TableIcon boxSize={4} />}
      label={label}
      opacity={0}
      sx={{
        "section:hover &": { opacity: 1 },
      }}
      _focus={{ opacity: 1 }}
      _active={{ opacity: 1 }}
      placement="right"
      className="no-print"
    />
  );
}

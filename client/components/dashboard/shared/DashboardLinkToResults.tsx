import { TableIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NakedLink } from "@parallel/components/common/Link";

export function DashboardLinkToResults({ href, label }: { href: string; label: string }) {
  return (
    <NakedLink href={href}>
      <IconButtonWithTooltip
        as="a"
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
      />
    </NakedLink>
  );
}

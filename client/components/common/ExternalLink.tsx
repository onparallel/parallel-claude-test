import { LinkProps } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NormalLink } from "./Link";

interface ExternalLinkProps extends LinkProps {
  hideIcon?: boolean;
}

export const ExternalLink = chakraForwardRef<"a", ExternalLinkProps>(function ExternalLink(
  { children, hideIcon, ...props },
  ref,
) {
  return (
    <NormalLink isExternal ref={ref} {...props}>
      {children}
      {hideIcon ? null : <ExternalLinkIcon verticalAlign="sub" marginStart={1} />}
    </NormalLink>
  );
});

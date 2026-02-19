import { LinkProps } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { NormalLink } from "./Link";

interface ExternalLinkProps extends LinkProps {
  hideIcon?: boolean;
}

export const ExternalLink = chakraComponent<"a", ExternalLinkProps>(function ExternalLink({
  ref,
  children,
  hideIcon,
  ...props
}) {
  return (
    <NormalLink isExternal ref={ref} {...props}>
      {children}
      {hideIcon ? null : <ExternalLinkIcon verticalAlign="sub" marginStart={1} />}
    </NormalLink>
  );
});

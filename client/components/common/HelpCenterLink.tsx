import { Box } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { NormalLink } from "./Link";

interface HelpCenterLinkProps {
  articleId: number;
}

export const HelpCenterLink = chakraForwardRef<"a", HelpCenterLinkProps>(function HelpCenterLink(
  { children, ...props },
  ref
) {
  return (
    <NormalLink as={NakedHelpCenterLink} ref={ref} {...props}>
      {children}
      <ExternalLinkIcon verticalAlign="sub" marginLeft={1} />
    </NormalLink>
  );
});

interface NakedHelpCenterLinkProps {
  articleId: number;
}

export const NakedHelpCenterLink = chakraForwardRef<"a", NakedHelpCenterLinkProps>(
  function HelpCenterLink({ articleId, onClick, ...props }, ref) {
    const intl = useIntl();
    return (
      <Box
        ref={ref as any}
        {...(props as any)}
        as="a"
        href={`https://help.onparallel.com/${intl.locale}/articles/${articleId}`}
        target="_blank"
        rel="noopener"
        onClick={(event) => {
          if (isDefined(window.Intercom)) {
            event.preventDefault();
            window.Intercom("showArticle", articleId);
          }
          onClick?.(event as any);
        }}
      />
    );
  }
);

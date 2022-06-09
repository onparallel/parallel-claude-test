import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { NormalLink } from "./Link";

interface HelpCenterLink {
  articleId: number;
  hideIcon?: boolean;
}

export const HelpCenterLink = chakraForwardRef<"a", HelpCenterLink>(function HelpCenterLink(
  { articleId, hideIcon, children, onClick, ...props },
  ref
) {
  const intl = useIntl();
  return (
    <NormalLink
      ref={ref}
      href={`https://help.onparallel.com/${intl.locale}/articles/${articleId}`}
      isExternal
      {...props}
      onClick={(event) => {
        if (isDefined(window.Intercom)) {
          event.preventDefault();
          window.Intercom("showArticle", articleId);
        }
        onClick?.(event);
      }}
    >
      {children}
      {hideIcon ? null : <ExternalLinkIcon verticalAlign="sub" marginLeft={1} />}
    </NormalLink>
  );
});

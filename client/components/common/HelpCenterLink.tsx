import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Box } from "@parallel/components/ui";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { NormalLink } from "./Link";

interface HelpCenterLinkProps {
  articleId: number;
}

export const HelpCenterLink = chakraComponent<"a", HelpCenterLinkProps>(function HelpCenterLink({
  ref,
  children,
  ...props
}) {
  return (
    <NormalLink
      as={NakedHelpCenterLink}
      ref={ref}
      display="inline-flex"
      alignItems="center"
      {...props}
    >
      {children}
      <ExternalLinkIcon verticalAlign="sub" marginStart={1} />
    </NormalLink>
  );
});

interface NakedHelpCenterLinkProps {
  articleId: number;
}

export const NakedHelpCenterLink = chakraComponent<"a", NakedHelpCenterLinkProps>(
  function HelpCenterLink({ ref, articleId, onClick, ...props }) {
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
          if (isNonNullish(window.Intercom)) {
            event.preventDefault();
            window.Intercom("showArticle", articleId);
          }
          onClick?.(event as any);
        }}
      />
    );
  },
);

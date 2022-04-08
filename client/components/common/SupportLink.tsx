import { chakraForwardRef } from "@parallel/chakra/utils";
import { isDefined } from "remeda";
import { NormalLink } from "./Link";

interface SupportLink {
  message: string;
}

export const SupportLink = chakraForwardRef<"a", SupportLink>(function SupportLink(
  { message, onClick, ...props },
  ref
) {
  return (
    <NormalLink
      ref={ref}
      href={`mailto:support@onparallel.com?body=${encodeURIComponent(message)}`}
      {...props}
      onClick={(event) => {
        if (isDefined(window.Intercom)) {
          event.preventDefault();
          window.Intercom("showNewMessage", message);
        }
        onClick?.(event);
      }}
    />
  );
});

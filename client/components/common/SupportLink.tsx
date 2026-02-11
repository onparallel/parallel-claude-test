import { chakraComponent } from "@parallel/chakra/utils";
import { isNonNullish } from "remeda";
import { NormalLink } from "./Link";

interface SupportLink {
  message: string;
}

export const SupportLink = chakraComponent<"a", SupportLink>(function SupportLink({
  ref,
  message,
  onClick,
  ...props
}) {
  return (
    <NormalLink
      ref={ref}
      href={`mailto:support@onparallel.com?body=${encodeURIComponent(message)}`}
      {...props}
      onClick={(event) => {
        if (isNonNullish(window.Intercom)) {
          event.preventDefault();
          window.Intercom("showNewMessage", message);
        }
        onClick?.(event);
      }}
    />
  );
});

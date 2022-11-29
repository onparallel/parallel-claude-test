import { Tone } from "@parallel/graphql/__types";
import { useUserPreference } from "@parallel/utils/useUserPreference";
import { useEffect } from "react";
import { useRecipientViewHelpDialog } from "./dialogs/RecipientViewHelpDialog";

export function useHelpModal({ tone }: { tone: Tone }) {
  const [firstTime, setFirstTime] = useUserPreference("recipient-first-time-check", "");
  const showRecipientViewHelpDialog = useRecipientViewHelpDialog();

  useEffect(() => {
    if (firstTime !== "check") showHelp();
  }, []);

  async function showHelp() {
    try {
      await showRecipientViewHelpDialog({ tone });
    } catch {}
    setFirstTime("check");
  }
  return async function () {
    try {
      await showRecipientViewHelpDialog({ tone });
    } catch {}
  };
}

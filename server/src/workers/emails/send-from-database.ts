import { isDefined } from "remeda";
import { WorkerContext } from "../../context";

export async function sendFromDatabase(
  payload: {
    email_log_id: number[];
  },
  context: WorkerContext,
) {
  return (await context.emailLogs.loadEmailLog(payload.email_log_id)).filter(isDefined);
}

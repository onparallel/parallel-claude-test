COMMAND=$1

if [[ "$COMMAND" == "start" ]]; then
  sudo systemctl ${COMMAND} parallel-completed-email-queue.service
  sudo systemctl ${COMMAND} parallel-email-events-queue.service
  sudo systemctl ${COMMAND} parallel-email-sender-queue.service
  sudo systemctl ${COMMAND} parallel-reminder-email-queue.service
  sudo systemctl ${COMMAND} parallel-reminder-trigger-cron.service
  sudo systemctl ${COMMAND} parallel-scheduled-trigger-cron.service
  sudo systemctl ${COMMAND} parallel-sendout-email-queue.service
else
  sudo systemctl ${COMMAND} parallel-*-{cron,queue}.service
fi

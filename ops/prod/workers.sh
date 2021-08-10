COMMAND=$1
ENV="#ENV#"

if [[ "$COMMAND" == "start" ]]; then
  
  sudo systemctl ${COMMAND} parallel-email-events-queue.service
  sudo systemctl ${COMMAND} parallel-email-sender-queue.service
  sudo systemctl ${COMMAND} parallel-event-processor-queue.service
  sudo systemctl ${COMMAND} parallel-signature-worker-queue.service
  sudo systemctl ${COMMAND} parallel-reminder-trigger-cron.service
  sudo systemctl ${COMMAND} parallel-scheduled-trigger-cron.service
  sudo systemctl ${COMMAND} parallel-petition-notifications-cron.service
  sudo systemctl ${COMMAND} parallel-organization-limits-cron.service
  if [[ "$ENV" == "production" ]]; then
    sudo systemctl ${COMMAND} parallel-reporting-cron.service
  fi
else
  sudo systemctl ${COMMAND} parallel-*-{cron,queue}.service
fi

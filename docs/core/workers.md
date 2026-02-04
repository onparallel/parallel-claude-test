# Background Workers

Documentation for the background worker processes that handle asynchronous tasks in Parallel.

**Note:** All commands below assume you're in the `server/` directory unless otherwise specified.

---

## Overview

Workers are Node.js processes that run independently from the main server. They handle:

- Email sending
- Event processing
- Scheduled tasks (reminders, notifications)
- Data anonymization (GDPR compliance)
- Webhook delivery
- Signature processing
- Background checks

## Worker Types

There are two main types of workers:

1. **Queue Workers** - Process messages from Redis/SQS queues
2. **Cron Workers** - Execute on a schedule (every minute, hour, etc.)

---

## Queue Workers

### `worker:tasks`

The main task worker processes async jobs from the task queue, including bulk petition sending, exports, and imports.

```bash
yarn worker:tasks start
```

### `worker:email-sender`

Sends emails via AWS SES. Processes email queue messages and builds emails using templates.

```bash
yarn worker:email-sender start
```

**Note for development:** In the `server` folder, you must have a `.development.env` file with a property called `EMAILS_WHITELIST`. Only the email addresses listed in this property will be allowed for outgoing emails during development.

Example:

```
EMAILS_WHITELIST=you@onparallel.com,user2@gmail.com,...
```

### `worker:event-processor`

Processes domain events (petition created, field replied, etc.) and triggers appropriate actions like notifications, webhooks, and audit logging.

```bash
yarn worker:event-processor start
```

### `worker:signature`

Handles electronic signature processes with providers like Signaturit and DocuSign.

```bash
yarn worker:signature start
```

### `worker:webhooks`

Delivers webhook events to external systems configured by organizations.

```bash
yarn worker:webhooks start
```

### `worker:email-events`

Processes email delivery events from AWS SES (bounces, complaints, deliveries).

```bash
yarn worker:email-events start
```

### `worker:delay-queue`

Processes delayed messages - messages scheduled to be processed at a future time.

```bash
yarn worker:delay-queue start
```

### `worker:low-priority-event-queue`

Processes low-priority events that don't require immediate processing.

```bash
yarn worker:low-priority-event-queue start
```

---

## Cron Workers

### `worker:reminder-trigger`

Triggers automatic reminders for pending petitions based on configured reminder schedules.

```bash
yarn worker:reminder-trigger start
```

### `worker:scheduled-trigger`

Triggers scheduled actions and time-based automations.

```bash
yarn worker:scheduled-trigger start
```

### `worker:petition-notifications`

Processes and sends batched notifications (comments, signature cancellations).

```bash
yarn worker:petition-notifications start
```

### `worker:anonymizer`

GDPR compliance worker that anonymizes data after retention periods. Handles deleted petitions, replies, comments, contacts, files, and scheduled deletions.

```bash
yarn worker:anonymizer start
```

### `worker:organization-limits`

Resets organization usage limits on their cycle dates (monthly quotas, etc.).

```bash
yarn worker:organization-limits start
```

### `worker:old-notifications`

Cleans up old notification records from the database.

```bash
yarn worker:old-notifications start
```

### `worker:expiring-properties`

Checks for expiring profile properties (documents, certifications) and triggers alerts.

```bash
yarn worker:expiring-properties start
```

### `worker:background-check-monitor`

Monitors ongoing background checks and updates their status.

```bash
yarn worker:background-check-monitor start
```

### `worker:adverse-media-monitor`

Monitors adverse media checks for profiles (KYC/AML compliance).

```bash
yarn worker:adverse-media-monitor start
```

### `worker:sap-profile-polling`

Triggers scheduled SAP profile syncs based on integration settings.

```bash
yarn worker:sap-profile-polling start
```

### `worker:background-check-profile-search`

Processes bulk profile searches for background checks.

```bash
yarn worker:background-check-profile-search start
```

---

## Running Workers

### Development

Run individual workers:

```bash
cd server
yarn worker:tasks start
yarn worker:email-sender start
```

Run all workers concurrently:

```bash
cd server
yarn dev-workers
```

### Production

Workers are deployed as separate processes/containers. Each worker should be started with:

```bash
yarn workspace @parallel/server worker:<name> start
```

Or from the `server/` directory:
```bash
cd server
yarn worker:<name> start
```

---

## Architecture Diagram

```
                                    ┌─────────────────────┐
                                    │     Redis/SQS       │
                                    │      Queues         │
                                    └──────────┬──────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────────────┐
        │                                      │                                      │
        ▼                                      ▼                                      ▼
┌───────────────┐                    ┌───────────────┐                    ┌───────────────┐
│  task-worker  │                    │ email-sender  │                    │ event-processor│
│  (bulk jobs)  │                    │   (emails)    │                    │   (events)    │
└───────────────┘                    └───────────────┘                    └───────────────┘
        │                                      │                                      │
        │                                      │                                      │
        ▼                                      ▼                                      ▼
┌───────────────┐                    ┌───────────────┐                    ┌───────────────┐
│   PostgreSQL  │                    │    AWS SES    │                    │   Webhooks    │
└───────────────┘                    └───────────────┘                    └───────────────┘
```

---

## Configuration

Workers are configured in `server/src/config.ts`. Each worker has its schedule (for cron workers) and processing parameters.

See `server/src/workers/` for implementation details.

import { DeepReadonly } from "ts-essentials";

export const CONFIG = Symbol.for("CONFIG");

export type Config = ReturnType<typeof buildConfig>;

export function buildConfig() {
  return deepFreeze({
    db: {
      "read-write": {
        host: process.env.DB_HOST!,
        database: process.env.DB_DATABASE!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        port: parseInt(process.env.DB_PORT!),
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS!),
      },
      "read-only": {
        host: process.env.READONLY_DB_HOST!,
        database: process.env.READONLY_DB_DATABASE!,
        user: process.env.READONLY_DB_USER!,
        password: process.env.READONLY_DB_PASSWORD!,
        port: parseInt(process.env.READONLY_DB_PORT!),
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS!),
      },
    },
    cognito: {
      domain: process.env.COGNITO_DOMAIN!,
      clientId: process.env.COGNITO_CLIENT_ID!,
      defaultPoolId: process.env.COGNITO_DEFAULT_POOL_ID!,
    },
    redis: {
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!),
    },
    aws: {
      credentials: {
        accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
      },
      region: process.env._AWS_REGION!,
    },
    s3: {
      fileUploadsBucketName: process.env.S3_FILE_UPLOADS_BUCKET_NAME!,
      temporaryFilesBucketName: process.env.S3_TEMPORARY_FILES_BUCKET_NAME!,
      publicFilesBucketName: process.env.S3_PUBLIC_FILES_BUCKET_NAME!,
    },
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!),
      user: process.env.SMTP_USER!,
      password: process.env.SMTP_PASSWORD!,
    },
    ses: {
      configurationSet: {
        tracking: process.env.SES_CONFIGURATION_SET_TRACKING!,
        noTracking: process.env.SES_CONFIGURATION_SET_NO_TRACKING!,
      },
    },
    analytics: {
      writeKey: process.env.ANALYTICS_SEGMENT_WRITE_KEY, // can be undefined
    },
    security: {
      jwtSecret: process.env.SECURITY_SERVICE_JWT_SECRET!,
    },
    signature: {
      signaturitSandboxApiKey: process.env.SIGNATURIT_SANDBOX_API_KEY!,
      signaturitSharedProductionApiKey: process.env.SIGNATURIT_SHARED_PRODUCTION_API_KEY!,
    },
    recaptcha: {
      secretKey: process.env.RECAPTCHA_SECRET_KEY!,
    },
    queueWorkers: {
      "email-sender": {
        endpoint: process.env.WORKERS_EMAIL_SENDER_ENDPOINT!,
      },
      "email-events": {
        endpoint: process.env.WORKERS_EMAIL_EVENTS_ENDPOINT!,
      },
      "signature-worker": {
        endpoint: process.env.WORKERS_SIGNATURE_ENDPOINT!,
      },
      "event-processor": {
        endpoint: process.env.WORKERS_EVENT_PROCESSOR_ENDPOINT!,
      },
      "task-worker": {
        endpoint: process.env.WORKERS_TASK_WORKER_ENDPOINT!,
      },
    },
    cronWorkers: {
      "scheduled-trigger": {
        rule: process.env.WORKERS_SCHEDULED_TRIGGER_RULE!,
      },
      "reminder-trigger": {
        rule: process.env.WORKERS_REMINDER_TRIGGER_RULE!,
      },
      "petition-notifications": {
        rule: process.env.WORKERS_PETITION_NOTIFICATIONS_RULE!,
        minutesBeforeNotify: parseInt(
          process.env.WORKERS_PETITION_NOTIFICATIONS_MINUTES_BEFORE_NOTIFY!,
          10
        ),
      },
      "organization-limits": {
        rule: process.env.WORKERS_ORGANIZATION_LIMITS_RULE!,
      },
      anonymizer: {
        rule: process.env.WORKERS_ANONYMIZER_RULE!,
        anonymizeAfterDays: parseInt(process.env.WORKERS_ANONYMIZER_AFTER_DAYS!),
      },
    },
    imageProxy: {
      secret: process.env.IMAGE_PROXY_SIGNATURE_SECRET!,
    },
    logs: {
      groupName: process.env.LOGS_GROUP_NAME!,
      streamName: process.env.LOGS_STREAM_NAME!,
    },
    misc: {
      assetsUrl: process.env.ASSETS_URL!,
      imagesUrl: process.env.IMAGES_URL!,
      parallelUrl: process.env.PARALLEL_URL!,
      webhooksUrl: process.env.WEBHOOKS_BASE_URL!,
      emailFrom: process.env.EMAIL_FROM!,
      clientServerToken: process.env.CLIENT_SERVER_TOKEN!,
    },
    development: {
      whitelistedEmails: (process.env.EMAILS_WHITELIST ?? "").split(","),
    },
    appsumo: {
      username: process.env.APPSUMO_USERNAME!,
      password: process.env.APPSUMO_PASSWORD!,
    },
  });
}

function deepFreeze<T extends {}>(obj: T): DeepReadonly<T> {
  for (const propertyName of Object.getOwnPropertyNames(obj)) {
    const value = (obj as any)[propertyName] as any;

    if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value as any);
    }
  }
  return Object.freeze(obj) as any;
}

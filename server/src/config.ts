export const CONFIG = Symbol.for("CONFIG");

export type Config = ReturnType<typeof buildConfig>;

export function buildConfig() {
  return Object.freeze({
    db: Object.freeze({
      host: process.env.DB_HOST!,
      database: process.env.DB_DATABASE!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      port: parseInt(process.env.DB_PORT!),
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS!),
    }),
    cognito: Object.freeze({
      clientId: process.env.COGNITO_CLIENT_ID!,
      defaultPoolId: process.env.COGNITO_DEFAULT_POOL_ID!,
    }),
    redis: Object.freeze({
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!),
    }),
    aws: Object.freeze({
      accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
      region: process.env._AWS_REGION!,
    }),
    s3: Object.freeze({
      fileUploadsBucketName: process.env.S3_FILE_UPLOADS_BUCKET_NAME!,
      temporaryFilesBucketName: process.env.S3_TEMPORARY_FILES_BUCKET_NAME!,
    }),
    smtp: Object.freeze({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!),
      user: process.env.SMTP_USER!,
      password: process.env.SMTP_PASSWORD!,
    }),
    ses: Object.freeze({
      configurationSet: Object.freeze({
        tracking: process.env.SES_CONFIGURATION_SET_TRACKING!,
        noTracking: process.env.SES_CONFIGURATION_SET_NO_TRACKING!,
      }),
    }),
    analytics: Object.freeze({
      writeKey: process.env.ANALYTICS_SEGMENT_WRITE_KEY, // can be undefined
    }),
    signature: Object.freeze({
      jwtSecret: process.env.SIGNATURE_SERVICE_JWT_SECRET!,
    }),
    queueWorkers: Object.freeze({
      "email-sender": Object.freeze({
        endpoint: process.env.WORKERS_EMAIL_SENDER_ENDPOINT!,
      }),
      "email-events": Object.freeze({
        endpoint: process.env.WORKERS_EMAIL_EVENTS_ENDPOINT!,
      }),
      "signature-worker": Object.freeze({
        endpoint: process.env.WORKERS_SIGNATURE_ENDPOINT!,
      }),
    }),
    cronWorkers: Object.freeze({
      "scheduled-trigger": Object.freeze({
        rule: process.env.WORKERS_SCHEDULED_TRIGGER_RULE!,
      }),
      "reminder-trigger": Object.freeze({
        rule: process.env.WORKERS_REMINDER_TRIGGER_RULE!,
      }),
      reporting: Object.freeze({
        rule: process.env.WORKERS_REPORTING_RULE!,
      }),
    }),
    logs: Object.freeze({
      groupName: process.env.LOGS_GROUP_NAME!,
      streamName: process.env.LOGS_STREAM_NAME!,
    }),
    misc: Object.freeze({
      assetsUrl: process.env.ASSETS_URL!,
      parallelUrl: process.env.PARALLEL_URL!,
      emailFrom: process.env.EMAIL_FROM!,
      clientServerToken: process.env.CLIENT_SERVER_TOKEN!,
    }),
  });
}

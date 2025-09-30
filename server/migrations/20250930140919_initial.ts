import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
  





















CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;






COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';






CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;






COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';






CREATE TYPE public.ai_completion_log_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED'
);






CREATE TYPE public.ai_completion_log_type AS ENUM (
    'PETITION_SUMMARY',
    'DOCUMENT_PROCESSING'
);






CREATE TYPE public.contact_locale AS ENUM (
    'en',
    'es',
    'ca',
    'it',
    'pt'
);






CREATE TYPE public.dashboard_module_size AS ENUM (
    'SMALL',
    'MEDIUM',
    'LARGE'
);






CREATE TYPE public.dashboard_module_type AS ENUM (
    'PROFILES_NUMBER',
    'PROFILES_RATIO',
    'PROFILES_PIE_CHART',
    'PETITIONS_NUMBER',
    'PETITIONS_RATIO',
    'PETITIONS_PIE_CHART',
    'CREATE_PETITION_BUTTON'
);






CREATE TYPE public.dashboard_permission_type AS ENUM (
    'READ',
    'WRITE',
    'OWNER'
);






CREATE TYPE public.document_processing_type AS ENUM (
    'PAYSLIP'
);






CREATE TYPE public.event_subscription_type AS ENUM (
    'PETITION',
    'PROFILE'
);






CREATE TYPE public.feature_flag_name AS ENUM (
    'PETITION_SIGNATURE',
    'HIDE_RECIPIENT_VIEW_CONTENTS',
    'SKIP_FORWARD_SECURITY',
    'EXPORT_CUATRECASAS',
    'REMOVE_WHY_WE_USE_PARALLEL',
    'ON_BEHALF_OF',
    'GHOST_LOGIN',
    'ES_TAX_DOCUMENTS_FIELD',
    'REMOVE_PARALLEL_BRANDING',
    'CUSTOM_HOST_UI',
    'PUBLIC_PETITION_LINK_PREFILL_SECRET_UI',
    'PETITION_ACCESS_RECIPIENT_URL_FIELD',
    'AUTO_ANONYMIZE',
    'TEMPLATE_REPLIES_PREVIEW_URL',
    'DOW_JONES_KYC',
    'PUBLIC_PETITION_LINK_PREFILL_DATA',
    'DOCUSIGN_SANDBOX_PROVIDER',
    'CLIENT_PORTAL',
    'PROFILES',
    'PERMISSION_MANAGEMENT',
    'CUSTOM_PROPERTIES',
    'BULK_PETITION_SEND_TASK',
    'TEMPLATE_REPLIES_CSV_EXPORT_TASK',
    'SETTING_DELEGATE_ACCESS',
    'PETITION_SUMMARY',
    'RECIPIENT_LANG_CA',
    'RECIPIENT_LANG_IT',
    'RECIPIENT_LANG_PT',
    'BACKGROUND_CHECK',
    'CREATE_PROFILE_TYPE',
    'PDF_EXPORT_V2',
    'SHOW_CONTACTS_BUTTON',
    'KEY_PROCESSES',
    'DASHBOARDS',
    'PETITION_APPROVAL_FLOW',
    'PROFILE_SEARCH_FIELD',
    'REMOVE_PREVIEW_FILES',
    'DOCUMENT_PROCESSING',
    'ADVERSE_MEDIA_SEARCH',
    'SIGN_WITH_DIGITAL_CERTIFICATE',
    'SIGN_WITH_EMBEDDED_IMAGE'
);






CREATE TYPE public.integration_type AS ENUM (
    'SIGNATURE',
    'SSO',
    'USER_PROVISIONING',
    'DOW_JONES_KYC',
    'AI_COMPLETION',
    'ID_VERIFICATION',
    'DOCUMENT_PROCESSING',
    'PROFILE_EXTERNAL_SOURCE',
    'FILE_EXPORT'
);






CREATE TYPE public.license_code_status AS ENUM (
    'PENDING',
    'REDEEMED',
    'EXPIRED'
);






CREATE TYPE public.list_view_type AS ENUM (
    'ALL',
    'CUSTOM'
);






CREATE TYPE public.organization_status AS ENUM (
    'DEV',
    'DEMO',
    'ACTIVE',
    'CHURNED',
    'ROOT',
    'INACTIVE'
);






CREATE TYPE public.organization_theme_type AS ENUM (
    'PDF_DOCUMENT',
    'BRAND'
);






CREATE TYPE public.organization_usage_limit_name AS ENUM (
    'PETITION_SEND',
    'SIGNATURIT_SHARED_APIKEY'
);






CREATE TYPE public.petition_access_status AS ENUM (
    'ACTIVE',
    'INACTIVE'
);






CREATE TYPE public.petition_approval_request_step_approval_type AS ENUM (
    'ANY',
    'ALL'
);






CREATE TYPE public.petition_approval_request_step_status AS ENUM (
    'NOT_STARTED',
    'NOT_APPLICABLE',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELED',
    'SKIPPED'
);






CREATE TYPE public.petition_attachment_type AS ENUM (
    'FRONT',
    'ANNEX',
    'BACK'
);






CREATE TYPE public.petition_contact_notification_type AS ENUM (
    'COMMENT_CREATED'
);






CREATE TYPE public.petition_event_type AS ENUM (
    'PETITION_CREATED',
    'PETITION_COMPLETED',
    'ACCESS_ACTIVATED',
    'ACCESS_DEACTIVATED',
    'ACCESS_OPENED',
    'MESSAGE_SCHEDULED',
    'MESSAGE_CANCELLED',
    'MESSAGE_SENT',
    'REMINDER_SENT',
    'REPLY_CREATED',
    'REPLY_DELETED',
    'COMMENT_PUBLISHED',
    'COMMENT_DELETED',
    'USER_PERMISSION_ADDED',
    'USER_PERMISSION_REMOVED',
    'USER_PERMISSION_EDITED',
    'OWNERSHIP_TRANSFERRED',
    'PETITION_CLOSED',
    'PETITION_CLOSED_NOTIFIED',
    'PETITION_REOPENED',
    'SIGNATURE_STARTED',
    'SIGNATURE_COMPLETED',
    'SIGNATURE_CANCELLED',
    'ACCESS_DELEGATED',
    'REPLY_UPDATED',
    'GROUP_PERMISSION_ADDED',
    'GROUP_PERMISSION_EDITED',
    'GROUP_PERMISSION_REMOVED',
    'TEMPLATE_USED',
    'PETITION_CLONED',
    'PETITION_DELETED',
    'REMINDERS_OPT_OUT',
    'ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK',
    'RECIPIENT_SIGNED',
    'PETITION_MESSAGE_BOUNCED',
    'PETITION_REMINDER_BOUNCED',
    'SIGNATURE_REMINDER',
    'SIGNATURE_OPENED',
    'PETITION_ANONYMIZED',
    'REPLY_STATUS_CHANGED',
    'PROFILE_ASSOCIATED',
    'PROFILE_DISASSOCIATED',
    'SIGNATURE_DELIVERED',
    'PETITION_TAGGED',
    'PETITION_UNTAGGED',
    'CONTACTLESS_ACCESS_USED',
    'PETITION_APPROVAL_REQUEST_STEP_STARTED',
    'PETITION_APPROVAL_REQUEST_STEP_APPROVED',
    'PETITION_APPROVAL_REQUEST_STEP_REJECTED',
    'PETITION_APPROVAL_REQUEST_STEP_SKIPPED',
    'PETITION_APPROVAL_REQUEST_STEP_REMINDER',
    'PETITION_APPROVAL_REQUEST_STEP_FINISHED',
    'PETITION_APPROVAL_REQUEST_STEP_CANCELED',
    'PETITION_SCHEDULED_FOR_DELETION',
    'PETITION_RECOVERED_FROM_DELETION'
);






CREATE TYPE public.petition_field_reply_status AS ENUM (
    'PENDING',
    'REJECTED',
    'APPROVED'
);






CREATE TYPE public.petition_field_type AS ENUM (
    'TEXT',
    'FILE_UPLOAD',
    'HEADING',
    'SELECT',
    'DYNAMIC_SELECT',
    'SHORT_TEXT',
    'CHECKBOX',
    'NUMBER',
    'PHONE',
    'DATE',
    'ES_TAX_DOCUMENTS',
    'DOW_JONES_KYC',
    'DATE_TIME',
    'FIELD_GROUP',
    'BACKGROUND_CHECK',
    'ID_VERIFICATION',
    'PROFILE_SEARCH',
    'ADVERSE_MEDIA_SEARCH'
);






CREATE TYPE public.petition_message_status AS ENUM (
    'SCHEDULED',
    'CANCELLED',
    'PROCESSING',
    'PROCESSED'
);






CREATE TYPE public.petition_permission_type AS ENUM (
    'OWNER',
    'WRITE',
    'READ'
);






CREATE TYPE public.petition_reminder_status AS ENUM (
    'PROCESSING',
    'PROCESSED',
    'ERROR'
);






CREATE TYPE public.petition_reminder_type AS ENUM (
    'MANUAL',
    'AUTOMATIC'
);






CREATE TYPE public.petition_signature_cancel_reason AS ENUM (
    'CANCELLED_BY_USER',
    'DECLINED_BY_SIGNER',
    'REQUEST_ERROR',
    'REQUEST_RESTARTED',
    'REQUEST_EXPIRED'
);






CREATE TYPE public.petition_signature_status AS ENUM (
    'ENQUEUED',
    'PROCESSING',
    'PROCESSED',
    'CANCELLING',
    'CANCELLED',
    'COMPLETED'
);






CREATE TYPE public.petition_status AS ENUM (
    'DRAFT',
    'PENDING',
    'COMPLETED',
    'CLOSED'
);






CREATE TYPE public.petition_user_notification_type AS ENUM (
    'COMMENT_CREATED',
    'PETITION_COMPLETED',
    'SIGNATURE_COMPLETED',
    'SIGNATURE_CANCELLED',
    'PETITION_SHARED',
    'MESSAGE_EMAIL_BOUNCED',
    'REMINDERS_OPT_OUT',
    'REMINDER_EMAIL_BOUNCED',
    'ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK'
);






CREATE TYPE public.profile_event_type AS ENUM (
    'PROFILE_CREATED',
    'PROFILE_FIELD_VALUE_UPDATED',
    'PROFILE_FIELD_FILE_ADDED',
    'PROFILE_FIELD_FILE_REMOVED',
    'PROFILE_FIELD_EXPIRY_UPDATED',
    'PETITION_ASSOCIATED',
    'PETITION_DISASSOCIATED',
    'PROFILE_CLOSED',
    'PROFILE_SCHEDULED_FOR_DELETION',
    'PROFILE_REOPENED',
    'PROFILE_ANONYMIZED',
    'PROFILE_UPDATED',
    'PROFILE_RELATIONSHIP_CREATED',
    'PROFILE_RELATIONSHIP_REMOVED',
    'PROFILE_FIELD_VALUE_MONITORED'
);






CREATE TYPE public.profile_relationship_type_direction AS ENUM (
    'LEFT_RIGHT',
    'RIGHT_LEFT'
);






CREATE TYPE public.profile_status AS ENUM (
    'OPEN',
    'CLOSED',
    'DELETION_SCHEDULED'
);






CREATE TYPE public.profile_type_field_permission_type AS ENUM (
    'HIDDEN',
    'READ',
    'WRITE'
);






CREATE TYPE public.profile_type_field_type AS ENUM (
    'TEXT',
    'SHORT_TEXT',
    'FILE',
    'DATE',
    'PHONE',
    'NUMBER',
    'SELECT',
    'BACKGROUND_CHECK',
    'CHECKBOX',
    'ADVERSE_MEDIA_SEARCH'
);






CREATE TYPE public.profile_type_standard_type AS ENUM (
    'INDIVIDUAL',
    'LEGAL_ENTITY',
    'CONTRACT'
);






CREATE TYPE public.standard_list_definition_list_type AS ENUM (
    'COUNTRIES'
);






CREATE TYPE public.system_event_type AS ENUM (
    'USER_CREATED',
    'USER_LOGGED_IN',
    'EMAIL_OPENED',
    'EMAIL_VERIFIED',
    'INVITE_SENT',
    'ORGANIZATION_LIMIT_REACHED'
);






CREATE TYPE public.task_name AS ENUM (
    'PRINT_PDF',
    'EXPORT_REPLIES',
    'EXPORT_EXCEL',
    'TEMPLATE_REPLIES_REPORT',
    'TEMPLATE_STATS_REPORT',
    'DOW_JONES_PROFILE_DOWNLOAD',
    'TEMPLATES_OVERVIEW_REPORT',
    'BANKFLIP_SESSION_COMPLETED',
    'BULK_PETITION_SEND',
    'TEMPLATE_REPLIES_CSV_EXPORT',
    'PETITION_SUMMARY',
    'BACKGROUND_CHECK_PROFILE_PDF',
    'PETITION_SHARING',
    'PROFILE_NAME_PATTERN_UPDATED',
    'ID_VERIFICATION_SESSION_COMPLETED',
    'FILE_EXPORT',
    'CLOSE_PETITIONS',
    'PROFILES_EXCEL_IMPORT',
    'DASHBOARD_REFRESH',
    'PROFILES_EXCEL_EXPORT',
    'DOCUMENT_PROCESSING'
);






CREATE TYPE public.task_status AS ENUM (
    'ENQUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);






CREATE TYPE public.user_group_permission_effect AS ENUM (
    'GRANT',
    'DENY'
);






CREATE TYPE public.user_group_permission_name AS ENUM (
    'SUPERADMIN',
    'REPORTS:OVERVIEW',
    'REPORTS:TEMPLATE_STATISTICS',
    'REPORTS:TEMPLATE_REPLIES',
    'PROFILES:DELETE_PROFILES',
    'PROFILES:DELETE_PERMANENTLY_PROFILES',
    'PROFILE_TYPES:CRUD_PROFILE_TYPES',
    'INTEGRATIONS:CRUD_INTEGRATIONS',
    'USERS:CRUD_USERS',
    'USERS:GHOST_LOGIN',
    'TEAMS:CRUD_TEAMS',
    'ORG_SETTINGS',
    'CONTACTS:DELETE_CONTACTS',
    'PETITIONS:SEND_ON_BEHALF',
    'PETITIONS:CHANGE_PATH',
    'PETITIONS:CREATE_TEMPLATES',
    'INTEGRATIONS:CRUD_API',
    'PROFILES:SUBSCRIBE_PROFILES',
    'PETITIONS:CREATE_PETITIONS',
    'PROFILES:CREATE_PROFILES',
    'PROFILES:CLOSE_PROFILES',
    'PROFILES:LIST_PROFILES',
    'PROFILE_ALERTS:LIST_ALERTS',
    'CONTACTS:LIST_CONTACTS',
    'USERS:LIST_USERS',
    'TEAMS:LIST_TEAMS',
    'TAGS:CREATE_TAGS',
    'TAGS:UPDATE_TAGS',
    'TAGS:DELETE_TAGS',
    'TEAMS:READ_PERMISSIONS',
    'TEAMS:UPDATE_PERMISSIONS',
    'PETITIONS:LIST_PUBLIC_TEMPLATES',
    'DASHBOARDS:CRUD_DASHBOARDS',
    'PROFILES:IMPORT_EXPORT_PROFILES',
    'DASHBOARDS:LIST_DASHBOARDS',
    'DASHBOARDS:CREATE_DASHBOARDS'
);






CREATE TYPE public.user_group_type AS ENUM (
    'NORMAL',
    'ALL_USERS',
    'INITIAL'
);






CREATE TYPE public.user_locale AS ENUM (
    'en',
    'es'
);






CREATE TYPE public.user_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ON_HOLD'
);






CREATE FUNCTION public.get_folder_after_prefix(path text, prefix text) RETURNS text
    LANGUAGE plpgsql
    AS $$
    declare
      without_prefix text;
    begin
      without_prefix := substring(path, char_length(prefix) + 1);
      return case
        when without_prefix = '' then null
        else split_part(without_prefix, '/', 1)
      end;
    end;
    $$;






CREATE FUNCTION public.profile_field_value_content_is_equal(type public.profile_type_field_type, a jsonb, b jsonb) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
    begin
      -- on complex fields we don't want to compare, and will always assume they are different
      if (type = 'BACKGROUND_CHECK' or type = 'ADVERSE_MEDIA_SEARCH') then
        return false;
        
      elsif type = 'CHECKBOX' then
        return (a -> 'value') @> (b -> 'value') and (a -> 'value') <@ (b -> 'value');
    
      else
        return a ->> 'value' IS NOT DISTINCT FROM b ->> 'value';
      end if;
    end;
    $$;










CREATE TABLE public.ai_completion_log (
    id integer NOT NULL,
    integration_id integer NOT NULL,
    type public.ai_completion_log_type NOT NULL,
    status public.ai_completion_log_status DEFAULT 'PENDING'::public.ai_completion_log_status NOT NULL,
    request_params jsonb NOT NULL,
    raw_response jsonb,
    completion text,
    error jsonb,
    request_tokens integer,
    response_tokens integer,
    cost character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deprecated_at timestamp with time zone,
    request_duration_ms integer,
    CONSTRAINT ai_completion_log__failed_error CHECK ((((status = 'FAILED'::public.ai_completion_log_status) AND (error IS NOT NULL)) OR (status <> 'FAILED'::public.ai_completion_log_status)))
);






CREATE SEQUENCE public.ai_completion_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.ai_completion_log_id_seq OWNED BY public.ai_completion_log.id;






CREATE TABLE public.contact (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255),
    org_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    last_email_bounced boolean DEFAULT false NOT NULL,
    anonymized_at timestamp with time zone
);






CREATE TABLE public.contact_authentication (
    id integer NOT NULL,
    contact_id integer NOT NULL,
    cookie_value_hash character varying(255) NOT NULL,
    access_log jsonb DEFAULT '[]'::jsonb NOT NULL
);






CREATE SEQUENCE public.contact_authentication_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.contact_authentication_id_seq OWNED BY public.contact_authentication.id;






CREATE TABLE public.contact_authentication_request (
    id integer NOT NULL,
    petition_access_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    remaining_attempts integer NOT NULL,
    email_log_id integer,
    ip character varying(255),
    user_agent character varying(255),
    expires_at timestamp with time zone NOT NULL,
    contact_first_name text,
    contact_last_name text,
    contact_email text
);






CREATE SEQUENCE public.contact_authentication_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.contact_authentication_request_id_seq OWNED BY public.contact_authentication_request.id;






CREATE SEQUENCE public.contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.contact_id_seq OWNED BY public.contact.id;






CREATE TABLE public.dashboard (
    id integer NOT NULL,
    org_id integer NOT NULL,
    name character varying(255) NOT NULL,
    "position" integer,
    is_default boolean,
    is_refreshing boolean DEFAULT false NOT NULL,
    last_refresh_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






COMMENT ON COLUMN public.dashboard."position" IS '@deprecated';






COMMENT ON COLUMN public.dashboard.is_default IS '@deprecated';






CREATE SEQUENCE public.dashboard_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.dashboard_id_seq OWNED BY public.dashboard.id;






CREATE TABLE public.dashboard_module (
    id integer NOT NULL,
    dashboard_id integer NOT NULL,
    title character varying(255),
    type public.dashboard_module_type NOT NULL,
    "position" integer NOT NULL,
    size public.dashboard_module_size NOT NULL,
    settings jsonb NOT NULL,
    result jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.dashboard_module_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.dashboard_module_id_seq OWNED BY public.dashboard_module.id;






CREATE TABLE public.dashboard_permission (
    id integer NOT NULL,
    dashboard_id integer NOT NULL,
    user_id integer,
    user_group_id integer,
    type public.dashboard_permission_type NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT dashboard_permission__user_group__not_owner CHECK (((user_group_id IS NULL) OR (type <> 'OWNER'::public.dashboard_permission_type))),
    CONSTRAINT dashboard_permission__user_or_user_group CHECK ((((user_id IS NOT NULL) AND (user_group_id IS NULL)) OR ((user_id IS NULL) AND (user_group_id IS NOT NULL))))
);






CREATE SEQUENCE public.dashboard_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.dashboard_permission_id_seq OWNED BY public.dashboard_permission.id;






CREATE TABLE public.document_processing_log (
    id integer NOT NULL,
    external_id character varying(255),
    integration_id integer NOT NULL,
    file_upload_id integer NOT NULL,
    document_type public.document_processing_type NOT NULL,
    raw_result jsonb,
    error jsonb,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255)
);






CREATE SEQUENCE public.document_processing_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.document_processing_log_id_seq OWNED BY public.document_processing_log.id;






CREATE TABLE public.email_attachment (
    id integer NOT NULL,
    email_log_id integer NOT NULL,
    temporary_file_id integer NOT NULL
);






CREATE SEQUENCE public.email_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.email_attachment_id_seq OWNED BY public.email_attachment.id;






CREATE TABLE public.email_event (
    id integer NOT NULL,
    email_log_id integer NOT NULL,
    event character varying(255) NOT NULL,
    payload text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);






CREATE SEQUENCE public.email_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.email_event_id_seq OWNED BY public.email_event.id;






CREATE TABLE public.email_log (
    id integer NOT NULL,
    "to" text NOT NULL,
    "from" text NOT NULL,
    subject text NOT NULL,
    text text NOT NULL,
    html text NOT NULL,
    track_opens boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_from text NOT NULL,
    sent_at timestamp with time zone,
    response text,
    external_id character varying(255),
    reply_to text,
    anonymized_at timestamp with time zone,
    processed_at timestamp with time zone,
    processed_by character varying(255)
);






CREATE SEQUENCE public.email_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.email_log_id_seq OWNED BY public.email_log.id;






CREATE TABLE public.event_subscription (
    id integer NOT NULL,
    type public.event_subscription_type NOT NULL,
    user_id integer NOT NULL,
    name character varying(255),
    endpoint character varying(255) NOT NULL,
    event_types jsonb,
    is_enabled boolean DEFAULT true NOT NULL,
    is_failing boolean DEFAULT false NOT NULL,
    from_template_id integer,
    from_template_field_ids integer[],
    from_profile_type_id integer,
    from_profile_type_field_ids integer[],
    error_log jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    ignore_owner_events boolean DEFAULT false NOT NULL,
    CONSTRAINT event_subscription__petition_or_profile__check CHECK ((((type = 'PETITION'::public.event_subscription_type) AND (from_profile_type_id IS NULL) AND (from_profile_type_field_ids IS NULL)) OR ((type = 'PROFILE'::public.event_subscription_type) AND (from_template_id IS NULL) AND (from_template_field_ids IS NULL))))
);






CREATE SEQUENCE public.event_subscription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.event_subscription_id_seq OWNED BY public.event_subscription.id;






CREATE TABLE public.event_subscription_signature_key (
    id integer NOT NULL,
    event_subscription_id integer NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.event_subscription_signature_key_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.event_subscription_signature_key_id_seq OWNED BY public.event_subscription_signature_key.id;






CREATE TABLE public.feature_flag (
    id integer NOT NULL,
    name public.feature_flag_name NOT NULL,
    default_value boolean DEFAULT false NOT NULL
);






CREATE SEQUENCE public.feature_flag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.feature_flag_id_seq OWNED BY public.feature_flag.id;






CREATE TABLE public.feature_flag_override (
    id integer NOT NULL,
    feature_flag_name public.feature_flag_name NOT NULL,
    org_id integer,
    user_id integer,
    value boolean NOT NULL,
    CONSTRAINT feature_flag_override__org_id__user_id CHECK ((((org_id IS NULL) AND (user_id IS NOT NULL)) OR ((org_id IS NOT NULL) AND (user_id IS NULL))))
);






CREATE SEQUENCE public.feature_flag_override_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.feature_flag_override_id_seq OWNED BY public.feature_flag_override.id;






CREATE TABLE public.file_export_log (
    id integer NOT NULL,
    integration_id integer NOT NULL,
    json_export jsonb NOT NULL,
    created_by_user_id integer NOT NULL,
    request_log jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255)
);






CREATE SEQUENCE public.file_export_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.file_export_log_id_seq OWNED BY public.file_export_log.id;






CREATE TABLE public.file_upload (
    id integer NOT NULL,
    path character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    size bigint NOT NULL,
    content_type character varying(255) NOT NULL,
    upload_complete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    file_deleted_at timestamp with time zone,
    password character varying(255)
);






CREATE SEQUENCE public.file_upload_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.file_upload_id_seq OWNED BY public.file_upload.id;






CREATE TABLE public.license_code (
    id integer NOT NULL,
    source character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    status public.license_code_status DEFAULT 'PENDING'::public.license_code_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255)
);






CREATE SEQUENCE public.license_code_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.license_code_id_seq OWNED BY public.license_code.id;






CREATE TABLE public.org_integration (
    id integer NOT NULL,
    org_id integer NOT NULL,
    type public.integration_type NOT NULL,
    provider character varying(255) NOT NULL,
    settings jsonb,
    is_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    is_default boolean DEFAULT false NOT NULL,
    name character varying(255) NOT NULL,
    invalid_credentials boolean DEFAULT false NOT NULL,
    CONSTRAINT org_integration__provider_uppercase_check CHECK ((upper((provider)::text) = (provider)::text))
);






CREATE SEQUENCE public.org_integration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.org_integration_id_seq OWNED BY public.org_integration.id;






CREATE TABLE public.organization (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    status public.organization_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    custom_host character varying(255),
    custom_email_from character varying(255),
    logo_public_file_id integer,
    usage_details jsonb,
    icon_public_file_id integer,
    appsumo_license jsonb,
    anonymize_petitions_after_months integer,
    default_timezone character varying(50) DEFAULT 'Etc/UTC'::character varying NOT NULL,
    last_profile_digest_at timestamp with time zone,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL
);






CREATE SEQUENCE public.organization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.organization_id_seq OWNED BY public.organization.id;






CREATE TABLE public.organization_theme (
    id integer NOT NULL,
    org_id integer NOT NULL,
    name character varying(255) NOT NULL,
    type public.organization_theme_type NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT organization_theme__is_default__deleted_at__check CHECK ((((is_default = true) AND (deleted_at IS NULL)) OR (is_default = false)))
);






CREATE SEQUENCE public.organization_theme_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.organization_theme_id_seq OWNED BY public.organization_theme.id;






CREATE TABLE public.organization_usage_limit (
    id integer NOT NULL,
    org_id integer NOT NULL,
    limit_name public.organization_usage_limit_name NOT NULL,
    "limit" numeric(8,2) NOT NULL,
    used numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    period interval NOT NULL,
    period_start_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    period_end_date timestamp with time zone,
    cycle_number integer DEFAULT 1 NOT NULL
);






CREATE SEQUENCE public.organization_usage_limit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.organization_usage_limit_id_seq OWNED BY public.organization_usage_limit.id;






CREATE TABLE public.petition (
    id integer NOT NULL,
    org_id integer NOT NULL,
    name character varying(255),
    custom_ref character varying(255),
    is_template boolean DEFAULT false NOT NULL,
    status public.petition_status,
    deadline timestamp with time zone,
    email_subject character varying(1000),
    email_body text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    reminders_config jsonb,
    template_description text,
    template_public boolean DEFAULT false NOT NULL,
    from_template_id integer,
    signature_config jsonb,
    hide_recipient_view_contents boolean DEFAULT false NOT NULL,
    skip_forward_security boolean DEFAULT false NOT NULL,
    public_metadata jsonb,
    from_public_petition_link_id integer,
    custom_properties jsonb DEFAULT '{}'::jsonb NOT NULL,
    restricted_by_user_id integer,
    restricted_at timestamp with time zone,
    restricted_password_hash character varying(255),
    restricted_password_salt character varying(255),
    credits_used integer DEFAULT 0 NOT NULL,
    closing_email_body text,
    is_completing_message_enabled boolean DEFAULT false NOT NULL,
    completing_message_subject text,
    completing_message_body text,
    anonymized_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::json NOT NULL,
    closed_at timestamp with time zone,
    anonymize_after_months integer,
    anonymize_purpose text,
    document_organization_theme_id integer NOT NULL,
    path text DEFAULT '/'::text NOT NULL,
    default_path text DEFAULT '/'::text NOT NULL,
    latest_signature_status character varying(255),
    send_on_behalf_user_id integer,
    recipient_locale public.contact_locale NOT NULL,
    last_activity_at timestamp with time zone,
    last_recipient_activity_at timestamp with time zone,
    variables jsonb DEFAULT '[]'::jsonb NOT NULL,
    enable_delegate_access boolean DEFAULT true NOT NULL,
    last_change_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    summary_config jsonb,
    summary_ai_completion_log_id integer,
    custom_lists jsonb,
    enable_interaction_with_recipients boolean DEFAULT true NOT NULL,
    enable_review_flow boolean DEFAULT true NOT NULL,
    enable_document_generation boolean DEFAULT true NOT NULL,
    automatic_numbering_config jsonb,
    standard_list_definition_override jsonb DEFAULT '[]'::jsonb NOT NULL,
    approval_flow_config jsonb,
    deletion_scheduled_at timestamp with time zone,
    CONSTRAINT petition__is_template__status CHECK ((((NOT is_template) AND (status IS NOT NULL)) OR (is_template AND (status IS NULL)))),
    CONSTRAINT petition__path CHECK (((char_length(path) < 1000) AND (path ~ '^/([^/]+/)*$'::text)))
);






CREATE TABLE public.petition_access (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    granter_id integer NOT NULL,
    contact_id integer,
    keycode character varying(255) NOT NULL,
    status public.petition_access_status NOT NULL,
    next_reminder_at timestamp with time zone,
    reminders_active boolean DEFAULT false NOT NULL,
    reminders_config jsonb,
    reminders_left integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    reminders_opt_out boolean DEFAULT false NOT NULL,
    delegator_contact_id integer,
    delegate_granter_id integer,
    automatic_reminders_left integer DEFAULT 0 NOT NULL,
    is_shared_by_link boolean DEFAULT false NOT NULL,
    CONSTRAINT petition_access__reminders_left_check CHECK ((reminders_left >= 0)),
    CONSTRAINT petition_access__reminders_limit CHECK ((reminders_left >= automatic_reminders_left))
);






CREATE SEQUENCE public.petition_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_access_id_seq OWNED BY public.petition_access.id;






CREATE TABLE public.petition_approval_request_step (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    step_number integer NOT NULL,
    step_name character varying(255) NOT NULL,
    status public.petition_approval_request_step_status NOT NULL,
    approval_type public.petition_approval_request_step_approval_type NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deprecated_at timestamp with time zone
);






CREATE TABLE public.petition_approval_request_step_approver (
    id integer NOT NULL,
    petition_approval_request_step_id integer NOT NULL,
    user_id integer NOT NULL,
    sent_at timestamp with time zone,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    canceled_at timestamp with time zone,
    skipped_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255)
);






CREATE SEQUENCE public.petition_approval_request_step_approver_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_approval_request_step_approver_id_seq OWNED BY public.petition_approval_request_step_approver.id;






CREATE SEQUENCE public.petition_approval_request_step_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_approval_request_step_id_seq OWNED BY public.petition_approval_request_step.id;






CREATE TABLE public.petition_attachment (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    file_upload_id integer NOT NULL,
    type public.petition_attachment_type NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    visibility jsonb
);






CREATE SEQUENCE public.petition_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_attachment_id_seq OWNED BY public.petition_attachment.id;






CREATE TABLE public.petition_comment_attachment (
    id integer NOT NULL,
    petition_comment_id integer NOT NULL,
    file_upload_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.petition_comment_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_comment_attachment_id_seq OWNED BY public.petition_comment_attachment.id;






CREATE TABLE public.petition_contact_notification (
    id integer NOT NULL,
    petition_access_id integer NOT NULL,
    petition_id integer NOT NULL,
    type public.petition_contact_notification_type NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone,
    read_at timestamp with time zone
);






CREATE SEQUENCE public.petition_contact_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_contact_notification_id_seq OWNED BY public.petition_contact_notification.id;






CREATE TABLE public.petition_event (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    type public.petition_event_type NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone,
    processed_by character varying(255)
);






CREATE SEQUENCE public.petition_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_event_id_seq OWNED BY public.petition_event.id;






CREATE TABLE public.petition_field (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    "position" integer NOT NULL,
    type public.petition_field_type NOT NULL,
    title text,
    description text,
    optional boolean DEFAULT false NOT NULL,
    multiple boolean DEFAULT true NOT NULL,
    options jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    is_fixed boolean DEFAULT false NOT NULL,
    visibility jsonb,
    from_petition_field_id integer,
    alias character varying(100),
    is_internal boolean DEFAULT false NOT NULL,
    show_in_pdf boolean DEFAULT true NOT NULL,
    has_comments_enabled boolean DEFAULT true NOT NULL,
    show_activity_in_pdf boolean DEFAULT false NOT NULL,
    require_approval boolean DEFAULT true NOT NULL,
    parent_petition_field_id integer,
    math jsonb,
    profile_type_id integer,
    profile_type_field_id integer,
    CONSTRAINT petition_field__profile_type_field_id__child_field CHECK (((profile_type_field_id IS NULL) OR ((profile_type_field_id IS NOT NULL) AND (parent_petition_field_id IS NOT NULL)))),
    CONSTRAINT petition_field__profile_type_id__field_group CHECK (((profile_type_id IS NULL) OR ((profile_type_id IS NOT NULL) AND (type = 'FIELD_GROUP'::public.petition_field_type))))
);






CREATE TABLE public.petition_field_attachment (
    id integer NOT NULL,
    petition_field_id integer NOT NULL,
    file_upload_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.petition_field_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_field_attachment_id_seq OWNED BY public.petition_field_attachment.id;






CREATE TABLE public.petition_field_comment (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    petition_field_id integer,
    user_id integer,
    petition_access_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    is_internal boolean DEFAULT false NOT NULL,
    anonymized_at timestamp with time zone,
    content_json jsonb,
    approval_metadata jsonb
);






CREATE SEQUENCE public.petition_field_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_field_comment_id_seq OWNED BY public.petition_field_comment.id;






CREATE TABLE public.petition_field_group_relationship (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    left_side_petition_field_id integer NOT NULL,
    profile_relationship_type_id integer NOT NULL,
    direction public.profile_relationship_type_direction NOT NULL,
    right_side_petition_field_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.petition_field_group_relationship_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_field_group_relationship_id_seq OWNED BY public.petition_field_group_relationship.id;






CREATE SEQUENCE public.petition_field_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_field_id_seq OWNED BY public.petition_field.id;






CREATE TABLE public.petition_field_reply (
    id integer NOT NULL,
    petition_field_id integer NOT NULL,
    type public.petition_field_type NOT NULL,
    content jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    petition_access_id integer,
    status public.petition_field_reply_status DEFAULT 'PENDING'::public.petition_field_reply_status NOT NULL,
    metadata jsonb DEFAULT '{}'::json NOT NULL,
    user_id integer,
    anonymized_at timestamp with time zone,
    parent_petition_field_reply_id integer,
    associated_profile_id integer,
    CONSTRAINT petition_field_reply__associated_profile_id__field_group CHECK (((associated_profile_id IS NULL) OR ((associated_profile_id IS NOT NULL) AND (type = 'FIELD_GROUP'::public.petition_field_type)))),
    CONSTRAINT petition_field_reply__petition_access_id__user_id CHECK ((num_nulls(petition_access_id, user_id) = 1))
);






CREATE SEQUENCE public.petition_field_reply_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_field_reply_id_seq OWNED BY public.petition_field_reply.id;






CREATE SEQUENCE public.petition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_id_seq OWNED BY public.petition.id;






CREATE TABLE public.petition_list_view (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    data jsonb NOT NULL,
    "position" integer NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    view_type public.list_view_type DEFAULT 'CUSTOM'::public.list_view_type NOT NULL
);






CREATE SEQUENCE public.petition_list_view_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_list_view_id_seq OWNED BY public.petition_list_view.id;






CREATE TABLE public.petition_message (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    petition_access_id integer NOT NULL,
    sender_id integer NOT NULL,
    email_subject character varying(255),
    email_body text,
    status public.petition_message_status NOT NULL,
    scheduled_at timestamp with time zone,
    email_log_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    anonymized_at timestamp with time zone
);






CREATE SEQUENCE public.petition_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_message_id_seq OWNED BY public.petition_message.id;






CREATE TABLE public.petition_permission (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    user_id integer,
    type public.petition_permission_type DEFAULT 'OWNER'::public.petition_permission_type NOT NULL,
    is_subscribed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    user_group_id integer,
    from_user_group_id integer,
    CONSTRAINT petition_permission__user_type_owner CHECK ((((type = 'OWNER'::public.petition_permission_type) AND (user_group_id IS NULL) AND (from_user_group_id IS NULL) AND (user_id IS NOT NULL)) OR (type <> 'OWNER'::public.petition_permission_type)))
);






CREATE SEQUENCE public.petition_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_permission_id_seq OWNED BY public.petition_permission.id;






CREATE TABLE public.petition_profile (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    profile_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255)
);






CREATE SEQUENCE public.petition_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_profile_id_seq OWNED BY public.petition_profile.id;






CREATE TABLE public.petition_reminder (
    id integer NOT NULL,
    email_log_id integer,
    type public.petition_reminder_type NOT NULL,
    status public.petition_reminder_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    sender_id integer,
    petition_access_id integer NOT NULL,
    email_body text,
    anonymized_at timestamp with time zone
);






CREATE SEQUENCE public.petition_reminder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_reminder_id_seq OWNED BY public.petition_reminder.id;






CREATE TABLE public.petition_signature_request (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    external_id character varying(255),
    signature_config jsonb NOT NULL,
    status public.petition_signature_status DEFAULT 'ENQUEUED'::public.petition_signature_status NOT NULL,
    cancel_reason public.petition_signature_cancel_reason,
    cancel_data jsonb,
    data jsonb,
    event_logs jsonb DEFAULT '[]'::jsonb,
    file_upload_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    file_upload_audit_trail_id integer,
    metadata jsonb DEFAULT '{}'::json NOT NULL,
    signer_status jsonb DEFAULT '{}'::json NOT NULL,
    anonymized_at timestamp with time zone,
    temporary_file_document_id integer,
    processed_at timestamp with time zone,
    processed_by character varying(255),
    CONSTRAINT petition_signature_request__cancel_reason_data_check CHECK ((((status = ANY (ARRAY['CANCELLING'::public.petition_signature_status, 'CANCELLED'::public.petition_signature_status])) AND (cancel_reason IS NOT NULL) AND (cancel_data IS NOT NULL)) OR ((status <> ALL (ARRAY['CANCELLING'::public.petition_signature_status, 'CANCELLED'::public.petition_signature_status])) AND (cancel_reason IS NULL) AND (cancel_data IS NULL))))
);






CREATE SEQUENCE public.petition_signature_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_signature_request_id_seq OWNED BY public.petition_signature_request.id;






CREATE TABLE public.petition_tag (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255)
);






CREATE SEQUENCE public.petition_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_tag_id_seq OWNED BY public.petition_tag.id;






CREATE TABLE public.petition_user_notification (
    id integer NOT NULL,
    user_id integer NOT NULL,
    petition_id integer NOT NULL,
    type public.petition_user_notification_type NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone,
    read_at timestamp with time zone
);






CREATE SEQUENCE public.petition_user_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_user_notification_id_seq OWNED BY public.petition_user_notification.id;






CREATE TABLE public.profile (
    id integer NOT NULL,
    org_id integer NOT NULL,
    profile_type_id integer NOT NULL,
    name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    status public.profile_status DEFAULT 'OPEN'::public.profile_status NOT NULL,
    closed_at timestamp with time zone,
    deletion_scheduled_at timestamp with time zone,
    anonymized_at timestamp with time zone,
    localizable_name jsonb DEFAULT jsonb_build_object('en', '') NOT NULL,
    value_cache jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT profile__status__closed_at__deletion_scheduled_at__check CHECK ((((status = 'OPEN'::public.profile_status) AND (closed_at IS NULL) AND (deletion_scheduled_at IS NULL)) OR ((status = 'CLOSED'::public.profile_status) AND (closed_at IS NOT NULL) AND (deletion_scheduled_at IS NULL)) OR ((status = 'DELETION_SCHEDULED'::public.profile_status) AND (deletion_scheduled_at IS NOT NULL))))
);






COMMENT ON COLUMN public.profile.name IS '@deprecated';






CREATE TABLE public.profile_event (
    id integer NOT NULL,
    org_id integer NOT NULL,
    profile_id integer NOT NULL,
    type public.profile_event_type NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone,
    processed_by character varying(255)
);






CREATE SEQUENCE public.profile_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_event_id_seq OWNED BY public.profile_event.id;






CREATE TABLE public.profile_external_source_entity (
    id integer NOT NULL,
    integration_id integer NOT NULL,
    data jsonb NOT NULL,
    standard_type public.profile_type_standard_type NOT NULL,
    parsed_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by_user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255)
);






CREATE SEQUENCE public.profile_external_source_entity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_external_source_entity_id_seq OWNED BY public.profile_external_source_entity.id;






CREATE TABLE public.profile_field_file (
    id integer NOT NULL,
    profile_id integer NOT NULL,
    profile_type_field_id integer NOT NULL,
    type public.profile_type_field_type NOT NULL,
    file_upload_id integer,
    expiry_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by_user_id integer NOT NULL,
    removed_at timestamp with time zone,
    removed_by_user_id integer,
    anonymized_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    petition_field_reply_id integer,
    source character varying(255),
    CONSTRAINT profile_field_file__file_upload_id__anonymized_at CHECK ((((file_upload_id IS NOT NULL) AND (anonymized_at IS NULL)) OR ((file_upload_id IS NULL) AND (anonymized_at IS NOT NULL)))),
    CONSTRAINT profile_field_file__removed CHECK ((((removed_at IS NULL) AND (removed_by_user_id IS NULL)) OR ((removed_at IS NOT NULL) AND (removed_by_user_id IS NOT NULL))))
);






CREATE SEQUENCE public.profile_field_file_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_field_file_id_seq OWNED BY public.profile_field_file.id;






CREATE TABLE public.profile_field_value (
    id integer NOT NULL,
    profile_id integer NOT NULL,
    profile_type_field_id integer NOT NULL,
    type public.profile_type_field_type NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    expiry_date date,
    created_by_user_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    removed_at timestamp with time zone,
    removed_by_user_id integer,
    anonymized_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    external_source_integration_id integer,
    is_draft boolean DEFAULT false NOT NULL,
    pending_review boolean DEFAULT false NOT NULL,
    active_monitoring boolean DEFAULT false NOT NULL,
    petition_field_reply_id integer,
    review_reason jsonb,
    profile_type_field_is_unique boolean DEFAULT false NOT NULL,
    source character varying(255)
);






CREATE SEQUENCE public.profile_field_value_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_field_value_id_seq OWNED BY public.profile_field_value.id;






CREATE SEQUENCE public.profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_id_seq OWNED BY public.profile.id;






CREATE TABLE public.profile_list_view (
    id integer NOT NULL,
    user_id integer NOT NULL,
    profile_type_id integer NOT NULL,
    name character varying(255) NOT NULL,
    data jsonb NOT NULL,
    "position" integer NOT NULL,
    view_type public.list_view_type DEFAULT 'CUSTOM'::public.list_view_type NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.profile_list_view_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_list_view_id_seq OWNED BY public.profile_list_view.id;






CREATE TABLE public.profile_relationship (
    id integer NOT NULL,
    org_id integer NOT NULL,
    left_side_profile_id integer NOT NULL,
    profile_relationship_type_id integer NOT NULL,
    right_side_profile_id integer NOT NULL,
    created_by_user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    removed_at timestamp with time zone,
    removed_by_user_id integer,
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT left_side_profile_id_not_equal_right_side_profile_id CHECK ((left_side_profile_id <> right_side_profile_id))
);






CREATE SEQUENCE public.profile_relationship_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_relationship_id_seq OWNED BY public.profile_relationship.id;






CREATE TABLE public.profile_relationship_type (
    id integer NOT NULL,
    org_id integer NOT NULL,
    left_right_name jsonb DEFAULT '{}'::jsonb NOT NULL,
    right_left_name jsonb,
    is_reciprocal boolean DEFAULT false NOT NULL,
    alias character varying(255) DEFAULT NULL::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE TABLE public.profile_relationship_type_allowed_profile_type (
    id integer NOT NULL,
    org_id integer NOT NULL,
    profile_relationship_type_id integer NOT NULL,
    allowed_profile_type_id integer NOT NULL,
    direction public.profile_relationship_type_direction NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.profile_relationship_type_allowed_profile_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_relationship_type_allowed_profile_type_id_seq OWNED BY public.profile_relationship_type_allowed_profile_type.id;






CREATE SEQUENCE public.profile_relationship_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_relationship_type_id_seq OWNED BY public.profile_relationship_type.id;






CREATE TABLE public.profile_subscription (
    id integer NOT NULL,
    profile_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.profile_subscription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_subscription_id_seq OWNED BY public.profile_subscription.id;






CREATE TABLE public.profile_type (
    id integer NOT NULL,
    org_id integer NOT NULL,
    name jsonb DEFAULT '{}'::jsonb NOT NULL,
    profile_name_pattern jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    archived_by_user_id integer,
    archived_at timestamp with time zone,
    standard_type public.profile_type_standard_type,
    name_plural jsonb DEFAULT jsonb_build_object('en', '') NOT NULL,
    icon character varying(255) DEFAULT 'DATABASE'::character varying NOT NULL,
    CONSTRAINT profile_type__deleted_at__null_archived_at CHECK (((deleted_at IS NULL) OR ((deleted_at IS NOT NULL) AND (archived_at IS NOT NULL))))
);






CREATE TABLE public.profile_type_field (
    id integer NOT NULL,
    profile_type_id integer NOT NULL,
    "position" integer NOT NULL,
    name jsonb DEFAULT '{}'::jsonb NOT NULL,
    type public.profile_type_field_type NOT NULL,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    alias character varying(255),
    is_expirable boolean DEFAULT false NOT NULL,
    permission public.profile_type_field_permission_type DEFAULT 'WRITE'::public.profile_type_field_permission_type NOT NULL,
    expiry_alert_ahead_time interval,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    is_unique boolean DEFAULT false NOT NULL,
    CONSTRAINT profile_type_field__expiry_time CHECK (((is_expirable IS TRUE) OR ((is_expirable IS FALSE) AND (expiry_alert_ahead_time IS NULL))))
);






CREATE SEQUENCE public.profile_type_field_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_type_field_id_seq OWNED BY public.profile_type_field.id;






CREATE TABLE public.profile_type_field_permission (
    id integer NOT NULL,
    profile_type_field_id integer NOT NULL,
    permission public.profile_type_field_permission_type NOT NULL,
    user_id integer,
    user_group_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT ptfp__user_or_user_group CHECK (((((user_id IS NULL))::integer + ((user_group_id IS NULL))::integer) = 1))
);






CREATE SEQUENCE public.profile_type_field_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_type_field_permission_id_seq OWNED BY public.profile_type_field_permission.id;






CREATE SEQUENCE public.profile_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_type_id_seq OWNED BY public.profile_type.id;






CREATE TABLE public.profile_type_process (
    id integer NOT NULL,
    profile_type_id integer NOT NULL,
    process_name jsonb DEFAULT jsonb_build_object('en', '') NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT profile_type_process_position_check CHECK ((("position" >= 0) AND ("position" <= 2)))
);






CREATE SEQUENCE public.profile_type_process_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_type_process_id_seq OWNED BY public.profile_type_process.id;






CREATE TABLE public.profile_type_process_template (
    id integer NOT NULL,
    profile_type_process_id integer NOT NULL,
    template_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255)
);






CREATE SEQUENCE public.profile_type_process_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.profile_type_process_template_id_seq OWNED BY public.profile_type_process_template.id;






CREATE TABLE public.public_file_upload (
    id integer NOT NULL,
    path character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    size bigint NOT NULL,
    content_type character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.public_file_upload_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.public_file_upload_id_seq OWNED BY public.public_file_upload.id;






CREATE TABLE public.public_petition_link (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    slug character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    prefill_secret character varying(255) DEFAULT NULL::character varying,
    allow_multiple_petitions boolean DEFAULT false NOT NULL,
    petition_name_pattern character varying(255),
    CONSTRAINT public_petition_link__slug CHECK (((slug)::text ~ '^[a-zA-Z0-9-]*$'::text))
);






CREATE SEQUENCE public.public_petition_link_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.public_petition_link_id_seq OWNED BY public.public_petition_link.id;






CREATE TABLE public.public_petition_link_prefill_data (
    id integer NOT NULL,
    template_id integer NOT NULL,
    keycode character varying(255) NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    path text DEFAULT '/'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.public_petition_link_prefill_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.public_petition_link_prefill_data_id_seq OWNED BY public.public_petition_link_prefill_data.id;






CREATE TABLE public.standard_list_definition (
    id integer NOT NULL,
    title jsonb DEFAULT jsonb_build_object('en', '') NOT NULL,
    list_name character varying(255) NOT NULL,
    list_version date NOT NULL,
    version_format jsonb DEFAULT '{}'::jsonb NOT NULL,
    list_type public.standard_list_definition_list_type NOT NULL,
    "values" jsonb DEFAULT '[]'::jsonb NOT NULL,
    source_name character varying(255) NOT NULL,
    source_url character varying(255),
    version_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    CONSTRAINT standard_list_definition__list_name__upper_snake_case CHECK (((list_name)::text ~ '^[A-Z0-9_]+$'::text))
);






CREATE SEQUENCE public.standard_list_definition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.standard_list_definition_id_seq OWNED BY public.standard_list_definition.id;






CREATE TABLE public.system_event (
    id integer NOT NULL,
    type public.system_event_type NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone,
    processed_by character varying(255)
);






CREATE SEQUENCE public.system_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.system_event_id_seq OWNED BY public.system_event.id;






CREATE TABLE public.tag (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.tag_id_seq OWNED BY public.tag.id;






CREATE TABLE public.task (
    id integer NOT NULL,
    user_id integer,
    name public.task_name NOT NULL,
    status public.task_status DEFAULT 'ENQUEUED'::public.task_status NOT NULL,
    progress integer,
    input jsonb DEFAULT '{}'::jsonb NOT NULL,
    output jsonb,
    error_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    petition_access_id integer,
    started_at timestamp with time zone,
    anonymized_at timestamp with time zone,
    processed_at timestamp with time zone,
    processed_by character varying(255),
    CONSTRAINT task_failed_error_data CHECK ((((status = 'FAILED'::public.task_status) AND (error_data IS NOT NULL)) OR ((status <> 'FAILED'::public.task_status) AND (error_data IS NULL)))),
    CONSTRAINT task_progress_bounds CHECK (((progress IS NULL) OR ((progress >= 0) AND (progress <= 100))))
);






CREATE SEQUENCE public.task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.task_id_seq OWNED BY public.task.id;






CREATE TABLE public.template_default_permission (
    id integer NOT NULL,
    template_id integer NOT NULL,
    type public.petition_permission_type NOT NULL,
    user_id integer,
    user_group_id integer,
    is_subscribed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT template_default_permission__user_or_user_group CHECK (((((user_id IS NULL))::integer + ((user_group_id IS NULL))::integer) = 1)),
    CONSTRAINT template_default_permission__user_type_owner CHECK ((((type = 'OWNER'::public.petition_permission_type) AND (user_group_id IS NULL) AND (user_id IS NOT NULL)) OR (type <> 'OWNER'::public.petition_permission_type)))
);






CREATE SEQUENCE public.template_default_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.template_default_permission_id_seq OWNED BY public.template_default_permission.id;






CREATE TABLE public.temporary_file (
    id integer NOT NULL,
    path character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    size bigint NOT NULL,
    content_type character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255)
);






CREATE SEQUENCE public.temporary_file_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.temporary_file_id_seq OWNED BY public.temporary_file.id;






CREATE TABLE public."user" (
    id integer NOT NULL,
    org_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    last_active_at timestamp with time zone,
    status public.user_status DEFAULT 'ACTIVE'::public.user_status NOT NULL,
    external_id character varying(255),
    user_data_id integer NOT NULL,
    is_org_owner boolean DEFAULT false NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL
);






CREATE TABLE public.user_authentication_token (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_name character varying(255) NOT NULL,
    token_hash character varying(255) NOT NULL,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    token_hint character varying(255)
);






CREATE SEQUENCE public.user_authentication_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_authentication_token_id_seq OWNED BY public.user_authentication_token.id;






CREATE TABLE public.user_data (
    id integer NOT NULL,
    cognito_id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    is_sso_user boolean DEFAULT false NOT NULL,
    avatar_public_file_id integer,
    details jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    preferred_locale public.user_locale NOT NULL
);






CREATE SEQUENCE public.user_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_data_id_seq OWNED BY public.user_data.id;






CREATE TABLE public.user_delegate (
    id integer NOT NULL,
    user_id integer NOT NULL,
    delegate_user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.user_delegate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_delegate_id_seq OWNED BY public.user_delegate.id;






CREATE TABLE public.user_group (
    id integer NOT NULL,
    org_id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    type public.user_group_type DEFAULT 'NORMAL'::public.user_group_type NOT NULL,
    localizable_name jsonb DEFAULT jsonb_build_object('en', '') NOT NULL
);






CREATE SEQUENCE public.user_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_group_id_seq OWNED BY public.user_group.id;






CREATE TABLE public.user_group_member (
    id integer NOT NULL,
    user_group_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.user_group_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_group_member_id_seq OWNED BY public.user_group_member.id;






CREATE TABLE public.user_group_permission (
    id integer NOT NULL,
    user_group_id integer NOT NULL,
    name public.user_group_permission_name NOT NULL,
    effect public.user_group_permission_effect NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.user_group_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_group_permission_id_seq OWNED BY public.user_group_permission.id;






CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;






CREATE TABLE public.user_petition_event_log (
    id bigint NOT NULL,
    user_id integer,
    petition_event_id integer
);






CREATE SEQUENCE public.user_petition_event_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_petition_event_log_id_seq OWNED BY public.user_petition_event_log.id;






CREATE TABLE public.user_profile_event_log (
    id bigint NOT NULL,
    user_id integer,
    profile_event_id integer
);






CREATE SEQUENCE public.user_profile_event_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_profile_event_log_id_seq OWNED BY public.user_profile_event_log.id;






CREATE TABLE public.user_profile_type_pinned (
    id integer NOT NULL,
    user_id integer NOT NULL,
    profile_type_id integer NOT NULL
);






CREATE SEQUENCE public.user_profile_type_pinned_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.user_profile_type_pinned_id_seq OWNED BY public.user_profile_type_pinned.id;






ALTER TABLE ONLY public.ai_completion_log ALTER COLUMN id SET DEFAULT nextval('public.ai_completion_log_id_seq'::regclass);






ALTER TABLE ONLY public.contact ALTER COLUMN id SET DEFAULT nextval('public.contact_id_seq'::regclass);






ALTER TABLE ONLY public.contact_authentication ALTER COLUMN id SET DEFAULT nextval('public.contact_authentication_id_seq'::regclass);






ALTER TABLE ONLY public.contact_authentication_request ALTER COLUMN id SET DEFAULT nextval('public.contact_authentication_request_id_seq'::regclass);






ALTER TABLE ONLY public.dashboard ALTER COLUMN id SET DEFAULT nextval('public.dashboard_id_seq'::regclass);






ALTER TABLE ONLY public.dashboard_module ALTER COLUMN id SET DEFAULT nextval('public.dashboard_module_id_seq'::regclass);






ALTER TABLE ONLY public.dashboard_permission ALTER COLUMN id SET DEFAULT nextval('public.dashboard_permission_id_seq'::regclass);






ALTER TABLE ONLY public.document_processing_log ALTER COLUMN id SET DEFAULT nextval('public.document_processing_log_id_seq'::regclass);






ALTER TABLE ONLY public.email_attachment ALTER COLUMN id SET DEFAULT nextval('public.email_attachment_id_seq'::regclass);






ALTER TABLE ONLY public.email_event ALTER COLUMN id SET DEFAULT nextval('public.email_event_id_seq'::regclass);






ALTER TABLE ONLY public.email_log ALTER COLUMN id SET DEFAULT nextval('public.email_log_id_seq'::regclass);






ALTER TABLE ONLY public.event_subscription ALTER COLUMN id SET DEFAULT nextval('public.event_subscription_id_seq'::regclass);






ALTER TABLE ONLY public.event_subscription_signature_key ALTER COLUMN id SET DEFAULT nextval('public.event_subscription_signature_key_id_seq'::regclass);






ALTER TABLE ONLY public.feature_flag ALTER COLUMN id SET DEFAULT nextval('public.feature_flag_id_seq'::regclass);






ALTER TABLE ONLY public.feature_flag_override ALTER COLUMN id SET DEFAULT nextval('public.feature_flag_override_id_seq'::regclass);






ALTER TABLE ONLY public.file_export_log ALTER COLUMN id SET DEFAULT nextval('public.file_export_log_id_seq'::regclass);






ALTER TABLE ONLY public.file_upload ALTER COLUMN id SET DEFAULT nextval('public.file_upload_id_seq'::regclass);






ALTER TABLE ONLY public.license_code ALTER COLUMN id SET DEFAULT nextval('public.license_code_id_seq'::regclass);






ALTER TABLE ONLY public.org_integration ALTER COLUMN id SET DEFAULT nextval('public.org_integration_id_seq'::regclass);






ALTER TABLE ONLY public.organization ALTER COLUMN id SET DEFAULT nextval('public.organization_id_seq'::regclass);






ALTER TABLE ONLY public.organization_theme ALTER COLUMN id SET DEFAULT nextval('public.organization_theme_id_seq'::regclass);






ALTER TABLE ONLY public.organization_usage_limit ALTER COLUMN id SET DEFAULT nextval('public.organization_usage_limit_id_seq'::regclass);






ALTER TABLE ONLY public.petition ALTER COLUMN id SET DEFAULT nextval('public.petition_id_seq'::regclass);






ALTER TABLE ONLY public.petition_access ALTER COLUMN id SET DEFAULT nextval('public.petition_access_id_seq'::regclass);






ALTER TABLE ONLY public.petition_approval_request_step ALTER COLUMN id SET DEFAULT nextval('public.petition_approval_request_step_id_seq'::regclass);






ALTER TABLE ONLY public.petition_approval_request_step_approver ALTER COLUMN id SET DEFAULT nextval('public.petition_approval_request_step_approver_id_seq'::regclass);






ALTER TABLE ONLY public.petition_attachment ALTER COLUMN id SET DEFAULT nextval('public.petition_attachment_id_seq'::regclass);






ALTER TABLE ONLY public.petition_comment_attachment ALTER COLUMN id SET DEFAULT nextval('public.petition_comment_attachment_id_seq'::regclass);






ALTER TABLE ONLY public.petition_contact_notification ALTER COLUMN id SET DEFAULT nextval('public.petition_contact_notification_id_seq'::regclass);






ALTER TABLE ONLY public.petition_event ALTER COLUMN id SET DEFAULT nextval('public.petition_event_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field ALTER COLUMN id SET DEFAULT nextval('public.petition_field_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field_attachment ALTER COLUMN id SET DEFAULT nextval('public.petition_field_attachment_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field_comment ALTER COLUMN id SET DEFAULT nextval('public.petition_field_comment_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field_group_relationship ALTER COLUMN id SET DEFAULT nextval('public.petition_field_group_relationship_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field_reply ALTER COLUMN id SET DEFAULT nextval('public.petition_field_reply_id_seq'::regclass);






ALTER TABLE ONLY public.petition_list_view ALTER COLUMN id SET DEFAULT nextval('public.petition_list_view_id_seq'::regclass);






ALTER TABLE ONLY public.petition_message ALTER COLUMN id SET DEFAULT nextval('public.petition_message_id_seq'::regclass);






ALTER TABLE ONLY public.petition_permission ALTER COLUMN id SET DEFAULT nextval('public.petition_permission_id_seq'::regclass);






ALTER TABLE ONLY public.petition_profile ALTER COLUMN id SET DEFAULT nextval('public.petition_profile_id_seq'::regclass);






ALTER TABLE ONLY public.petition_reminder ALTER COLUMN id SET DEFAULT nextval('public.petition_reminder_id_seq'::regclass);






ALTER TABLE ONLY public.petition_signature_request ALTER COLUMN id SET DEFAULT nextval('public.petition_signature_request_id_seq'::regclass);






ALTER TABLE ONLY public.petition_tag ALTER COLUMN id SET DEFAULT nextval('public.petition_tag_id_seq'::regclass);






ALTER TABLE ONLY public.petition_user_notification ALTER COLUMN id SET DEFAULT nextval('public.petition_user_notification_id_seq'::regclass);






ALTER TABLE ONLY public.profile ALTER COLUMN id SET DEFAULT nextval('public.profile_id_seq'::regclass);






ALTER TABLE ONLY public.profile_event ALTER COLUMN id SET DEFAULT nextval('public.profile_event_id_seq'::regclass);






ALTER TABLE ONLY public.profile_external_source_entity ALTER COLUMN id SET DEFAULT nextval('public.profile_external_source_entity_id_seq'::regclass);






ALTER TABLE ONLY public.profile_field_file ALTER COLUMN id SET DEFAULT nextval('public.profile_field_file_id_seq'::regclass);






ALTER TABLE ONLY public.profile_field_value ALTER COLUMN id SET DEFAULT nextval('public.profile_field_value_id_seq'::regclass);






ALTER TABLE ONLY public.profile_list_view ALTER COLUMN id SET DEFAULT nextval('public.profile_list_view_id_seq'::regclass);






ALTER TABLE ONLY public.profile_relationship ALTER COLUMN id SET DEFAULT nextval('public.profile_relationship_id_seq'::regclass);






ALTER TABLE ONLY public.profile_relationship_type ALTER COLUMN id SET DEFAULT nextval('public.profile_relationship_type_id_seq'::regclass);






ALTER TABLE ONLY public.profile_relationship_type_allowed_profile_type ALTER COLUMN id SET DEFAULT nextval('public.profile_relationship_type_allowed_profile_type_id_seq'::regclass);






ALTER TABLE ONLY public.profile_subscription ALTER COLUMN id SET DEFAULT nextval('public.profile_subscription_id_seq'::regclass);






ALTER TABLE ONLY public.profile_type ALTER COLUMN id SET DEFAULT nextval('public.profile_type_id_seq'::regclass);






ALTER TABLE ONLY public.profile_type_field ALTER COLUMN id SET DEFAULT nextval('public.profile_type_field_id_seq'::regclass);






ALTER TABLE ONLY public.profile_type_field_permission ALTER COLUMN id SET DEFAULT nextval('public.profile_type_field_permission_id_seq'::regclass);






ALTER TABLE ONLY public.profile_type_process ALTER COLUMN id SET DEFAULT nextval('public.profile_type_process_id_seq'::regclass);






ALTER TABLE ONLY public.profile_type_process_template ALTER COLUMN id SET DEFAULT nextval('public.profile_type_process_template_id_seq'::regclass);






ALTER TABLE ONLY public.public_file_upload ALTER COLUMN id SET DEFAULT nextval('public.public_file_upload_id_seq'::regclass);






ALTER TABLE ONLY public.public_petition_link ALTER COLUMN id SET DEFAULT nextval('public.public_petition_link_id_seq'::regclass);






ALTER TABLE ONLY public.public_petition_link_prefill_data ALTER COLUMN id SET DEFAULT nextval('public.public_petition_link_prefill_data_id_seq'::regclass);






ALTER TABLE ONLY public.standard_list_definition ALTER COLUMN id SET DEFAULT nextval('public.standard_list_definition_id_seq'::regclass);






ALTER TABLE ONLY public.system_event ALTER COLUMN id SET DEFAULT nextval('public.system_event_id_seq'::regclass);






ALTER TABLE ONLY public.tag ALTER COLUMN id SET DEFAULT nextval('public.tag_id_seq'::regclass);






ALTER TABLE ONLY public.task ALTER COLUMN id SET DEFAULT nextval('public.task_id_seq'::regclass);






ALTER TABLE ONLY public.template_default_permission ALTER COLUMN id SET DEFAULT nextval('public.template_default_permission_id_seq'::regclass);






ALTER TABLE ONLY public.temporary_file ALTER COLUMN id SET DEFAULT nextval('public.temporary_file_id_seq'::regclass);






ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);






ALTER TABLE ONLY public.user_authentication_token ALTER COLUMN id SET DEFAULT nextval('public.user_authentication_token_id_seq'::regclass);






ALTER TABLE ONLY public.user_data ALTER COLUMN id SET DEFAULT nextval('public.user_data_id_seq'::regclass);






ALTER TABLE ONLY public.user_delegate ALTER COLUMN id SET DEFAULT nextval('public.user_delegate_id_seq'::regclass);






ALTER TABLE ONLY public.user_group ALTER COLUMN id SET DEFAULT nextval('public.user_group_id_seq'::regclass);






ALTER TABLE ONLY public.user_group_member ALTER COLUMN id SET DEFAULT nextval('public.user_group_member_id_seq'::regclass);






ALTER TABLE ONLY public.user_group_permission ALTER COLUMN id SET DEFAULT nextval('public.user_group_permission_id_seq'::regclass);






ALTER TABLE ONLY public.user_petition_event_log ALTER COLUMN id SET DEFAULT nextval('public.user_petition_event_log_id_seq'::regclass);






ALTER TABLE ONLY public.user_profile_event_log ALTER COLUMN id SET DEFAULT nextval('public.user_profile_event_log_id_seq'::regclass);






ALTER TABLE ONLY public.user_profile_type_pinned ALTER COLUMN id SET DEFAULT nextval('public.user_profile_type_pinned_id_seq'::regclass);






ALTER TABLE ONLY public.ai_completion_log
    ADD CONSTRAINT ai_completion_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.contact_authentication
    ADD CONSTRAINT contact_authentication_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request__petition_access_id__token_hash UNIQUE (petition_access_id, token_hash);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.dashboard
    ADD CONSTRAINT dashboard__org_id__position EXCLUDE USING btree (org_id WITH =, "position" WITH =) WHERE ((deleted_at IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.dashboard_module
    ADD CONSTRAINT dashboard_module__dashboard_id__position EXCLUDE USING btree (dashboard_id WITH =, "position" WITH =) WHERE ((deleted_at IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.dashboard_module
    ADD CONSTRAINT dashboard_module_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.dashboard_permission
    ADD CONSTRAINT dashboard_permission_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.dashboard
    ADD CONSTRAINT dashboard_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.document_processing_log
    ADD CONSTRAINT document_processing_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_email_log_id_temporary_file_id_unique UNIQUE (email_log_id, temporary_file_id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.email_event
    ADD CONSTRAINT email_event_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.email_log
    ADD CONSTRAINT email_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.event_subscription
    ADD CONSTRAINT event_subscription_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.event_subscription_signature_key
    ADD CONSTRAINT event_subscription_signature_key_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.feature_flag
    ADD CONSTRAINT feature_flag_name_unique UNIQUE (name);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.feature_flag
    ADD CONSTRAINT feature_flag_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.file_export_log
    ADD CONSTRAINT file_export_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.file_upload
    ADD CONSTRAINT file_upload_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.license_code
    ADD CONSTRAINT license_code__code_unique UNIQUE (code);






ALTER TABLE ONLY public.license_code
    ADD CONSTRAINT license_code_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.org_integration
    ADD CONSTRAINT org_integration_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_custom_host_unique UNIQUE (custom_host);






ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.organization_theme
    ADD CONSTRAINT organization_theme_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.organization_usage_limit
    ADD CONSTRAINT organization_usage_limit__org_id__limit_name__unique EXCLUDE USING btree (org_id WITH =, limit_name WITH =) WHERE ((period_end_date IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.organization_usage_limit
    ADD CONSTRAINT organization_usage_limit_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access__keycode UNIQUE (keycode);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_approval_request_step_approver
    ADD CONSTRAINT petition_approval_request_step_approver_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_approval_request_step
    ADD CONSTRAINT petition_approval_request_step_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_attachment
    ADD CONSTRAINT petition_attachment__petition_id__type__position EXCLUDE USING btree (petition_id WITH =, type WITH =, "position" WITH =) WHERE ((deleted_at IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.petition_attachment
    ADD CONSTRAINT petition_attachment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_comment_attachment
    ADD CONSTRAINT petition_comment_attachment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_contact_notification
    ADD CONSTRAINT petition_contact_notification_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_event
    ADD CONSTRAINT petition_event_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field__petition_id__parent_petition_field_id__position EXCLUDE USING btree (petition_id WITH =, parent_petition_field_id WITH =, "position" WITH =) WHERE (((deleted_at IS NULL) AND (parent_petition_field_id IS NOT NULL))) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field__petition_id__position EXCLUDE USING btree (petition_id WITH =, "position" WITH =) WHERE (((deleted_at IS NULL) AND (parent_petition_field_id IS NULL))) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.petition_field_attachment
    ADD CONSTRAINT petition_field_attachment__petition_field_id__file_upload_id__u UNIQUE (petition_field_id, file_upload_id);






ALTER TABLE ONLY public.petition_field_attachment
    ADD CONSTRAINT petition_field_attachment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field_comment
    ADD CONSTRAINT petition_field_comment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field_group_relationship
    ADD CONSTRAINT petition_field_group_relationship_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field_reply
    ADD CONSTRAINT petition_field_reply_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_list_view
    ADD CONSTRAINT petition_list_view__user_id__position EXCLUDE USING btree (user_id WITH =, "position" WITH =) WHERE ((deleted_at IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.petition_list_view
    ADD CONSTRAINT petition_list_view_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_message
    ADD CONSTRAINT petition_message_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_permission
    ADD CONSTRAINT petition_permission_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_profile
    ADD CONSTRAINT petition_profile__petition_id__profile_id UNIQUE (petition_id, profile_id);






ALTER TABLE ONLY public.petition_profile
    ADD CONSTRAINT petition_profile_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_reminder
    ADD CONSTRAINT petition_reminder_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request__external_id UNIQUE (external_id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_tag
    ADD CONSTRAINT petition_tag__petition_id__tag_id__unique UNIQUE (petition_id, tag_id);






ALTER TABLE ONLY public.petition_tag
    ADD CONSTRAINT petition_tag_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_user_notification
    ADD CONSTRAINT petition_user_notification_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_event
    ADD CONSTRAINT profile_event_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_external_source_entity
    ADD CONSTRAINT profile_external_source_entity_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_field_file
    ADD CONSTRAINT profile_field_file_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_field_value
    ADD CONSTRAINT profile_field_value_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_list_view
    ADD CONSTRAINT profile_list_view__user_id__profile_type_id__position EXCLUDE USING btree (user_id WITH =, profile_type_id WITH =, "position" WITH =) WHERE ((deleted_at IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.profile_list_view
    ADD CONSTRAINT profile_list_view_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_relationship
    ADD CONSTRAINT profile_relationship_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_relationship_type_allowed_profile_type
    ADD CONSTRAINT profile_relationship_type_allowed_profile_type_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_relationship_type
    ADD CONSTRAINT profile_relationship_type_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_subscription
    ADD CONSTRAINT profile_subscription_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_type_field
    ADD CONSTRAINT profile_type_field__profile_type_id__position EXCLUDE USING btree (profile_type_id WITH =, "position" WITH =) WHERE ((deleted_at IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.profile_type_field_permission
    ADD CONSTRAINT profile_type_field_permission_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_type_field
    ADD CONSTRAINT profile_type_field_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_type
    ADD CONSTRAINT profile_type_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_type_process
    ADD CONSTRAINT profile_type_process__profile_type_id__position EXCLUDE USING btree (profile_type_id WITH =, "position" WITH =) WHERE ((deleted_at IS NULL)) DEFERRABLE INITIALLY DEFERRED;






ALTER TABLE ONLY public.profile_type_process
    ADD CONSTRAINT profile_type_process_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.profile_type_process_template
    ADD CONSTRAINT profile_type_process_template_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.public_file_upload
    ADD CONSTRAINT public_file_upload_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.public_petition_link
    ADD CONSTRAINT public_petition_link_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.public_petition_link_prefill_data
    ADD CONSTRAINT public_petition_link_prefill_data_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.standard_list_definition
    ADD CONSTRAINT standard_list_definition_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.system_event
    ADD CONSTRAINT system_event_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.template_default_permission
    ADD CONSTRAINT template_default_permission_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.temporary_file
    ADD CONSTRAINT temporary_file_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_authentication_token
    ADD CONSTRAINT user_authentication_token_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_data
    ADD CONSTRAINT user_data_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_delegate
    ADD CONSTRAINT user_delegate_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_group_member
    ADD CONSTRAINT user_group_member_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_group_permission
    ADD CONSTRAINT user_group_permission_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_group
    ADD CONSTRAINT user_group_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log__user_id__petition_event_id UNIQUE (user_id, petition_event_id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_profile_event_log
    ADD CONSTRAINT user_profile_event_log__user_id__profile_event_id UNIQUE (user_id, profile_event_id);






ALTER TABLE ONLY public.user_profile_event_log
    ADD CONSTRAINT user_profile_event_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_profile_type_pinned
    ADD CONSTRAINT user_profile_type_pinned_pkey PRIMARY KEY (id);






CREATE INDEX contact__deleted_at__anonymized_at ON public.contact USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE UNIQUE INDEX contact__org_id__email ON public.contact USING btree (org_id, email) WHERE (deleted_at IS NULL);






CREATE INDEX contact_authentication__contact_id__contact_value_hash ON public.contact_authentication USING btree (contact_id, cookie_value_hash);






CREATE INDEX dashboard__org_id ON public.dashboard USING btree (org_id) INCLUDE ("position") WHERE (deleted_at IS NULL);






CREATE INDEX dashboard_module__dashboard_id ON public.dashboard_module USING btree (dashboard_id) INCLUDE ("position") WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX dashboard_permission__dashboard_id__owner ON public.dashboard_permission USING btree (dashboard_id) WHERE ((type = 'OWNER'::public.dashboard_permission_type) AND (deleted_at IS NULL));






CREATE UNIQUE INDEX dashboard_permission__dashboard_id__user_group_id ON public.dashboard_permission USING btree (dashboard_id, user_group_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX dashboard_permission__dashboard_id__user_id ON public.dashboard_permission USING btree (dashboard_id, user_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX document_processing_log__external_id ON public.document_processing_log USING btree (external_id);






CREATE INDEX email_event__email_log_id__event ON public.email_event USING btree (email_log_id, event);






CREATE INDEX email_log__external_id ON public.email_log USING btree (external_id);






CREATE UNIQUE INDEX feature_flag_override__org_id__feature_flag_name ON public.feature_flag_override USING btree (org_id, feature_flag_name) WHERE (user_id IS NULL);






CREATE UNIQUE INDEX feature_flag_override__user_id__feature_flag_name ON public.feature_flag_override USING btree (user_id, feature_flag_name) WHERE (org_id IS NULL);






CREATE INDEX file_upload__deleted_at_notnull__file_deleted_at_null ON public.file_upload USING btree (path) WHERE ((deleted_at IS NOT NULL) AND (file_deleted_at IS NULL));






CREATE INDEX file_upload__deleted_at_null__file_deleted_at_null ON public.file_upload USING btree (path) WHERE ((deleted_at IS NULL) AND (file_deleted_at IS NULL));






CREATE INDEX file_upload__path__idx ON public.file_upload USING btree (path) WHERE (deleted_at IS NULL);






CREATE INDEX license_code__appsumo_uuid__index ON public.license_code USING btree (((details ->> 'uuid'::text))) WHERE ((source)::text = 'AppSumo'::text);






CREATE INDEX org_integration___sso_email_domains__index ON public.org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::public.integration_type);






CREATE INDEX org_integration___user_provisioning_auth_key__index ON public.org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::public.integration_type);






CREATE UNIQUE INDEX organization__status__root__unique ON public.organization USING btree (status) WHERE ((status = 'ROOT'::public.organization_status) AND (deleted_at IS NULL));






CREATE INDEX organization_theme__org_id__type ON public.organization_theme USING btree (org_id, type);






CREATE UNIQUE INDEX organization_theme__org_id__type__is_default ON public.organization_theme USING btree (org_id, type) WHERE (is_default AND (deleted_at IS NULL));






CREATE INDEX organization_usage_limit__org_id__limit_name ON public.organization_usage_limit USING btree (org_id, limit_name) WHERE (period_end_date IS NULL);






CREATE INDEX oul__current_limits ON public.organization_usage_limit USING btree (((timezone('UTC'::text, period_start_date) + period))) WHERE (period_end_date IS NULL);






CREATE UNIQUE INDEX pcn__comment_created__petition_access_id__petition_id__data ON public.petition_contact_notification USING btree (petition_access_id, petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_contact_notification_type);






CREATE INDEX pcn__comment_created__petition_id__data ON public.petition_contact_notification USING btree (petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_contact_notification_type);






CREATE INDEX pcn__unprocessed_unread_notifications ON public.petition_contact_notification USING btree (id) WHERE ((type = 'COMMENT_CREATED'::public.petition_contact_notification_type) AND (read_at IS NULL) AND (processed_at IS NULL));






CREATE INDEX petition__closed__anonymizer ON public.petition USING btree (org_id) WHERE ((deleted_at IS NULL) AND (anonymized_at IS NULL) AND (status = 'CLOSED'::public.petition_status) AND (closed_at IS NOT NULL));






CREATE INDEX petition__deleted_at__anonymized_at ON public.petition USING btree (id) INCLUDE (deleted_at) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE INDEX petition__from_public_petition_link_id__idx ON public.petition USING btree (from_public_petition_link_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition__from_template_id ON public.petition USING btree (from_template_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition__org_id ON public.petition USING btree (org_id) INCLUDE (status) WHERE (deleted_at IS NULL);






CREATE INDEX petition__org_id__document_organization_theme_id ON public.petition USING btree (org_id, document_organization_theme_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition__org_id__path ON public.petition USING btree (org_id, path) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition__public_metadata__slug ON public.petition USING btree (((public_metadata ->> 'slug'::text))) WHERE ((template_public IS TRUE) AND (deleted_at IS NULL));






CREATE INDEX petition__template_public__id ON public.petition USING btree (id) WHERE ((deleted_at IS NULL) AND template_public);






CREATE INDEX petition_access__contact_id ON public.petition_access USING btree (contact_id);






CREATE INDEX petition_access__petition_id ON public.petition_access USING btree (petition_id);






CREATE INDEX petition_access__petition_id_contact_id ON public.petition_access USING btree (petition_id, contact_id);






CREATE UNIQUE INDEX petition_access__petition_id_contact_id_active ON public.petition_access USING btree (petition_id, contact_id) WHERE (status = 'ACTIVE'::public.petition_access_status);






CREATE UNIQUE INDEX petition_access__petition_id_contactless ON public.petition_access USING btree (petition_id) WHERE ((status = 'ACTIVE'::public.petition_access_status) AND (contact_id IS NULL));






CREATE INDEX petition_access__remindable_accesses ON public.petition_access USING btree (id) WHERE ((status = 'ACTIVE'::public.petition_access_status) AND (reminders_active = true) AND (next_reminder_at IS NOT NULL) AND (reminders_left > 0) AND (automatic_reminders_left > 0));






CREATE INDEX petition_attachment__petition_id ON public.petition_attachment USING btree (petition_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_created_by_idx ON public.petition USING btree (created_by);






CREATE INDEX petition_event__petition_id__type ON public.petition_event USING btree (petition_id, type);






CREATE INDEX petition_event__processed_at ON public.petition_event USING btree (id) WHERE (processed_at IS NULL);






CREATE UNIQUE INDEX petition_field__parent_petition_field_id__profile_type_field_id ON public.petition_field USING btree (parent_petition_field_id, profile_type_field_id) WHERE ((parent_petition_field_id IS NOT NULL) AND (profile_type_field_id IS NOT NULL) AND (deleted_at IS NULL));






CREATE INDEX petition_field__petition_id ON public.petition_field USING btree (petition_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition_field__petition_id__alias__unique ON public.petition_field USING btree (petition_id, alias) WHERE (deleted_at IS NULL);






CREATE INDEX petition_field_attachment__file_upload_id ON public.petition_field_attachment USING btree (file_upload_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_field_attachment__petition_field_id ON public.petition_field_attachment USING btree (petition_field_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_field_comment__deleted_at__anonymized_at ON public.petition_field_comment USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE INDEX petition_field_comment__petition_id__petition_field_id ON public.petition_field_comment USING btree (petition_id, petition_field_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition_field_group_relationship__avoid_duplicates ON public.petition_field_group_relationship USING btree (petition_id, left_side_petition_field_id, right_side_petition_field_id, profile_relationship_type_id, direction) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition_field_reply__adverse_media__child_reply_unique ON public.petition_field_reply USING btree (petition_field_id, parent_petition_field_reply_id) WHERE ((type = 'ADVERSE_MEDIA_SEARCH'::public.petition_field_type) AND (parent_petition_field_reply_id IS NOT NULL) AND (deleted_at IS NULL));






CREATE UNIQUE INDEX petition_field_reply__adverse_media__reply_unique ON public.petition_field_reply USING btree (petition_field_id) WHERE ((type = 'ADVERSE_MEDIA_SEARCH'::public.petition_field_type) AND (parent_petition_field_reply_id IS NULL) AND (deleted_at IS NULL));






CREATE INDEX petition_field_reply__associated_profile_id ON public.petition_field_reply USING btree (associated_profile_id) WHERE ((associated_profile_id IS NOT NULL) AND (deleted_at IS NULL));






CREATE INDEX petition_field_reply__deleted_at__anonymized_at ON public.petition_field_reply USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE INDEX petition_field_reply__parent_petition_field_reply_id ON public.petition_field_reply USING btree (parent_petition_field_reply_id) WHERE ((deleted_at IS NULL) AND (parent_petition_field_reply_id IS NOT NULL));






CREATE INDEX petition_field_reply__petition_field_id ON public.petition_field_reply USING btree (petition_field_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_list_view__user_id ON public.petition_list_view USING btree (user_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_message__email_log_id ON public.petition_message USING btree (email_log_id);






CREATE INDEX petition_message__petition_access_id ON public.petition_message USING btree (petition_access_id);






CREATE INDEX petition_message__petition_id ON public.petition_message USING btree (petition_id);






CREATE INDEX petition_message__scheduled_at ON public.petition_message USING btree (scheduled_at) WHERE ((status = 'SCHEDULED'::public.petition_message_status) AND (scheduled_at IS NOT NULL));






CREATE UNIQUE INDEX petition_permission__from_user_group_id__petition_id__user_id ON public.petition_permission USING btree (from_user_group_id, petition_id, user_id) WHERE ((deleted_at IS NULL) AND (from_user_group_id IS NOT NULL));






CREATE UNIQUE INDEX petition_permission__owner ON public.petition_permission USING btree (petition_id) WHERE ((type = 'OWNER'::public.petition_permission_type) AND (deleted_at IS NULL));






CREATE INDEX petition_permission__petition_id ON public.petition_permission USING btree (petition_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition_permission__petition_id__user_id ON public.petition_permission USING btree (petition_id, user_id) WHERE ((deleted_at IS NULL) AND (from_user_group_id IS NULL) AND (user_group_id IS NULL));






CREATE UNIQUE INDEX petition_permission__user_group_id__petition_id ON public.petition_permission USING btree (user_group_id, petition_id) WHERE ((deleted_at IS NULL) AND (user_group_id IS NOT NULL));






CREATE INDEX petition_permission__user_id ON public.petition_permission USING btree (user_id) WHERE ((deleted_at IS NULL) AND (user_id IS NOT NULL));






CREATE INDEX petition_permission__user_id__petition_id ON public.petition_permission USING btree (user_id, petition_id) WHERE ((deleted_at IS NULL) AND (user_group_id IS NULL));






CREATE INDEX petition_reminder__email_log_id ON public.petition_reminder USING btree (email_log_id);






CREATE INDEX petition_reminder__petition_access_id ON public.petition_reminder USING btree (petition_access_id);






CREATE INDEX petition_signature_request__petition_id ON public.petition_signature_request USING btree (petition_id);






CREATE UNIQUE INDEX petition_signature_request__petition_id_processing_uniq ON public.petition_signature_request USING btree (petition_id) WHERE (status = ANY (ARRAY['ENQUEUED'::public.petition_signature_status, 'PROCESSING'::public.petition_signature_status, 'PROCESSED'::public.petition_signature_status]));






CREATE INDEX petition_user_notification__petition_id__user_id ON public.petition_user_notification USING btree (petition_id, user_id);






CREATE INDEX petition_user_notification__user_id ON public.petition_user_notification USING btree (user_id) INCLUDE (type);






CREATE INDEX petition_user_notification__user_id__created_at ON public.petition_user_notification USING btree (user_id, created_at DESC) INCLUDE (type);






CREATE INDEX petition_user_notification__user_id__created_at__is_read ON public.petition_user_notification USING btree (user_id, created_at DESC) INCLUDE (type, id) WHERE (read_at IS NULL);






CREATE INDEX petition_user_notification__user_id__read_at ON public.petition_user_notification USING btree (user_id) INCLUDE (id, type, created_at) WHERE (read_at IS NULL);






CREATE INDEX profile__deleted_at__anonymized_at ON public.profile USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE INDEX profile__org_id ON public.profile USING btree (org_id) WHERE (deleted_at IS NULL);






CREATE INDEX profile_event__processed_at ON public.profile_event USING btree (id) WHERE (processed_at IS NULL);






CREATE INDEX profile_event__profile_id__type ON public.profile_event USING btree (profile_id, type);






CREATE INDEX profile_field_file__expiring_files ON public.profile_field_file USING btree (profile_id, profile_type_field_id) INCLUDE (expiry_date) WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (expiry_date IS NOT NULL));






CREATE INDEX profile_field_file__not_anonymized ON public.profile_field_file USING btree (id) WHERE ((anonymized_at IS NULL) AND ((removed_at IS NOT NULL) OR (deleted_at IS NOT NULL)));






CREATE INDEX profile_field_file__p_id__ptf_id ON public.profile_field_file USING btree (profile_id, profile_type_field_id) WHERE (deleted_at IS NULL);






CREATE INDEX profile_field_file__ptf_id ON public.profile_field_file USING btree (profile_type_field_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX profile_field_value__current_value ON public.profile_field_value USING btree (profile_id, profile_type_field_id) WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (is_draft = false));






CREATE UNIQUE INDEX profile_field_value__draft_value ON public.profile_field_value USING btree (profile_id, profile_type_field_id) WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (is_draft = true));






CREATE INDEX profile_field_value__expiring_values ON public.profile_field_value USING btree (profile_id, profile_type_field_id) INCLUDE (expiry_date) WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (expiry_date IS NOT NULL) AND (is_draft = false));






CREATE INDEX profile_field_value__not_anonymized ON public.profile_field_value USING btree (id) WHERE ((anonymized_at IS NULL) AND ((removed_at IS NOT NULL) OR (deleted_at IS NOT NULL)));






CREATE INDEX profile_field_value__p_id__ptf_id ON public.profile_field_value USING btree (profile_id, profile_type_field_id) WHERE ((deleted_at IS NULL) AND (is_draft = false));






CREATE INDEX profile_field_value__ptf_id ON public.profile_field_value USING btree (profile_type_field_id) WHERE ((deleted_at IS NULL) AND (is_draft = false));






CREATE UNIQUE INDEX profile_field_value__unique_values_uniq ON public.profile_field_value USING btree (profile_type_field_id, ((content ->> 'value'::text))) WHERE (profile_type_field_is_unique AND (removed_at IS NULL) AND (deleted_at IS NULL));






CREATE INDEX profile_list_view__user_id__profile_type_id ON public.profile_list_view USING btree (user_id, profile_type_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX profile_relationship__avoid_duplicates ON public.profile_relationship USING btree (org_id, left_side_profile_id, profile_relationship_type_id, right_side_profile_id) WHERE ((deleted_at IS NULL) AND (removed_at IS NULL));






CREATE UNIQUE INDEX profile_relationship_type__org_id__alias ON public.profile_relationship_type USING btree (org_id, alias) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX profile_relationship_type_allowed_profile_type_unique ON public.profile_relationship_type_allowed_profile_type USING btree (org_id, profile_relationship_type_id, direction, allowed_profile_type_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX profile_subscription__profile_id__user_id ON public.profile_subscription USING btree (profile_id, user_id) WHERE (deleted_at IS NULL);






CREATE INDEX profile_subscription__user_id ON public.profile_subscription USING btree (user_id) WHERE (deleted_at IS NULL);






CREATE INDEX profile_type__org_id ON public.profile_type USING btree (org_id) WHERE (deleted_at IS NULL);






CREATE INDEX profile_type_field__profile_type_id ON public.profile_type_field USING btree (profile_type_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX profile_type_field__profile_type_id__alias__unique ON public.profile_type_field USING btree (profile_type_id, alias) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX profile_type_process_template__profile_type_process_id__templat ON public.profile_type_process_template USING btree (profile_type_process_id, template_id);






CREATE UNIQUE INDEX ptfp__profile_type_field_id__user_group_id ON public.profile_type_field_permission USING btree (profile_type_field_id, user_group_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX ptfp__profile_type_field_id__user_id ON public.profile_type_field_permission USING btree (profile_type_field_id, user_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX public_petition_link__slug__unique ON public.public_petition_link USING btree (slug);






CREATE INDEX public_petition_link__template_id ON public.public_petition_link USING btree (template_id);






CREATE INDEX public_petition_link_prefill_data__keycode ON public.public_petition_link_prefill_data USING btree (keycode) WHERE (deleted_at IS NULL);






CREATE INDEX pun__comment_created__petition_id__data ON public.petition_user_notification USING btree (petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_user_notification_type);






CREATE UNIQUE INDEX pun__comment_created__user_id__petition_id__data ON public.petition_user_notification USING btree (user_id, petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_user_notification_type);






CREATE INDEX pun__unprocessed_unread_notifications ON public.petition_user_notification USING btree (id) WHERE (((type = 'COMMENT_CREATED'::public.petition_user_notification_type) OR (type = 'SIGNATURE_CANCELLED'::public.petition_user_notification_type)) AND (read_at IS NULL) AND (processed_at IS NULL));






CREATE UNIQUE INDEX standard_list_definition__list_name__list_version__unique ON public.standard_list_definition USING btree (list_name, list_version);






CREATE INDEX system_event__processed_at ON public.system_event USING btree (id) WHERE (processed_at IS NULL);






CREATE INDEX system_event__user_logged_in__index ON public.system_event USING btree ((((data ->> 'user_id'::text))::integer)) WHERE (type = 'USER_LOGGED_IN'::public.system_event_type);






CREATE UNIQUE INDEX tag__organization_id__name__unique ON public.tag USING btree (organization_id, name) WHERE (deleted_at IS NULL);






CREATE INDEX task__anonymized_at ON public.task USING btree (id) INCLUDE (created_at) WHERE (anonymized_at IS NULL);






CREATE UNIQUE INDEX template_default_permission__owner ON public.template_default_permission USING btree (template_id) WHERE ((type = 'OWNER'::public.petition_permission_type) AND (deleted_at IS NULL));






CREATE INDEX template_default_permission__template_id ON public.template_default_permission USING btree (template_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX template_default_permission__template_id__user_group_id ON public.template_default_permission USING btree (template_id, user_group_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX template_default_permission__template_id__user_id ON public.template_default_permission USING btree (template_id, user_id) WHERE (deleted_at IS NULL);






CREATE INDEX template_default_permission__user_group_id ON public.template_default_permission USING btree (user_group_id) WHERE ((deleted_at IS NULL) AND (user_group_id IS NOT NULL));






CREATE INDEX template_default_permission__user_id ON public.template_default_permission USING btree (user_id) WHERE ((deleted_at IS NULL) AND (user_id IS NOT NULL));






CREATE UNIQUE INDEX user__is_org_owner ON public."user" USING btree (org_id) WHERE ((is_org_owner = true) AND (deleted_at IS NULL));






CREATE UNIQUE INDEX user__org_id__external_id ON public."user" USING btree (org_id, external_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user__org_id__user_data_id ON public."user" USING btree (org_id, user_data_id) WHERE (deleted_at IS NULL);






CREATE INDEX user__user_data_id ON public."user" USING btree (user_data_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_authentication_token__token_hash ON public.user_authentication_token USING btree (token_hash) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_authentication_token__token_name_user_id ON public.user_authentication_token USING btree (user_id, token_name) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_data__cognito_id__unique ON public.user_data USING btree (cognito_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_data__email__unique ON public.user_data USING btree (email) WHERE (deleted_at IS NULL);






CREATE INDEX user_delegate__delegate_user_id__user_id ON public.user_delegate USING btree (delegate_user_id, user_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_delegate__user_id__delegate_user_id ON public.user_delegate USING btree (user_id, delegate_user_id) WHERE (deleted_at IS NULL);






CREATE INDEX user_group__org_id ON public.user_group USING btree (org_id) WHERE (deleted_at IS NULL);






CREATE INDEX user_group_member__user_group_id ON public.user_group_member USING btree (user_group_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_group_member__user_group_id__user_id ON public.user_group_member USING btree (user_group_id, user_id) WHERE (deleted_at IS NULL);






CREATE INDEX user_group_permission__user_group_id ON public.user_group_permission USING btree (user_group_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_group_permission__user_group_id__name ON public.user_group_permission USING btree (user_group_id, name) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_profile_type_pinned__user_id__profile_type_id ON public.user_profile_type_pinned USING btree (user_id, profile_type_id);






ALTER TABLE ONLY public.ai_completion_log
    ADD CONSTRAINT ai_completion_log_integration_id_foreign FOREIGN KEY (integration_id) REFERENCES public.org_integration(id);






ALTER TABLE ONLY public.contact_authentication
    ADD CONSTRAINT contact_authentication_contact_id_foreign FOREIGN KEY (contact_id) REFERENCES public.contact(id);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.dashboard_module
    ADD CONSTRAINT dashboard_module_dashboard_id_foreign FOREIGN KEY (dashboard_id) REFERENCES public.dashboard(id);






ALTER TABLE ONLY public.dashboard
    ADD CONSTRAINT dashboard_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.dashboard_permission
    ADD CONSTRAINT dashboard_permission_dashboard_id_foreign FOREIGN KEY (dashboard_id) REFERENCES public.dashboard(id);






ALTER TABLE ONLY public.dashboard_permission
    ADD CONSTRAINT dashboard_permission_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_group(id);






ALTER TABLE ONLY public.dashboard_permission
    ADD CONSTRAINT dashboard_permission_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.document_processing_log
    ADD CONSTRAINT document_processing_log_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.document_processing_log
    ADD CONSTRAINT document_processing_log_integration_id_foreign FOREIGN KEY (integration_id) REFERENCES public.org_integration(id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_temporary_file_id_foreign FOREIGN KEY (temporary_file_id) REFERENCES public.temporary_file(id);






ALTER TABLE ONLY public.email_event
    ADD CONSTRAINT email_event_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.event_subscription
    ADD CONSTRAINT event_subscription_from_profile_type_id_foreign FOREIGN KEY (from_profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.event_subscription
    ADD CONSTRAINT event_subscription_from_template_id_foreign FOREIGN KEY (from_template_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.event_subscription_signature_key
    ADD CONSTRAINT event_subscription_signature_key_event_subscription_id_foreign FOREIGN KEY (event_subscription_id) REFERENCES public.event_subscription(id);






ALTER TABLE ONLY public.event_subscription
    ADD CONSTRAINT event_subscription_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_feature_flag_name_foreign FOREIGN KEY (feature_flag_name) REFERENCES public.feature_flag(name);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.file_export_log
    ADD CONSTRAINT file_export_log_created_by_user_id_foreign FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.file_export_log
    ADD CONSTRAINT file_export_log_integration_id_foreign FOREIGN KEY (integration_id) REFERENCES public.org_integration(id);






ALTER TABLE ONLY public.org_integration
    ADD CONSTRAINT org_integration_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_icon_public_file_id_foreign FOREIGN KEY (icon_public_file_id) REFERENCES public.public_file_upload(id);






ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_logo_public_file_id_foreign FOREIGN KEY (logo_public_file_id) REFERENCES public.public_file_upload(id);






ALTER TABLE ONLY public.organization_theme
    ADD CONSTRAINT organization_theme_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.organization_usage_limit
    ADD CONSTRAINT organization_usage_limit_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access_contact_id_foreign FOREIGN KEY (contact_id) REFERENCES public.contact(id);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access_delegate_granter_id_foreign FOREIGN KEY (delegate_granter_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access_delegator_contact_id_foreign FOREIGN KEY (delegator_contact_id) REFERENCES public.contact(id);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access_granter_id_foreign FOREIGN KEY (granter_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_approval_request_step_approver
    ADD CONSTRAINT petition_approval_request_step_approver_petition_approval_reque FOREIGN KEY (petition_approval_request_step_id) REFERENCES public.petition_approval_request_step(id);






ALTER TABLE ONLY public.petition_approval_request_step_approver
    ADD CONSTRAINT petition_approval_request_step_approver_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_approval_request_step
    ADD CONSTRAINT petition_approval_request_step_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_attachment
    ADD CONSTRAINT petition_attachment_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_attachment
    ADD CONSTRAINT petition_attachment_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_comment_attachment
    ADD CONSTRAINT petition_comment_attachment_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_comment_attachment
    ADD CONSTRAINT petition_comment_attachment_petition_comment_id_foreign FOREIGN KEY (petition_comment_id) REFERENCES public.petition_field_comment(id);






ALTER TABLE ONLY public.petition_contact_notification
    ADD CONSTRAINT petition_contact_notification_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.petition_contact_notification
    ADD CONSTRAINT petition_contact_notification_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_document_organization_theme_id_foreign FOREIGN KEY (document_organization_theme_id) REFERENCES public.organization_theme(id);






ALTER TABLE ONLY public.petition_event
    ADD CONSTRAINT petition_event_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_field_attachment
    ADD CONSTRAINT petition_field_attachment_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_field_attachment
    ADD CONSTRAINT petition_field_attachment_petition_field_id_foreign FOREIGN KEY (petition_field_id) REFERENCES public.petition_field(id);






ALTER TABLE ONLY public.petition_field_comment
    ADD CONSTRAINT petition_field_comment_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.petition_field_comment
    ADD CONSTRAINT petition_field_comment_petition_field_id_foreign FOREIGN KEY (petition_field_id) REFERENCES public.petition_field(id);






ALTER TABLE ONLY public.petition_field_comment
    ADD CONSTRAINT petition_field_comment_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_field_comment
    ADD CONSTRAINT petition_field_comment_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_from_petition_field_id_foreign FOREIGN KEY (from_petition_field_id) REFERENCES public.petition_field(id);






ALTER TABLE ONLY public.petition_field_group_relationship
    ADD CONSTRAINT petition_field_group_relationship_left_side_petition_field_id_f FOREIGN KEY (left_side_petition_field_id) REFERENCES public.petition_field(id);






ALTER TABLE ONLY public.petition_field_group_relationship
    ADD CONSTRAINT petition_field_group_relationship_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_field_group_relationship
    ADD CONSTRAINT petition_field_group_relationship_profile_relationship_type_id_ FOREIGN KEY (profile_relationship_type_id) REFERENCES public.profile_relationship_type(id);






ALTER TABLE ONLY public.petition_field_group_relationship
    ADD CONSTRAINT petition_field_group_relationship_right_side_petition_field_id_ FOREIGN KEY (right_side_petition_field_id) REFERENCES public.petition_field(id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_parent_petition_field_id_foreign FOREIGN KEY (parent_petition_field_id) REFERENCES public.petition_field(id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_profile_type_field_id_foreign FOREIGN KEY (profile_type_field_id) REFERENCES public.profile_type_field(id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_profile_type_id_foreign FOREIGN KEY (profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.petition_field_reply
    ADD CONSTRAINT petition_field_reply_associated_profile_id_foreign FOREIGN KEY (associated_profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.petition_field_reply
    ADD CONSTRAINT petition_field_reply_parent_petition_field_reply_id_foreign FOREIGN KEY (parent_petition_field_reply_id) REFERENCES public.petition_field_reply(id);






ALTER TABLE ONLY public.petition_field_reply
    ADD CONSTRAINT petition_field_reply_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.petition_field_reply
    ADD CONSTRAINT petition_field_reply_petition_field_id_foreign FOREIGN KEY (petition_field_id) REFERENCES public.petition_field(id);






ALTER TABLE ONLY public.petition_field_reply
    ADD CONSTRAINT petition_field_reply_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_from_public_petition_link_id_foreign FOREIGN KEY (from_public_petition_link_id) REFERENCES public.public_petition_link(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_from_template_id_foreign FOREIGN KEY (from_template_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_list_view
    ADD CONSTRAINT petition_list_view_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_message
    ADD CONSTRAINT petition_message_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.petition_message
    ADD CONSTRAINT petition_message_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.petition_message
    ADD CONSTRAINT petition_message_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_message
    ADD CONSTRAINT petition_message_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.petition_permission
    ADD CONSTRAINT petition_permission_from_user_group_id_foreign FOREIGN KEY (from_user_group_id) REFERENCES public.user_group(id);






ALTER TABLE ONLY public.petition_permission
    ADD CONSTRAINT petition_permission_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_permission
    ADD CONSTRAINT petition_permission_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_group(id);






ALTER TABLE ONLY public.petition_permission
    ADD CONSTRAINT petition_permission_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_profile
    ADD CONSTRAINT petition_profile_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_profile
    ADD CONSTRAINT petition_profile_profile_id_foreign FOREIGN KEY (profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.petition_reminder
    ADD CONSTRAINT petition_reminder_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.petition_reminder
    ADD CONSTRAINT petition_reminder_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.petition_reminder
    ADD CONSTRAINT petition_reminder_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_restricted_by_user_id_foreign FOREIGN KEY (restricted_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_send_on_behalf_user_id_foreign FOREIGN KEY (send_on_behalf_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_file_upload_audit_trail_id_foreign FOREIGN KEY (file_upload_audit_trail_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_temporary_file_document_id_foreign FOREIGN KEY (temporary_file_document_id) REFERENCES public.temporary_file(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_summary_ai_completion_log_id_foreign FOREIGN KEY (summary_ai_completion_log_id) REFERENCES public.ai_completion_log(id);






ALTER TABLE ONLY public.petition_tag
    ADD CONSTRAINT petition_tag_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_tag
    ADD CONSTRAINT petition_tag_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.tag(id);






ALTER TABLE ONLY public.petition_user_notification
    ADD CONSTRAINT petition_user_notification_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_user_notification
    ADD CONSTRAINT petition_user_notification_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_event
    ADD CONSTRAINT profile_event_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.profile_event
    ADD CONSTRAINT profile_event_profile_id_foreign FOREIGN KEY (profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.profile_external_source_entity
    ADD CONSTRAINT profile_external_source_entity_created_by_user_id_foreign FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_external_source_entity
    ADD CONSTRAINT profile_external_source_entity_integration_id_foreign FOREIGN KEY (integration_id) REFERENCES public.org_integration(id);






ALTER TABLE ONLY public.profile_field_file
    ADD CONSTRAINT profile_field_file_created_by_user_id_foreign FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_field_file
    ADD CONSTRAINT profile_field_file_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.profile_field_file
    ADD CONSTRAINT profile_field_file_petition_field_reply_id_foreign FOREIGN KEY (petition_field_reply_id) REFERENCES public.petition_field_reply(id);






ALTER TABLE ONLY public.profile_field_file
    ADD CONSTRAINT profile_field_file_profile_id_foreign FOREIGN KEY (profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.profile_field_file
    ADD CONSTRAINT profile_field_file_profile_type_field_id_foreign FOREIGN KEY (profile_type_field_id) REFERENCES public.profile_type_field(id);






ALTER TABLE ONLY public.profile_field_file
    ADD CONSTRAINT profile_field_file_removed_by_user_id_foreign FOREIGN KEY (removed_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_field_value
    ADD CONSTRAINT profile_field_value_created_by_user_id_foreign FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_field_value
    ADD CONSTRAINT profile_field_value_external_source_integration_id_foreign FOREIGN KEY (external_source_integration_id) REFERENCES public.org_integration(id);






ALTER TABLE ONLY public.profile_field_value
    ADD CONSTRAINT profile_field_value_petition_field_reply_id_foreign FOREIGN KEY (petition_field_reply_id) REFERENCES public.petition_field_reply(id);






ALTER TABLE ONLY public.profile_field_value
    ADD CONSTRAINT profile_field_value_profile_id_foreign FOREIGN KEY (profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.profile_field_value
    ADD CONSTRAINT profile_field_value_profile_type_field_id_foreign FOREIGN KEY (profile_type_field_id) REFERENCES public.profile_type_field(id);






ALTER TABLE ONLY public.profile_field_value
    ADD CONSTRAINT profile_field_value_removed_by_user_id_foreign FOREIGN KEY (removed_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_list_view
    ADD CONSTRAINT profile_list_view_profile_type_id_foreign FOREIGN KEY (profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.profile_list_view
    ADD CONSTRAINT profile_list_view_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_profile_type_id_foreign FOREIGN KEY (profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.profile_relationship
    ADD CONSTRAINT profile_relationship_created_by_user_id_foreign FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_relationship
    ADD CONSTRAINT profile_relationship_left_side_profile_id_foreign FOREIGN KEY (left_side_profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.profile_relationship
    ADD CONSTRAINT profile_relationship_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.profile_relationship
    ADD CONSTRAINT profile_relationship_profile_relationship_type_id_foreign FOREIGN KEY (profile_relationship_type_id) REFERENCES public.profile_relationship_type(id);






ALTER TABLE ONLY public.profile_relationship
    ADD CONSTRAINT profile_relationship_removed_by_user_id_foreign FOREIGN KEY (removed_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_relationship
    ADD CONSTRAINT profile_relationship_right_side_profile_id_foreign FOREIGN KEY (right_side_profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.profile_relationship_type_allowed_profile_type
    ADD CONSTRAINT profile_relationship_type_allowed_profile_type_allowed_profile_ FOREIGN KEY (allowed_profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.profile_relationship_type_allowed_profile_type
    ADD CONSTRAINT profile_relationship_type_allowed_profile_type_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.profile_relationship_type_allowed_profile_type
    ADD CONSTRAINT profile_relationship_type_allowed_profile_type_profile_relation FOREIGN KEY (profile_relationship_type_id) REFERENCES public.profile_relationship_type(id);






ALTER TABLE ONLY public.profile_relationship_type
    ADD CONSTRAINT profile_relationship_type_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.profile_subscription
    ADD CONSTRAINT profile_subscription_profile_id_foreign FOREIGN KEY (profile_id) REFERENCES public.profile(id);






ALTER TABLE ONLY public.profile_subscription
    ADD CONSTRAINT profile_subscription_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_type
    ADD CONSTRAINT profile_type_archived_by_user_id_foreign FOREIGN KEY (archived_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_type_field_permission
    ADD CONSTRAINT profile_type_field_permission_profile_type_field_id_foreign FOREIGN KEY (profile_type_field_id) REFERENCES public.profile_type_field(id);






ALTER TABLE ONLY public.profile_type_field_permission
    ADD CONSTRAINT profile_type_field_permission_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_group(id);






ALTER TABLE ONLY public.profile_type_field_permission
    ADD CONSTRAINT profile_type_field_permission_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.profile_type_field
    ADD CONSTRAINT profile_type_field_profile_type_id_foreign FOREIGN KEY (profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.profile_type
    ADD CONSTRAINT profile_type_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.profile_type_process
    ADD CONSTRAINT profile_type_process_profile_type_id_foreign FOREIGN KEY (profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.profile_type_process_template
    ADD CONSTRAINT profile_type_process_template_profile_type_process_id_foreign FOREIGN KEY (profile_type_process_id) REFERENCES public.profile_type_process(id);






ALTER TABLE ONLY public.profile_type_process_template
    ADD CONSTRAINT profile_type_process_template_template_id_foreign FOREIGN KEY (template_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.public_petition_link_prefill_data
    ADD CONSTRAINT public_petition_link_prefill_data_template_id_foreign FOREIGN KEY (template_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.public_petition_link
    ADD CONSTRAINT public_petition_link_template_id_foreign FOREIGN KEY (template_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.template_default_permission
    ADD CONSTRAINT template_default_permission_template_id_foreign FOREIGN KEY (template_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.template_default_permission
    ADD CONSTRAINT template_default_permission_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_group(id);






ALTER TABLE ONLY public.template_default_permission
    ADD CONSTRAINT template_default_permission_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.user_authentication_token
    ADD CONSTRAINT user_authentication_token_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.user_data
    ADD CONSTRAINT user_data_avatar_public_file_id_foreign FOREIGN KEY (avatar_public_file_id) REFERENCES public.public_file_upload(id);






ALTER TABLE ONLY public.user_delegate
    ADD CONSTRAINT user_delegate_delegate_user_id_foreign FOREIGN KEY (delegate_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.user_delegate
    ADD CONSTRAINT user_delegate_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.user_group_member
    ADD CONSTRAINT user_group_member_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_group(id);






ALTER TABLE ONLY public.user_group_member
    ADD CONSTRAINT user_group_member_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.user_group
    ADD CONSTRAINT user_group_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.user_group_permission
    ADD CONSTRAINT user_group_permission_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_group(id);






ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log_petition_event_id_foreign FOREIGN KEY (petition_event_id) REFERENCES public.petition_event(id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.user_profile_event_log
    ADD CONSTRAINT user_profile_event_log_profile_event_id_foreign FOREIGN KEY (profile_event_id) REFERENCES public.profile_event(id);






ALTER TABLE ONLY public.user_profile_event_log
    ADD CONSTRAINT user_profile_event_log_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.user_profile_type_pinned
    ADD CONSTRAINT user_profile_type_pinned_profile_type_id_foreign FOREIGN KEY (profile_type_id) REFERENCES public.profile_type(id);






ALTER TABLE ONLY public.user_profile_type_pinned
    ADD CONSTRAINT user_profile_type_pinned_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_user_data_id_foreign FOREIGN KEY (user_data_id) REFERENCES public.user_data(id);







  `);
}

export async function down(knex: Knex): Promise<void> {}

import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
  





















CREATE TYPE public.feature_flag_name AS ENUM (
    'PETITION_SIGNATURE',
    'HIDE_RECIPIENT_VIEW_CONTENTS',
    'SKIP_FORWARD_SECURITY',
    'EXPORT_CUATRECASAS',
    'DEVELOPER_ACCESS',
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
    'PUBLIC_PETITION_LINK_PREFILL_DATA'
);






CREATE TYPE public.integration_type AS ENUM (
    'SIGNATURE',
    'SSO',
    'USER_PROVISIONING',
    'DOW_JONES_KYC'
);






CREATE TYPE public.license_code_status AS ENUM (
    'PENDING',
    'REDEEMED',
    'EXPIRED'
);






CREATE TYPE public.organization_status AS ENUM (
    'DEV',
    'DEMO',
    'ACTIVE',
    'CHURNED',
    'ROOT'
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
    'PETITION_ANONYMIZED'
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
    'DOW_JONES_KYC'
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
    'REQUEST_RESTARTED'
);






CREATE TYPE public.petition_signature_status AS ENUM (
    'ENQUEUED',
    'PROCESSING',
    'PROCESSED',
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
    'DOW_JONES_PROFILE_DOWNLOAD'
);






CREATE TYPE public.task_status AS ENUM (
    'ENQUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);






CREATE TYPE public.user_organization_role AS ENUM (
    'COLLABORATOR',
    'NORMAL',
    'ADMIN',
    'OWNER'
);






CREATE TYPE public.user_status AS ENUM (
    'ACTIVE',
    'INACTIVE'
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
    created_from character varying(255) NOT NULL,
    sent_at timestamp with time zone,
    response text,
    external_id character varying(255),
    reply_to text,
    anonymized_at timestamp with time zone
);






CREATE SEQUENCE public.email_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.email_log_id_seq OWNED BY public.email_log.id;






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
    file_deleted_at timestamp with time zone
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
    anonymize_petitions_after_months integer
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
    "limit" integer NOT NULL,
    used integer DEFAULT 0 NOT NULL,
    period interval NOT NULL,
    period_start_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    period_end_date timestamp with time zone,
    cycle_number integer DEFAULT 1 NOT NULL,
    CONSTRAINT organization_usage_limit__used__limit__check CHECK ((used <= "limit"))
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
    locale character varying(10) NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    status public.petition_status,
    deadline timestamp with time zone,
    email_subject character varying(255),
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
    CONSTRAINT petition_access__reminders_left_check CHECK ((reminders_left >= 0))
);






CREATE SEQUENCE public.petition_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_access_id_seq OWNED BY public.petition_access.id;






CREATE TABLE public.petition_attachment (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    file_upload_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255)
);






CREATE SEQUENCE public.petition_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_attachment_id_seq OWNED BY public.petition_attachment.id;






CREATE TABLE public.petition_contact_notification (
    id integer NOT NULL,
    petition_access_id integer NOT NULL,
    petition_id integer NOT NULL,
    type public.petition_contact_notification_type NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone
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
    processed_at timestamp with time zone
);






CREATE SEQUENCE public.petition_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_event_id_seq OWNED BY public.petition_event.id;






CREATE TABLE public.petition_event_subscription (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    is_enabled boolean DEFAULT true NOT NULL,
    event_types jsonb,
    name character varying(255),
    from_template_id integer
);






CREATE SEQUENCE public.petition_event_subscription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_event_subscription_id_seq OWNED BY public.petition_event_subscription.id;






CREATE TABLE public.petition_field (
    id integer NOT NULL,
    petition_id integer NOT NULL,
    "position" integer,
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
    CONSTRAINT petition_field__petition_id__position__null_deleted_at CHECK (((("position" IS NULL) AND (deleted_at IS NOT NULL)) OR (("position" IS NOT NULL) AND (deleted_at IS NULL))))
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
    petition_field_id integer NOT NULL,
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
    content_json jsonb
);






CREATE SEQUENCE public.petition_field_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_field_comment_id_seq OWNED BY public.petition_field_comment.id;






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
    CONSTRAINT petition_signature_request__cancel_reason_data_check CHECK ((((status = 'CANCELLED'::public.petition_signature_status) AND (cancel_reason IS NOT NULL) AND (cancel_data IS NOT NULL)) OR ((status <> 'CANCELLED'::public.petition_signature_status) AND (cancel_reason IS NULL) AND (cancel_data IS NULL))))
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
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone
);






CREATE SEQUENCE public.petition_user_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;






ALTER SEQUENCE public.petition_user_notification_id_seq OWNED BY public.petition_user_notification.id;






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






CREATE TABLE public.system_event (
    id integer NOT NULL,
    type public.system_event_type NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp with time zone
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
    finished_at timestamp with time zone,
    CONSTRAINT task__user_id__petition_access_id CHECK ((((user_id IS NULL) AND (petition_access_id IS NOT NULL)) OR ((user_id IS NOT NULL) AND (petition_access_id IS NULL)))),
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
    organization_role public.user_organization_role DEFAULT 'NORMAL'::public.user_organization_role NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(255),
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    last_active_at timestamp with time zone,
    status public.user_status DEFAULT 'ACTIVE'::public.user_status NOT NULL,
    external_id character varying(255),
    user_data_id integer NOT NULL
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
    deleted_by character varying(255)
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
    deleted_by character varying(255)
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






ALTER TABLE ONLY public.contact ALTER COLUMN id SET DEFAULT nextval('public.contact_id_seq'::regclass);






ALTER TABLE ONLY public.contact_authentication ALTER COLUMN id SET DEFAULT nextval('public.contact_authentication_id_seq'::regclass);






ALTER TABLE ONLY public.contact_authentication_request ALTER COLUMN id SET DEFAULT nextval('public.contact_authentication_request_id_seq'::regclass);






ALTER TABLE ONLY public.email_attachment ALTER COLUMN id SET DEFAULT nextval('public.email_attachment_id_seq'::regclass);






ALTER TABLE ONLY public.email_event ALTER COLUMN id SET DEFAULT nextval('public.email_event_id_seq'::regclass);






ALTER TABLE ONLY public.email_log ALTER COLUMN id SET DEFAULT nextval('public.email_log_id_seq'::regclass);






ALTER TABLE ONLY public.feature_flag ALTER COLUMN id SET DEFAULT nextval('public.feature_flag_id_seq'::regclass);






ALTER TABLE ONLY public.feature_flag_override ALTER COLUMN id SET DEFAULT nextval('public.feature_flag_override_id_seq'::regclass);






ALTER TABLE ONLY public.file_upload ALTER COLUMN id SET DEFAULT nextval('public.file_upload_id_seq'::regclass);






ALTER TABLE ONLY public.license_code ALTER COLUMN id SET DEFAULT nextval('public.license_code_id_seq'::regclass);






ALTER TABLE ONLY public.org_integration ALTER COLUMN id SET DEFAULT nextval('public.org_integration_id_seq'::regclass);






ALTER TABLE ONLY public.organization ALTER COLUMN id SET DEFAULT nextval('public.organization_id_seq'::regclass);






ALTER TABLE ONLY public.organization_theme ALTER COLUMN id SET DEFAULT nextval('public.organization_theme_id_seq'::regclass);






ALTER TABLE ONLY public.organization_usage_limit ALTER COLUMN id SET DEFAULT nextval('public.organization_usage_limit_id_seq'::regclass);






ALTER TABLE ONLY public.petition ALTER COLUMN id SET DEFAULT nextval('public.petition_id_seq'::regclass);






ALTER TABLE ONLY public.petition_access ALTER COLUMN id SET DEFAULT nextval('public.petition_access_id_seq'::regclass);






ALTER TABLE ONLY public.petition_attachment ALTER COLUMN id SET DEFAULT nextval('public.petition_attachment_id_seq'::regclass);






ALTER TABLE ONLY public.petition_contact_notification ALTER COLUMN id SET DEFAULT nextval('public.petition_contact_notification_id_seq'::regclass);






ALTER TABLE ONLY public.petition_event ALTER COLUMN id SET DEFAULT nextval('public.petition_event_id_seq'::regclass);






ALTER TABLE ONLY public.petition_event_subscription ALTER COLUMN id SET DEFAULT nextval('public.petition_event_subscription_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field ALTER COLUMN id SET DEFAULT nextval('public.petition_field_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field_attachment ALTER COLUMN id SET DEFAULT nextval('public.petition_field_attachment_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field_comment ALTER COLUMN id SET DEFAULT nextval('public.petition_field_comment_id_seq'::regclass);






ALTER TABLE ONLY public.petition_field_reply ALTER COLUMN id SET DEFAULT nextval('public.petition_field_reply_id_seq'::regclass);






ALTER TABLE ONLY public.petition_message ALTER COLUMN id SET DEFAULT nextval('public.petition_message_id_seq'::regclass);






ALTER TABLE ONLY public.petition_permission ALTER COLUMN id SET DEFAULT nextval('public.petition_permission_id_seq'::regclass);






ALTER TABLE ONLY public.petition_reminder ALTER COLUMN id SET DEFAULT nextval('public.petition_reminder_id_seq'::regclass);






ALTER TABLE ONLY public.petition_signature_request ALTER COLUMN id SET DEFAULT nextval('public.petition_signature_request_id_seq'::regclass);






ALTER TABLE ONLY public.petition_tag ALTER COLUMN id SET DEFAULT nextval('public.petition_tag_id_seq'::regclass);






ALTER TABLE ONLY public.petition_user_notification ALTER COLUMN id SET DEFAULT nextval('public.petition_user_notification_id_seq'::regclass);






ALTER TABLE ONLY public.public_file_upload ALTER COLUMN id SET DEFAULT nextval('public.public_file_upload_id_seq'::regclass);






ALTER TABLE ONLY public.public_petition_link ALTER COLUMN id SET DEFAULT nextval('public.public_petition_link_id_seq'::regclass);






ALTER TABLE ONLY public.public_petition_link_prefill_data ALTER COLUMN id SET DEFAULT nextval('public.public_petition_link_prefill_data_id_seq'::regclass);






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






ALTER TABLE ONLY public.user_petition_event_log ALTER COLUMN id SET DEFAULT nextval('public.user_petition_event_log_id_seq'::regclass);






ALTER TABLE ONLY public.contact_authentication
    ADD CONSTRAINT contact_authentication_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request__petition_access_id__token_hash UNIQUE (petition_access_id, token_hash);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_email_log_id_temporary_file_id_unique UNIQUE (email_log_id, temporary_file_id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.email_event
    ADD CONSTRAINT email_event_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.email_log
    ADD CONSTRAINT email_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.feature_flag
    ADD CONSTRAINT feature_flag_name_unique UNIQUE (name);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.feature_flag
    ADD CONSTRAINT feature_flag_pkey PRIMARY KEY (id);






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
    ADD CONSTRAINT organization_usage_limit_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access__keycode UNIQUE (keycode);






ALTER TABLE ONLY public.petition_access
    ADD CONSTRAINT petition_access_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_attachment
    ADD CONSTRAINT petition_attachment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_contact_notification
    ADD CONSTRAINT petition_contact_notification_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_event
    ADD CONSTRAINT petition_event_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_event_subscription
    ADD CONSTRAINT petition_event_subscription_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field__petition_id__position UNIQUE (petition_id, "position") DEFERRABLE;






ALTER TABLE ONLY public.petition_field_attachment
    ADD CONSTRAINT petition_field_attachment__petition_field_id__file_upload_id__u UNIQUE (petition_field_id, file_upload_id);






ALTER TABLE ONLY public.petition_field_attachment
    ADD CONSTRAINT petition_field_attachment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field_comment
    ADD CONSTRAINT petition_field_comment_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_field_reply
    ADD CONSTRAINT petition_field_reply_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_message
    ADD CONSTRAINT petition_message_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition_permission
    ADD CONSTRAINT petition_permission_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_pkey PRIMARY KEY (id);






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






ALTER TABLE ONLY public.public_file_upload
    ADD CONSTRAINT public_file_upload_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.public_petition_link
    ADD CONSTRAINT public_petition_link_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.public_petition_link_prefill_data
    ADD CONSTRAINT public_petition_link_prefill_data_pkey PRIMARY KEY (id);






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






ALTER TABLE ONLY public.user_group
    ADD CONSTRAINT user_group_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log__user_id__petition_event_id UNIQUE (user_id, petition_event_id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);






CREATE INDEX contact__deleted_at__anonymized_at ON public.contact USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE UNIQUE INDEX contact__org_id__email ON public.contact USING btree (org_id, email) WHERE (deleted_at IS NULL);






CREATE INDEX contact_authentication__contact_id__contact_value_hash ON public.contact_authentication USING btree (contact_id, cookie_value_hash);






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






CREATE UNIQUE INDEX organization_usage_limit__org_id__limit_name__unique ON public.organization_usage_limit USING btree (org_id, limit_name) WHERE (period_end_date IS NULL);






CREATE INDEX oul__current_limits ON public.organization_usage_limit USING btree (((timezone('UTC'::text, period_start_date) + period))) WHERE (period_end_date IS NULL);






CREATE UNIQUE INDEX pcn__comment_created__petition_access_id__petition_id__data ON public.petition_contact_notification USING btree (petition_access_id, petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_contact_notification_type);






CREATE INDEX pcn__comment_created__petition_id__data ON public.petition_contact_notification USING btree (petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_contact_notification_type);






CREATE INDEX pcn__unprocessed_comment_notifications ON public.petition_contact_notification USING btree (id) WHERE ((type = 'COMMENT_CREATED'::public.petition_contact_notification_type) AND (is_read = false) AND (processed_at IS NULL));






CREATE INDEX petition__deleted_at__anonymized_at ON public.petition USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE INDEX petition__from_public_petition_link_id__idx ON public.petition USING btree (from_public_petition_link_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition__from_template_id ON public.petition USING btree (from_template_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition__org_id__document_organization_theme_id ON public.petition USING btree (org_id, document_organization_theme_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition__org_id__path ON public.petition USING btree (org_id, path) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition__public_metadata__slug ON public.petition USING btree (((public_metadata ->> 'slug'::text))) WHERE ((template_public IS TRUE) AND (deleted_at IS NULL));






CREATE INDEX petition__template_public__id ON public.petition USING btree (id) WHERE ((deleted_at IS NULL) AND template_public);






CREATE INDEX petition_access__contact_id ON public.petition_access USING btree (contact_id);






CREATE INDEX petition_access__petition_id ON public.petition_access USING btree (petition_id);






CREATE INDEX petition_access__petition_id_contact_id ON public.petition_access USING btree (petition_id, contact_id);






CREATE UNIQUE INDEX petition_access__petition_id_contact_id_active ON public.petition_access USING btree (petition_id, contact_id) WHERE (status = 'ACTIVE'::public.petition_access_status);






CREATE UNIQUE INDEX petition_access__petition_id_contactless ON public.petition_access USING btree (petition_id) WHERE ((status = 'ACTIVE'::public.petition_access_status) AND (contact_id IS NULL));






CREATE INDEX petition_access__remindable_accesses_idx ON public.petition_access USING btree (id) WHERE ((status = 'ACTIVE'::public.petition_access_status) AND (reminders_active = true) AND (next_reminder_at IS NOT NULL) AND (reminders_left > 0));






CREATE INDEX petition_created_by_idx ON public.petition USING btree (created_by);






CREATE INDEX petition_event__petition_id__type ON public.petition_event USING btree (petition_id, type);






CREATE INDEX petition_event__processed_at ON public.petition_event USING btree (id) WHERE (processed_at IS NULL);






CREATE INDEX petition_field__petition_id ON public.petition_field USING btree (petition_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition_field__petition_id__alias__unique ON public.petition_field USING btree (petition_id, alias) WHERE (deleted_at IS NULL);






CREATE INDEX petition_field_attachment__file_upload_id ON public.petition_field_attachment USING btree (file_upload_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_field_attachment__petition_field_id ON public.petition_field_attachment USING btree (petition_field_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_field_comment__deleted_at__anonymized_at ON public.petition_field_comment USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE INDEX petition_field_reply__deleted_at__anonymized_at ON public.petition_field_reply USING btree (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));






CREATE INDEX petition_field_reply__petition_field_id ON public.petition_field_reply USING btree (petition_field_id) WHERE (deleted_at IS NULL);






CREATE INDEX petition_message__email_log_id ON public.petition_message USING btree (email_log_id);






CREATE INDEX petition_message__petition_access_id ON public.petition_message USING btree (petition_access_id);






CREATE INDEX petition_message__petition_id ON public.petition_message USING btree (petition_id);






CREATE INDEX petition_message__scheduled_at ON public.petition_message USING btree (scheduled_at) WHERE ((status = 'SCHEDULED'::public.petition_message_status) AND (scheduled_at IS NOT NULL));






CREATE UNIQUE INDEX petition_permission__from_user_group_id__petition_id__user_id ON public.petition_permission USING btree (from_user_group_id, petition_id, user_id) WHERE ((deleted_at IS NULL) AND (from_user_group_id IS NOT NULL));






CREATE UNIQUE INDEX petition_permission__owner ON public.petition_permission USING btree (petition_id) WHERE ((type = 'OWNER'::public.petition_permission_type) AND (deleted_at IS NULL));






CREATE INDEX petition_permission__petition_id ON public.petition_permission USING btree (petition_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX petition_permission__petition_id__user_id ON public.petition_permission USING btree (petition_id, user_id) WHERE ((deleted_at IS NULL) AND (from_user_group_id IS NULL) AND (user_group_id IS NULL));






CREATE UNIQUE INDEX petition_permission__user_group_id__petition_id ON public.petition_permission USING btree (user_group_id, petition_id) WHERE ((deleted_at IS NULL) AND (user_group_id IS NOT NULL));






CREATE INDEX petition_permission__user_id__petition_id ON public.petition_permission USING btree (user_id, petition_id) WHERE ((deleted_at IS NULL) AND (user_group_id IS NULL));






CREATE INDEX petition_signature_request__petition_id ON public.petition_signature_request USING btree (petition_id);






CREATE UNIQUE INDEX petition_signature_request__petition_id_processing_uniq ON public.petition_signature_request USING btree (petition_id) WHERE (status = ANY (ARRAY['ENQUEUED'::public.petition_signature_status, 'PROCESSING'::public.petition_signature_status, 'PROCESSED'::public.petition_signature_status]));






CREATE INDEX petition_user_notification__user_id__created_at__is_read ON public.petition_user_notification USING btree (user_id, created_at) INCLUDE (type) WHERE (is_read = false);






CREATE INDEX petition_user_notification__user_id_created_at ON public.petition_user_notification USING btree (user_id, created_at) INCLUDE (type);






CREATE INDEX pfc__petition_id__petition_field_id ON public.petition_field_comment USING btree (petition_id, petition_field_id);






CREATE UNIQUE INDEX public_petition_link__slug__unique ON public.public_petition_link USING btree (slug);






CREATE INDEX public_petition_link__template_id ON public.public_petition_link USING btree (template_id);






CREATE INDEX public_petition_link_prefill_data__keycode ON public.public_petition_link_prefill_data USING btree (keycode) WHERE (deleted_at IS NULL);






CREATE INDEX pun__comment_created__petition_id__data ON public.petition_user_notification USING btree (petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_user_notification_type);






CREATE UNIQUE INDEX pun__comment_created__user_id__petition_id__data ON public.petition_user_notification USING btree (user_id, petition_id, (((data ->> 'petition_field_id'::text))::integer), (((data ->> 'petition_field_comment_id'::text))::integer)) WHERE (type = 'COMMENT_CREATED'::public.petition_user_notification_type);






CREATE INDEX pun__unprocessed_notifications ON public.petition_user_notification USING btree (id) WHERE (((type = 'COMMENT_CREATED'::public.petition_user_notification_type) OR (type = 'SIGNATURE_CANCELLED'::public.petition_user_notification_type)) AND (is_read = false) AND (processed_at IS NULL));






CREATE INDEX system_event__processed_at ON public.system_event USING btree (id) WHERE (processed_at IS NULL);






CREATE INDEX system_event__user_logged_in__index ON public.system_event USING btree ((((data ->> 'user_id'::text))::integer)) WHERE (type = 'USER_LOGGED_IN'::public.system_event_type);






CREATE UNIQUE INDEX tag__organization_id__name__unique ON public.tag USING btree (organization_id, name) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX template_default_permission__owner ON public.template_default_permission USING btree (template_id) WHERE ((type = 'OWNER'::public.petition_permission_type) AND (deleted_at IS NULL));






CREATE INDEX template_default_permission__template_id ON public.template_default_permission USING btree (template_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX template_default_permission__template_id__user_group_id ON public.template_default_permission USING btree (template_id, user_group_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX template_default_permission__template_id__user_id ON public.template_default_permission USING btree (template_id, user_id) WHERE (deleted_at IS NULL);






CREATE INDEX template_default_permission__user_group_id ON public.template_default_permission USING btree (user_group_id) WHERE ((deleted_at IS NULL) AND (user_group_id IS NOT NULL));






CREATE INDEX template_default_permission__user_id ON public.template_default_permission USING btree (user_id) WHERE ((deleted_at IS NULL) AND (user_id IS NOT NULL));






CREATE UNIQUE INDEX user__org_id__external_id ON public."user" USING btree (org_id, external_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user__org_id__user_data_id ON public."user" USING btree (org_id, user_data_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user__organization_role__owner ON public."user" USING btree (org_id) WHERE ((organization_role = 'OWNER'::public.user_organization_role) AND (deleted_at IS NULL));






CREATE UNIQUE INDEX user_authentication_token__token_hash ON public.user_authentication_token USING btree (token_hash) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_authentication_token__token_name_user_id ON public.user_authentication_token USING btree (user_id, token_name) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_data__cognito_id__unique ON public.user_data USING btree (cognito_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_data__email__unique ON public.user_data USING btree (email) WHERE (deleted_at IS NULL);






CREATE INDEX user_delegate__delegate_user_id__user_id ON public.user_delegate USING btree (delegate_user_id, user_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_delegate__user_id__delegate_user_id ON public.user_delegate USING btree (user_id, delegate_user_id) WHERE (deleted_at IS NULL);






CREATE INDEX user_group__org_id ON public.user_group USING btree (org_id) WHERE (deleted_at IS NULL);






CREATE INDEX user_group_member__user_group_id ON public.user_group_member USING btree (user_group_id) WHERE (deleted_at IS NULL);






CREATE UNIQUE INDEX user_group_member__user_group_id__user_id ON public.user_group_member USING btree (user_group_id, user_id) WHERE (deleted_at IS NULL);






ALTER TABLE ONLY public.contact_authentication
    ADD CONSTRAINT contact_authentication_contact_id_foreign FOREIGN KEY (contact_id) REFERENCES public.contact(id);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.contact_authentication_request
    ADD CONSTRAINT contact_authentication_request_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.email_attachment
    ADD CONSTRAINT email_attachment_temporary_file_id_foreign FOREIGN KEY (temporary_file_id) REFERENCES public.temporary_file(id);






ALTER TABLE ONLY public.email_event
    ADD CONSTRAINT email_event_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_feature_flag_name_foreign FOREIGN KEY (feature_flag_name) REFERENCES public.feature_flag(name);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.feature_flag_override
    ADD CONSTRAINT feature_flag_override_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






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






ALTER TABLE ONLY public.petition_attachment
    ADD CONSTRAINT petition_attachment_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_attachment
    ADD CONSTRAINT petition_attachment_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_contact_notification
    ADD CONSTRAINT petition_contact_notification_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.petition_contact_notification
    ADD CONSTRAINT petition_contact_notification_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_document_organization_theme_id_foreign FOREIGN KEY (document_organization_theme_id) REFERENCES public.organization_theme(id);






ALTER TABLE ONLY public.petition_event
    ADD CONSTRAINT petition_event_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_event_subscription
    ADD CONSTRAINT petition_event_subscription_from_template_id_foreign FOREIGN KEY (from_template_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_event_subscription
    ADD CONSTRAINT petition_event_subscription_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






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






ALTER TABLE ONLY public.petition_field
    ADD CONSTRAINT petition_field_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






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






ALTER TABLE ONLY public.petition_reminder
    ADD CONSTRAINT petition_reminder_email_log_id_foreign FOREIGN KEY (email_log_id) REFERENCES public.email_log(id);






ALTER TABLE ONLY public.petition_reminder
    ADD CONSTRAINT petition_reminder_petition_access_id_foreign FOREIGN KEY (petition_access_id) REFERENCES public.petition_access(id);






ALTER TABLE ONLY public.petition_reminder
    ADD CONSTRAINT petition_reminder_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition
    ADD CONSTRAINT petition_restricted_by_user_id_foreign FOREIGN KEY (restricted_by_user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_file_upload_audit_trail_id_foreign FOREIGN KEY (file_upload_audit_trail_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_file_upload_id_foreign FOREIGN KEY (file_upload_id) REFERENCES public.file_upload(id);






ALTER TABLE ONLY public.petition_signature_request
    ADD CONSTRAINT petition_signature_request_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_tag
    ADD CONSTRAINT petition_tag_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_tag
    ADD CONSTRAINT petition_tag_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.tag(id);






ALTER TABLE ONLY public.petition_user_notification
    ADD CONSTRAINT petition_user_notification_petition_id_foreign FOREIGN KEY (petition_id) REFERENCES public.petition(id);






ALTER TABLE ONLY public.petition_user_notification
    ADD CONSTRAINT petition_user_notification_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






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






ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log_petition_event_id_foreign FOREIGN KEY (petition_event_id) REFERENCES public.petition_event(id);






ALTER TABLE ONLY public.user_petition_event_log
    ADD CONSTRAINT user_petition_event_log_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);






ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_user_data_id_foreign FOREIGN KEY (user_data_id) REFERENCES public.user_data(id);







  `);
}

export async function down(knex: Knex): Promise<void> {}

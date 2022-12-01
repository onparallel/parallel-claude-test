import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
create type organization_status as enum ('DEV', 'DEMO', 'ACTIVE', 'CHURNED', 'ROOT');

create type user_organization_role as enum ('COLLABORATOR', 'NORMAL', 'ADMIN', 'OWNER');

create type petition_status as enum ('DRAFT', 'PENDING', 'COMPLETED', 'CLOSED');

create type petition_field_type as enum (
    'TEXT',
    'FILE_UPLOAD',
    'HEADING',
    'SELECT',
    'DYNAMIC_SELECT',
    'SHORT_TEXT',
    'CHECKBOX'
);

create type petition_reminder_status as enum ('PROCESSING', 'PROCESSED', 'ERROR');

create type petition_reminder_type as enum ('MANUAL', 'AUTOMATIC');

create type petition_access_status as enum ('ACTIVE', 'INACTIVE');

create type petition_message_status as enum (
    'SCHEDULED',
    'CANCELLED',
    'PROCESSING',
    'PROCESSED'
);

create type petition_event_type as enum (
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
    'SIGNATURE_REMINDER'
);

create type petition_field_reply_status as enum ('PENDING', 'REJECTED', 'APPROVED');

create type petition_user_notification_type as enum (
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

create type petition_contact_notification_type as enum ('COMMENT_CREATED');

create type petition_permission_type as enum ('OWNER', 'WRITE', 'READ');

create type petition_signature_cancel_reason as enum (
    'CANCELLED_BY_USER',
    'DECLINED_BY_SIGNER',
    'REQUEST_ERROR',
    'REQUEST_RESTARTED'
);

create type petition_signature_status as enum (
    'ENQUEUED',
    'PROCESSING',
    'CANCELLED',
    'COMPLETED'
);

create type user_status as enum ('ACTIVE', 'INACTIVE');

create type organization_usage_limit_name as enum ('PETITION_SEND');

create type system_event_type as enum (
    'USER_CREATED',
    'USER_LOGGED_IN',
    'EMAIL_OPENED',
    'EMAIL_VERIFIED',
    'INVITE_SENT'
);

create type tone as enum ('FORMAL', 'INFORMAL');

create type integration_type as enum ('SIGNATURE', 'SSO', 'USER_PROVISIONING');

create type task_status as enum ('ENQUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

create type task_name as enum ('PRINT_PDF', 'EXPORT_REPLIES');

create type feature_flag_name as enum (
    'PETITION_SIGNATURE',
    'INTERNAL_COMMENTS',
    'PETITION_PDF_EXPORT',
    'HIDE_RECIPIENT_VIEW_CONTENTS',
    'SKIP_FORWARD_SECURITY',
    'EXPORT_CUATRECASAS',
    'AUTO_SEND_TEMPLATE',
    'DEVELOPER_ACCESS'
);

create table email_log (
    id serial not null constraint email_log_pkey primary key,
    "to" text not null,
    "from" text not null,
    subject text not null,
    text text not null,
    html text not null,
    track_opens boolean default false not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_from varchar(255) not null,
    sent_at timestamp with time zone,
    response text,
    external_id varchar(255),
    reply_to text
);

create index email_log__external_id on email_log (external_id);

create table file_upload (
    id serial not null constraint file_upload_pkey primary key,
    path varchar(255) not null,
    filename varchar(255) not null,
    size bigint not null,
    content_type varchar(255) not null,
    upload_complete boolean default false not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255)
);

create table email_event (
    id serial not null constraint email_event_pkey primary key,
    email_log_id integer not null constraint email_event_email_log_id_foreign references email_log,
    event varchar(255) not null,
    payload text not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

create index email_event__email_log_id__event on email_event (email_log_id, event);

create table feature_flag (
    id serial not null constraint feature_flag_pkey primary key,
    name feature_flag_name not null constraint feature_flag_name_unique unique,
    default_value boolean default false not null
);

create table temporary_file (
    id serial not null constraint temporary_file_pkey primary key,
    path varchar(255) not null,
    filename varchar(255) not null,
    size bigint not null,
    content_type varchar(255) not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255)
);

create table email_attachment (
    id serial not null constraint email_attachment_pkey primary key,
    email_log_id integer not null constraint email_attachment_email_log_id_foreign references email_log,
    temporary_file_id integer not null constraint email_attachment_temporary_file_id_foreign references temporary_file,
    constraint email_attachment_email_log_id_temporary_file_id_unique unique (email_log_id, temporary_file_id)
);

create table public_file_upload (
    id serial not null constraint public_file_upload_pkey primary key,
    path varchar(255) not null,
    filename varchar(255) not null,
    size bigint not null,
    content_type varchar(255) not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255)
);

create table organization (
    id serial not null constraint organization_pkey primary key,
    name varchar(255) not null,
    status organization_status not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    custom_host varchar(255) constraint organization_custom_host_unique unique,
    custom_email_from varchar(255),
    logo_public_file_id integer constraint organization_logo_public_file_id_foreign references public_file_upload,
    usage_details jsonb,
    preferred_tone tone default 'INFORMAL'::tone not null
);

create unique index organization__status__root__unique on organization (status)
where
    (
        (status = 'ROOT'::organization_status)
        AND (deleted_at IS NULL)
    );

create table "user" (
    id serial not null constraint user_pkey primary key,
    cognito_id varchar(255) not null,
    org_id integer not null constraint user_org_id_foreign references organization,
    organization_role user_organization_role default 'NORMAL'::user_organization_role not null,
    email varchar(255) not null,
    first_name varchar(255),
    last_name varchar(255),
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    last_active_at timestamp with time zone,
    onboarding_status jsonb default '{}'::jsonb not null,
    status user_status default 'ACTIVE'::user_status not null,
    is_sso_user boolean default false not null,
    external_id varchar(255),
    avatar_public_file_id integer constraint user_avatar_public_file_id_foreign references public_file_upload,
    details jsonb
);

create unique index user__email on "user" (email)
where
    (deleted_at IS NULL);

create unique index user__org_id__external_id on "user" (org_id, external_id)
where
    (deleted_at IS NULL);

create unique index user__organization_role__owner on "user" (org_id)
where
    (
        (
            organization_role = 'OWNER'::user_organization_role
        )
        AND (deleted_at IS NULL)
    );

create table contact (
    id serial not null constraint contact_pkey primary key,
    email varchar(255) not null,
    first_name varchar(255),
    last_name varchar(255),
    org_id integer not null constraint contact_org_id_foreign references organization,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    last_email_bounced boolean default false not null
);

create unique index contact__org_id__email on contact (org_id, email)
where
    (deleted_at IS NULL);

create table petition (
    id serial not null constraint petition_pkey primary key,
    org_id integer not null constraint petition_org_id_foreign references organization,
    name varchar(255),
    custom_ref varchar(255),
    locale varchar(10) not null,
    is_template boolean default false not null,
    status petition_status,
    deadline timestamp with time zone,
    email_subject varchar(255),
    email_body text,
    reminders_active boolean default false not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    reminders_config jsonb,
    template_description text,
    template_public boolean default false not null,
    from_template_id integer constraint petition_from_template_id_foreign references petition,
    signature_config jsonb,
    hide_recipient_view_contents boolean default false not null,
    skip_forward_security boolean default false not null,
    is_readonly boolean default false not null,
    public_metadata jsonb,
    from_public_petition_link_id integer,
    custom_properties jsonb default '{}'::jsonb not null,
    restricted_by_user_id integer constraint petition_restricted_by_user_id_foreign references "user",
    restricted_at timestamp with time zone,
    restricted_password_hash varchar(255),
    restricted_password_salt varchar(255),
    constraint petition__is_template__status check (
        (
            (NOT is_template)
            AND (status IS NOT NULL)
        )
        OR (
            is_template
            AND (status IS NULL)
        )
    ),
    constraint petition__reminders_check check (
        (
            reminders_active
            AND (reminders_config IS NOT NULL)
        )
        OR (
            (NOT reminders_active)
            AND (reminders_config IS NULL)
        )
    )
);

create index petition__template_public__id on petition (id)
where
    (
        (deleted_at IS NULL)
        AND template_public
    );

create index petition_created_by_idx on petition (created_by);

create unique index petition__public_metadata__slug on petition ((public_metadata ->> 'slug'::text))
where
    (
        (template_public IS TRUE)
        AND (deleted_at IS NULL)
    );

create index petition__from_public_petition_link_id__idx on petition (from_public_petition_link_id)
where
    (deleted_at IS NULL);

create table petition_field (
    id serial not null constraint petition_field_pkey primary key,
    petition_id integer not null constraint petition_field_petition_id_foreign references petition,
    position integer not null,
    type petition_field_type not null,
    title text,
    description text,
    optional boolean default false not null,
    multiple boolean default true not null,
    options jsonb,
    validated boolean default false not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    is_fixed boolean default false not null,
    visibility jsonb,
    from_petition_field_id integer constraint petition_field_from_petition_field_id_foreign references petition_field,
    alias varchar(100)
);

create unique index "petition_field__petition_id__position" on "petition_field" ("petition_id", "position") where "deleted_at" is null;

create unique index petition_field__petition_id__alias__unique on petition_field (petition_id, alias)
where
    (deleted_at IS NULL);

create table petition_access (
    id serial not null constraint petition_access_pkey primary key,
    petition_id integer not null constraint petition_access_petition_id_foreign references petition,
    granter_id integer not null constraint petition_access_granter_id_foreign references "user",
    contact_id integer not null constraint petition_access_contact_id_foreign references contact,
    keycode varchar(255) not null constraint petition_access__keycode unique,
    status petition_access_status not null,
    next_reminder_at timestamp with time zone,
    reminders_active boolean default false not null,
    reminders_config jsonb,
    reminders_left integer default 0 not null constraint petition_access__reminders_left_check check (reminders_left >= 0),
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    reminders_opt_out boolean default false not null,
    delegator_contact_id integer constraint petition_access_delegator_contact_id_foreign references contact,
    constraint petition_access__petition_id_contact_id unique (petition_id, contact_id)
);

create table petition_field_reply (
    id serial not null constraint petition_field_reply_pkey primary key,
    petition_field_id integer not null constraint petition_field_reply_petition_field_id_foreign references petition_field,
    type petition_field_type not null,
    content jsonb not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    petition_access_id integer constraint petition_field_reply_petition_access_id_foreign references petition_access,
    status petition_field_reply_status default 'PENDING'::petition_field_reply_status not null,
    metadata jsonb default '{}'::json not null,
    user_id integer constraint petition_field_reply_user_id_foreign references "user",
    constraint petition_field_reply__petition_access_id__user_id check (num_nulls(petition_access_id, user_id) = 1)
);

create table petition_reminder (
    id serial not null constraint petition_reminder_pkey primary key,
    email_log_id integer constraint petition_reminder_email_log_id_foreign references email_log,
    type petition_reminder_type not null,
    status petition_reminder_status not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    sender_id integer constraint petition_reminder_sender_id_foreign references "user",
    petition_access_id integer not null constraint petition_reminder_petition_access_id_foreign references petition_access,
    email_body text
);

create index petition_access__petition_id on petition_access (petition_id);

create index petition_access__contact_id on petition_access (contact_id);

create table petition_message (
    id serial not null constraint petition_message_pkey primary key,
    petition_id integer not null constraint petition_message_petition_id_foreign references petition,
    petition_access_id integer not null constraint petition_message_petition_access_id_foreign references petition_access,
    sender_id integer not null constraint petition_message_sender_id_foreign references "user",
    email_subject varchar(255),
    email_body text,
    status petition_message_status not null,
    scheduled_at timestamp with time zone,
    email_log_id integer constraint petition_message_email_log_id_foreign references email_log,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255)
);

create index petition_message__petition_id on petition_message (petition_id);

create index petition_message__petition_access_id on petition_message (petition_access_id);

create index petition_message__email_log_id on petition_message (email_log_id);

create table petition_event (
    id serial not null constraint petition_event_pkey primary key,
    petition_id integer not null constraint petition_event_petition_id_foreign references petition,
    type petition_event_type not null,
    data jsonb,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

create index petition_event__petition_id__type on petition_event (petition_id, type);

create table petition_field_comment (
    id serial not null constraint petition_field_comment_pkey primary key,
    petition_id integer not null constraint petition_field_comment_petition_id_foreign references petition,
    petition_field_id integer not null constraint petition_field_comment_petition_field_id_foreign references petition_field,
    content text not null,
    user_id integer constraint petition_field_comment_user_id_foreign references "user",
    petition_access_id integer constraint petition_field_comment_petition_access_id_foreign references petition_access,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    is_internal boolean default false not null
);

create index pfc__petition_id__petition_field_id on petition_field_comment (petition_id, petition_field_id);

create table petition_user_notification (
    id serial not null constraint petition_user_notification_pkey primary key,
    user_id integer not null constraint petition_user_notification_user_id_foreign references "user",
    petition_id integer not null constraint petition_user_notification_petition_id_foreign references petition,
    type petition_user_notification_type not null,
    data jsonb,
    is_read boolean default false not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    processed_at timestamp with time zone
);

create index pun__comment_created__petition_id__data on petition_user_notification (
    petition_id,
    ((data ->> 'petition_field_id'::text)::integer),
    (
        (data ->> 'petition_field_comment_id'::text)::integer
    )
)
where
    (
        "type" = 'COMMENT_CREATED'::petition_user_notification_type
    );

create unique index pun__comment_created__user_id__petition_id__data on petition_user_notification (
    user_id,
    petition_id,
    ((data ->> 'petition_field_id'::text)::integer),
    (
        (data ->> 'petition_field_comment_id'::text)::integer
    )
)
where
    (
        "type" = 'COMMENT_CREATED'::petition_user_notification_type
    );

create index petition_user_notification__user_id__created_at__is_read on petition_user_notification (user_id, created_at)
include ("type") where (is_read = false);

create index petition_user_notification__user_id_created_at on petition_user_notification (user_id, created_at) include ("type");

create table petition_contact_notification (
    id serial not null constraint petition_contact_notification_pkey primary key,
    petition_access_id integer not null constraint petition_contact_notification_petition_access_id_foreign references petition_access,
    petition_id integer not null constraint petition_contact_notification_petition_id_foreign references petition,
    type petition_contact_notification_type not null,
    data jsonb,
    is_read boolean default false not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    processed_at timestamp with time zone
);

create index pcn__comment_created__petition_id__data on petition_contact_notification (
    petition_id,
    ((data ->> 'petition_field_id'::text)::integer),
    (
        (data ->> 'petition_field_comment_id'::text)::integer
    )
)
where
    (
        "type" = 'COMMENT_CREATED'::petition_contact_notification_type
    );

create unique index pcn__comment_created__petition_access_id__petition_id__data on petition_contact_notification (
    petition_access_id,
    petition_id,
    ((data ->> 'petition_field_id'::text)::integer),
    (
        (data ->> 'petition_field_comment_id'::text)::integer
    )
)
where
    (
        "type" = 'COMMENT_CREATED'::petition_contact_notification_type
    );

create table feature_flag_override (
    id serial not null constraint feature_flag_override_pkey primary key,
    feature_flag_name feature_flag_name not null constraint feature_flag_override_feature_flag_name_foreign references feature_flag (name),
    org_id integer constraint feature_flag_override_org_id_foreign references organization,
    user_id integer constraint feature_flag_override_user_id_foreign references "user",
    value boolean not null,
    constraint feature_flag_override__org_id__user_id check (
        (
            (org_id IS NULL)
            AND (user_id IS NOT NULL)
        )
        OR (
            (org_id IS NOT NULL)
            AND (user_id IS NULL)
        )
    )
);

create unique index feature_flag_override__org_id__feature_flag_name on feature_flag_override (org_id, feature_flag_name)
where
    (user_id IS NULL);

create unique index feature_flag_override__user_id__feature_flag_name on feature_flag_override (user_id, feature_flag_name)
where
    (org_id IS NULL);

create table petition_signature_request (
    id serial not null constraint petition_signature_request_pkey primary key,
    petition_id integer not null constraint petition_signature_request_petition_id_foreign references petition,
    external_id varchar(255) constraint petition_signature_request__external_id unique,
    signature_config jsonb not null,
    status petition_signature_status default 'ENQUEUED'::petition_signature_status not null,
    cancel_reason petition_signature_cancel_reason,
    cancel_data jsonb,
    data jsonb,
    event_logs jsonb default '[]'::jsonb,
    file_upload_id integer constraint petition_signature_request_file_upload_id_foreign references file_upload,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    file_upload_audit_trail_id integer constraint petition_signature_request_file_upload_audit_trail_id_foreign references file_upload,
    metadata jsonb default '{}'::json not null,
    signer_status jsonb default '{}'::json not null,
    constraint petition_signature_request__cancel_reason_data_check check (
        (
            (status = 'CANCELLED'::petition_signature_status)
            AND (cancel_reason IS NOT NULL)
            AND (cancel_data IS NOT NULL)
        )
        OR (
            (status <> 'CANCELLED'::petition_signature_status)
            AND (cancel_reason IS NULL)
            AND (cancel_data IS NULL)
        )
    )
);

create index petition_signature_request__petition_id on petition_signature_request (petition_id);

create unique index petition_signature_request__petition_id_processing_uniq on petition_signature_request (petition_id)
where
    (
        status = ANY (
            ARRAY ['ENQUEUED'::petition_signature_status, 'PROCESSING'::petition_signature_status]
        )
    );

create table org_integration (
    id serial not null constraint org_integration_pkey primary key,
    org_id integer not null constraint org_integration_org_id_foreign references organization,
    type integration_type not null,
    provider varchar(255) not null constraint org_integration__provider_uppercase_check check (upper((provider)::text) = (provider)::text),
    settings jsonb,
    is_enabled boolean default false not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    is_default boolean default false not null,
    name varchar(255) not null
);

create index org_integration___sso_email_domains__index on org_integration using gin (
    (
        settings #> '{EMAIL_DOMAINS}'::text[]))
        where
            (type = 'SSO'::integration_type);

create index org_integration___user_provisioning_auth_key__index on org_integration ((settings ->> 'AUTH_KEY'::text))
where
    (type = 'USER_PROVISIONING'::integration_type);

create table contact_authentication (
    id serial not null constraint contact_authentication_pkey primary key,
    contact_id integer not null constraint contact_authentication_contact_id_foreign references contact,
    cookie_value_hash varchar(255) not null,
    access_log jsonb default '[]'::jsonb not null
);

create index contact_authentication__contact_id__contact_value_hash on contact_authentication (contact_id, cookie_value_hash);

create table contact_authentication_request (
    id serial not null constraint contact_authentication_request_pkey primary key,
    petition_access_id integer not null constraint contact_authentication_request_petition_access_id_foreign references petition_access,
    token_hash varchar(255) not null,
    code varchar(6) not null,
    remaining_attempts integer not null,
    email_log_id integer constraint contact_authentication_request_email_log_id_foreign references email_log,
    ip varchar(255),
    user_agent varchar(255),
    expires_at timestamp with time zone not null,
    constraint contact_authentication_request__petition_access_id__token_hash unique (petition_access_id, token_hash)
);

create table user_authentication_token (
    id serial not null constraint user_authentication_token_pkey primary key,
    user_id integer not null constraint user_authentication_token_user_id_foreign references "user",
    token_name varchar(255) not null,
    token_hash varchar(255) not null,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255)
);

create unique index user_authentication_token__token_hash on user_authentication_token (token_hash)
where
    (deleted_at IS NULL);

create unique index user_authentication_token__token_name_user_id on user_authentication_token (user_id, token_name)
where
    (deleted_at IS NULL);

create table petition_event_subscription (
    id serial not null constraint petition_event_subscription_pkey primary key,
    user_id integer not null constraint petition_event_subscription_user_id_foreign references "user",
    endpoint varchar(255) not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    is_enabled boolean default true not null,
    event_types jsonb
);

create table tag (
    id serial not null constraint tag_pkey primary key,
    organization_id integer not null constraint tag_organization_id_foreign references organization,
    name varchar(255) not null,
    color varchar(255) not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255)
);

create unique index tag__organization_id__name__unique on tag (organization_id, name)
where
    (deleted_at IS NULL);

create table petition_tag (
    id serial not null constraint petition_tag_pkey primary key,
    petition_id integer not null constraint petition_tag_petition_id_foreign references petition,
    tag_id integer not null constraint petition_tag_tag_id_foreign references tag,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    constraint petition_tag__petition_id__tag_id__unique unique (petition_id, tag_id)
);

create table user_group (
    id serial not null constraint user_group_pkey primary key,
    org_id integer not null constraint user_group_org_id_foreign references organization,
    name varchar(255) not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255)
);

create table petition_permission (
    id serial not null constraint petition_permission_pkey primary key,
    petition_id integer not null constraint petition_permission_petition_id_foreign references petition,
    user_id integer constraint petition_permission_user_id_foreign references "user",
    type petition_permission_type default 'OWNER'::petition_permission_type not null,
    is_subscribed boolean default true not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    user_group_id integer constraint petition_permission_user_group_id_foreign references user_group,
    from_user_group_id integer constraint petition_permission_from_user_group_id_foreign references user_group,
    constraint petition_permission__user_type_owner check (
        (
            (type = 'OWNER'::petition_permission_type)
            AND (user_group_id IS NULL)
            AND (from_user_group_id IS NULL)
            AND (user_id IS NOT NULL)
        )
        OR (type <> 'OWNER'::petition_permission_type)
    )
);

create index petition_permission__petition_id on petition_permission (petition_id)
where
    (deleted_at IS NULL);

create index petition_permission__user_id__petition_id on petition_permission (user_id, petition_id)
where
    (
        (deleted_at IS NULL)
        AND (user_group_id IS NULL)
    );

create unique index petition_permission__petition_id__user_id on petition_permission (petition_id, user_id)
where
    (
        (deleted_at IS NULL)
        AND (from_user_group_id IS NULL)
        AND (user_group_id IS NULL)
    );

create unique index petition_permission__from_user_group_id__petition_id__user_id on petition_permission (from_user_group_id, petition_id, user_id)
where
    (
        (deleted_at IS NULL)
        AND (from_user_group_id IS NOT NULL)
    );

create unique index petition_permission__user_group_id__petition_id on petition_permission (user_group_id, petition_id)
where
    (
        (deleted_at IS NULL)
        AND (user_group_id IS NOT NULL)
    );

create unique index petition_permission__owner on petition_permission (petition_id)
where
    (
        (type = 'OWNER'::petition_permission_type)
        AND (deleted_at IS NULL)
    );

create index user_group__org_id on user_group (org_id)
where
    (deleted_at IS NULL);

create table user_group_member (
    id serial not null constraint user_group_member_pkey primary key,
    user_group_id integer not null constraint user_group_member_user_group_id_foreign references user_group,
    user_id integer not null constraint user_group_member_user_id_foreign references "user",
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255)
);

create index user_group_member__user_group_id on user_group_member (user_group_id)
where
    (deleted_at IS NULL);

create unique index user_group_member__user_group_id__user_id on user_group_member (user_group_id, user_id)
where
    (deleted_at IS NULL);

create table petition_field_attachment (
    id serial not null constraint petition_field_attachment_pkey primary key,
    petition_field_id integer not null constraint petition_field_attachment_petition_field_id_foreign references petition_field,
    file_upload_id integer not null constraint petition_field_attachment_file_upload_id_foreign references file_upload,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    constraint petition_field_attachment__petition_field_id__file_upload_id__u unique (petition_field_id, file_upload_id)
);

create index petition_field_attachment__petition_field_id on petition_field_attachment (petition_field_id)
where
    (deleted_at IS NULL);

create index petition_field_attachment__file_upload_id on petition_field_attachment (file_upload_id)
where
    (deleted_at IS NULL);

create table system_event (
    id serial not null constraint system_event_pkey primary key,
    type system_event_type not null,
    data jsonb,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

create index system_event__user_logged_in__index on system_event (((data ->> 'user_id'::text)::integer))
where
    (type = 'USER_LOGGED_IN'::system_event_type);

create table public_petition_link (
    id serial not null constraint public_petition_link_pkey primary key,
    template_id integer not null constraint public_petition_link_template_id_foreign references petition,
    title varchar(255) not null,
    description text not null,
    slug varchar(255) not null constraint public_petition_link__slug check ((slug)::text ~ '^[a-zA-Z0-9-]*$'::text),
    is_active boolean default true not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    owner_id integer not null constraint public_petition_link_owner_id_foreign references "user"
);

alter table
    petition
add
    constraint petition_from_public_petition_link_id_foreign foreign key (from_public_petition_link_id) references public_petition_link;

create index public_petition_link__template_id on public_petition_link (template_id);

create unique index public_petition_link__slug__unique on public_petition_link (slug);

create table public_petition_link_user (
    id serial not null constraint public_petition_link_user_pkey primary key,
    public_petition_link_id integer not null constraint public_petition_link_user_public_petition_link_id_foreign references public_petition_link,
    user_id integer constraint public_petition_link_user_user_id_foreign references "user",
    type petition_permission_type not null,
    is_subscribed boolean default true not null,
    user_group_id integer constraint public_petition_link_user_user_group_id_foreign references user_group,
    from_user_group_id integer constraint public_petition_link_user_from_user_group_id_foreign references user_group,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    constraint public_petition_link_user__user_type_owner check (
        (
            (type = 'OWNER'::petition_permission_type)
            AND (user_group_id IS NULL)
            AND (from_user_group_id IS NULL)
            AND (user_id IS NOT NULL)
        )
        OR (type <> 'OWNER'::petition_permission_type)
    )
);

create index public_petition_link_user__user_id__public_petition_link_id on public_petition_link_user (user_id, public_petition_link_id)
where
    (
        (deleted_at IS NULL)
        AND (user_group_id IS NULL)
    );

create unique index public_petition_link_user__petition_id__user_id on public_petition_link_user (public_petition_link_id, user_id)
where
    (
        (deleted_at IS NULL)
        AND (from_user_group_id IS NULL)
        AND (user_group_id IS NULL)
    );

create unique index public_petition_link_user__from_user_group_id__public_petition_ on public_petition_link_user (
    from_user_group_id,
    public_petition_link_id,
    user_id
)
where
    (
        (deleted_at IS NULL)
        AND (from_user_group_id IS NOT NULL)
    );

create unique index public_petition_link_user__user_group_id__public_petition_link_ on public_petition_link_user (user_group_id, public_petition_link_id)
where
    (
        (deleted_at IS NULL)
        AND (user_group_id IS NOT NULL)
    );

create index public_petition_link_user__public_petition_link_id on public_petition_link_user (public_petition_link_id)
where
    (deleted_at IS NULL);

create table organization_usage_limit (
    id serial not null constraint organization_usage_limit_pkey primary key,
    org_id integer not null constraint organization_usage_limit_org_id_foreign references organization,
    limit_name organization_usage_limit_name not null,
    "limit" integer not null,
    used integer default 0 not null,
    period interval not null,
    period_start_date timestamp with time zone default CURRENT_TIMESTAMP not null,
    period_end_date timestamp with time zone
);

create unique index organization_usage_limit__org_id__limit_name__unique on organization_usage_limit (org_id, limit_name)
where
    (period_end_date IS NULL);

create table task (
    id serial not null constraint task_pkey primary key,
    user_id integer not null constraint task_user_id_foreign references "user",
    name task_name not null,
    status task_status default 'ENQUEUED'::task_status not null,
    progress integer constraint task_progress_bounds check (
        (progress IS NULL)
        OR (
            (progress >= 0)
            AND (progress <= 100)
        )
    ),
    input jsonb default '{}'::jsonb not null,
    output jsonb default '{}'::jsonb not null,
    error_data jsonb,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    constraint task_failed_error_data check (
        (
            (status = 'FAILED'::task_status)
            AND (error_data IS NOT NULL)
        )
        OR (
            (status <> 'FAILED'::task_status)
            AND (error_data IS NULL)
        )
    )
);

create table template_default_permission (
    id serial not null constraint template_default_permission_pkey primary key,
    template_id integer not null constraint template_default_permission_template_id_foreign references petition,
    type petition_permission_type not null constraint template_default_permission__no_owners check (type <> 'OWNER'::petition_permission_type),
    user_id integer constraint template_default_permission_user_id_foreign references "user",
    user_group_id integer constraint template_default_permission_user_group_id_foreign references user_group,
    is_subscribed boolean default true not null,
    position integer not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by varchar(255),
    updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    updated_by varchar(255),
    deleted_at timestamp with time zone,
    deleted_by varchar(255),
    constraint template_default_permission__user_or_user_group check (
        (
            ((user_id IS NULL))::integer + ((user_group_id IS NULL))::integer
        ) = 1
    )
);

create index template_default_permission__template_id on template_default_permission (template_id)
where
    (deleted_at IS NULL);

create unique index template_default_permission__template_id__user_id on template_default_permission (template_id, user_id)
where
    (deleted_at IS NULL);

create unique index template_default_permission__template_id__user_group_id on template_default_permission (template_id, user_group_id)
where
    (deleted_at IS NULL);
`);
}

export async function down(knex: Knex): Promise<void> {}

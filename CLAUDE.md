# Parallel - AI Assistant Documentation

> **Purpose**: Quick reference for AI assistants working with the Parallel codebase.

## Quick Navigation

**Core Concepts:**
[Project Overview](#1-project-overview) • [Domain Model](#2-core-domain-model) • [Architecture](#3-architecture-patterns) • [Gotchas](#8-critical-gotchas)

**Frontend:**
[Component Patterns](#component-patterns) • [GraphQL](#graphql-schema-nexus) • [Forms & State](#forms-react-hook-form) • [i18n](#internationalization-i18n)

**Backend:**
[Services](#core-services) • [Repositories](#repository-pattern) • [Events](#event-driven-architecture) • [Queues](#queueworker-system)

**Guides:**
[Modification Patterns](#9-modification-patterns) • [Development Workflow](#10-development-workflow) • [Key Files](#11-key-files-reference)

## Agent Behavior Guidelines

### Documentation

When editing README files or other documentation markdown files, **always use the `crafting-effective-readmes` skill**. This ensures documentation follows best practices and is tailored to the appropriate audience.

## 1. Project Overview

### What is Parallel?

Parallel is a **petition and profile management SaaS platform** for legal/compliance workflows. Organizations use it to:

- Create digital petitions (forms/legal document requests)
- Collect e-signatures (Docusign, Signaturit integration)
- Manage profiles (people, companies, contracts, matters)
- Perform background checks and adverse media searches
- Generate PDF documents with signatures
- Support multi-language recipients (en, es, ca, it, pt)

It's a **white-label, multi-tenant platform** where each organization has isolated data and branding.

### Technology Stack

- **Backend**: TypeScript, Express.js, Apollo Server, GraphQL Nexus, Knex.js, PostgreSQL, Redis, AWS SQS
- **Frontend**: Next.js 14, Apollo Client, Chakra UI, React Hook Form
- **PDF Tools**: Typst, Ghostscript, ImageMagick, ExifTool, QPdf
- **Patterns**: InversifyJS (DI), DataLoader, Event-driven architecture

### Monorepo Structure

```
parallel/
├── server/          # GraphQL API + workers (TypeScript)
│   ├── src/
│   │   ├── api/             # REST endpoints (webhooks, auth)
│   │   ├── graphql/         # GraphQL schema (Nexus)
│   │   ├── db/              # Repositories, events, types
│   │   ├── services/        # Business logic (~50 services)
│   │   ├── workers/         # Background processors (~20 workers)
│   │   ├── integrations/    # External systems (Docusign, SAP, etc.)
│   │   ├── pdf/             # PDF generation (Typst)
│   │   ├── emails/          # Email templates
│   │   └── util/            # Shared utilities
│   └── migrations/          # Database migrations
├── client/          # Next.js frontend
│   ├── pages/               # Next.js routes (SSR with getInitialProps)
│   │   ├── app/             # Dashboard routes (authenticated)
│   │   ├── petition/        # Recipient-facing routes (public)
│   │   └── pp/              # Public petition link page (public)
│   ├── components/          # React components
│   │   ├── common/          # Reusable UI components
│   │   ├── ui/              # Chakra UI v3 abstraction layer
│   │   ├── layout/          # Layout wrappers (AppLayout, etc.)
│   │   └── [feature]/       # Feature-specific components
│   ├── graphql/             # Generated types (__types.ts)
│   ├── utils/               # Utilities + custom hooks
│   │   ├── apollo/          # Apollo Client setup + cache policies
│   │   ├── hooks/           # Custom React hooks
│   │   ├── mutations/       # Reusable mutation hooks
│   │   └── __tests__/       # Hooks and utils tests
│   ├── chakra/              # Theme configuration
│   └── lang/                # i18n translations
└── e2e/             # End-to-end tests
```

**Key Numbers**: ~50 services, ~20 workers, ~20 repositories, 100+ tables, ~60 petition events, ~15 profile events

**Integrations**: Docusign, Signaturit, SAP (OData), Dow Jones, Bankflip, OpenAI, Anthropic, AWS (Cognito, S3, SES, SQS)

---

## 2. Core Domain Model

### Organizations (Multi-Tenancy)

**Table**: `organization`

Organizations are the top-level tenant entity. All data scoped to organization.

**Status**: `DEV | DEMO | ACTIVE | CHURNED | ROOT | INACTIVE`
**Key Fields**: `name`, `status`, `custom_host`, `default_timezone`, `preferences`
**Related**: `organization_usage_limit`, `org_integration`, `feature_flag`

**Critical**: Always filter by `organization_id` for tenant isolation.

### Petitions

**Definition**: Forms/requests sent to contacts for completion (legal documents, data collection, approvals).

**Tables**: `petition`, `petition_field`, `petition_field_reply`, `petition_access`, `petition_signature_request`

**Lifecycle**: `DRAFT → PENDING → COMPLETED | CLOSED`

**Key Components**:

1. **Fields**: Form elements with types (`TEXT`, `NUMBER`, `DATE`, `FILE_UPLOAD`, `SELECT`, `CHECKBOX`, `PROFILE_SEARCH`, etc.)

   - **Field Logic**: Conditional visibility/requirements based on other field values (JSON stored in `visibility` column, evaluated in `server/src/util/fieldLogic.ts`)

2. **Access**: Links petition to contacts, status (`ACTIVE`, `INACTIVE`), unique `keycode` for secure access

3. **Replies**: Contact responses, `content` stored as JSON

4. **Attachments**: Front matter, annexes, back matter

5. **Signatures**: Docusign/Signaturit integration, status tracking

6. **Messages**: Scheduled communications

7. **Reminders**: Auto/manual follow-ups

**Permissions**: `OWNER` (full control), `WRITE` (edit), `READ` (view-only)

### Profiles

**Definition**: Entity records (people, companies, contracts, matters) with customizable schemas.

**Tables**: `profile`, `profile_type`, `profile_type_field`, `profile_field_value`

**Profile Types**: `INDIVIDUAL`, `LEGAL_ENTITY`, `CONTRACT`, `MATTER`, or custom types

**Field Permissions**: `HIDDEN` (system-only), `READ` (visible), `WRITE` (editable)

**Key Features**:

- **Monitoring**: Background checks, adverse media searches on specific fields
- **External Sources**: Fill profiles information from external sources (eInforma, Companies House) Extracted information from providers is stored in `profile_external_source_entity` table for later usage.
- **Profile Search**: Special petition field type for searchable profile selection
- **Sync**: Bidirectional sync via SAP integrations
  - Types: `INITIAL`, `TO_LOCAL` (SAP→Parallel), `TO_REMOTE` (Parallel→SAP)
  - Conflict resolution: last-write-wins

### Contacts

**Table**: `contact`

Petition recipients (not organization members).

**Key Fields**: `email` (unique per org), `first_name`, `last_name`
**Related**: `petition_access`

**Authentication**: Via `contact_authentication` table - code-based email verification for accessing petitions

### Users

**Table**: `user`

Organization members who access the dashboard.

**Status**: `ACTIVE | INACTIVE | ON_HOLD`
**Auth**: AWS Cognito
**Groups**: `user_group` with `GRANT`/`DENY` effects

- Special groups: `ALL_USERS` (all org members), `INITIAL` (default admin permissions for new organizations)

**Permissions**: Cascade through groups, `DENY` overrides `GRANT`

### Approval Flows

**Table**: `petition_approval_request`

**Purpose**: Multi-stage approval workflows for petitions

**Key Fields**:

- `petition_id`: Associated petition
- `step_order`: Approval sequence
- `approver_user_id`: Required approver
- `status`: `PENDING | APPROVED | REJECTED`

**Service**: `ApprovalsService` (injected as `ctx.approvals`)

**Flow**:

1. Create approval requests when petition moves to approval stage
2. Notify approvers
3. Track approval/rejection
4. Proceed to next step or complete petition

**Example**: See [server/src/services/ApprovalsService.ts](server/src/services/ApprovalsService.ts)

### Views (List Customization)

**Tables**: `petition_list_view`, `profile_list_view`

**Purpose**: User-customized list views with saved filters and columns

**Key Fields**:

- `user_id`: View owner
- `name`: View name
- `filters`: JSON filter configuration
- `visible_columns`: Array of column names
- `sort_by`: Sort configuration

**Repository**: `ViewRepository`

**Usage**: Users can save frequently-used filter/sort combinations

**Example**: See view management in list pages

### Events

Events drive asynchronous behavior.

**Types**:

- **Petition Events** (`petition_event`): ~60 types - `PETITION_CREATED`, `ACCESS_ACTIVATED`, `REPLY_CREATED`, `SIGNATURE_COMPLETED`, etc.
- **Profile Events** (`profile_event`): ~15 types - `PROFILE_CREATED`, `PROFILE_FIELD_VALUE_UPDATED`, `PROFILE_CLOSED`, `PROFILE_RELATIONSHIP_CREATED`, etc.
- **System Events** (`system_event`): `USER_CREATED`, `USER_LOGGED_IN`, `INVITE_SENT`, `ORGANIZATION_LIMIT_REACHED`, etc.

**Flow**:

```
Repository creates event → Stored in DB → Enqueued to SQS (after transaction commit)
→ Event processor worker → Event listeners execute side effects
```

---

## 3. Architecture Patterns

### Dependency Injection (InversifyJS)

**Location**: `server/src/container.ts`

All services, repositories, clients managed through InversifyJS.

**Pattern**: Define symbol → Create interface → Implement with `@injectable()` → Register in module → Inject with `@inject()`

**ApiContext** (`server/src/context.ts`): Central DI container with all services and repositories, available in resolvers, handlers, and workers.

Key services: `auth`, `emails`, `signature`, `storage`, `encryption`, `jwt`, `redis`, `petitionsHelper`, `profilesHelper`, `backgroundCheck`, etc.

Key repositories: `petitions`, `profiles`, `contacts`, `users`, `organizations`, `tasks`, `integrations`, etc.

#### Module Registration

InversifyJS modules are defined in `module.ts` files. Registration patterns differ for services vs repositories.

**Services** (`server/src/services/module.ts`):

- Import: `{ SERVICE_SYMBOL, ServiceClass, IServiceInterface }`
- Register: `options.bind<IServiceInterface>(SERVICE_SYMBOL).to(ServiceClass).inSingletonScope();`
- Singleton scope for stateless services
- Request scope for services that need request context

**Repositories** (`server/src/db/module.ts`):

- Import: `{ RepositoryClass }`
- Register: `options.bind<RepositoryClass>(RepositoryClass).toSelf();`
- No symbol needed, bind to class itself
- Request scope by default

**Integrations** (`server/src/integrations/module.ts`):

- Similar to services pattern
- Often includes factory functions for multi-provider integrations

**Example:** See [server/src/services/module.ts:118-128](server/src/services/module.ts#L118-L128) for QueuesService registration

### Repository Pattern

**Location**: `server/src/db/repositories/`

**Naming Convention** (from `README.md`):

- `load*`: DataLoader (batching + request-scoped caching) - use for reusable queries
- `get*`: Direct DB read without DataLoader - use for one-off queries
- `update*`: Update operation
- `create*`: Insert operation
- `delete*`: Soft/hard delete
- `clone*`: Duplicate rows

**DataLoader Helpers** (in `BaseRepository`):

- `buildLoadBy`: Load single entity by key
- `buildLoadMultipleBy`: Load multiple entities by key
- `buildLoadCountBy`: Load count by key
- `buildLoadExistsBy`: Check existence by key
- `buildLoader`: Advanced custom DataLoader

**Example**: `PetitionRepository.loadPetition` (DataLoader via `buildLoadBy`), `PetitionRepository.getPetitionVariables` (direct query)

**Real-world examples:**

- [server/src/db/repositories/PetitionRepository.ts](server/src/db/repositories/PetitionRepository.ts) - complex repository with all DataLoader patterns
- [server/src/db/repositories/ProfileRepository.ts](server/src/db/repositories/ProfileRepository.ts) - advanced DataLoader usage

**Critical Patterns**:

- **Soft Deletes**: Always filter `whereNull("deleted_at")`
- **Transactions**: Pass `t?: Knex.Transaction` through call chain
- **DataLoaders**: Automatic batching, per-request caching

### GraphQL Schema (Nexus)

**Location**: `server/src/graphql/[entity]/`

**Structure per entity** (file or directory depending on complexity):

- `types.ts` or `types/`: Object types, enums, inputs
- `queries.ts` or `queries/`: Query resolvers
- `mutations.ts` or `mutations/`: Mutation resolvers
- `authorizers.ts`: Permission checks

**Global IDs**: Always use `toGlobalId(type, id)` / `fromGlobalId(globalId)` for GraphQL API

**Authorization**: Check in resolver `authorize` function, not field-level

**Example**: See `server/src/graphql/petition/` for complete pattern

### Event-Driven Architecture

**Locations**: `server/src/db/events/`, `server/src/workers/queues/event-listeners/`

**Creating Events** (in repository):

```typescript
await this.createEvent(
  {
    type: "REPLY_CREATED",
    petition_id: petitionId,
    data: { replyId, fieldId },
  },
  t,
); // Within same transaction
```

**Event Listeners**: Implement `EventListener<EventType>`, register in `server/src/workers/queues/event-listeners/module.ts`, inject in `EventProcessorQueue` and call `.register()`

**Real-world examples:**

- [server/src/workers/queues/event-listeners/PetitionActivityListener.ts](server/src/workers/queues/event-listeners/PetitionActivityListener.ts) - petition event listener
- [server/src/workers/queues/event-listeners/ProfileSyncListener.ts](server/src/workers/queues/event-listeners/ProfileSyncListener.ts) - profile event listener with side effects

**Critical**: Design for idempotency - workers may receive duplicate messages

### Queue/Worker System

**Location**: `server/src/workers/`, `server/src/services/QueuesService.ts`

**Queue Types**:

- `event-processor`: Main event queue
- `low-priority-event-queue`: Bulk operations
- `task-worker`: Async tasks (exports, PDF gen, syncs)
- `signature-worker`: Signature polling
- `email-sender`: Email delivery
- `email-events`: Bounce/delivery tracking
- `webhooks-worker`: External webhook dispatch
- `delay-queue`: Special messages that are sent with delay to accumulate over a small period of time. e.g. COMMENT_CREATED events
- `background-check-profile-search`: Background checks

**Enqueuing**: `await ctx.queues.enqueueMessages("queue-name", { body: {...} }, t)`

**Task Pattern**: Extend `TaskRunner<TaskName>`, register in module, inject in `TaskWorkerQueue`

**Real-world examples:**

- [server/src/workers/queues/task-runners/ExportRepliesRunner.ts](server/src/workers/queues/task-runners/ExportRepliesRunner.ts) - export task
- [server/src/workers/queues/task-runners/ProfileSyncRunner.ts](server/src/workers/queues/task-runners/ProfileSyncRunner.ts) - sync task
- [server/src/workers/queues/task-runners/PrintPdfRunner.ts](server/src/workers/queues/task-runners/PrintPdfRunner.ts) - PDF generation task

**Workers**: Individual processes (e.g., `email-sender.ts`, `event-processor.ts`), consume SQS queues

**Cron Workers**: Scheduled workers - `reminder-trigger`, `petition-notifications`, `anonymizer`, `background-check-monitor`, `adverse-media-monitor`, `sap-profile-polling`, `expiring-properties`, `scheduled-trigger`, `old-notifications`, `organization-limits`

---

## 4. Key Systems

### PDF Generation

**Location**: `server/src/pdf/`

**Technology**: Typst compiler (replaced HTML-based system)

**External Tools**: Ghostscript, ImageMagick, ExifTool, QPdf

**Entry Point**: `buildPdf.tsx` - generates Typst markup, downloads assets to temp dir, compiles to PDF, streams result

**Documents**: `server/src/pdf/documents/` - recipient documents, background check reports

**Key Gotcha**: Typst doesn't support URLs - must download assets to local files. Always clean up temp directories.

### Signature Integrations

**Location**: `server/src/integrations/signature/`

**Providers**: Docusign (enterprise), Signaturit (Spain/EU)

**Interface**: `ISignatureClient` with methods: `startSignatureRequest`, `getSignatureRequest`, `cancelSignatureRequest`, `downloadSignedDocument`, `downloadAuditTrail`, `canSendSignatureReminder`, `sendPendingSignatureReminder`

**Factory**: `signatureClientFactory(provider, integrationId)` returns appropriate client

**Real-world examples:**

- [server/src/integrations/signature/DocusignClient.ts](server/src/integrations/signature/DocusignClient.ts) - complete OAuth integration
- [server/src/integrations/signature/SignaturitClient.ts](server/src/integrations/signature/SignaturitClient.ts) - API key integration

**Flow**:

1. Generate petition PDF
2. Upload to S3
3. Call provider API → store `petition_signature_request` with `external_id`
4. Signature worker polls status
5. Webhook receives updates
6. On completion: download signed PDF, store in S3, update status

**Status States**: `ENQUEUED → PROCESSING → PROCESSED → COMPLETED | CANCELLED` (individual signer status tracked separately in `signer_status` JSON)

**Critical Gotchas**:

- Docusign: OAuth tokens expire every 8 hours (proactive refresh)
- Webhooks: Verify signatures, design for idempotency
- Rate limits: Docusign 1000/hour, Signaturit varies

### Profile Sync (SAP)

**Location**: `server/src/integrations/profile-sync/sap/`

**Components**:

- `SapOdataClient`: SAP OData API client
- `SapProfileSyncIntegration`: Main sync orchestration
- `SapProfileSyncIntegrationSettingsValidator`: Config validation

**Sync Types**: `INITIAL` (first import), `TO_LOCAL` (SAP→Parallel), `TO_REMOTE` (Parallel→SAP)

**Settings** (stored in `org_integration.settings` JSON):

- Entity, filter, profile type mapping
- Field mappings with directions (`TO_LOCAL`, `TO_REMOTE`, `BIDIRECTIONAL`)
- Field transformations (date format, enum mapping, concat, split)
- Sync schedule

**Polling Worker**: `sap-profile-polling.ts` triggers scheduled syncs

**Critical**: OData pagination required, last-write-wins conflict resolution

### Feature Flags

**Table**: `feature_flag`

**Purpose**: Enable/disable features per organization

**Key Fields**:

- `organization_id`: Organization scope
- `flag_name`: Feature identifier (enum)
- `enabled`: Boolean flag

**Usage in code**:

```typescript
const hasFeature = await ctx.featureFlags.checkFlag(organizationId, "FEATURE_NAME");
```

**Common flags**: Check `server/src/db/__types.ts` for `FeatureFlagName` enum

**Example**: See feature flag checks in resolvers and services

### Background Checks & Adverse Media

**Location**: `server/src/services/BackgroundCheckService.ts`, `server/src/services/AdverseMediaSearchService.ts`

These are special petition/profile field types (not separate tables). Results stored in `petition_field_reply.content`/ `profile_field_value.content` JSON.

**Background Checks** (`BACKGROUND_CHECK` field type):

- Uses Open Sanctions to search for people/companies in sanctions lists
- Performs search and matches if positive results found
- Results can be downloaded as PDF

**Adverse Media** (`ADVERSE_MEDIA_SEARCH` field type):

- Searches for negative news/media mentions (OPoint)
- Similar to background checks but focused on media coverage
- Performs search and matches if positive results found

**Monitoring Workers**:

- `background-check-monitor`: Watches for changes - alerts if new matches appear or existing matches have new sanctions
- `adverse-media-monitor`: Similar monitoring for adverse media changes

---

## 5. Frontend Architecture

### Component Patterns

**Co-located GraphQL**: Operations defined at the end of component files, auto-discovered by codegen.

```tsx
// MyComponent.tsx
export function MyComponent({ petition }: Props) {
  const { data } = useQuery(MyComponent_petitionsDocument);
  return <div>{data?.petitions.map(...)}</div>;
}

// GraphQL operations at end of file
const _fragments = {
  Petition: gql`
    fragment MyComponent_Petition on Petition {
      id
      name
    }
  `,
};

const _queries = [
  gql`
    query MyComponent_petitions {
      petitions {
        ...MyComponent_Petition
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation MyComponent_createPetition($name: String, $locale: PetitionLocale, $petitionId: GID, $type: PetitionBaseType, $path: String) {
      createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type, path: $path) {
        ...MyComponent_Petition
      }
    }
  `
]
```

**Naming Convention**: `ComponentName_EntityType` for fragments, `ComponentName_queryName` for queries/mutations.

**Real-world examples:**

- [client/utils/useUnpinProfileType.ts](client/utils/useUnpinProfileType.ts) - mutation hook with fragments
- [client/pages/app/petitions/[petitionId]/compose.tsx](client/pages/app/petitions/[petitionId]/compose.tsx) - page with queries
- [client/components/profiles/ProfileForm.tsx](client/components/profiles/ProfileForm.tsx) - component with fragments and queries

**Component Types**:

- `components/common/`: Reusable UI (Card, EmptyState, DataTable)
- `components/ui/`: Chakra v3 abstraction layer (Button, Dialog, Input)
- `components/layout/`: Layout wrappers (AppLayout, SidebarLayout)
- `components/[feature]/`: Feature-specific (petition-compose/, profiles/)
- `components/*/dialogs/`: Dialog components used with `useDialog()` or `useWizardDialog()` hook

### Apollo Client & State Management

**Setup** (`utils/apollo/client.ts`): SSR support, batch queries, custom cache merge functions.

**SSR with getInitialProps**: Populate Apollo cache server-side, components read from cache.

```tsx
function MyPage() {
  // Data already in cache from getInitialProps
  const { data } = useQuery(MyPage_dataDocument);
  return <div>{data?.items.map(...)}</div>;
}

MyPage.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  // Populate cache - don't return data, components use useQuery
  await fetchQuery(MyPage_dataDocument);
  return {};
};

export default compose(withApolloData)(MyPage);
```

**Real-world examples:**

- [client/pages/app/petitions/index.tsx](client/pages/app/petitions/index.tsx) - SSR with fetchQuery
- [client/pages/app/profiles/index.tsx](client/pages/app/profiles/index.tsx) - SSR with multiple queries

**Cache Updates**: Use `update` function in mutations, not `refetchQueries`. Normalize with global IDs.

**React Context Providers**:

- `DialogProvider`: Promise-based dialog management (`await useDialog(MyDialog)(props)`)
- `I18nProvider`: Wraps `react-intl` with locale-specific messages
- `LiquidProvider`: Template variable evaluation

### Routing (Next.js)

**Page Structure**:

- `pages/app/`: Dashboard routes (authenticated, wrapped with `withApolloData`)
- `pages/petition/[keycode]/`: Recipient-facing public routes
- `pages/login.tsx`, `pages/signup.tsx`: Auth pages

**Auth Flow**: `withApolloData` HOC redirects to `/login` on `UNAUTHENTICATED` error.

**URL State** (`utils/queryState.ts`): Sync URL params with component state for filters, pagination.

### Forms (React Hook Form)

```tsx
const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
  mode: "onChange",
  defaultValues: { ... }
});

// Array fields
const { fields, append, remove } = useFieldArray({ control, name: "items" });
```

### Styling (Chakra UI)

**Prefer long property names** for clarity:

```tsx
// Good
<Box paddingX={4} paddingY={2} marginBottom={4} />

// Avoid shorthand
<Box px={4} py={2} mb={4} />
```

**RTL Support**: Use `Start`/`End` instead of `Left`/`Right`:

```tsx
// Good - RTL compatible
<Box paddingStart={4} paddingEnd={2} marginStart={4} insetStart={0} />

// Bad - breaks RTL
<Box paddingLeft={4} paddingRight={2} marginLeft={4} left={0} />
```

**Chakra v3 Migration**: Components in `components/ui/` abstract v2→v3 differences. Use these wrappers.

### Custom Hooks

**Data Hooks**: Wrap `useQuery`/`useMutation` for reusable operations.

```tsx
// utils/mutations/useCreatePetition.ts
export function useCreatePetition() {
  const [mutation] = useMutation(useCreatePetition_createDocument);
  return useCallback(
    async (data: CreateData) => {
      return await mutation({ variables: data });
    },
    [mutation],
  );
}
```

**Dialog Hook**: Promise-based modal management.

```tsx
const useConfirmDialog = () => useDialog(ConfirmDialog);
const result = await useConfirmDialog({ title: "Confirm?" });
```

**Other Patterns**:

- `useMemoFactory`: Stable memoized callbacks for list items
- `useAssertQuery`: Type-safe assertion that query data is loaded

### Internationalization (i18n)

**Library**: FormatJS (`react-intl`) with ICU MessageFormat syntax.

**Message ID Patterns** (enforced by ESLint):

- `generic.[key]`: Reusable messages (e.g., `generic.save`, `generic.cancel`)
- `page.[name].[key]`: Page-specific (e.g., `page.petitions.title`)
- `component.[name].[key]`: Component-specific (e.g., `component.user-menu.logout`)
- `util.[name].[key]`: Utility messages

**Usage**:

```tsx
// In JSX
<FormattedMessage id="page.petitions.empty-state" defaultMessage="No petitions found" />;

// Imperative
const intl = useIntl();
const label = intl.formatMessage({ id: "generic.save", defaultMessage: "Save" });
```

**ICU MessageFormat Syntax**:

- Plurals: `{count, plural, one {# petition} other {# petitions}}`
- Variables: `Hello, {name}!`
- Dates: `{date, date, medium}`
- Select: `{gender, select, male {He} female {She} other {They}}`

**Files**:

- `client/lang/{en,es}.json`: App messages
- `client/lang/recipient/{en,es,ca,it,pt}.json`: Recipient-facing messages (5 locales)

**Literal Strings**: ESLint enforces i18n for props like `title`, `placeholder`, `aria-label`, `label`, `description`, `alt`.

---

## 6. Services & Utilities

### Core Services

**Location**: `server/src/services/`

| Service             | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `Auth`              | AWS Cognito authentication, token validation               |
| `EmailsService`     | Email sending (SES/SMTP), template rendering (React Email) |
| `StorageService`    | S3 operations, pre-signed URLs, file management            |
| `EncryptionService` | AES encryption for sensitive data                          |
| `JwtService`        | JWT token generation/validation                            |
| `Redis`             | Caching, session storage, rate limiting                    |
| `SignatureService`  | Signature orchestration (provider abstraction)             |
| `QueuesService`     | Queue/worker message management                            |

**Real-world examples:**

- [server/src/services/EmailsService.ts](server/src/services/EmailsService.ts) - service with multiple integrations
- [server/src/services/PetitionsHelperService.ts](server/src/services/PetitionsHelperService.ts) - complex business logic service

### Petition Services

| Service                       | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `PetitionsHelperService`      | High-level petition CRUD, stats     |
| `PetitionFieldService`        | Field logic evaluation, validation  |
| `PetitionValidationService`   | Completeness checks, business rules |
| `PetitionImportExportService` | Excel/CSV import/export             |

### Profile Services

| Service                         | Purpose                               |
| ------------------------------- | ------------------------------------- |
| `ProfilesHelperService`         | Profile CRUD operations               |
| `ProfileTypeFieldService`       | Field configuration, monitoring setup |
| `ProfileValidationService`      | Profile/field value validation        |
| `ProfileExcelImportService`     | Excel import with validation          |
| `ProfileExternalSourcesService` | External source management            |

### Other Key Services

| Service                      | Purpose                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `BackgroundCheckService`     | Background check orchestration                                     |
| `AdverseMediaSearchService`  | Adverse media monitoring                                           |
| `IdVerificationService`      | ID document verification                                           |
| `BankflipService`            | Banking integration                                                |
| `OrgLimitsService`           | Usage limit enforcement                                            |
| `OrganizationCreditsService` | Credit balance management                                          |
| `I18nService`                | Message formatting, localization                                   |
| `AiCompletionService`        | AI completion (petition summaries, extract information from files) |
| `EventSubscriptionService`   | Webhook subscriptions                                              |
| `ApprovalsService`           | Approval workflow management                                       |

### Key Utilities

**Server** (`server/src/util/`):

- `globalId.ts`: Global ID encoding/decoding for GraphQL
- `fieldLogic.ts`: Conditional field logic evaluation
- `completedFieldReplies.ts`: Reply completion checks
- `reminderUtils.ts`: Reminder scheduling helpers
- `slate/`: Rich text utilities
- `promises/`: `pMapChunk`, `LazyPromise` promise related helpers
- `ProfileQueryFilter.ts`, `ProfileQuerySortBy.ts`: Profile filtering/sorting

**Client** (`client/utils/`):

- `apollo/`: Apollo Client setup, cache policies
- `fieldLogic/`: Client-side field logic (mirrors server)
- `dates.ts`: Date formatting
- `downloadSpreadsheet.ts`: File downloads
- `events.ts`: Analytics tracking (Segment)

---

## 7. Data Layer

### Key Database Tables

**Organizations & Users**:

- `organization`, `user`, `user_group`, `user_group_member`

**Petitions**:

- `petition`, `petition_field`, `petition_access`, `petition_field_reply`
- `petition_attachment`, `petition_signature_request`, `petition_message`, `petition_reminder`
- `petition_permission`, `petition_approval_request`, `petition_field_comment`

**Profiles**:

- `profile`, `profile_type`, `profile_type_field`, `profile_field_value`
- `profile_external_source_entity`, `profile_sync_log`

**Contacts**:

- `contact`, `contact_authentication`

**System**:

- `petition_event`, `profile_event`, `system_event`
- `task`, `org_integration`, `feature_flag`, `event_subscription`
- `email_log`, `file_upload`, `dashboard`, `petition_list_view`, `profile_list_view`

### Migrations

**Tool**: Knex.js
**Location**: `server/migrations/`

**Commands**:

```bash
yarn workspace @parallel/server migrate          # Run migrations
yarn workspace @parallel/server migrate-make     # Create new migration
yarn workspace @parallel/server migrate-down     # Rollback
yarn workspace @parallel/server generate-db-types # Regenerate types
```

**Auto-Generated Types**: `server/src/db/__types.ts` - database types, enums, models

### GraphQL Code Generation

**Server**: `server/parallel-schema.graphql` (auto-generated by Nexus when running `yarn dev`)

**Client**:

```bash
yarn workspace @parallel/client generate-graphql-types
```

Generates `client/graphql/__types.ts` from operations defined in components and utilities throughout the codebase

**Pattern**: Define operation → Run codegen → Import generated TypedDocumentNode from \_\_types.ts → Types inferred automatically by Apollo

### Internationalization

**Files**:

- `server/lang/{en,es,ca,it,pt}.json` - service messages (emails)
- `client/lang/{en,es}.json` - app messages
- `client/lang/recipient/{en,es,ca,it,pt}.json` - recipient-facing messages (5 locales)

**Commands**:

- `yarn workspace @parallel/[server|client] extract-i18n-terms` - Extract translation terms from code
- `yarn workspace @parallel/[server|client] generate-i18n-files` - Generate translation files (runs during build, no need to run manually)

**Workflow for adding new translations**:

1. Add `<FormattedMessage>` or `intl.formatMessage()` in code with `id` and `defaultMessage`
2. Run `yarn extract-i18n-terms` in the appropriate workspace
3. Populate the new terms in the corresponding `lang/[locale].json` files

**Usage (server)**: `await ctx.i18n.formatMessage({ id: "key" }, { placeholders })`
**Usage (client)**: `<FormattedMessage id="key" values={{ placeholders }} />`

---

## 8. Critical Gotchas

### 1. Soft Deletes

**Always** filter `whereNull("deleted_at")` in queries. DataLoaders include this by default, direct queries must add manually.

### 2. Transaction Discipline

Pass `t?: Knex.Transaction` through entire call chain. Events only enqueued **after** transaction commits. Don't mix transactional/non-transactional calls.

```typescript
// Inside a repository or service:
await this.withTransaction(async (t) => {
  await this.createPetition(data, t);
  await this.createPetitionField(fieldData, t);
  // Events auto-enqueued after commit
});
```

### 3. DataLoaders

Scoped per HTTP request, cleared automatically. Use for all relations to avoid N+1 queries. Never call repository methods directly in resolvers without DataLoader.

### 4. Global IDs

Always use in GraphQL API: `toGlobalId("Petition", 123)` → `"UGV0aXRpb246MTIz"`, decode with `fromGlobalId(globalId)`. Never expose internal IDs to clients.

### 5. Worker Idempotency

Workers may receive duplicate messages. Design all handlers to be idempotent - check current state before processing, use database transactions for atomicity.

### 6. Event Timing

Events enqueued only after transaction commits. Failed transactions = no events. Don't enqueue if transaction might roll back.

### 7. OAuth Token Refresh

Docusign tokens expire every 8 hours. Refresh proactively before expiry. Store tokens encrypted. Handle refresh failures gracefully.

### 8. PDF Memory Limits

Typst compilation is memory-intensive. Limit concurrent PDF generation (use worker queue to throttle). Monitor memory usage. Set worker memory limits. Enforce asset file size limits.

### 9. N+1 Query Prevention

Use DataLoaders for **all** relations in GraphQL resolvers. Batch database queries. Profile queries in development. Never fetch in loops.

### 10. Multi-Tenancy Isolation

**Always** filter by `organization_id`. Check permissions before operations. Isolate tenant data. Verify user belongs to organization in context.

**Additional Gotchas**:

- **Webhooks**: Always verify signatures, respond quickly (<5s), process in background if needed
- **Rate Limits**: Respect provider limits (implement client-side throttling, exponential backoff)
- **Temp Files**: Always clean up after PDF generation, use `stream.on("end", () => cleanup())`
- **GraphQL Authorization**: Check at resolver level (not field level for performance), cache with DataLoader
- **Frontend Apollo Cache**: Normalize with global IDs, use `update` function (not `refetchQueries`) for cache updates

### Frontend-Specific Gotchas

- **Fragment Naming**: Fragments must follow `ComponentName_EntityType` pattern for codegen to discover them
- **getInitialProps Cache**: Don't return data from `getInitialProps` - just populate cache, let `useQuery` read from it
- **Chakra RTL**: Always use `Start`/`End` instead of `Left`/`Right` for margin, padding, border, position
- **i18n Literal IDs**: Message IDs must match ESLint patterns (`generic.*`, `page.*.*`, `component.*.*`)
- **Dialog Stacking**: `DialogProvider` manages stack; nested dialogs supported but only top modal blocks
- **SSR vs Client**: Use `typeof window !== "undefined"` checks for browser-only code

---

## 9. Modification Patterns

### Common steps

1. Check if a migration is needed for adding new database enum options

### Adding a GraphQL Field

1. Add column via migration: `yarn workspace @parallel/server migrate-make add_field`
2. Run migration: `yarn workspace @parallel/server migrate` (types auto-regenerate)
3. Add to GraphQL type: `server/src/graphql/[entity]/types/index.ts`
4. Update client queries (in components/pages where the field is used)
5. Regenerate client types: `yarn workspace @parallel/client generate-graphql-types`

### Adding an Event Listener

1. Create listener: `server/src/workers/queues/event-listeners/MyListener.ts`
2. Define symbol and implement `EventListener<EventType>`
3. Register in module: `options.bind(MY_LISTENER).to(MyListener)`
4. Inject in `EventProcessorQueue` and call `.register(myListener)`

### Adding an Integration

1. Create client: `server/src/integrations/[type]/MyClient.ts`
2. Implement interface (e.g., `ISignatureClient`)
3. Register in module: Define symbol, bind to container
4. Update factory function to include new provider
5. Add webhook handler in `server/src/api/integrations.ts`

### Adding a Task Type

1. Create migration to add new value to `task_name` enum (types auto-regenerate)
2. Create runner: `server/src/workers/queues/task-runners/MyRunner.ts` extending `TaskRunner<"MY_TASK_NAME">`
3. Register in module: `options.bind(MyRunner).toSelf()`
4. Add to `TaskWorkerQueue`: inject runner in constructor, add mapping in `runners` record
5. Enqueue via `TaskRepository.createTask()` which creates DB record and enqueues to task-worker

### Adding a Database Migration

1. Create: `yarn workspace @parallel/server migrate-make descriptive_name`
2. Edit generated file in `server/migrations/`
3. Run: `yarn workspace @parallel/server migrate`
4. Types auto-regenerate in `server/src/db/__types.ts`

### Adding a Client Component with GraphQL

1. Create component file in appropriate directory (`components/[feature]/`)
2. Define GraphQL operations at end of file with proper naming (`ComponentName_*`)
3. Run codegen: `yarn workspace @parallel/client generate-graphql-types`
4. Import generated document from `@parallel/graphql/__types`
5. Add i18n messages following ID pattern (`component.[name].[key]`)

### Adding a New Page

1. Create page in `pages/app/[section]/` or `pages/petition/`
2. Use `withApolloData` HOC for authenticated pages
3. Populate cache in `getInitialProps` with `fetchQuery()`, return empty object
4. Use `useQuery` in component to read from cache
5. Add i18n messages with `page.[name].[key]` pattern

---

## 10. Development Workflow

For local development setup and running the application, see [getting-started.md](./getting-started.md).

### Database Migrations

**Naming Convention**: kebab-case (table/column names use underscores to match DB convention)

**Examples**:

- `add-column-petition_field_reply__associated_at.ts` - adding column to table
- `add-profile_type__standard_type__matter.ts` - adding enum value
- `add-petition_field-index.ts` - adding database index
- `remove-feature-flags.ts` - removing deprecated features

**Commands** (from `server/` directory):

```bash
# Create new migration (use kebab-case)
yarn migrate-make add-field-to-profile

# Run migrations
yarn migrate

# Rollback last migration
yarn migrate-down

# Regenerate DB types (always after migrations)
yarn generate-db-types
```

**Example migration**: See `server/migrations/` for patterns

### Checking if Code Compiles

To verify that code compiles correctly, run `yarn check-types` in the appropriate directory

### Common Development Gotchas

- Always run `generate-db-types` after migrations
- Always run `generate-graphql-types` after GraphQL schema changes (server) or operation changes (client)
- Worker processes must be restarted separately from API server
- Clear Redis cache if seeing stale data: `redis-cli FLUSHDB`

## 11. Key Files Reference

### Configuration

- `server/src/config.ts`: Environment config (DB, AWS, queues, integrations)
- `server/src/context.ts`: ApiContext with all services/repositories
- `server/src/container.ts`: InversifyJS DI container setup (loads modules from `db/`, `services/`, `integrations/`)
- `client/utils/apollo/client.ts`: Apollo Client setup with SSR, cache, links
- `client/chakra/theme/`: Chakra UI theme configuration
- `client/codegen.yml`: GraphQL codegen configuration

### Type Definitions

- `server/src/db/__types.ts`: Database types (auto-generated from schema)
- `server/parallel-schema.graphql`: GraphQL schema (auto-generated by Nexus)
- `client/graphql/__types.ts`: Client GraphQL types (auto-generated from operations)

### Documentation

- `README.md`: Commands, naming conventions, setup
- `server/src/integrations/signature/README.md`: Signature provider setup

### Example Implementations

**Server**:

- `server/src/graphql/petition/`: Complete GraphQL entity pattern
- `server/src/db/repositories/PetitionRepository.ts`: Complex repository with DataLoaders, events, transactions
- `server/src/workers/queues/event-listeners/`: Event listener examples
- `server/src/integrations/signature/DocusignClient.ts`: Integration client implementation
- `server/src/pdf/documents/recipient/`: PDF document examples

**Client**:

- `client/pages/app/petitions/index.tsx`: Page with SSR + Apollo cache pattern
- `client/components/common/dialogs/`: Dialog components with `useDialog()` pattern
- `client/utils/mutations/`: Reusable mutation hooks
- `client/utils/hooks/useClosePetition.ts`: Complex hook orchestrating mutations + dialogs
- `client/components/ui/`: Chakra v3 abstraction components

### Testing

- `server/test/testContainer.ts`: Test DI container
- `server/src/**/__tests__/`: Unit/integration tests
- `client/**/__tests__/`: Client component tests
- `e2e/`: End-to-end tests

---

## Quick Reference Checklist

When working with Parallel:

**Backend**:
✅ **Identify context**: GraphQL resolver, service, repository, or worker?
✅ **Check `context.ts`**: See what services/repositories are available
✅ **Follow patterns**: Look at `petition/` GraphQL, `PetitionRepository.ts` for examples
✅ **Respect architecture**: Services → repositories, GraphQL → services, workers use both
✅ **Transaction discipline**: Pass `t`, create events within transactions
✅ **Design for idempotency**: Workers may receive duplicate messages
✅ **Avoid N+1 queries**: Use DataLoaders for all relations
✅ **Multi-tenancy always**: Filter by `organization_id`, check permissions

**Frontend**:
✅ **Co-locate GraphQL**: Define operations at end of file with `ComponentName_*` naming
✅ **SSR pattern**: Use `fetchQuery()` in `getInitialProps`, `useQuery` in component
✅ **Chakra RTL**: Use `Start`/`End` props, avoid `Left`/`Right`
✅ **i18n IDs**: Follow patterns (`generic.*`, `page.*.*`, `component.*.*`)
✅ **Run codegen**: After GraphQL changes: `yarn workspace @parallel/client generate-graphql-types`
✅ **Use type system**: Import typed documents from `@parallel/graphql/__types`

**This is a production SaaS application.** Understand domain model and architecture before making changes. When in doubt, follow existing patterns.

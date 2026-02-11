/**
 * AuditLogService - Records and queries audit trail events for compliance.
 *
 * Tracks user actions across the platform for regulatory compliance,
 * security monitoring, and debugging purposes.
 */
export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  async logAction(entry: AuditLogEntry): Promise<void> {
    await this.repository.insert({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  }

  async getActionsForUser(userId: string, options?: QueryOptions): Promise<AuditLogEntry[]> {
    return this.repository.findByUser(userId, options);
  }

  async getActionsForEntity(
    entityType: string,
    entityId: string,
    options?: QueryOptions,
  ): Promise<AuditLogEntry[]> {
    return this.repository.findByEntity(entityType, entityId, options);
  }
}

// Types
export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "EXPORT"
  | "LOGIN"
  | "LOGOUT";

export interface QueryOptions {
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogRepository {
  insert(entry: AuditLogEntry): Promise<void>;
  findByUser(userId: string, options?: QueryOptions): Promise<AuditLogEntry[]>;
  findByEntity(entityType: string, entityId: string, options?: QueryOptions): Promise<AuditLogEntry[]>;
}

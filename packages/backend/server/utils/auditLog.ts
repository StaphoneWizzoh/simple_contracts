import type { PrismaClient } from "@prisma/client";
import { prisma } from "../db";

export type ContractCreatedEvent = {
  type: "CONTRACT_CREATED";
  source: string;
  mode: string;
  fromTemplate?: boolean;
  templateId?: string;
  templateTitle?: string;
};

export type VersionCreatedEvent = {
  type: "VERSION_CREATED";
  mode: string;
  versionNumber: number;
};

export type StatusChangedEvent =
  | {
      type: "STATUS_CHANGED";
      transition: "to_review";
      from: string;
      to: "REVIEW";
      versionNumber: number;
    }
  | {
      type: "STATUS_CHANGED";
      transition: "rejected";
      from: "REVIEW";
      to: "DRAFT";
      reason: "rejected";
      comment: string | null;
    }
  | {
      type: "STATUS_CHANGED";
      transition: "terminated";
      from: "ACTIVE";
      to: "TERMINATED";
      reason: string | null;
    }
  | {
      type: "STATUS_CHANGED";
      transition: "sent_for_signing";
      from: string;
      to: "SENT_FOR_SIGNING";
    }
  | {
      type: "STATUS_CHANGED";
      transition: "reopen_signing";
      from: "ACTIVE";
      to: "SENT_FOR_SIGNING";
      totalParties: number;
      signedCount: number;
      unsignedCount: number;
    };

export type SettingsUpdatedEvent = {
  type: "SETTINGS_UPDATED";
  changes: Record<string, unknown>;
};

export type ReviewersAssignedEvent = {
  type: "REVIEWERS_ASSIGNED";
  approverIds: string[];
  workflow: string;
};

export type ApprovalSubmittedEvent = {
  type: "APPROVAL_SUBMITTED";
  action: "APPROVED" | "REJECTED";
  comment: string | null;
};

export type SignatoryAddedEvent = {
  type: "SIGNATORY_ADDED";
  partyId: string;
  legalName: string;
  email: string;
};

export type SignatoryRemovedEvent = {
  type: "SIGNATORY_REMOVED";
  legalName: string;
  email: string;
};

export type ContractEvent =
  | ContractCreatedEvent
  | VersionCreatedEvent
  | StatusChangedEvent
  | SettingsUpdatedEvent
  | ReviewersAssignedEvent
  | ApprovalSubmittedEvent
  | SignatoryAddedEvent
  | SignatoryRemovedEvent;

export type AuditContext = { contractId: string; actorUserId: string };

// Prisma transaction client (inner arg of $transaction)
type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Write a typed audit log entry.
 * Pass `tx` to run inside an existing $transaction; omit to use the module prisma instance.
 */
export async function logContractEvent(
  event: ContractEvent,
  context: AuditContext,
  tx?: TxClient,
): Promise<void> {
  const { type, ...details } = event;

  await (tx ?? prisma).contractAuditLog.create({
    data: {
      contractId: context.contractId,
      actorUserId: context.actorUserId,
      eventType: type,
      details: JSON.stringify(details),
    },
  });
}

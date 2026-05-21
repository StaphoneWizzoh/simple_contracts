import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { logContractEvent, type ApprovalSubmittedEvent, type StatusChangedEvent } from "../utils/auditLog";
import { createTestFixture, cleanupTestFixture, type TestFixture } from "./fixtures";
import { testPrisma as prisma } from "./setup";

describe("auditLog - Event Service (Block C)", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    fixture = await createTestFixture();
  });

  afterEach(async () => {
    await cleanupTestFixture(fixture);
  });

  it("C14: writes ContractAuditLog row with correct eventType and contractId for CONTRACT_CREATED", async () => {
    const event = {
      type: "CONTRACT_CREATED" as const,
      source: "manual",
      mode: "blank",
    };

    await logContractEvent(event, {
      contractId: fixture.contractId,
      actorUserId: fixture.userId,
    });

    const log = await prisma.contractAuditLog.findFirst({
      where: { contractId: fixture.contractId, eventType: "CONTRACT_CREATED" },
    });

    expect(log).toBeDefined();
    expect(log?.contractId).toBe(fixture.contractId);
    expect(log?.actorUserId).toBe(fixture.userId);
    expect(log?.eventType).toBe("CONTRACT_CREATED");
  });

  it("C15: serializes details as valid JSON containing the non-type payload fields", async () => {
    const event = {
      type: "CONTRACT_CREATED" as const,
      source: "template",
      mode: "duplicate",
      fromTemplate: true,
      templateId: "tpl_123",
      templateTitle: "Service Agreement",
    };

    await logContractEvent(event, {
      contractId: fixture.contractId,
      actorUserId: fixture.userId,
    });

    const log = await prisma.contractAuditLog.findFirst({
      where: { contractId: fixture.contractId, eventType: "CONTRACT_CREATED" },
    });

    expect(log?.details).toBeDefined();
    const details = JSON.parse(log!.details!);
    expect(details.source).toBe("template");
    expect(details.mode).toBe("duplicate");
    expect(details.fromTemplate).toBe(true);
    expect(details.templateId).toBe("tpl_123");
    expect(details.templateTitle).toBe("Service Agreement");
    expect(details.type).toBeUndefined(); // type field should not be in details
  });

  it("C16: without tx, row is immediately readable after the call", async () => {
    const event = {
      type: "APPROVAL_SUBMITTED" as const,
      action: "APPROVED" as const,
      comment: "Looks good to me",
    };

    await logContractEvent(event, {
      contractId: fixture.contractId,
      actorUserId: fixture.userId,
    });

    // Immediately read back without awaiting
    const log = await prisma.contractAuditLog.findFirst({
      where: { contractId: fixture.contractId, eventType: "APPROVAL_SUBMITTED" },
    });

    expect(log).toBeDefined();
    expect(log?.contractId).toBe(fixture.contractId);
  });

  it("C17: with tx, row is absent if the transaction is rolled back", async () => {
    const event: ApprovalSubmittedEvent = {
      type: "APPROVAL_SUBMITTED",
      action: "APPROVED",
      comment: null,
    };

    // Start a transaction and roll it back
    try {
      await prisma.$transaction(async (tx) => {
        await logContractEvent(event, { contractId: fixture.contractId, actorUserId: fixture.userId }, tx);
        throw new Error("Intentional rollback");
      });
    } catch (e) {
      // Expected rollback
    }

    // Verify the log was NOT written (rolled back)
    const log = await prisma.contractAuditLog.findFirst({
      where: { contractId: fixture.contractId, eventType: "APPROVAL_SUBMITTED" },
    });

    expect(log).toBeNull();
  });

  it("C18: spot-check APPROVAL_SUBMITTED persists action and comment in details", async () => {
    const event: ApprovalSubmittedEvent = {
      type: "APPROVAL_SUBMITTED",
      action: "REJECTED",
      comment: "Missing signature authority",
    };

    await logContractEvent(event, {
      contractId: fixture.contractId,
      actorUserId: fixture.userId,
    });

    const log = await prisma.contractAuditLog.findFirst({
      where: { contractId: fixture.contractId, eventType: "APPROVAL_SUBMITTED" },
    });

    const details = JSON.parse(log!.details!);
    expect(details.action).toBe("REJECTED");
    expect(details.comment).toBe("Missing signature authority");
  });

  it("C19: spot-check STATUS_CHANGED (rejected) persists transition, from, to, comment in details", async () => {
    const event: StatusChangedEvent & { transition: "rejected" } = {
      type: "STATUS_CHANGED",
      transition: "rejected",
      from: "REVIEW",
      to: "DRAFT",
      reason: "rejected",
      comment: "Please revise and resubmit",
    };

    await logContractEvent(event, {
      contractId: fixture.contractId,
      actorUserId: fixture.userId,
    });

    const log = await prisma.contractAuditLog.findFirst({
      where: { contractId: fixture.contractId, eventType: "STATUS_CHANGED" },
    });

    const details = JSON.parse(log!.details!);
    expect(details.transition).toBe("rejected");
    expect(details.from).toBe("REVIEW");
    expect(details.to).toBe("DRAFT");
    expect(details.reason).toBe("rejected");
    expect(details.comment).toBe("Please revise and resubmit");
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { requireContractAccess, requireApprovalAction } from "../utils/contractGuards";
import { createTestFixture, cleanupTestFixture, type TestFixture } from "./fixtures";
import { auth } from "../auth";

/** Mock AppEvent for testing — simulates the Nitro event object */
function createMockEvent(userId: string): any {
  return {
    node: {
      req: {
        headers: {
          // Better Auth looks for this header; we'll mock getSession instead
        },
      },
    },
  };
}

describe("contractGuards", () => {
  describe("requireContractAccess (Block A)", () => {
    let fixture: TestFixture;

    beforeEach(async () => {
      fixture = await createTestFixture();
    });

    afterEach(async () => {
      await cleanupTestFixture(fixture);
    });

    it("A1: returns { ctx, contract } when auth valid, user is org member, contract belongs to org", async () => {
      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);
      const result = await requireContractAccess(event, fixture.contractId);

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.ctx.userId).toBe(fixture.userId);
      expect(result.ctx.organizationId).toBe(fixture.orgId);
      expect(result.ctx.roleId).toBe(fixture.roleId);
      expect(result.contract).toBeDefined();
      expect(result.contract.id).toBe(fixture.contractId);
      expect(result.contract.organizationId).toBe(fixture.orgId);
      expect(Array.isArray(result.contract.approvals)).toBe(true);
    });

    it("A2: throws 401 when there is no valid session", async () => {
      (auth.api.getSession as any).mockResolvedValue(null);

      const event = createMockEvent(fixture.userId);

      await expect(requireContractAccess(event, fixture.contractId)).rejects.toThrow("Unauthorized");
    });

    it("A3: throws 403 when user is authenticated but not an org member", async () => {
      const otherUserId = `other_user_${Date.now()}`;
      (auth.api.getSession as any).mockResolvedValue({
        user: { id: otherUserId },
      });

      const event = createMockEvent(otherUserId);

      await expect(requireContractAccess(event, fixture.contractId)).rejects.toThrow("Not a member of any organisation");
    });

    it("A4: throws 404 when contractId does not exist", async () => {
      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      await expect(requireContractAccess(event, "nonexistent_contract_id")).rejects.toThrow("Contract not found");
    });

    it("A5: throws 404 when contract exists but belongs to a different org", async () => {
      // Create another org with another contract
      const otherFixture = await createTestFixture();

      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      await expect(requireContractAccess(event, otherFixture.contractId)).rejects.toThrow("Contract not found");

      await cleanupTestFixture(otherFixture);
    });

    it("A6: throws 403 when permission arg supplied but caller lacks that permission", async () => {
      // Create fixture with no permissions
      const noPermFixture = await createTestFixture({ permissions: [] });

      (auth.api.getSession as any).mockResolvedValue({
        user: { id: noPermFixture.userId },
      });

      const event = createMockEvent(noPermFixture.userId);

      await expect(requireContractAccess(event, noPermFixture.contractId, "approve_contracts")).rejects.toThrow("Insufficient permissions");

      await cleanupTestFixture(noPermFixture);
    });

    it("A7: succeeds when permission arg supplied and caller holds that permission", async () => {
      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      const result = await requireContractAccess(event, fixture.contractId, "approve_contracts");

      expect(result).toBeDefined();
      expect(result.ctx.userId).toBe(fixture.userId);
      expect(result.contract.id).toBe(fixture.contractId);
    });
  });

  describe("requireApprovalAction (Block B)", () => {
    let fixture: TestFixture;

    beforeEach(async () => {
      fixture = await createTestFixture({ withApproval: true });
    });

    afterEach(async () => {
      await cleanupTestFixture(fixture);
    });

    it("B8: returns { ctx, contract, myApproval } when REVIEW + caller has PENDING approval + SIMULTANEOUS workflow", async () => {
      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);
      const result = await requireApprovalAction(event, fixture.contractId);

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.ctx.userId).toBe(fixture.userId);
      expect(result.contract).toBeDefined();
      expect(result.contract.id).toBe(fixture.contractId);
      expect(result.myApproval).toBeDefined();
      expect(result.myApproval.approverId).toBe(fixture.userId);
      expect(result.myApproval.status).toBe("PENDING");
    });

    it("B9: throws 422 when contract.status is not REVIEW", async () => {
      const { testPrisma: prisma } = await import("./setup");

      // Change the default fixture contract to DRAFT status
      await prisma.contract.update({
        where: { id: fixture.contractId },
        data: { status: "DRAFT" },
      });

      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      await expect(requireApprovalAction(event, fixture.contractId)).rejects.toThrow("Contract is not in REVIEW status");

      // Restore the contract to REVIEW for next tests
      await prisma.contract.update({
        where: { id: fixture.contractId },
        data: { status: "REVIEW" },
      });
    });

    it("B10: throws 403 when contract is REVIEW but caller has no approval row", async () => {
      // Delete the default fixture's approval row for this test
      const { testPrisma: prisma } = await import("./setup");
      await prisma.contractApproval.delete({ where: { id: fixture.approvalId! } });

      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      await expect(requireApprovalAction(event, fixture.contractId)).rejects.toThrow("Not a pending approver");

      // Recreate the approval for subsequent tests
      await prisma.contractApproval.create({
        data: {
          contractId: fixture.contractId,
          approverId: fixture.userId,
          order: 0,
          status: "PENDING",
        },
      });
    });

    it("B11: throws 403 when caller has an approval row but it is already APPROVED (not PENDING)", async () => {
      const { testPrisma: prisma } = await import("./setup");

      // Mark the fixture approval as APPROVED
      await prisma.contractApproval.update({
        where: { id: fixture.approvalId },
        data: { status: "APPROVED", actedAt: new Date() },
      });

      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      await expect(requireApprovalAction(event, fixture.contractId)).rejects.toThrow("Not a pending approver");
    });

    it("B12: SEQUENTIAL workflow throws 422 when a prior-ordered approval is still PENDING", async () => {
      const { testPrisma: prisma } = await import("./setup");

      // Update contract to SEQUENTIAL workflow
      await prisma.contract.update({
        where: { id: fixture.contractId },
        data: { approvalWorkflow: "SEQUENTIAL" },
      });

      // Create a prior approval (order 0) with PENDING status
      const priorUser = await prisma.user.create({
        data: {
          id: `prior_user_${Date.now()}`,
          email: `prior${Date.now()}@test.local`,
          name: "Prior Approver",
        },
      });

      await prisma.organizationMember.create({
        data: {
          organizationId: fixture.orgId,
          userId: priorUser.id,
          roleId: fixture.roleId,
        },
      });

      await prisma.contractApproval.create({
        data: {
          contractId: fixture.contractId,
          approverId: priorUser.id,
          order: 0,
          status: "PENDING",
        },
      });

      // Update fixture approval to order 1
      await prisma.contractApproval.update({
        where: { id: fixture.approvalId },
        data: { order: 1 },
      });

      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      await expect(requireApprovalAction(event, fixture.contractId)).rejects.toThrow("Cannot approve while prior approvers are pending");
    });

    it("B13: SEQUENTIAL workflow succeeds when all prior-ordered approvals are APPROVED", async () => {
      const { testPrisma: prisma } = await import("./setup");

      // Update contract to SEQUENTIAL workflow
      await prisma.contract.update({
        where: { id: fixture.contractId },
        data: { approvalWorkflow: "SEQUENTIAL" },
      });

      // Create a prior approval (order 0) with APPROVED status
      const priorUser = await prisma.user.create({
        data: {
          id: `prior_user_${Date.now()}`,
          email: `prior${Date.now()}@test.local`,
          name: "Prior Approver",
        },
      });

      await prisma.organizationMember.create({
        data: {
          organizationId: fixture.orgId,
          userId: priorUser.id,
          roleId: fixture.roleId,
        },
      });

      await prisma.contractApproval.create({
        data: {
          contractId: fixture.contractId,
          approverId: priorUser.id,
          order: 0,
          status: "APPROVED",
          actedAt: new Date(),
        },
      });

      // Update fixture approval to order 1
      await prisma.contractApproval.update({
        where: { id: fixture.approvalId },
        data: { order: 1 },
      });

      (auth.api.getSession as any).mockResolvedValue({
        user: { id: fixture.userId },
      });

      const event = createMockEvent(fixture.userId);

      const result = await requireApprovalAction(event, fixture.contractId);

      expect(result).toBeDefined();
      expect(result.myApproval.order).toBe(1);
    });
  });
});

import type { ContractApproval, Contract } from "@prisma/client";
import type { OrgContext, Permission } from "./permissions";
import { getOrgContext, requirePermission } from "./permissions";
import { prisma } from "../db";

export type ContractWithApprovals = Contract & { approvals: ContractApproval[] };

/**
 * Verify auth + org membership + contract belongs to org.
 * Optionally assert the caller holds a specific permission.
 *
 * @throws 401 — no valid session
 * @throws 403 — not an org member, or lacks required permission
 * @throws 404 — contract not found or belongs to a different org
 */
export async function requireContractAccess(
  event: any,
  contractId: string,
  permission?: Permission,
): Promise<{ ctx: OrgContext; contract: ContractWithApprovals }> {
  const ctx = permission ? await requirePermission(event, permission) : await getOrgContext(event);

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, organizationId: ctx.organizationId },
    include: { approvals: { orderBy: { order: "asc" } } },
  });

  if (!contract) {
    throw createError({ statusCode: 404, statusMessage: "Contract not found" });
  }

  return { ctx, contract };
}

/**
 * Extends requireContractAccess with approval-action preconditions:
 *   - contract.status === "REVIEW"
 *   - caller has a PENDING approval row on this contract
 *   - if SEQUENTIAL workflow, all prior-ordered approvals are non-PENDING
 *
 * @throws 422 — contract not in REVIEW, or sequential blockers exist
 * @throws 403 — caller is not a pending approver
 */
export async function requireApprovalAction(
  event: any,
  contractId: string,
): Promise<{ ctx: OrgContext; contract: ContractWithApprovals; myApproval: ContractApproval }> {
  const { ctx, contract } = await requireContractAccess(event, contractId);

  if (contract.status !== "REVIEW") {
    throw createError({ statusCode: 422, statusMessage: "Contract is not in REVIEW status" });
  }

  const myApproval = contract.approvals.find((a) => a.approverId === ctx.userId && a.status === "PENDING");

  if (!myApproval) {
    throw createError({ statusCode: 403, statusMessage: "Not a pending approver for this contract" });
  }

  // SEQUENTIAL: check that no prior-ordered approvals are still PENDING
  if (contract.approvalWorkflow === "SEQUENTIAL") {
    const myOrder = myApproval.order;
    const hasBlocker = contract.approvals.some((a) => a.order < myOrder && a.status === "PENDING");
    if (hasBlocker) {
      throw createError({ statusCode: 422, statusMessage: "Cannot approve while prior approvers are pending" });
    }
  }

  return { ctx, contract, myApproval };
}

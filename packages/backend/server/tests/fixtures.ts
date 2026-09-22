import { testPrisma as prisma } from "./setup";
import { seedDefaultRoles, getAdminRole, ALL_PERMISSIONS } from "../utils/permissions";

export interface TestFixtureOptions {
  /** Contract status, defaults to "REVIEW" */
  contractStatus?: string;
  /** Permissions for the created user's role. Defaults to ["approve_contracts"] */
  permissions?: string[];
  /** Whether to create a ContractApproval for the user. Defaults to false */
  withApproval?: boolean;
  /** Approval order (for SEQUENTIAL workflow testing). Defaults to 0 */
  approvalOrder?: number;
}

export interface TestFixture {
  orgId: string;
  userId: string;
  roleId: string;
  contractId: string;
  approvalId?: string;
}

/**
 * Create a minimal but complete test fixture:
 * Organization + OrgRole (with specified permissions) + User + OrganizationMember + Contract + optional ContractApproval.
 *
 * Never duplicate seed logic in individual test blocks — always call this once per test.
 */
export async function createTestFixture(opts: TestFixtureOptions = {}): Promise<TestFixture> {
  const contractStatus = opts.contractStatus ?? "REVIEW";
  const permissions = opts.permissions ?? ["approve_contracts"];
  const withApproval = opts.withApproval ?? false;
  const approvalOrder = opts.approvalOrder ?? 0;

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: `Test Org ${Date.now()}`,
      legalName: `Test Legal ${Date.now()}`,
    },
  });

  // Create role with specified permissions
  const role = await prisma.orgRole.create({
    data: {
      organizationId: org.id,
      name: `Test Role ${Date.now()}`,
      permissions: JSON.stringify(permissions),
      isSystemRole: false,
    },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      id: `user_${Date.now()}`,
      email: `user${Date.now()}@test.local`,
      name: "Test User",
    },
  });

  // Create org membership
  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      roleId: role.id,
    },
  });

  // Create contract
  const contract = await prisma.contract.create({
    data: {
      organizationId: org.id,
      ownerUserId: user.id,
      createdByUserId: user.id,
      contractNumber: `CTR-${Date.now()}`,
      title: `Test Contract ${Date.now()}`,
      status: contractStatus,
    },
  });

  let approvalId: string | undefined;
  if (withApproval) {
    const approval = await prisma.contractApproval.create({
      data: {
        contractId: contract.id,
        approverId: user.id,
        order: approvalOrder,
        status: "PENDING",
      },
    });
    approvalId = approval.id;
  }

  return {
    orgId: org.id,
    userId: user.id,
    roleId: role.id,
    contractId: contract.id,
    approvalId,
  };
}

/** Clean up test data after each test. */
export async function cleanupTestFixture(fixture: TestFixture) {
  // Cascade deletes via Prisma relations
  await prisma.contract.delete({ where: { id: fixture.contractId } }).catch(() => {});
  await prisma.user.delete({ where: { id: fixture.userId } }).catch(() => {});
  await prisma.organization.delete({ where: { id: fixture.orgId } }).catch(() => {});
}

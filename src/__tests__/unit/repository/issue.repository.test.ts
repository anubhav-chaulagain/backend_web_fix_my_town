import mongoose from "mongoose";
import { IssueRepository } from "../../../repositories/issue.repository";
import { IssueModel } from "../../../models/issue.model";
import { UserModel } from "../../../models/user.model";

describe("IssueRepository Unit Tests", () => {
  let issueRepo: IssueRepository;
  let testIssueId: string;
  let testUserId: string;
  let testAuthorityId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://127.0.0.1:27017/testdb");
    }
    issueRepo = new IssueRepository();
  });

  afterAll(async () => {
    await IssueModel.deleteMany({});
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await IssueModel.deleteMany({});
    await UserModel.deleteMany({});

    // Seed a citizen user
    const citizen = await UserModel.create({
      fullname: "John Citizen",
      email: "citizen@example.com",
      password: "123456",
      role: "citizen",
    });
    testUserId = citizen._id.toString();

    // Seed an authority user
    const authority = await UserModel.create({
      fullname: "Auth Officer",
      email: "authority@example.com",
      password: "123456",
      role: "authority",
      department: "Roads",
      employeeId: "EMP001",
      phoneNumber: "9800000000",
    });
    testAuthorityId = authority._id.toString();

    // Seed a base issue
    const issue = await issueRepo.createIssue(getIssueData({ reportedBy: testUserId as any }));
    testIssueId = issue._id.toString();
  });

  const getIssueData = (overrides = {}) => ({
    title: "Broken Streetlight on Main Road",
    category: "Broken Streetlight" as const,
    location: "Main Road, Near Bus Stop 12",
    description: "The streetlight has been broken for over a week and causes safety hazards at night.",
    reportedBy: new mongoose.Types.ObjectId(testUserId),
    ...overrides,
  });

  // ─── createIssue ────────────────────────────────────────────────────────────
  test("should create a new issue", async () => {
    const issue = await issueRepo.createIssue(getIssueData());
    expect(issue).toBeDefined();
    expect(issue.title).toBe("Broken Streetlight on Main Road");
    expect(issue).toHaveProperty("_id");
    expect(issue.status).toBe("pending");
  });

  // ─── getIssueById ───────────────────────────────────────────────────────────
  test("should get issue by id", async () => {
    const issue = await issueRepo.getIssueById(testIssueId);
    expect(issue).not.toBeNull();
    expect(issue!._id.toString()).toBe(testIssueId);
  });

  // ─── getAllIssues ────────────────────────────────────────────────────────────
  test("should get all issues with pagination", async () => {
    await issueRepo.createIssue(getIssueData({ title: "Pothole on Side Road", category: "Pothole" }));
    const { issues, total } = await issueRepo.getAllIssues(1, 10);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(total).toBeGreaterThanOrEqual(2);
  });

  // ─── getAllIssues with filters ───────────────────────────────────────────────
  test("should filter issues by status and category", async () => {
    const { issues } = await issueRepo.getAllIssues(1, 10, {
      status: "pending",
      category: "Broken Streetlight",
    });
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues[0].status).toBe("pending");
    expect(issues[0].category).toBe("Broken Streetlight");
  });

  // ─── getAllIssues with search ────────────────────────────────────────────────
  test("should search issues by keyword", async () => {
    const { issues } = await issueRepo.getAllIssues(1, 10, { search: "streetlight" });
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues[0].title.toLowerCase()).toContain("streetlight");
  });

  // ─── getIssuesByUser ─────────────────────────────────────────────────────────
  test("should get issues by user", async () => {
    const { issues, total } = await issueRepo.getIssuesByUser(testUserId, 1, 10);
    expect(Array.isArray(issues)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(1);
    expect(issues[0].reportedBy._id.toString()).toBe(testUserId);
  });

  // ─── getIssuesByStatus ───────────────────────────────────────────────────────
  test("should get issues by status", async () => {
    const { issues, total } = await issueRepo.getIssuesByStatus("pending", 1, 10);
    expect(Array.isArray(issues)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(1);
    expect(issues[0].status).toBe("pending");
  });

  // ─── getUnassignedIssues ─────────────────────────────────────────────────────
  test("should get unassigned issues", async () => {
    const issues = await issueRepo.getUnassignedIssues(5);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    issues.forEach(issue => expect(issue.assignedTo).toBeUndefined());
  });

  // ─── updateIssue ─────────────────────────────────────────────────────────────
  test("should update an issue", async () => {
    const updated = await issueRepo.updateIssue(testIssueId, { title: "Updated Streetlight Title" });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Updated Streetlight Title");
  });

  // ─── updateIssueStatus ───────────────────────────────────────────────────────
  test("should update issue status with remarks", async () => {
    const updated = await issueRepo.updateIssueStatus(testIssueId, "in-progress", "Team dispatched");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("in-progress");
    expect(updated!.remarks).toBe("Team dispatched");
  });

  // ─── assignIssue ─────────────────────────────────────────────────────────────
  test("should assign issue to an authority", async () => {
    const updated = await issueRepo.assignIssue(testIssueId, testAuthorityId);
    expect(updated).not.toBeNull();
    expect(updated!.assignedTo!._id.toString()).toBe(testAuthorityId);
    expect(updated!.status).toBe("in-progress");
  });

  // ─── resolveIssue ────────────────────────────────────────────────────────────
  test("should resolve an issue", async () => {
    const updated = await issueRepo.resolveIssue(testIssueId, "Issue fixed successfully");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("resolved");
    expect(updated!.remarks).toBe("Issue fixed successfully");
    expect(updated!.resolvedAt).toBeDefined();
  });

  // ─── deleteIssue ─────────────────────────────────────────────────────────────
  test("should delete an issue", async () => {
    const result = await issueRepo.deleteIssue(testIssueId);
    expect(result).toBe(true);
    const issue = await issueRepo.getIssueById(testIssueId);
    expect(issue).toBeNull();
  });

  // ─── getMyRecentIssues ───────────────────────────────────────────────────────
  test("should get recent issues for a user (max 5)", async () => {
    const issues = await issueRepo.getMyRecentIssues(testUserId);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeLessThanOrEqual(5);
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  // ─── getAssignedIssues ───────────────────────────────────────────────────────
  test("should get issues assigned to an authority", async () => {
    await issueRepo.assignIssue(testIssueId, testAuthorityId);
    const { issues, total } = await issueRepo.getAssignedIssues(testAuthorityId, 1, 10);
    expect(Array.isArray(issues)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(1);
    expect(issues[0].assignedTo!._id.toString()).toBe(testAuthorityId);
  });

  // ─── getAssignedIssues with filter ──────────────────────────────────────────
  test("should filter assigned issues by status", async () => {
    await issueRepo.assignIssue(testIssueId, testAuthorityId);
    const { issues } = await issueRepo.getAssignedIssues(testAuthorityId, 1, 10, {
      status: "in-progress",
    });
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues[0].status).toBe("in-progress");
  });

  // ─── getAdminStats ───────────────────────────────────────────────────────────
  test("should return admin stats", async () => {
    const stats = await issueRepo.getAdminStats();
    expect(stats).toHaveProperty("totalReports");
    expect(stats).toHaveProperty("unassignedReports");
    expect(stats).toHaveProperty("pendingReports");
    expect(stats).toHaveProperty("inprogressReports");
    expect(stats).toHaveProperty("resolvedReports");
    expect(stats.totalReports).toBeGreaterThanOrEqual(1);
    expect(stats.pendingReports).toBeGreaterThanOrEqual(1);
  });
});
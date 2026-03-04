import mongoose from "mongoose";
import { UserRepository } from "../../../repositories/user.repository";
import { UserModel } from "../../../models/user.model";

describe("UserRepository Unit Tests", () => {
  let userRepo: UserRepository;
  let testUserId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://127.0.0.1:27017/testdb");
    }
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    const user = await userRepo.createUser({
      fullname: "John Doe",
      email: "john@example.com",
      password: "123456",
      role: "citizen",
    });
    testUserId = user._id.toString();
  });

  const getUserData = (overrides = {}) => ({
    fullname: "Alice Smith",
    email: "alice@example.com",
    password: "abcdef",
    role: "citizen" as const,
    ...overrides,
  });

  const getAuthorityData = (overrides = {}) => ({
    fullname: "Bob Authority",
    email: "bob@example.com",
    password: "securepass",
    role: "authority" as const,
    department: "Roads",
    employeeId: "EMP001",
    phoneNumber: "1234567890",
    ...overrides,
  });

  // ─── createUser ────────────────────────────────────────────────────────────
  test("should create a new user", async () => {
    const newUser = await userRepo.createUser(getUserData());
    expect(newUser).toBeDefined();
    expect(newUser.email).toBe("alice@example.com");
    expect(newUser).toHaveProperty("_id");
  });

  // ─── getUserByEmail ─────────────────────────────────────────────────────────
  test("should get user by email", async () => {
    const user = await userRepo.getUserByEmail("john@example.com");
    expect(user).not.toBeNull();
    expect(user!.fullname).toBe("John Doe");
  });

  // ─── getUserbyId ────────────────────────────────────────────────────────────
  test("should get user by id", async () => {
    const user = await userRepo.getUserbyId(testUserId);
    expect(user).not.toBeNull();
    expect(user!.email).toBe("john@example.com");
  });

  // ─── getUserByEmployeeId ────────────────────────────────────────────────────
  test("should get user by employee id", async () => {
    await userRepo.createUser(getAuthorityData());
    const user = await userRepo.getUserByEmployeeId("EMP001");
    expect(user).not.toBeNull();
    expect(user!.email).toBe("bob@example.com");
  });

  // ─── getAllUsers ────────────────────────────────────────────────────────────
  test("should get all users with pagination", async () => {
    await userRepo.createUser(getUserData());
    const { users, total } = await userRepo.getAllUsers(1, 10);
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(total).toBeGreaterThanOrEqual(2);
  });

  // ─── getAllUsers with search ─────────────────────────────────────────────────
  test("should filter users by search term", async () => {
    await userRepo.createUser(getUserData());
    const { users } = await userRepo.getAllUsers(1, 10, "Alice");
    expect(users.length).toBeGreaterThanOrEqual(1);
    expect(users[0].fullname).toMatch(/Alice/i);
  });

  // ─── getUsersByRole ─────────────────────────────────────────────────────────
  test("should get users by role", async () => {
    await userRepo.createUser(getAuthorityData());
    const authorities = await userRepo.getUsersByRole("authority");
    expect(Array.isArray(authorities)).toBe(true);
    expect(authorities.length).toBeGreaterThanOrEqual(1);
    expect(authorities[0].role).toBe("authority");
  });

  // ─── updateUser ─────────────────────────────────────────────────────────────
  test("should update a user", async () => {
    const updated = await userRepo.updateUser(testUserId, { fullname: "Johnny Doe" });
    expect(updated).not.toBeNull();
    expect(updated!.fullname).toBe("Johnny Doe");
  });

  // ─── deleteUser ─────────────────────────────────────────────────────────────
  test("should delete a user", async () => {
    const result = await userRepo.deleteUser(testUserId);
    expect(result).toBe(true);
    const user = await userRepo.getUserbyId(testUserId);
    expect(user).toBeNull();
  });

  // ─── getUserReportStats ─────────────────────────────────────────────────────
  test("should get user report stats", async () => {
    const stats = await userRepo.getUserReportStats(testUserId);
    expect(stats).toHaveProperty("totalReports");
    expect(stats).toHaveProperty("pendingReports");
    expect(stats).toHaveProperty("resolvedReports");
    expect(stats).toHaveProperty("inprogressReports");
    expect(stats.totalReports).toBe(0);
  });

  // ─── updateTotalReports ─────────────────────────────────────────────────────
  test("should increment total reports", async () => {
    await userRepo.updateTotalReports(testUserId);
    const stats = await userRepo.getUserReportStats(testUserId);
    expect(stats.totalReports).toBe(1);
  });

  // ─── updatePendingReports ───────────────────────────────────────────────────
  test("should increment pending reports", async () => {
    await userRepo.updatePendingReports(testUserId);
    const stats = await userRepo.getUserReportStats(testUserId);
    expect(stats.pendingReports).toBe(1);
  });

  // ─── updateResolvedReports ──────────────────────────────────────────────────
  test("should increment resolved reports", async () => {
    await userRepo.updateResolvedReports(testUserId);
    const stats = await userRepo.getUserReportStats(testUserId);
    expect(stats.resolvedReports).toBe(1);
  });

  // ─── updateInProgressReports ────────────────────────────────────────────────
  test("should increment in-progress reports", async () => {
    await userRepo.updateInProgressReports(testUserId);
    const stats = await userRepo.getUserReportStats(testUserId);
    expect(stats.inprogressReports).toBe(1);
  });

  // ─── decrementPendingReports ────────────────────────────────────────────────
  test("should decrement pending reports", async () => {
    await userRepo.updatePendingReports(testUserId);
    await userRepo.decrementPendingReports(testUserId);
    const stats = await userRepo.getUserReportStats(testUserId);
    expect(stats.pendingReports).toBe(0);
  });

  // ─── decrementInProgressReports ─────────────────────────────────────────────
  test("should decrement in-progress reports", async () => {
    await userRepo.updateInProgressReports(testUserId);
    await userRepo.decrementInProgressReports(testUserId);
    const stats = await userRepo.getUserReportStats(testUserId);
    expect(stats.inprogressReports).toBe(0);
  });

  // ─── incrementAuthorityStats ────────────────────────────────────────────────
  test("should increment authority assignedIssuesCount", async () => {
    const authority = await userRepo.createUser(getAuthorityData());
    const authorityId = authority._id.toString();
    await userRepo.incrementAuthorityStats(authorityId, "assignedIssuesCount");
    const updated = await userRepo.getUserbyId(authorityId);
    expect(updated!.assignedIssuesCount).toBe(1);
  });

  // ─── decrementAuthorityStats ────────────────────────────────────────────────
  test("should decrement authority completedIssuesCount", async () => {
    const authority = await userRepo.createUser({
      ...getAuthorityData(),
      email: "dec@example.com",
      employeeId: "EMP002",
      completedIssuesCount: 2,
    });
    const authorityId = authority._id.toString();
    await userRepo.decrementAuthorityStats(authorityId, "completedIssuesCount");
    const updated = await userRepo.getUserbyId(authorityId);
    expect(updated!.completedIssuesCount).toBe(1);
  });
});
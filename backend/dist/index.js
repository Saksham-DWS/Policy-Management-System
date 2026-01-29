// _core/env-loader.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// _core/logger.js
var LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}; 
var normalizeLevel = (value) => {
  if (!value) {
    return "info";
  }
  const normalized = value.toLowerCase().trim();
  return LOG_LEVELS[normalized] !== void 0 ? normalized : "info";
};
var shouldLog = (level) => {
  const current = normalizeLevel(process.env.LOG_LEVEL);
  return LOG_LEVELS[level] <= LOG_LEVELS[current];
};
var logger = {
  error: (...args) => {
    if (shouldLog("error")) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (shouldLog("warn")) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (shouldLog("info")) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (shouldLog("debug")) {
      console.debug(...args);
    }
  }
};

// _core/env-loader.js
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var envPath = path.resolve(__dirname, "..", ".env");
var envResult = dotenv.config({
  path: envPath,
  override: process.env.NODE_ENV !== "production"
});
if (envResult.error) {
  dotenv.config();
}
var jwtSecret = process.env.JWT_SECRET?.trim();
var mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (process.env.NODE_ENV !== "production") {
  logger.info(`[Env] Loaded ${envPath} (JWT_SECRET set: ${Boolean(jwtSecret)}, MONGODB_URI set: ${Boolean(mongoUri)})`);
}
if (!jwtSecret) {
  logger.error("[Env] JWT_SECRET is missing. Set it in backend/.env or your environment.");
  process.exit(1);
}
if (!mongoUri) {
  logger.warn("[Env] MONGODB_URI is missing. Database connection will fail until it is set.");
}

// _core/index.js
import express3 from "express";
import { createServer } from "http";

// rest.js
import express from "express";
import { z } from "zod";

// shared/const.js
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";

// _core/cookies.js
function isSecureRequest(req) {
  if (req.protocol === "https")
    return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto)
    return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  const sameSite = secure ? "none" : "lax";
  return {
    httpOnly: true,
    path: "/",
    sameSite,
    secure
  };
}

// shared/_core/errors.js
var HttpError = class extends Error {
  statusCode;
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var BadRequestError = (msg) => new HttpError(400, msg);
var UnauthorizedError = (msg) => new HttpError(401, msg);
var ForbiddenError = (msg) => new HttpError(403, msg);
var NotFoundError = (msg) => new HttpError(404, msg);

// _core/auth.js
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";

// models.js
import mongoose, { Schema } from "mongoose";
var shouldSyncCollections = () => {
  if (process.env.SYNC_DB_ON_START === "true") {
    return true;
  }
  if (process.env.SYNC_DB_ON_START === "false") {
    return false;
  }
  return process.env.NODE_ENV === "development";
};
var ROLE_VALUES = [
  "admin",
  "hod",
  "employee",
  "account",
  // legacy values kept for backward compatibility
  "user",
  "accounts_manager",
  "initiator"
];
var EMPLOYEE_TYPE_VALUES = [
  "permanent_india",
  "permanent_usa",
  "freelancer_india",
  "freelancer_usa",
  // legacy value kept for backward compatibility
  "permanent"
];
var UserSchema = new Schema({
  openId: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  loginMethod: String,
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ROLE_VALUES,
    default: "employee",
    required: true
  },
  employeeType: {
    type: String,
    enum: EMPLOYEE_TYPE_VALUES,
    default: "permanent_india"
  },
  hodId: String,
  lastSignedIn: { type: Date, default: Date.now }
}, { timestamps: true });
var User = mongoose.models.User || mongoose.model("User", UserSchema);
var PolicySchema = new Schema({
  name: { type: String, required: true },
  description: String,
  calculationLogic: String,
  validFrom: Date,
  validTo: Date,
  eligibilityCriteria: String,
  reRaiseAllowed: { type: Boolean, default: false },
  proofRequired: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ["active", "draft", "archived"],
    default: "draft",
    required: true
  },
  createdBy: { type: String, required: true }
}, { timestamps: true });
var Policy = mongoose.models.Policy || mongoose.model("Policy", PolicySchema);
var TeamAssignmentSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  hodId: { type: String, required: true },
  freelancerInitiatorId: String,
  assignedBy: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });
var TeamAssignment = mongoose.models.TeamAssignment || mongoose.model("TeamAssignment", TeamAssignmentSchema);
var EmployeePolicySchema = new Schema({
  userId: { type: String, required: true, index: true },
  policyId: { type: String, required: true, index: true },
  effectiveDate: { type: Date, required: true },
  assignedBy: { type: String, required: true }
}, { timestamps: true });
EmployeePolicySchema.index({ userId: 1, policyId: 1 }, { unique: true });
var EmployeePolicy = mongoose.models.EmployeePolicy || mongoose.model("EmployeePolicy", EmployeePolicySchema);
var PolicyInitiatorSchema = new Schema({
  assignmentId: { type: String, required: true, index: true },
  initiatorId: { type: String, required: true, index: true },
  assignedBy: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });
PolicyInitiatorSchema.index({ assignmentId: 1, initiatorId: 1 }, { unique: true });
var PolicyInitiator = mongoose.models.PolicyInitiator || mongoose.model("PolicyInitiator", PolicyInitiatorSchema);
var EmployeeInitiatorSchema = new Schema({
  employeeId: { type: String, required: true, index: true },
  initiatorId: { type: String, required: true, index: true },
  assignedBy: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });
EmployeeInitiatorSchema.index({ employeeId: 1, initiatorId: 1 }, { unique: true });
var EmployeeInitiator = mongoose.models.EmployeeInitiator || mongoose.model("EmployeeInitiator", EmployeeInitiatorSchema);
var CreditRequestSchema = new Schema({
  userId: { type: String, required: true },
  initiatorId: { type: String, required: true },
  hodId: { type: String, required: true },
  type: {
    type: String,
    enum: ["freelancer", "policy"],
    required: true
  },
  policyId: String,
  baseAmount: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  calculationBreakdown: String,
  notes: String,
  documents: String,
  status: {
    type: String,
    enum: ["pending_signature", "pending_approval", "approved", "rejected_by_user", "rejected_by_hod"],
    default: "pending_signature",
    required: true
  },
  userSignature: String,
  userSignedAt: Date,
  userRejectionReason: String,
  hodApprovedAt: Date,
  hodRejectedAt: Date,
  hodRejectionReason: String
}, { timestamps: true });
var CreditRequest = mongoose.models.CreditRequest || mongoose.model("CreditRequest", CreditRequestSchema);
var WalletSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  balance: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
var Wallet = mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);
var WalletTransactionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true
  },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  creditRequestId: String,
  redemptionRequestId: String,
  description: String
}, { timestamps: true });
var WalletTransaction = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", WalletTransactionSchema);
var NotificationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "info" },
  actionUrl: String,
  readAt: Date
}, { timestamps: true });
NotificationSchema.index({ userId: 1, createdAt: -1 });
var Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
var RedemptionRequestSchema = new Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  bankDetails: String,
  notes: String,
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "rejected"],
    default: "pending",
    required: true
  },
  processedBy: String,
  processedAt: Date,
  transactionReference: String,
  paymentNotes: String
}, { timestamps: true });
var RedemptionRequest = mongoose.models.RedemptionRequest || mongoose.model("RedemptionRequest", RedemptionRequestSchema);
var AuditLogSchema = new Schema({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  entityType: String,
  entityId: String,
  beforeValue: String,
  afterValue: String,
  details: String,
  ipAddress: String,
  userAgent: String
}, { timestamps: { createdAt: true, updatedAt: false } });
var AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
var AccessControlSchema = new Schema({
  userId: { type: String, required: true },
  feature: { type: String, required: true },
  grantedBy: { type: String, required: true },
  grantedAt: { type: Date, default: Date.now },
  expiresAt: Date
}, { timestamps: true });
AccessControlSchema.index({ userId: 1, feature: 1 }, { unique: true });
var AccessControl = mongoose.models.AccessControl || mongoose.model("AccessControl", AccessControlSchema);
var isConnected = false;
var collectionsEnsured = false;
var modelsToSync = [
  User,
  Policy,
  TeamAssignment,
  EmployeePolicy,
  PolicyInitiator,
  EmployeeInitiator,
  CreditRequest,
  Wallet,
  WalletTransaction,
  Notification,
  RedemptionRequest,
  AuditLog,
  AccessControl
];
async function ensureCollections() {
  if (collectionsEnsured || !shouldSyncCollections()) {
    return;
  }
  await Promise.all(modelsToSync.map(async (model) => {
    try {
      await model.createCollection();
    } catch (error) {
      const code = error?.code;
      const codeName = error?.codeName;
      if (code === 48 || codeName === "NamespaceExists") {
        return;
      }
      throw error;
    }
  }));
  collectionsEnsured = true;
  console.log("[MongoDB] Collections ensured");
}
async function connectDB() {
  if (isConnected) {
    return;
  }
  try {
    const mongoUri2 = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri2) {
      console.warn("[MongoDB] No connection string found. Skipping connection.");
      return;
    }
    await mongoose.connect(mongoUri2);
    isConnected = true;
    console.log("[MongoDB] Connected successfully");
    await ensureCollections();
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }
}

// db.js
async function ensureConnection() {
  await connectDB();
}
var LEGACY_ROLE_MAP = {
  user: "employee",
  accounts_manager: "account",
  initiator: "employee"
};
var LEGACY_EMPLOYEE_TYPE_MAP = {
  permanent: "permanent_india"
};
function normalizeRoleValue(role) {
  return LEGACY_ROLE_MAP[role] || role;
}
function normalizeEmployeeTypeValue(employeeType) {
  return LEGACY_EMPLOYEE_TYPE_MAP[employeeType] || employeeType;
}
function normalizeUserRecord(user) {
  if (!user)
    return user;
  return {
    ...user,
    role: normalizeRoleValue(user.role),
    employeeType: normalizeEmployeeTypeValue(user.employeeType)
  };
}
function normalizeUserList(users) {
  return users.map(normalizeUserRecord);
}
function expandRoleFilter(role) {
  const normalizedRole = normalizeRoleValue(role);
  if (normalizedRole === "employee") {
    return ["employee", "user", "initiator"];
  }
  if (normalizedRole === "account") {
    return ["account", "accounts_manager"];
  }
  return [normalizedRole];
}
async function getUserById(id) {
  await ensureConnection();
  const user = await User.findById(id).lean();
  return normalizeUserRecord(user);
}
async function getUserByEmail(email) {
  await ensureConnection();
  const user = await User.findOne({ email }).select("+password").lean();
  return normalizeUserRecord(user);
}
async function getUsersByIds(userIds) {
  await ensureConnection();
  const users = await User.find({ _id: { $in: userIds } }).lean();
  return normalizeUserList(users);
}
async function getAllUsers() {
  await ensureConnection();
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return normalizeUserList(users);
}
async function getUsersByRole(role) {
  await ensureConnection();
  const roles = expandRoleFilter(role);
  const users = await User.find({ role: { $in: roles } }).sort({ createdAt: -1 }).lean();
  return normalizeUserList(users);
}
async function hasAdminUser() {
  await ensureConnection();
  const admin = await User.findOne({ role: "admin" }).select("_id").lean();
  return !!admin;
}
async function getUsersByHod(hodId) {
  await ensureConnection();
  const users = await User.find({ hodId }).sort({ createdAt: -1 }).lean();
  return normalizeUserList(users);
}
async function createUser(userData) {
  await ensureConnection();
  const dataToSave = {
    ...userData,
    role: normalizeRoleValue(userData.role),
    employeeType: normalizeEmployeeTypeValue(userData.employeeType)
  };
  if (userData.password) {
    const bcrypt = await import("bcryptjs");
    dataToSave.password = await bcrypt.hash(userData.password, 10);
  }
  const user = await User.create(dataToSave);
  return normalizeUserRecord(user.toObject());
}
async function updateUser(id, updates) {
  await ensureConnection();
  const normalizedUpdates = { ...updates };
  if (updates.role !== void 0) {
    normalizedUpdates.role = normalizeRoleValue(updates.role);
  }
  if (updates.employeeType !== void 0) {
    normalizedUpdates.employeeType = normalizeEmployeeTypeValue(updates.employeeType);
  }
  if (updates.password) {
    const bcrypt = await import("bcryptjs");
    normalizedUpdates.password = await bcrypt.hash(updates.password, 10);
  }
  await User.findByIdAndUpdate(id, { $set: normalizedUpdates });
}
async function deleteUser(id) {
  await ensureConnection();
  await User.findByIdAndDelete(id);
}
async function getAllPolicies() {
  await ensureConnection();
  return await Policy.find().sort({ createdAt: -1 }).lean();
}
async function getPoliciesByIds(policyIds) {
  await ensureConnection();
  return await Policy.find({ _id: { $in: policyIds } }).lean();
}
async function getPoliciesByCreator(creatorId) {
  await ensureConnection();
  return await Policy.find({ createdBy: creatorId }).sort({ createdAt: -1 }).lean();
}
async function getPolicyById(id) {
  await ensureConnection();
  return await Policy.findById(id).lean();
}
async function createPolicy(policyData) {
  await ensureConnection();
  const policy = await Policy.create(policyData);
  return policy.toObject();
}
async function updatePolicy(id, updates) {
  await ensureConnection();
  await Policy.findByIdAndUpdate(id, { $set: updates });
}
async function deletePolicy(id) {
  await ensureConnection();
  await Policy.findByIdAndDelete(id);
}
async function createEmployeePolicyAssignment(data) {
  await ensureConnection();
  const assignment = await EmployeePolicy.create(data);
  return assignment.toObject();
}
async function getEmployeePolicyAssignmentById(id) {
  await ensureConnection();
  return await EmployeePolicy.findById(id).lean();
}
async function getEmployeePolicyAssignmentsByUserId(userId) {
  await ensureConnection();
  return await EmployeePolicy.find({ userId }).lean();
}
async function getEmployeePolicyAssignmentByUserPolicy(userId, policyId) {
  await ensureConnection();
  return await EmployeePolicy.findOne({ userId, policyId }).lean();
}
async function getEmployeePolicyAssignmentsByUserIds(userIds) {
  await ensureConnection();
  return await EmployeePolicy.find({ userId: { $in: userIds } }).lean();
}
async function getEmployeePolicyAssignmentsByIds(assignmentIds) {
  await ensureConnection();
  return await EmployeePolicy.find({ _id: { $in: assignmentIds } }).lean();
}
async function removeEmployeePolicyAssignmentById(id) {
  await ensureConnection();
  await EmployeePolicy.findByIdAndDelete(id);
}
async function updateEmployeePolicyAssignment(id, updates) {
  await ensureConnection();
  await EmployeePolicy.findByIdAndUpdate(id, { $set: updates });
}
async function setPolicyInitiators(assignmentId, initiatorIds, assignedBy) {
  await ensureConnection();
  await PolicyInitiator.deleteMany({ assignmentId });
  if (!initiatorIds?.length) {
    return [];
  }
  const records = initiatorIds.map((initiatorId) => ({
    assignmentId,
    initiatorId,
    assignedBy,
    assignedAt: /* @__PURE__ */ new Date()
  }));
  const result = await PolicyInitiator.insertMany(records);
  return result.map((r) => r.toObject());
}
async function getPolicyInitiatorsByAssignmentIds(assignmentIds) {
  await ensureConnection();
  return await PolicyInitiator.find({ assignmentId: { $in: assignmentIds } }).lean();
}
async function getPolicyInitiatorsByInitiatorId(initiatorId) {
  await ensureConnection();
  return await PolicyInitiator.find({ initiatorId }).lean();
}
async function setEmployeeInitiators(employeeId, initiatorIds, assignedBy) {
  await ensureConnection();
  await EmployeeInitiator.deleteMany({ employeeId });
  if (!initiatorIds?.length) {
    return [];
  }
  const records = initiatorIds.map((initiatorId) => ({
    employeeId,
    initiatorId,
    assignedBy,
    assignedAt: /* @__PURE__ */ new Date()
  }));
  const result = await EmployeeInitiator.insertMany(records);
  return result.map((r) => r.toObject());
}
async function getEmployeeInitiatorsByEmployeeIds(employeeIds) {
  await ensureConnection();
  return await EmployeeInitiator.find({ employeeId: { $in: employeeIds } }).lean();
}
async function getEmployeeInitiatorsByEmployeeId(employeeId) {
  await ensureConnection();
  return await EmployeeInitiator.find({ employeeId }).lean();
}
async function getEmployeeInitiatorsByInitiatorId(initiatorId) {
  await ensureConnection();
  return await EmployeeInitiator.find({ initiatorId }).lean();
}
async function createCreditRequest(data) {
  await ensureConnection();
  const request = await CreditRequest.create(data);
  return request.toObject();
}
async function getCreditRequestById(id) {
  await ensureConnection();
  return await CreditRequest.findById(id).lean();
}
async function getCreditRequestsByUserId(userId) {
  await ensureConnection();
  return await CreditRequest.find({ userId }).sort({ createdAt: -1 }).lean();
}
async function getCreditRequestsByHod(hodId) {
  await ensureConnection();
  return await CreditRequest.find({ hodId }).sort({ createdAt: -1 }).lean();
}
async function getCreditRequestsByInitiator(initiatorId) {
  await ensureConnection();
  return await CreditRequest.find({ initiatorId }).sort({ createdAt: -1 }).lean();
}
async function getAllCreditRequests() {
  await ensureConnection();
  return await CreditRequest.find().sort({ createdAt: -1 }).lean();
}
async function getCreditRequestsByStatus(status) {
  await ensureConnection();
  return await CreditRequest.find({ status }).sort({ createdAt: -1 }).lean();
}
async function updateCreditRequest(id, updates) {
  await ensureConnection();
  await CreditRequest.findByIdAndUpdate(id, { $set: updates });
}
async function ensureWallet(userId) {
  await ensureConnection();
  let wallet = await Wallet.findOne({ userId }).lean();
  if (!wallet) {
    const created = await Wallet.create({ userId, balance: 0, updatedAt: /* @__PURE__ */ new Date() });
    wallet = created.toObject();
  }
  return wallet;
}
async function createWalletTransaction(data) {
  await ensureConnection();
  const transaction = await WalletTransaction.create(data);
  await Wallet.findOneAndUpdate({ userId: data.userId }, {
    $set: { balance: data.balance, updatedAt: /* @__PURE__ */ new Date() }
  }, { upsert: true });
  return transaction.toObject();
}
async function getWalletBalance(userId) {
  await ensureConnection();
  const wallet = await ensureWallet(userId);
  return wallet?.balance || 0;
}
async function getWalletTransactions(userId) {
  await ensureConnection();
  return await WalletTransaction.find({ userId }).sort({ createdAt: -1 }).lean();
}
async function getWalletTransactionsByUserIds(userIds) {
  await ensureConnection();
  return await WalletTransaction.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean();
}
async function getAllWalletTransactions() {
  await ensureConnection();
  return await WalletTransaction.find().sort({ createdAt: -1 }).lean();
}
async function createNotification(data) {
  await ensureConnection();
  const notification = await Notification.create(data);
  return notification.toObject();
}
async function getNotificationsByUserId(userId, limit = 50) {
  await ensureConnection();
  return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}
async function getUnreadNotificationCount(userId) {
  await ensureConnection();
  return await Notification.countDocuments({ userId, readAt: { $exists: false } });
}
async function markNotificationRead(notificationId, userId) {
  await ensureConnection();
  await Notification.findOneAndUpdate({ _id: notificationId, userId }, { $set: { readAt: /* @__PURE__ */ new Date() } });
}
async function markAllNotificationsRead(userId) {
  await ensureConnection();
  await Notification.updateMany({ userId, readAt: { $exists: false } }, { $set: { readAt: /* @__PURE__ */ new Date() } });
}
async function getWalletSummary(userId) {
  await ensureConnection();
  const transactions = await WalletTransaction.find({ userId }).lean();
  const pendingRequests = await CreditRequest.find({
    userId,
    status: { $in: ["pending_signature", "pending_approval"] }
  }).lean();
  const earned = transactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const redeemed = transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
  const pending = pendingRequests.reduce((sum, r) => sum + r.amount, 0);
  const available = earned - redeemed;
  return { earned, pending, redeemed, available };
}
async function createRedemptionRequest(data) {
  await ensureConnection();
  const request = await RedemptionRequest.create(data);
  return request.toObject();
}
async function getRedemptionRequestById(id) {
  await ensureConnection();
  return await RedemptionRequest.findById(id).lean();
}
async function getRedemptionRequestsByUserId(userId) {
  await ensureConnection();
  return await RedemptionRequest.find({ userId }).sort({ createdAt: -1 }).lean();
}
async function getRedemptionRequestsByUserIds(userIds) {
  await ensureConnection();
  return await RedemptionRequest.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean();
}
async function getAllRedemptionRequests() {
  await ensureConnection();
  return await RedemptionRequest.find().sort({ createdAt: -1 }).lean();
}
async function getRedemptionRequestsByStatus(status) {
  await ensureConnection();
  return await RedemptionRequest.find({ status }).sort({ createdAt: -1 }).lean();
}
async function updateRedemptionRequest(id, updates) {
  await ensureConnection();
  await RedemptionRequest.findByIdAndUpdate(id, { $set: updates });
}
async function createAuditLog(data) {
  await ensureConnection();
  const log = await AuditLog.create(data);
  return log.toObject();
}
async function getAuditLogs(filters) {
  await ensureConnection();
  const query = {};
  if (filters?.userId)
    query.userId = filters.userId;
  if (filters?.action)
    query.action = filters.action;
  if (filters?.entityType)
    query.entityType = filters.entityType;
  if (filters?.startDate || filters?.endDate) {
    query.createdAt = {};
    if (filters.startDate)
      query.createdAt.$gte = filters.startDate;
    if (filters.endDate)
      query.createdAt.$lte = filters.endDate;
  }
  return await AuditLog.find(query).sort({ createdAt: -1 }).limit(1e3).lean();
}
async function grantAccess(data) {
  await ensureConnection();
  const access = await AccessControl.findOneAndUpdate({ userId: data.userId, feature: data.feature }, { $set: data }, { upsert: true, new: true });
  return access.toObject();
}
async function revokeAccess(userId, feature) {
  await ensureConnection();
  await AccessControl.findOneAndDelete({ userId, feature });
}
async function getUserAccess(userId) {
  await ensureConnection();
  return await AccessControl.find({
    userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: /* @__PURE__ */ new Date() } }
    ]
  }).lean();
}
async function getAllAccessGrants() {
  await ensureConnection();
  return await AccessControl.find().sort({ createdAt: -1 }).lean();
}
async function getActiveAccessGrants(userId) {
  await ensureConnection();
  return await getUserAccess(userId);
}

// _core/env.js
var getOptionalEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
};
var ENV = {
  get cookieSecret() {
    return getOptionalEnv("JWT_SECRET");
  },
  get databaseUrl() {
    return getOptionalEnv("DATABASE_URL");
  },
  get mongodbUri() {
    return getOptionalEnv("MONGODB_URI");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  }
};

// _core/auth.js
var parseCookies = (cookieHeader) => {
  if (!cookieHeader) {
    return /* @__PURE__ */ new Map();
  }
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
};
var getSessionSecret = () => {
  const secret = ENV.cookieSecret;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Set it in backend/.env or your environment.");
  }
  return new TextEncoder().encode(secret);
};
async function authenticateRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  if (!sessionCookie) {
    throw ForbiddenError("No session cookie");
  }
  let payload;
  try {
    const secretKey = getSessionSecret();
    ({ payload } = await jwtVerify(sessionCookie, secretKey, {
      algorithms: ["HS256"]
    }));
  } catch (error) {
    logger.debug("[Auth] Session verification failed", String(error));
    throw ForbiddenError("Invalid session cookie");
  }
  const userId = payload?.userId;
  if (!userId || typeof userId !== "string") {
    throw ForbiddenError("Invalid session cookie");
  }
  const user = await Promise.race([
    getUserById(userId),
    new Promise((_, reject) => setTimeout(() => reject(new Error("getUserById timeout")), 5e3))
  ]);
  if (!user) {
    logger.warn("[Auth] User not found in DB:", userId);
    throw ForbiddenError("User not found");
  }
  const { password, ...safeUser } = user;
  return { ...safeUser, id: user._id?.toString() ?? userId };
}

// ghl.js
var GHL_API_KEY = "pit-6e8fd509-31e7-44fd-8182-bf77af82250a";
var GHL_LOCATION_ID = "2xEjfVQAkuHg30MBhtW1";
var GHL_API_VERSION = "2021-07-28";
var API_BASE = "https://services.leadconnectorhq.com";
function ghlHeaders() {
  return {
    Authorization: `Bearer ${GHL_API_KEY}`,
    Version: GHL_API_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
    LocationId: GHL_LOCATION_ID
  };
}
async function ghlJson(path3, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path3}`, {
    method,
    headers: ghlHeaders(),
    body: body ? JSON.stringify(body) : void 0
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`GHL ${res.status} ${res.statusText}: ${msg}`);
  }
  return data;
}
async function upsertContactByEmail(email) {
  const data = await ghlJson("/contacts/upsert", {
    method: "POST",
    body: {
      email,
      locationId: GHL_LOCATION_ID
    }
  });
  const contactId = data?.contact?.id || data?.contact?._id || data?.id || data?._id;
  if (!contactId) {
    throw new Error(`Upsert succeeded but contactId not found in response: ${JSON.stringify(data)}`);
  }
  return contactId;
}
async function addTag(contactId, tag) {
  await ghlJson(`/contacts/${contactId}/tags`, {
    method: "POST",
    body: { tags: [tag] }
  });
}
async function updateContactCustomFields(contactId, customFields) {
  await ghlJson(`/contacts/${contactId}`, {
    method: "PUT",
    body: {
      customFields
    }
  });
}
async function createFreelancerDocument(email, name, amount, projectDetails) {
  try {
    console.log(`[GHL] Creating document for ${email}`);
    const contactId = await upsertContactByEmail(email);
    console.log(`[GHL] Contact ID: ${contactId}`);
    await updateContactCustomFields(contactId, {
      name,
      submit_feedback: `Amount: $${amount} | ${projectDetails}`
    });
    console.log(`[GHL] Updated custom fields`);
    await addTag(contactId, "+offer-letter");
    console.log(`[GHL] Added +offer-letter tag - workflow triggered`);
    return contactId;
  } catch (error) {
    console.error(`[GHL] Error creating document:`, error);
    throw error;
  }
}
async function createSignatureDocument(email, name, amount, projectDetails) {
  return createFreelancerDocument(email, name, amount, projectDetails);
}

// rest.js
var ROLE_OPTIONS = ["admin", "hod", "employee", "account"];
var EMPLOYEE_TYPES = [
  "permanent_india",
  "permanent_usa",
  "freelancer_india",
  "freelancer_usa"
];
var normalizeEmployeeType = (type) => type === "permanent" ? "permanent_india" : type;
var asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
var parseInput = (schema, data) => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error?.issues?.[0]?.message || "Invalid input";
    throw BadRequestError(message);
  }
  return parsed.data;
};
var attachUser = async (req) => {
  try {
    req.user = await authenticateRequest(req);
  } catch {
    req.user = null;
  }
};
var requireAuth = (req) => {
  if (!req.user) {
    throw UnauthorizedError(UNAUTHED_ERR_MSG);
  }
  return req.user;
};
var requireRole = (req, roles, message) => {
  const user = requireAuth(req);
  if (!roles.includes(user.role)) {
    throw ForbiddenError(message);
  }
  return user;
};
async function hydrateFreelancerInitiators(users) {
  if (!users || users.length === 0) {
    return [];
  }
  const userIds = users.map((u) => u._id?.toString()).filter(Boolean);
  const initiatorLinks = await getEmployeeInitiatorsByEmployeeIds(userIds);
  const initiatorIds = Array.from(new Set(initiatorLinks.map((link) => link.initiatorId)));
  const initiators = initiatorIds.length > 0 ? await getUsersByIds(initiatorIds) : [];
  const initiatorMap = new Map(initiators.map((user) => [user._id.toString(), user]));
  const linksByEmployee = /* @__PURE__ */ new Map();
  initiatorLinks.forEach((link) => {
    const list = linksByEmployee.get(link.employeeId) || [];
    const initiator = initiatorMap.get(link.initiatorId);
    if (initiator) {
      list.push(initiator);
    }
    linksByEmployee.set(link.employeeId, list);
  });
  return users.map((user) => ({
    ...user,
    freelancerInitiators: linksByEmployee.get(user._id.toString()) || [],
    freelancerInitiatorIds: (linksByEmployee.get(user._id.toString()) || []).map((init) => init._id.toString())
  }));
}
async function hydratePolicyAssignments(users) {
  if (!users || users.length === 0) {
    return [];
  }
  const userIds = users.map((u) => u._id?.toString()).filter(Boolean);
  const assignments = await getEmployeePolicyAssignmentsByUserIds(userIds);
  if (assignments.length === 0) {
    return users.map((user) => ({ ...user, policyAssignments: [] }));
  }
  const policyIds = Array.from(new Set(assignments.map((a) => a.policyId)));
  const policies = await getPoliciesByIds(policyIds);
  const policyMap = new Map(policies.map((policy) => [policy._id.toString(), policy]));
  const assignmentIds = assignments.map((a) => a._id.toString());
  const initiatorLinks = await getPolicyInitiatorsByAssignmentIds(assignmentIds);
  const initiatorIds = Array.from(new Set(initiatorLinks.map((link) => link.initiatorId)));
  const initiators = initiatorIds.length > 0 ? await getUsersByIds(initiatorIds) : [];
  const initiatorMap = new Map(initiators.map((user) => [user._id.toString(), user]));
  const initiatorsByAssignment = /* @__PURE__ */ new Map();
  initiatorLinks.forEach((link) => {
    const list = initiatorsByAssignment.get(link.assignmentId) || [];
    const initiator = initiatorMap.get(link.initiatorId);
    if (initiator) {
      list.push(initiator);
    }
    initiatorsByAssignment.set(link.assignmentId, list);
  });
  const assignmentsByUser = /* @__PURE__ */ new Map();
  assignments.forEach((assignment) => {
    const list = assignmentsByUser.get(assignment.userId) || [];
    list.push({
      ...assignment,
      policy: policyMap.get(assignment.policyId) || null,
      initiators: initiatorsByAssignment.get(assignment._id.toString()) || []
    });
    assignmentsByUser.set(assignment.userId, list);
  });
  return users.map((user) => ({
    ...user,
    policyAssignments: assignmentsByUser.get(user._id.toString()) || []
  }));
}
async function hydrateCreditRequests(requests) {
  if (!requests || requests.length === 0) {
    return [];
  }
  const userIds = Array.from(
    new Set(
      requests.flatMap((request) => [request.userId, request.initiatorId, request.hodId]).filter(Boolean)
    )
  );
  const policyIds = Array.from(new Set(requests.map((request) => request.policyId).filter(Boolean)));
  const users = userIds.length > 0 ? await getUsersByIds(userIds) : [];
  const policies = policyIds.length > 0 ? await getPoliciesByIds(policyIds) : [];
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const policyMap = new Map(policies.map((policy) => [policy._id.toString(), policy]));
  return requests.map((request) => ({
    ...request,
    user: userMap.get(request.userId) || null,
    initiator: userMap.get(request.initiatorId) || null,
    hod: request.hodId ? userMap.get(request.hodId) || null : null,
    policy: request.policyId ? policyMap.get(request.policyId) || null : null
  }));
}
async function hydrateRedemptionRequests(requests) {
  if (!requests || requests.length === 0) {
    return [];
  }
  const userIds = Array.from(new Set(requests.map((request) => request.userId).filter(Boolean)));
  const users = userIds.length > 0 ? await getUsersByIds(userIds) : [];
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  return requests.map((request) => ({
    ...request,
    user: userMap.get(request.userId) || null
  }));
}
function createRestRouter() {
  const router = express.Router();
  router.use(
    asyncHandler(async (req, res, next) => {
      await attachUser(req);
      next();
    })
  );
  router.get(
    "/health",
    asyncHandler((req, res) => {
      parseInput(
        z.object({
          timestamp: z.coerce.number().min(0, "timestamp cannot be negative")
        }),
        req.query
      );
      res.json({ ok: true });
    })
  );
  router.get(
    "/auth/me",
    asyncHandler((req, res) => {
      res.json(req.user ?? null);
    })
  );
  router.get(
    "/auth/admin-setup-status",
    asyncHandler(async (req, res) => {
      const adminExists = await hasAdminUser();
      res.json({ adminExists });
    })
  );
  router.post(
    "/auth/admin-signup",
    asyncHandler(async (req, res) => {
      const input = parseInput(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6)
        }),
        req.body
      );
      const adminExists = await hasAdminUser();
      if (adminExists) {
        throw ForbiddenError("Admin account already exists.");
      }
      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        throw new HttpError(409, "Email already in use.");
      }
      const openId = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let user;
      try {
        user = await createUser({
          openId,
          name: input.name,
          email: input.email,
          password: input.password,
          role: "admin",
          loginMethod: "email",
          lastSignedIn: /* @__PURE__ */ new Date()
        });
      } catch (error) {
        if (error?.code === 11e3) {
          throw new HttpError(409, "Email already in use.");
        }
        throw error;
      }
      await updateUser(user._id.toString(), { hodId: user._id.toString() });
      const { SignJWT } = await import("jose");
      const jwtSecret2 = ENV.cookieSecret;
      if (!jwtSecret2) {
        throw new HttpError(500, "JWT_SECRET is missing. Set it in backend/.env.");
      }
      const secret = new TextEncoder().encode(jwtSecret2);
      const token = await new SignJWT({
        userId: user._id.toString(),
        openId: user.openId,
        role: user.role
      }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      res.json({
        success: true,
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
      });
    })
  );
  router.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const input = parseInput(
        z.object({
          email: z.string().email(),
          password: z.string()
        }),
        req.body
      );
      const bcrypt = await import("bcryptjs");
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw UnauthorizedError("Invalid email or password");
      }
      if (!user.password) {
        console.error("[Login] User found but password field is missing:", user.email);
        throw new HttpError(500, "Account configuration error. Please contact administrator.");
      }
      const isValidPassword = await bcrypt.compare(input.password, user.password);
      if (!isValidPassword) {
        throw UnauthorizedError("Invalid email or password");
      }
      await updateUser(user._id.toString(), { lastSignedIn: /* @__PURE__ */ new Date() });
      const { SignJWT } = await import("jose");
      const jwtSecret2 = ENV.cookieSecret;
      if (!jwtSecret2) {
        throw new HttpError(500, "JWT_SECRET is missing. Set it in backend/.env.");
      }
      const secret = new TextEncoder().encode(jwtSecret2);
      const token = await new SignJWT({
        userId: user._id.toString(),
        openId: user.openId,
        role: user.role
      }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      res.json({
        success: true,
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
      });
    })
  );
  router.post(
    "/auth/logout",
    asyncHandler((req, res) => {
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, cookieOptions);
      res.json({ success: true });
    })
  );
  router.get(
    "/users",
    asyncHandler(async (req, res) => {
      const user = requireRole(req, ["admin", "hod"], "HOD access required");
      if (user.role === "admin") {
        const users2 = await getAllUsers();
        res.json(await hydrateFreelancerInitiators(users2));
        return;
      }
      const users = await getUsersByHod(user.id);
      const self = await getUserById(user.id);
      const combined = self ? [self, ...users.filter((u) => u._id.toString() !== self._id.toString())] : users;
      res.json(await hydrateFreelancerInitiators(combined));
    })
  );
  router.get(
    "/users/role/:role",
    asyncHandler(async (req, res) => {
      requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(z.object({ role: z.enum(ROLE_OPTIONS) }), { role: req.params.role });
      const users = await getUsersByRole(input.role);
      res.json(await hydrateFreelancerInitiators(users));
    })
  );
  router.get(
    "/users/:id",
    asyncHandler(async (req, res) => {
      requireAuth(req);
      const input = parseInput(z.object({ id: z.string() }), { id: req.params.id });
      const user = await getUserById(input.id);
      const [hydrated] = await hydrateFreelancerInitiators(user ? [user] : []);
      res.json(hydrated || null);
    })
  );
  router.post(
    "/users",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
          phone: z.string().optional(),
          employeeType: z.enum(EMPLOYEE_TYPES),
          role: z.enum(ROLE_OPTIONS),
          hodId: z.string().optional(),
          freelancerInitiatorIds: z.array(z.string()).optional()
        }),
        req.body
      );
      const { freelancerInitiatorIds, ...userInput } = input;
      const normalizedEmployeeType = normalizeEmployeeType(input.employeeType);
      let hodId = input.hodId;
      if (ctxUser.role === "hod") {
        if (input.role !== "employee") {
          throw ForbiddenError("HOD can only create employee users.");
        }
        hodId = ctxUser.id;
      }
      if (input.role === "admin") {
        hodId = void 0;
      } else if (input.role === "hod") {
        if (!hodId) {
          throw BadRequestError("HOD must have an Admin assigned as HOD.");
        }
        const hodUser = await getUserById(hodId);
        if (!hodUser || hodUser.role !== "admin") {
          throw BadRequestError("HOD must be assigned to an Admin user.");
        }
      } else {
        if (!hodId) {
          throw BadRequestError("HOD is required for this role.");
        }
        const hodUser = await getUserById(hodId);
        if (!hodUser || hodUser.role !== "admin" && hodUser.role !== "hod") {
          throw BadRequestError("Assigned HOD must be an Admin or HOD.");
        }
      }
      if (normalizedEmployeeType.startsWith("freelancer")) {
        if (!input.freelancerInitiatorIds || input.freelancerInitiatorIds.length === 0) {
          throw BadRequestError("Freelancers must have at least one initiator assigned.");
        }
      }
      const openId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user = await createUser({
        ...userInput,
        employeeType: normalizedEmployeeType,
        openId,
        hodId
      });
      if (input.role === "admin") {
        await updateUser(user._id.toString(), { hodId: user._id.toString() });
      }
      if (normalizedEmployeeType.startsWith("freelancer")) {
        await setEmployeeInitiators(user._id.toString(), freelancerInitiatorIds || [], ctxUser.id);
      }
      await createAuditLog({
        userId: ctxUser.id,
        action: "user_created",
        entityType: "user",
        entityId: openId,
        details: JSON.stringify({ email: input.email, role: input.role })
      });
      res.json({ success: true, message: "User created successfully" });
    })
  );
  router.patch(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          employeeType: z.enum(EMPLOYEE_TYPES).optional(),
          role: z.enum(ROLE_OPTIONS).optional(),
          hodId: z.string().optional(),
          freelancerInitiatorIds: z.array(z.string()).optional(),
          status: z.enum(["active", "inactive"]).optional()
        }),
        { ...req.body, id: req.params.id }
      );
      const { id, freelancerInitiatorIds, ...updates } = input;
      const currentUser = await getUserById(id);
      const normalizedEmployeeType = updates.employeeType ? normalizeEmployeeType(updates.employeeType) : currentUser?.employeeType;
      const targetRole = updates.role ?? currentUser?.role;
      const targetEmployeeType = normalizedEmployeeType ?? currentUser?.employeeType;
      if (targetRole === "admin") {
        updates.hodId = id;
      }
      if (targetRole === "hod") {
        if (!updates.hodId) {
          throw BadRequestError("HOD must have an Admin assigned as HOD.");
        }
        const hodUser = await getUserById(updates.hodId);
        if (!hodUser || hodUser.role !== "admin") {
          throw BadRequestError("HOD must be assigned to an Admin user.");
        }
      }
      if (targetRole === "employee" || targetRole === "account") {
        if (!updates.hodId) {
          throw BadRequestError("HOD is required for this role.");
        }
        const hodUser = await getUserById(updates.hodId);
        if (!hodUser || hodUser.role !== "admin" && hodUser.role !== "hod") {
          throw BadRequestError("Assigned HOD must be an Admin or HOD.");
        }
      }
      if (targetEmployeeType && targetEmployeeType.startsWith("freelancer")) {
        if (freelancerInitiatorIds) {
          if (freelancerInitiatorIds.length === 0) {
            throw BadRequestError("Freelancers must have at least one initiator assigned.");
          }
        } else {
          const existingInitiators = await getEmployeeInitiatorsByEmployeeId(id);
          if (!existingInitiators || existingInitiators.length === 0) {
            throw BadRequestError("Freelancers must have at least one initiator assigned.");
          }
        }
      }
      if (updates.employeeType) {
        updates.employeeType = normalizedEmployeeType;
      }
      await updateUser(id, updates);
      if (normalizedEmployeeType && normalizedEmployeeType.startsWith("freelancer") && freelancerInitiatorIds) {
        await setEmployeeInitiators(id, freelancerInitiatorIds, ctxUser.id);
      }
      await createAuditLog({
        userId: ctxUser.id,
        action: "user_updated",
        entityType: "user",
        entityId: id,
        beforeValue: JSON.stringify(currentUser),
        afterValue: JSON.stringify(updates)
      });
      res.json({ success: true });
    })
  );
  router.delete(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin"], "Admin access required");
      const input = parseInput(z.object({ id: z.string() }), { id: req.params.id });
      await deleteUser(input.id);
      await createAuditLog({
        userId: ctxUser.id,
        action: "user_deleted",
        entityType: "user",
        entityId: input.id
      });
      res.json({ success: true });
    })
  );
  router.get(
    "/policies",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      if (ctxUser.role === "admin") {
        res.json(await getAllPolicies());
        return;
      }
      res.json(await getPoliciesByCreator(ctxUser.id));
    })
  );
  router.get(
    "/policies/:id",
    asyncHandler(async (req, res) => {
      requireAuth(req);
      const input = parseInput(z.object({ id: z.string() }), { id: req.params.id });
      res.json(await getPolicyById(input.id));
    })
  );
  router.post(
    "/policies",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          eligibilityCriteria: z.string().optional(),
          calculationLogic: z.string().optional(),
          status: z.enum(["active", "draft", "archived"]).default("active")
        }),
        req.body
      );
      await createPolicy({
        ...input,
        createdBy: ctxUser.id
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "policy_created",
        entityType: "policy",
        details: JSON.stringify({ name: input.name })
      });
      res.json({ success: true });
    })
  );
  router.patch(
    "/policies/:id",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          eligibilityCriteria: z.string().optional(),
          calculationLogic: z.string().optional(),
          status: z.enum(["active", "draft", "archived"]).optional()
        }),
        { ...req.body, id: req.params.id }
      );
      const { id, ...updates } = input;
      await updatePolicy(id, updates);
      await createAuditLog({
        userId: ctxUser.id,
        action: "policy_updated",
        entityType: "policy",
        entityId: id,
        details: JSON.stringify(updates)
      });
      res.json({ success: true });
    })
  );
  router.delete(
    "/policies/:id",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(z.object({ id: z.string() }), { id: req.params.id });
      await deletePolicy(input.id);
      await createAuditLog({
        userId: ctxUser.id,
        action: "policy_deleted",
        entityType: "policy",
        entityId: input.id
      });
      res.json({ success: true });
    })
  );
  router.post(
    "/team/assign-policy",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          userId: z.string(),
          policyId: z.string(),
          initiatorIds: z.array(z.string()).min(1),
          effectiveDate: z.string().optional()
        }),
        req.body
      );
      const user = await getUserById(input.userId);
      if (!user) {
        throw NotFoundError("User not found");
      }
      if (ctxUser.role === "hod" && user.hodId?.toString() !== ctxUser.id) {
        throw ForbiddenError("You can only assign policies to your team members.");
      }
      const policy = await getPolicyById(input.policyId);
      if (!policy) {
        throw NotFoundError("Policy not found");
      }
      const effectiveDate = input.effectiveDate ? new Date(input.effectiveDate) : /* @__PURE__ */ new Date();
      if (Number.isNaN(effectiveDate.getTime())) {
        throw BadRequestError("Invalid effective date.");
      }
      const existingAssignment = await getEmployeePolicyAssignmentByUserPolicy(
        input.userId,
        input.policyId
      );
      let assignmentId;
      if (existingAssignment) {
        await updateEmployeePolicyAssignment(existingAssignment._id.toString(), {
          effectiveDate,
          assignedBy: ctxUser.id
        });
        assignmentId = existingAssignment._id.toString();
      } else {
        const assignment = await createEmployeePolicyAssignment({
          userId: input.userId,
          policyId: input.policyId,
          effectiveDate,
          assignedBy: ctxUser.id
        });
        assignmentId = assignment._id.toString();
      }
      await setPolicyInitiators(assignmentId, input.initiatorIds, ctxUser.id);
      await createAuditLog({
        userId: ctxUser.id,
        action: "policy_assigned",
        entityType: "policy_assignment",
        details: JSON.stringify({ ...input, assignmentId })
      });
      res.json({ success: true });
    })
  );
  router.post(
    "/team/remove-policy",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(z.object({ assignmentId: z.string() }), req.body);
      const assignment = await getEmployeePolicyAssignmentById(input.assignmentId);
      if (!assignment) {
        throw NotFoundError("Assignment not found");
      }
      if (ctxUser.role === "hod") {
        const user = await getUserById(assignment.userId);
        if (user?.hodId?.toString() !== ctxUser.id) {
          throw ForbiddenError("You can only remove policies from your team members.");
        }
      }
      await setPolicyInitiators(input.assignmentId, [], ctxUser.id);
      await removeEmployeePolicyAssignmentById(input.assignmentId);
      await createAuditLog({
        userId: ctxUser.id,
        action: "policy_removed",
        entityType: "policy_assignment",
        entityId: input.assignmentId
      });
      res.json({ success: true });
    })
  );
  router.get(
    "/team/my",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      if (ctxUser.role === "admin") {
        const users2 = await getAllUsers();
        const withInitiators2 = await hydrateFreelancerInitiators(users2);
        res.json(await hydratePolicyAssignments(withInitiators2));
        return;
      }
      const users = await getUsersByHod(ctxUser.id);
      const withInitiators = await hydrateFreelancerInitiators(users);
      res.json(await hydratePolicyAssignments(withInitiators));
    })
  );
  router.get(
    "/team/user-policies",
    asyncHandler(async (req, res) => {
      requireAuth(req);
      const input = parseInput(z.object({ userId: z.string() }), req.query);
      const user = await getUserById(input.userId);
      if (!user) {
        throw NotFoundError("User not found");
      }
      const [hydrated] = await hydratePolicyAssignments([user]);
      res.json(hydrated?.policyAssignments || []);
    })
  );
  router.get(
    "/credit-requests/initiator-scope",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      if (ctxUser.role === "admin" || ctxUser.role === "hod") {
        const users2 = ctxUser.role === "admin" ? await getAllUsers() : await getUsersByHod(ctxUser.id);
        const assignments2 = await getEmployeePolicyAssignmentsByUserIds(
          users2.map((u) => u._id.toString())
        );
        const policies2 = await getPoliciesByIds(
          Array.from(new Set(assignments2.map((a) => a.policyId)))
        );
        const policyMap2 = new Map(policies2.map((policy) => [policy._id.toString(), policy]));
        const userMap2 = new Map(users2.map((user) => [user._id.toString(), user]));
        const policyAssignments2 = assignments2.map((assignment) => ({
          assignmentId: assignment._id.toString(),
          user: userMap2.get(assignment.userId) || null,
          policy: policyMap2.get(assignment.policyId) || null,
          effectiveDate: assignment.effectiveDate
        })).filter((a) => a.user && a.policy);
        const freelancers2 = users2.filter((u) => u.employeeType?.startsWith("freelancer"));
        res.json({ policyAssignments: policyAssignments2, freelancers: freelancers2 });
        return;
      }
      const policyLinks = await getPolicyInitiatorsByInitiatorId(ctxUser.id);
      const assignmentIds = Array.from(new Set(policyLinks.map((link) => link.assignmentId)));
      const assignments = assignmentIds.length > 0 ? await getEmployeePolicyAssignmentsByIds(assignmentIds) : [];
      const policyIds = Array.from(new Set(assignments.map((a) => a.policyId)));
      const userIds = Array.from(new Set(assignments.map((a) => a.userId)));
      const [policies, users] = await Promise.all([
        policyIds.length > 0 ? getPoliciesByIds(policyIds) : Promise.resolve([]),
        userIds.length > 0 ? getUsersByIds(userIds) : Promise.resolve([])
      ]);
      const policyMap = new Map(policies.map((policy) => [policy._id.toString(), policy]));
      const userMap = new Map(users.map((user) => [user._id.toString(), user]));
      const policyAssignments = assignments.map((assignment) => ({
        assignmentId: assignment._id.toString(),
        user: userMap.get(assignment.userId) || null,
        policy: policyMap.get(assignment.policyId) || null,
        effectiveDate: assignment.effectiveDate
      })).filter((a) => a.user && a.policy);
      const freelancerLinks = await getEmployeeInitiatorsByInitiatorId(ctxUser.id);
      const freelancerIds = Array.from(new Set(freelancerLinks.map((link) => link.employeeId)));
      const freelancers = freelancerIds.length > 0 ? await getUsersByIds(freelancerIds) : [];
      res.json({ policyAssignments, freelancers });
    })
  );
  router.get(
    "/credit-requests",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      if (ctxUser.role === "admin") {
        const requests2 = await getAllCreditRequests();
        res.json(await hydrateCreditRequests(requests2));
        return;
      }
      const requests = await getCreditRequestsByHod(ctxUser.id);
      res.json(await hydrateCreditRequests(requests));
    })
  );
  router.get(
    "/credit-requests/pending-approvals",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      if (ctxUser.role === "admin") {
        const requests = await getCreditRequestsByStatus("pending_approval");
        res.json(await hydrateCreditRequests(requests));
        return;
      }
      const allRequests = await getCreditRequestsByHod(ctxUser.id);
      const pending = allRequests.filter((r) => r.status === "pending_approval");
      res.json(await hydrateCreditRequests(pending));
    })
  );
  router.get(
    "/credit-requests/my",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const requests = await getCreditRequestsByUserId(ctxUser.id);
      res.json(await hydrateCreditRequests(requests));
    })
  );
  router.get(
    "/credit-requests/submissions",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const requests = await getCreditRequestsByInitiator(ctxUser.id);
      res.json(await hydrateCreditRequests(requests));
    })
  );
  router.get(
    "/credit-requests/:id",
    asyncHandler(async (req, res) => {
      requireAuth(req);
      const input = parseInput(z.object({ id: z.string() }), { id: req.params.id });
      const request = await getCreditRequestById(input.id);
      const [hydrated] = await hydrateCreditRequests(request ? [request] : []);
      res.json(hydrated || null);
    })
  );
  router.post(
    "/credit-requests",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const input = parseInput(
        z.object({
          userId: z.string(),
          type: z.enum(["freelancer", "policy"]),
          policyId: z.string().optional(),
          baseAmount: z.number(),
          bonus: z.number().default(0),
          deductions: z.number().default(0),
          amount: z.number(),
          calculationBreakdown: z.string().optional(),
          notes: z.string().optional(),
          documents: z.string().optional()
        }),
        req.body
      );
      const user = await getUserById(input.userId);
      if (!user) {
        throw NotFoundError("User not found");
      }
      if (!user.hodId) {
        throw BadRequestError("User has no HOD assigned.");
      }
      const isAdminOrHod = ctxUser.role === "admin" || ctxUser.role === "hod";
      if (input.type === "policy") {
        if (!input.policyId) {
          throw BadRequestError("Policy is required for policy-based requests.");
        }
        const assignment = await getEmployeePolicyAssignmentByUserPolicy(
          input.userId,
          input.policyId
        );
        if (!assignment) {
          throw BadRequestError("Policy is not assigned to this employee.");
        }
        if (new Date(assignment.effectiveDate) > /* @__PURE__ */ new Date()) {
          throw BadRequestError("Policy assignment is not yet effective.");
        }
        if (!isAdminOrHod) {
          const initiators = await getPolicyInitiatorsByAssignmentIds([
            assignment._id.toString()
          ]);
          const isAllowed = initiators.some((link) => link.initiatorId === ctxUser.id);
          if (!isAllowed) {
            throw ForbiddenError("You are not an initiator for this policy assignment.");
          }
        }
      }
      if (input.type === "freelancer") {
        if (!user.employeeType?.startsWith("freelancer")) {
          throw BadRequestError("Selected user is not a freelancer.");
        }
        if (!isAdminOrHod) {
          const initiators = await getEmployeeInitiatorsByEmployeeId(input.userId);
          const isAllowed = initiators.some((link) => link.initiatorId === ctxUser.id);
          if (!isAllowed) {
            throw ForbiddenError("You are not an initiator for this freelancer.");
          }
        }
      }
      const status = input.type === "policy" ? "pending_signature" : "pending_approval";
      await createCreditRequest({
        userId: input.userId,
        initiatorId: ctxUser.id,
        hodId: user.hodId,
        type: input.type,
        policyId: input.policyId,
        baseAmount: input.baseAmount,
        bonus: input.bonus,
        deductions: input.deductions,
        amount: input.amount,
        calculationBreakdown: input.calculationBreakdown,
        notes: input.notes,
        documents: input.documents,
        status
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "credit_request_created",
        entityType: "credit_request",
        details: JSON.stringify({ userId: input.userId, amount: input.amount })
      });
      await createNotification({
        userId: input.userId,
        title: "Credit request created",
        message: input.type === "policy" ? "A policy-based credit request is awaiting your signature." : "A freelancer credit request has been submitted and is pending HOD approval.",
        type: "info",
        actionUrl: "/transactions"
      });
      if (user.hodId) {
        await createNotification({
          userId: user.hodId,
          title: "Credit request pending approval",
          message: `${user.name || user.email} has a credit request awaiting your approval.`,
          type: "action",
          actionUrl: "/approvals"
        });
      }
      if (input.type === "policy") {
        try {
          await createSignatureDocument(
            user.email || "",
            user.name || "",
            input.amount,
            `Policy: ${input.policyId} | Notes: ${input.notes || "N/A"} | Breakdown: ${input.calculationBreakdown || "N/A"}`
          );
          res.json({
            success: true,
            message: "Credit request created. Signature request sent to employee."
          });
          return;
        } catch (error) {
          console.error("GHL document creation failed:", error);
          throw new HttpError(500, "Failed to create signature document");
        }
      }
      res.json({ success: true, message: "Credit request created and sent to HOD for approval." });
    })
  );
  router.post(
    "/credit-requests/sign",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const input = parseInput(
        z.object({
          requestId: z.string(),
          signature: z.string()
        }),
        req.body
      );
      const request = await getCreditRequestById(input.requestId);
      if (!request || request.userId !== ctxUser.id) {
        throw ForbiddenError("Forbidden");
      }
      if (request.type !== "policy") {
        throw BadRequestError("Signature is only required for policy-based requests.");
      }
      if (request.status !== "pending_signature") {
        throw BadRequestError("Request is not awaiting signature.");
      }
      await updateCreditRequest(input.requestId, {
        userSignature: input.signature,
        userSignedAt: /* @__PURE__ */ new Date(),
        status: "pending_approval"
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "credit_request_signed",
        entityType: "credit_request",
        entityId: input.requestId
      });
      if (request.hodId) {
        await createNotification({
          userId: request.hodId,
          title: "Credit request ready for approval",
          message: `${ctxUser.name || ctxUser.email} signed a credit request and it is ready for approval.`,
          type: "action",
          actionUrl: "/approvals"
        });
      }
      res.json({ success: true });
    })
  );
  router.post(
    "/credit-requests/reject",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const input = parseInput(
        z.object({
          requestId: z.string(),
          reason: z.string()
        }),
        req.body
      );
      const request = await getCreditRequestById(input.requestId);
      if (!request || request.userId !== ctxUser.id) {
        throw ForbiddenError("Forbidden");
      }
      if (request.type !== "policy") {
        throw BadRequestError("Only policy-based requests can be rejected by the employee.");
      }
      await updateCreditRequest(input.requestId, {
        userRejectionReason: input.reason,
        status: "rejected_by_user"
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "credit_request_rejected_by_user",
        entityType: "credit_request",
        entityId: input.requestId,
        details: input.reason
      });
      res.json({ success: true });
    })
  );
  router.post(
    "/credit-requests/approve",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(z.object({ requestId: z.string() }), req.body);
      const request = await getCreditRequestById(input.requestId);
      if (!request) {
        throw NotFoundError("Not found");
      }
      if (request.status !== "pending_approval") {
        throw BadRequestError("Only pending approvals can be approved.");
      }
      await updateCreditRequest(input.requestId, {
        status: "approved",
        hodApprovedBy: ctxUser.id,
        hodApprovedAt: /* @__PURE__ */ new Date()
      });
      const currentBalance = await getWalletBalance(request.userId.toString());
      const newBalance = currentBalance + request.amount;
      await createWalletTransaction({
        userId: request.userId,
        type: "credit",
        amount: request.amount,
        creditRequestId: request._id?.toString(),
        description: request.type === "freelancer" ? "Freelancer Amount" : "Policy Credit",
        balance: newBalance
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "credit_request_approved",
        entityType: "credit_request",
        entityId: input.requestId
      });
      await createNotification({
        userId: request.userId,
        title: "Credit request approved",
        message: `Your credit request for $${request.amount.toFixed(2)} was approved.`,
        type: "success",
        actionUrl: "/transactions"
      });
      res.json({ success: true });
    })
  );
  router.post(
    "/credit-requests/reject-by-hod",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          requestId: z.string(),
          reason: z.string()
        }),
        req.body
      );
      await updateCreditRequest(input.requestId, {
        hodRejectionReason: input.reason,
        status: "rejected_by_hod"
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "credit_request_rejected_by_hod",
        entityType: "credit_request",
        entityId: input.requestId,
        details: input.reason
      });
      const request = await getCreditRequestById(input.requestId);
      if (request) {
        await createNotification({
          userId: request.userId,
          title: "Credit request rejected",
          message: `Your credit request was rejected. Reason: ${input.reason}`,
          type: "warning",
          actionUrl: "/transactions"
        });
      }
      res.json({ success: true });
    })
  );
  router.get(
    "/wallet/balance",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const [balance, summary] = await Promise.all([
        getWalletBalance(ctxUser.id),
        getWalletSummary(ctxUser.id)
      ]);
      res.json({ balance, ...summary });
    })
  );
  router.get(
    "/wallet/transactions",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      res.json(await getWalletTransactions(ctxUser.id));
    })
  );
  router.post(
    "/redemption",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const input = parseInput(
        z.object({
          amount: z.number(),
          method: z.string(),
          bankDetails: z.string().optional(),
          notes: z.string().optional()
        }),
        req.body
      );
      if (!input.bankDetails || !input.bankDetails.trim()) {
        throw BadRequestError("Bank/payment details are required.");
      }
      const balance = await getWalletBalance(ctxUser.id.toString());
      if (balance < input.amount) {
        throw BadRequestError("Insufficient balance");
      }
      await createRedemptionRequest({
        userId: ctxUser.id,
        amount: input.amount,
        method: input.method,
        bankDetails: input.bankDetails,
        notes: input.notes
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "redemption_requested",
        entityType: "redemption_request",
        details: JSON.stringify({ amount: input.amount })
      });
      await createNotification({
        userId: ctxUser.id,
        title: "Redemption request submitted",
        message: `Your redemption request for $${input.amount.toFixed(2)} was submitted.`,
        type: "info",
        actionUrl: "/my-account"
      });
      const accountUsers = await getUsersByRole("account");
      await Promise.all(
        accountUsers.map(
          (user) => createNotification({
            userId: user._id.toString(),
            title: "New redemption request",
            message: `A redemption request for $${input.amount.toFixed(2)} is waiting to be processed.`,
            type: "action",
            actionUrl: "/accounts"
          })
        )
      );
      res.json({ success: true });
    })
  );
  router.get(
    "/redemption/my",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const requests = await getRedemptionRequestsByUserId(ctxUser.id);
      res.json(await hydrateRedemptionRequests(requests));
    })
  );
  router.get(
    "/redemption/queue",
    asyncHandler(async (req, res) => {
      requireRole(req, ["admin", "account"], "Accounts access required");
      const requests = await getAllRedemptionRequests();
      res.json(await hydrateRedemptionRequests(requests));
    })
  );
  router.post(
    "/redemption/process",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "account"], "Accounts access required");
      const input = parseInput(
        z.object({
          requestId: z.string(),
          transactionReference: z.string(),
          paymentNotes: z.string().optional()
        }),
        req.body
      );
      const request = await getRedemptionRequestById(input.requestId);
      if (!request) {
        throw NotFoundError("Not found");
      }
      await updateRedemptionRequest(input.requestId, {
        status: "completed",
        processedBy: ctxUser.id,
        processedAt: /* @__PURE__ */ new Date(),
        transactionReference: input.transactionReference,
        paymentNotes: input.paymentNotes
      });
      const currentBalance = await getWalletBalance(request.userId.toString());
      const newBalance = currentBalance - request.amount;
      await createWalletTransaction({
        userId: request.userId,
        type: "debit",
        amount: request.amount,
        redemptionRequestId: request._id?.toString(),
        description: `Redemption via ${request.method}`,
        balance: newBalance
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "redemption_processed",
        entityType: "redemption_request",
        entityId: input.requestId,
        details: JSON.stringify({ transactionReference: input.transactionReference })
      });
      await createNotification({
        userId: request.userId,
        title: "Redemption processed",
        message: `Your redemption request for $${request.amount.toFixed(2)} has been processed.`,
        type: "success",
        actionUrl: "/my-account"
      });
      res.json({ success: true });
    })
  );
  router.get(
    "/audit",
    asyncHandler(async (req, res) => {
      requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          userId: z.string().optional(),
          action: z.string().optional(),
          entityType: z.string().optional(),
          limit: z.coerce.number().default(100)
        }),
        req.query
      );
      res.json(await getAuditLogs(input));
    })
  );
  router.post(
    "/access/grant",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          userId: z.string(),
          feature: z.string(),
          reason: z.string(),
          expiresAt: z.coerce.date().optional()
        }),
        req.body
      );
      await grantAccess({
        ...input,
        grantedBy: ctxUser.id
      });
      await createAuditLog({
        userId: ctxUser.id,
        action: "access_granted",
        entityType: "access_control",
        details: JSON.stringify(input)
      });
      res.json({ success: true });
    })
  );
  router.post(
    "/access/revoke",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(z.object({ accessId: z.string() }), req.body);
      const access = await getAllAccessGrants();
      const targetAccess = access.find((a) => a._id?.toString() === input.accessId);
      if (targetAccess) {
        await revokeAccess(targetAccess.userId, targetAccess.feature);
      }
      await createAuditLog({
        userId: ctxUser.id,
        action: "access_revoked",
        entityType: "access_control",
        entityId: input.accessId
      });
      res.json({ success: true });
    })
  );
  router.get(
    "/access",
    asyncHandler(async (req, res) => {
      requireRole(req, ["admin", "hod"], "HOD access required");
      res.json(await getAllAccessGrants());
    })
  );
  router.get(
    "/access/my",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      res.json(await getActiveAccessGrants(ctxUser.id));
    })
  );
  router.get(
    "/notifications",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const input = parseInput(
        z.object({
          limit: z.coerce.number().min(1).max(200).optional()
        }),
        req.query
      );
      res.json(await getNotificationsByUserId(ctxUser.id, input.limit || 50));
    })
  );
  router.get(
    "/notifications/unread-count",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const count = await getUnreadNotificationCount(ctxUser.id);
      res.json({ count });
    })
  );
  router.post(
    "/notifications/mark-read",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const input = parseInput(z.object({ id: z.string() }), req.body);
      await markNotificationRead(input.id, ctxUser.id);
      res.json({ success: true });
    })
  );
  router.post(
    "/notifications/mark-all-read",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      await markAllNotificationsRead(ctxUser.id);
      res.json({ success: true });
    })
  );
  router.get(
    "/reports/overview",
    asyncHandler(async (req, res) => {
      const ctxUser = requireRole(req, ["admin", "hod"], "HOD access required");
      const input = parseInput(
        z.object({
          months: z.coerce.number().min(3).max(12).optional()
        }),
        req.query
      );
      const monthsBack = input.months ?? 6;
      const users = ctxUser.role === "admin" ? await getAllUsers() : await getUsersByHod(ctxUser.id);
      const userIds = users.map((user) => user._id.toString());
      const [creditRequests, walletTransactions, redemptions] = await Promise.all([
        ctxUser.role === "admin" ? getAllCreditRequests() : getCreditRequestsByHod(ctxUser.id),
        ctxUser.role === "admin" ? getAllWalletTransactions() : getWalletTransactionsByUserIds(userIds),
        ctxUser.role === "admin" ? getAllRedemptionRequests() : getRedemptionRequestsByUserIds(userIds)
      ]);
      const monthLabels = [];
      const now = /* @__PURE__ */ new Date();
      for (let i = monthsBack - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthLabels.push({
          key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
          label: date.toLocaleString("default", { month: "short", year: "numeric" })
        });
      }
      const buildMonthlySeries = (items, valueSelector) => {
        const totals = new Map(monthLabels.map((label) => [label.key, 0]));
        items.forEach((item) => {
          const date = new Date(item.createdAt);
          if (Number.isNaN(date.getTime())) {
            return;
          }
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          if (!totals.has(key)) {
            return;
          }
          totals.set(key, totals.get(key) + valueSelector(item));
        });
        return monthLabels.map((label) => ({
          month: label.label,
          value: totals.get(label.key) || 0
        }));
      };
      const creditsByMonth = buildMonthlySeries(
        walletTransactions.filter((t) => t.type === "credit"),
        (item) => item.amount
      );
      const redemptionsByMonth = buildMonthlySeries(
        walletTransactions.filter((t) => t.type === "debit"),
        (item) => item.amount
      );
      const policyCounts = creditRequests.filter((request) => request.type === "policy" && request.policyId).reduce((acc, request) => {
        acc[request.policyId] = (acc[request.policyId] || 0) + 1;
        return acc;
      }, {});
      const policyIds = Object.keys(policyCounts);
      const policies = policyIds.length > 0 ? await getPoliciesByIds(policyIds) : [];
      const policyMap = new Map(policies.map((policy) => [policy._id.toString(), policy.name]));
      const topPolicies = policyIds.map((policyId) => ({
        policyId,
        name: policyMap.get(policyId) || "Unknown Policy",
        requests: policyCounts[policyId]
      })).sort((a, b) => b.requests - a.requests).slice(0, 5);
      const employeeTypeCounts = users.reduce((acc, user) => {
        const type = user.employeeType || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      const totalCredits = walletTransactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
      const totalRedemptions = walletTransactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
      res.json({
        totals: {
          totalCredits,
          totalRedemptions,
          pendingApprovals: creditRequests.filter((r) => r.status === "pending_approval").length,
          pendingSignatures: creditRequests.filter((r) => r.status === "pending_signature").length,
          pendingRedemptions: redemptions.filter((r) => r.status === "pending").length
        },
        creditsByMonth,
        redemptionsByMonth,
        topPolicies,
        employeeTypes: Object.entries(employeeTypeCounts).map(([type, count]) => ({ type, count }))
      });
    })
  );
  router.get(
    "/dashboard/stats",
    asyncHandler(async (req, res) => {
      const ctxUser = requireAuth(req);
      const role = ctxUser.role;
      try {
        if (role === "admin") {
          const allUsers = await Promise.race([
            getAllUsers(),
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("getAllUsers timeout")), 5e3)
            )
          ]);
          const allRequests = await Promise.race([
            getCreditRequestsByStatus("pending_approval"),
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("getCreditRequestsByStatus timeout")), 5e3)
            )
          ]);
          const allRedemptions = await Promise.race([
            getRedemptionRequestsByStatus("pending"),
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("getRedemptionRequestsByStatus timeout")), 5e3)
            )
          ]);
          res.json({
            totalUsers: allUsers.length,
            totalHods: allUsers.filter((u) => u.role === "hod").length,
            pendingApprovals: allRequests.length,
            pendingRedemptions: allRedemptions.length
          });
          return;
        }
        if (role === "hod") {
          const myTeam = await getUsersByHod(ctxUser.id);
          const myPolicies2 = await getPoliciesByCreator(ctxUser.id);
          const pendingApprovals = await getCreditRequestsByHod(ctxUser.id);
          res.json({
            teamSize: myTeam.length,
            activePolicies: myPolicies2.filter((p) => p.status === "active").length,
            pendingApprovals: pendingApprovals.filter((r) => r.status === "pending_approval").length
          });
          return;
        }
        if (role === "account") {
          const allRedemptions = await getAllRedemptionRequests();
          res.json({
            pendingRedemptions: allRedemptions.filter((r) => r.status === "pending").length,
            processingToday: allRedemptions.filter((r) => r.status === "processing").length,
            completedThisMonth: allRedemptions.filter((r) => r.status === "completed").length
          });
          return;
        }
        const balance = await getWalletBalance(ctxUser.id.toString());
        const myRequests = await getCreditRequestsByUserId(ctxUser.id.toString());
        const myPolicies = await getEmployeePolicyAssignmentsByUserId(ctxUser.id.toString());
        const summary = await getWalletSummary(ctxUser.id.toString());
        res.json({
          walletBalance: balance,
          pendingReviews: myRequests.filter((r) => r.status === "pending_signature").length,
          activePolicies: myPolicies.length,
          thisMonthEarnings: summary.earned
        });
      } catch (error) {
        console.error("[Dashboard] Error fetching stats:", error);
        res.json({
          totalUsers: 0,
          totalHods: 0,
          pendingApprovals: 0,
          pendingRedemptions: 0
        });
      }
    })
  );
  router.post(
    "/ghl/document-webhook",
    asyncHandler(async (req, res) => {
      const input = parseInput(
        z.object({
          email: z.string().email().optional(),
          contact: z.object({ email: z.string().email() }).optional(),
          contactEmail: z.string().email().optional(),
          status: z.string().optional()
        }),
        req.body
      );
      const email = (input.email || input.contact?.email || input.contactEmail || "").trim().toLowerCase();
      if (!email) {
        throw BadRequestError("Email missing in webhook payload");
      }
      console.log(`[GHL Webhook] Document completed for: ${email}`);
      const user = await getUserByEmail(email);
      if (!user) {
        console.error(`[GHL Webhook] User not found: ${email}`);
        throw NotFoundError("User not found");
      }
      const requests = await getCreditRequestsByUserId(user._id.toString());
      const pendingRequest = requests.find((r) => r.status === "pending_signature");
      if (!pendingRequest) {
        console.error(`[GHL Webhook] No pending request found for: ${email}`);
        res.json({ ok: true, message: "No pending request found" });
        return;
      }
      await updateCreditRequest(pendingRequest._id.toString(), {
        status: "pending_approval",
        userSignedAt: /* @__PURE__ */ new Date()
      });
      console.log(`[GHL Webhook] Updated request ${pendingRequest._id} to pending_approval`);
      res.json({ ok: true, message: "Status updated successfully" });
    })
  );
  return router;
}

// _core/vite.js
import express2 from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer } from "vite";
async function setupVite(app, server) {
  const __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
  const cacheBase = process.env.LOCALAPPDATA || process.env.TEMP;
  const cacheDir = cacheBase ? path2.resolve(cacheBase, "freelance-management-vite-cache-backend") : path2.resolve(__dirname2, "../..", "frontend", "vite-cache-backend");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    configFile: path2.resolve(__dirname2, "../..", "frontend", "vite.config.js"),
    cacheDir,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(__dirname2, "../..", "frontend", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.jsx"`, `src="/src/main.jsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
  const distPath = path2.resolve(__dirname2, "../..", "frontend", "dist");
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}, make sure to build the frontend first`);
  }
  app.use(express2.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// _core/index.js
async function startServer() {
  await connectDB();
  const app = express3();
  const server = createServer(app);
  app.use(express3.json({ limit: "50mb" }));
  app.use(express3.urlencoded({ limit: "50mb", extended: true }));
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const { method, originalUrl } = req;
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info(`[HTTP] ${method} ${originalUrl} ${res.statusCode} ${durationMs.toFixed(1)} ms`);
    });
    next();
  });
  app.use("/api", createRestRouter());
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const backendUrl = process.env.BACKEND_URL?.trim();
  const hasExternalFrontend = Boolean(frontendUrl && backendUrl && frontendUrl !== backendUrl);
  const shouldUseViteMiddleware = process.env.NODE_ENV === "development" && process.env.DISABLE_BACKEND_VITE !== "true" && !hasExternalFrontend;
  if (shouldUseViteMiddleware) {
    await setupVite(app, server);
  } else if (process.env.NODE_ENV !== "development") {
    serveStatic(app);
  } else {
    logger.info("[Vite] Backend Vite middleware disabled. Using external frontend dev server.");
  }
  app.use((error, req, res, next) => {
    if (error?.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    logger.error("[API] Unexpected error:", error);
    res.status(500).json({ message: "Internal server error" });
  });
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  server.listen(port, () => {
    logger.info(`[Server] Listening on port ${port}`);
  });
  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      logger.error(`[Server] Port ${port} is already in use. Stop the other process or change PORT in backend/.env.`);
      process.exit(1);
    }
    logger.error("[Server] Failed to start:", error);
    process.exit(1);
  });
}
startServer().catch((error) => {
  logger.error("[Server] Startup failed:", error);
  process.exit(1);
});

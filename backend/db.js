import { connectDB, User, Policy, TeamAssignment, EmployeePolicy, PolicyInitiator, EmployeeInitiator, CreditRequest, Wallet, WalletTransaction, Notification, RedemptionRequest, AuditLog, AccessControl, } from './models.js';
// Ensure DB connection before any operation
async function ensureConnection() {
    await connectDB();
}
const LEGACY_ROLE_MAP = {
    user: 'employee',
    accounts_manager: 'account',
    initiator: 'employee',
};
const LEGACY_EMPLOYEE_TYPE_MAP = {
    permanent: 'permanent_india',
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
        employeeType: normalizeEmployeeTypeValue(user.employeeType),
    };
}
function normalizeUserList(users) {
    return users.map(normalizeUserRecord);
}
function expandRoleFilter(role) {
    const normalizedRole = normalizeRoleValue(role);
    if (normalizedRole === 'employee') {
        return ['employee', 'user', 'initiator'];
    }
    if (normalizedRole === 'account') {
        return ['account', 'accounts_manager'];
    }
    return [normalizedRole];
}
// ==================== USER OPERATIONS ====================
export async function upsertUser(userData) {
    await ensureConnection();
    const updateData = {
        openId: userData.openId,
        lastSignedIn: userData.lastSignedIn || new Date(),
    };
    if (userData.name !== undefined)
        updateData.name = userData.name;
    if (userData.email !== undefined)
        updateData.email = userData.email;
    if (userData.loginMethod !== undefined)
        updateData.loginMethod = userData.loginMethod;
    if (userData.employeeType !== undefined)
        updateData.employeeType = normalizeEmployeeTypeValue(userData.employeeType);
    // Set role, defaulting to admin for owner
    if (userData.role !== undefined) {
        updateData.role = normalizeRoleValue(userData.role);
    }
    await User.findOneAndUpdate({ openId: userData.openId }, { $set: updateData }, { upsert: true, new: true });
}
export async function getUserByOpenId(openId) {
    await ensureConnection();
    const user = await User.findOne({ openId }).lean();
    return normalizeUserRecord(user);
}
export async function getUserById(id) {
    await ensureConnection();
    const user = await User.findById(id).lean();
    return normalizeUserRecord(user);
}
export async function getUserByEmail(email) {
    await ensureConnection();
    // Explicitly select all fields including password
    const user = await User.findOne({ email }).select('+password').lean();
    return normalizeUserRecord(user);
}
export async function getUsersByIds(userIds) {
    await ensureConnection();
    const users = await User.find({ _id: { $in: userIds } }).lean();
    return normalizeUserList(users);
}
export async function getAllUsers() {
    await ensureConnection();
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return normalizeUserList(users);
}
export async function getUsersByRole(role) {
    await ensureConnection();
    const roles = expandRoleFilter(role);
    const users = await User.find({ role: { $in: roles } }).sort({ createdAt: -1 }).lean();
    return normalizeUserList(users);
}
export async function hasAdminUser() {
    await ensureConnection();
    const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
    return !!admin;
}
export async function getUsersByHod(hodId) {
    await ensureConnection();
    const users = await User.find({ hodId }).sort({ createdAt: -1 }).lean();
    return normalizeUserList(users);
}
export async function createUser(userData) {
    await ensureConnection();
    // Hash password if provided
    const dataToSave = {
        ...userData,
        role: normalizeRoleValue(userData.role),
        employeeType: normalizeEmployeeTypeValue(userData.employeeType),
    };
    if (userData.password) {
        const bcrypt = await import('bcryptjs');
        dataToSave.password = await bcrypt.hash(userData.password, 10);
    }
    const user = await User.create(dataToSave);
    return normalizeUserRecord(user.toObject());
}
export async function updateUser(id, updates) {
    await ensureConnection();
    const normalizedUpdates = { ...updates };
    if (updates.role !== undefined) {
        normalizedUpdates.role = normalizeRoleValue(updates.role);
    }
    if (updates.employeeType !== undefined) {
        normalizedUpdates.employeeType = normalizeEmployeeTypeValue(updates.employeeType);
    }
    if (updates.password) {
        const bcrypt = await import('bcryptjs');
        normalizedUpdates.password = await bcrypt.hash(updates.password, 10);
    }
    await User.findByIdAndUpdate(id, { $set: normalizedUpdates });
}
export async function deleteUser(id) {
    await ensureConnection();
    await User.findByIdAndDelete(id);
}
// ==================== POLICY OPERATIONS ====================
export async function getAllPolicies() {
    await ensureConnection();
    return await Policy.find().sort({ createdAt: -1 }).lean();
}
export async function getPoliciesByIds(policyIds) {
    await ensureConnection();
    return await Policy.find({ _id: { $in: policyIds } }).lean();
}
export async function getPoliciesByCreator(creatorId) {
    await ensureConnection();
    return await Policy.find({ createdBy: creatorId }).sort({ createdAt: -1 }).lean();
}
export async function getPolicyById(id) {
    await ensureConnection();
    return await Policy.findById(id).lean();
}
export async function getPoliciesByStatus(status) {
    await ensureConnection();
    return await Policy.find({ status }).sort({ createdAt: -1 }).lean();
}
export async function createPolicy(policyData) {
    await ensureConnection();
    const policy = await Policy.create(policyData);
    return policy.toObject();
}
export async function addPolicyAttachments(policyId, attachments) {
    await ensureConnection();
    const updated = await Policy.findByIdAndUpdate(policyId, {
        $push: { attachments: { $each: attachments } },
    }, { new: true }).lean();
    return updated;
}
export async function removePolicyAttachment(policyId, attachmentId) {
    await ensureConnection();
    const updated = await Policy.findByIdAndUpdate(policyId, {
        $pull: { attachments: { _id: attachmentId } },
    }, { new: true }).lean();
    return updated;
}
export async function updatePolicy(id, updates) {
    await ensureConnection();
    await Policy.findByIdAndUpdate(id, { $set: updates });
}
export async function deletePolicy(id) {
    await ensureConnection();
    await Policy.findByIdAndDelete(id);
}
// ==================== TEAM ASSIGNMENT OPERATIONS ====================
export async function createTeamAssignment(data) {
    await ensureConnection();
    const assignment = await TeamAssignment.create(data);
    return assignment.toObject();
}
export async function getTeamAssignmentByUserId(userId) {
    await ensureConnection();
    return await TeamAssignment.findOne({ userId }).lean();
}
export async function updateTeamAssignment(userId, updates) {
    await ensureConnection();
    await TeamAssignment.findOneAndUpdate({ userId }, { $set: updates });
}
export async function deleteTeamAssignment(userId) {
    await ensureConnection();
    await TeamAssignment.findOneAndDelete({ userId });
}
// ==================== POLICY ASSIGNMENT OPERATIONS ====================
export async function createEmployeePolicyAssignment(data) {
    await ensureConnection();
    const assignment = await EmployeePolicy.create(data);
    return assignment.toObject();
}
export async function getEmployeePolicyAssignmentById(id) {
    await ensureConnection();
    return await EmployeePolicy.findById(id).lean();
}
export async function getEmployeePolicyAssignmentsByUserId(userId) {
    await ensureConnection();
    return await EmployeePolicy.find({ userId }).lean();
}
export async function getEmployeePolicyAssignmentByUserPolicy(userId, policyId) {
    await ensureConnection();
    return await EmployeePolicy.findOne({ userId, policyId }).lean();
}
export async function getEmployeePolicyAssignmentsByUserIds(userIds) {
    await ensureConnection();
    return await EmployeePolicy.find({ userId: { $in: userIds } }).lean();
}
export async function getEmployeePolicyAssignmentsByIds(assignmentIds) {
    await ensureConnection();
    return await EmployeePolicy.find({ _id: { $in: assignmentIds } }).lean();
}
export async function getEmployeePolicyAssignmentsByPolicyId(policyId) {
    await ensureConnection();
    return await EmployeePolicy.find({ policyId }).lean();
}
export async function removeEmployeePolicyAssignmentById(id) {
    await ensureConnection();
    await EmployeePolicy.findByIdAndDelete(id);
}
export async function removeEmployeePolicyAssignment(userId, policyId) {
    await ensureConnection();
    await EmployeePolicy.findOneAndDelete({ userId, policyId });
}
export async function updateEmployeePolicyAssignment(id, updates) {
    await ensureConnection();
    await EmployeePolicy.findByIdAndUpdate(id, { $set: updates });
}
export async function setPolicyInitiators(assignmentId, initiatorIds, assignedBy) {
    await ensureConnection();
    await PolicyInitiator.deleteMany({ assignmentId });
    if (!initiatorIds?.length) {
        return [];
    }
    const records = initiatorIds.map(initiatorId => ({
        assignmentId,
        initiatorId,
        assignedBy,
        assignedAt: new Date(),
    }));
    const result = await PolicyInitiator.insertMany(records);
    return result.map(r => r.toObject());
}
export async function getPolicyInitiatorsByAssignmentIds(assignmentIds) {
    await ensureConnection();
    return await PolicyInitiator.find({ assignmentId: { $in: assignmentIds } }).lean();
}
export async function getPolicyInitiatorsByInitiatorId(initiatorId) {
    await ensureConnection();
    return await PolicyInitiator.find({ initiatorId }).lean();
}
// ==================== EMPLOYEE INITIATOR OPERATIONS ====================
export async function setEmployeeInitiators(employeeId, initiatorIds, assignedBy) {
    await ensureConnection();
    await EmployeeInitiator.deleteMany({ employeeId });
    if (!initiatorIds?.length) {
        return [];
    }
    const records = initiatorIds.map(initiatorId => ({
        employeeId,
        initiatorId,
        assignedBy,
        assignedAt: new Date(),
    }));
    const result = await EmployeeInitiator.insertMany(records);
    return result.map(r => r.toObject());
}
export async function getEmployeeInitiatorsByEmployeeIds(employeeIds) {
    await ensureConnection();
    return await EmployeeInitiator.find({ employeeId: { $in: employeeIds } }).lean();
}
export async function getEmployeeInitiatorsByEmployeeId(employeeId) {
    await ensureConnection();
    return await EmployeeInitiator.find({ employeeId }).lean();
}
export async function getEmployeeInitiatorsByInitiatorId(initiatorId) {
    await ensureConnection();
    return await EmployeeInitiator.find({ initiatorId }).lean();
}
// ==================== CREDIT REQUEST OPERATIONS ====================
export async function createCreditRequest(data) {
    await ensureConnection();
    const request = await CreditRequest.create(data);
    return request.toObject();
}
export async function getCreditRequestById(id) {
    await ensureConnection();
    return await CreditRequest.findById(id).lean();
}
export async function getCreditRequestsByUserId(userId) {
    await ensureConnection();
    return await CreditRequest.find({ userId }).sort({ createdAt: -1 }).lean();
}
export async function getCreditRequestsByHod(hodId) {
    await ensureConnection();
    return await CreditRequest.find({ hodId }).sort({ createdAt: -1 }).lean();
}
export async function getCreditRequestsByInitiator(initiatorId) {
    await ensureConnection();
    return await CreditRequest.find({ initiatorId }).sort({ createdAt: -1 }).lean();
}
export async function getAllCreditRequests() {
    await ensureConnection();
    return await CreditRequest.find().sort({ createdAt: -1 }).lean();
}
export async function getCreditRequestsByStatus(status) {
    await ensureConnection();
    return await CreditRequest.find({ status }).sort({ createdAt: -1 }).lean();
}
export async function updateCreditRequest(id, updates) {
    await ensureConnection();
    await CreditRequest.findByIdAndUpdate(id, { $set: updates });
}
// ==================== WALLET OPERATIONS ====================
async function ensureWallet(userId) {
    await ensureConnection();
    let wallet = await Wallet.findOne({ userId }).lean();
    if (!wallet) {
        const created = await Wallet.create({ userId, balance: 0, updatedAt: new Date() });
        wallet = created.toObject();
    }
    return wallet;
}
export async function createWalletTransaction(data) {
    await ensureConnection();
    const transaction = await WalletTransaction.create(data);
    await Wallet.findOneAndUpdate({ userId: data.userId }, {
        $set: { balance: data.balance, updatedAt: new Date() },
    }, { upsert: true });
    return transaction.toObject();
}
export async function getWalletBalance(userId) {
    await ensureConnection();
    const wallet = await ensureWallet(userId);
    return wallet?.balance || 0;
}
export async function getWalletTransactions(userId) {
    await ensureConnection();
    return await WalletTransaction.find({ userId }).sort({ createdAt: -1 }).lean();
}
export async function getWalletTransactionById(id) {
    await ensureConnection();
    return await WalletTransaction.findById(id).lean();
}
export async function updateWalletTransaction(id, updates) {
    await ensureConnection();
    await WalletTransaction.findByIdAndUpdate(id, { $set: updates });
}
export async function getRedeemableCreditTransactions(userId) {
    await ensureConnection();
    return await WalletTransaction.find({
        userId,
        type: "credit",
        redeemed: false,
    }).sort({ createdAt: -1 }).lean();
}
export async function getWalletTransactionsByUserIds(userIds) {
    await ensureConnection();
    return await WalletTransaction.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean();
}
export async function getAllWalletTransactions() {
    await ensureConnection();
    return await WalletTransaction.find().sort({ createdAt: -1 }).lean();
}
// ==================== NOTIFICATION OPERATIONS ====================
export async function createNotification(data) {
    await ensureConnection();
    const notification = await Notification.create(data);
    return notification.toObject();
}
export async function getNotificationsByUserId(userId, limit = 50) {
    await ensureConnection();
    return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}
export async function getUnreadNotificationCount(userId) {
    await ensureConnection();
    return await Notification.countDocuments({ userId, readAt: { $exists: false } });
}
export async function markNotificationRead(notificationId, userId) {
    await ensureConnection();
    await Notification.findOneAndUpdate({ _id: notificationId, userId }, { $set: { readAt: new Date() } });
}
export async function markAllNotificationsRead(userId) {
    await ensureConnection();
    await Notification.updateMany({ userId, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
}
export async function getWalletSummary(userId) {
    await ensureConnection();
    const transactions = await WalletTransaction.find({ userId }).lean();
    const pendingRequests = await CreditRequest.find({
        userId,
        status: { $in: ['pending_signature', 'pending_approval'] }
    }).lean();
    const earned = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
    const redeemed = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
    const pending = pendingRequests.reduce((sum, r) => sum + r.amount, 0);
    const available = earned - redeemed;
    return { earned, pending, redeemed, available };
}
// ==================== REDEMPTION OPERATIONS ====================
export async function createRedemptionRequest(data) {
    await ensureConnection();
    const request = await RedemptionRequest.create(data);
    return request.toObject();
}
export async function getRedemptionRequestById(id) {
    await ensureConnection();
    return await RedemptionRequest.findById(id).lean();
}
export async function getRedemptionRequestsByUserId(userId) {
    await ensureConnection();
    return await RedemptionRequest.find({ userId }).sort({ createdAt: -1 }).lean();
}
export async function getRedemptionRequestsByUserIds(userIds) {
    await ensureConnection();
    return await RedemptionRequest.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean();
}
export async function getAllRedemptionRequests() {
    await ensureConnection();
    return await RedemptionRequest.find().sort({ createdAt: -1 }).lean();
}
export async function getRedemptionRequestsByStatus(status) {
    await ensureConnection();
    return await RedemptionRequest.find({ status }).sort({ createdAt: -1 }).lean();
}
export async function updateRedemptionRequest(id, updates) {
    await ensureConnection();
    await RedemptionRequest.findByIdAndUpdate(id, { $set: updates });
}
// ==================== AUDIT LOG OPERATIONS ====================
export async function createAuditLog(data) {
    await ensureConnection();
    const log = await AuditLog.create(data);
    return log.toObject();
}
export async function getAuditLogs(filters) {
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
    return await AuditLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();
}
// ==================== ACCESS CONTROL OPERATIONS ====================
export async function grantAccess(data) {
    await ensureConnection();
    const access = await AccessControl.findOneAndUpdate({ userId: data.userId, feature: data.feature }, { $set: data }, { upsert: true, new: true });
    return access.toObject();
}
export async function checkAccess(userId, feature) {
    await ensureConnection();
    const access = await AccessControl.findOne({
        userId,
        feature,
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    }).lean();
    return !!access;
}
export async function revokeAccess(userId, feature) {
    await ensureConnection();
    await AccessControl.findOneAndDelete({ userId, feature });
}
export async function getUserAccess(userId) {
    await ensureConnection();
    return await AccessControl.find({
        userId,
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    }).lean();
}
export async function getAllAccessGrants() {
    await ensureConnection();
    return await AccessControl.find().sort({ createdAt: -1 }).lean();
}
export async function getActiveAccessGrants(userId) {
    await ensureConnection();
    return await getUserAccess(userId);
}
// ==================== DASHBOARD & REPORTS ====================
export async function getDashboardStats(userId, role) {
    await ensureConnection();
    if (role === 'admin') {
        const totalUsers = await User.countDocuments();
        const totalPolicies = await Policy.countDocuments();
        const pendingApprovals = await CreditRequest.countDocuments({ status: 'pending_approval' });
        const totalCreditsIssued = await WalletTransaction.aggregate([
            { $match: { type: 'credit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return {
            totalUsers,
            totalPolicies,
            pendingApprovals,
            totalCreditsIssued: totalCreditsIssued[0]?.total || 0,
        };
    }
    if (role === 'hod') {
        const teamMembers = await getUsersByHod(userId);
        const pendingApprovals = await CreditRequest.countDocuments({
            hodId: userId,
            status: 'pending_approval'
        });
        const totalCreditsIssued = await WalletTransaction.aggregate([
            { $match: { type: 'credit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return {
            teamSize: teamMembers.length,
            pendingApprovals,
            totalCreditsIssued: totalCreditsIssued[0]?.total || 0,
        };
    }
    if (role === 'account') {
        const pendingPayments = await RedemptionRequest.countDocuments({ status: 'pending' });
        const processingPayments = await RedemptionRequest.countDocuments({ status: 'processing' });
        const completedThisMonth = await RedemptionRequest.countDocuments({
            status: 'completed',
            processedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });
        return {
            pendingPayments,
            processingPayments,
            completedThisMonth,
        };
    }
    // Regular user
    const walletSummary = await getWalletSummary(userId);
    const pendingRequests = await CreditRequest.countDocuments({
        userId,
        status: { $in: ['pending_signature', 'pending_approval'] }
    });
    return {
        ...walletSummary,
        pendingRequests,
    };
}

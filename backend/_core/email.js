import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { getGridFSFileBuffer } from "./files.js";

const getSmtpConfig = () => {
    const secureValue = (process.env.SMTP_SECURE || "").toString().toLowerCase();
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || "";
    const fromName = process.env.SMTP_FROM_NAME || "";
    const from = fromName && fromEmail ? `${fromName} <${fromEmail}>` : fromEmail;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const secure = secureValue
        ? secureValue === "true"
        : port === 465;
    return {
        host: process.env.SMTP_HOST || "",
        port,
        secure,
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
        from,
    };
};

const getTransport = () => {
    const config = getSmtpConfig();
    if (!config.host || !config.user || !config.pass) {
        return null;
    }
    return {
        transporter: nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            requireTLS: !config.secure,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        }),
        from: config.from,
    };
};

const resolveAttachmentPath = (filename) =>
    path.resolve(process.cwd(), "uploads", "credit-requests", filename);

export async function sendHodFreelancerRequestEmail({
    to,
    hodName,
    employee,
    initiator,
    amount,
    details,
    attachments,
    requestType,
}) {
    if (!to) {
        return { skipped: true, reason: "missing_recipient" };
    }
    const transport = getTransport();
    if (!transport) {
        console.warn("[Email] SMTP is not configured. Skipping HOD notification email.");
        return { skipped: true, reason: "smtp_not_configured" };
    }
    const { transporter, from } = transport;
    const typeLabel = requestType === "policy" ? "Policy incentive" : "Freelancer incentive";
    const subject = `${typeLabel} request for ${employee?.name || employee?.email || "employee"}`;
    const approvalBase = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
    const approvalUrl = approvalBase ? `${approvalBase}/approvals` : "";
    const textLines = [
        `Hello ${hodName || ""},`,
        "",
        `A ${typeLabel.toLowerCase()} request has been submitted.`,
        `Employee: ${employee?.name || ""} (${employee?.email || ""})`,
        `Initiator: ${initiator?.name || ""} (${initiator?.email || ""})`,
        `Amount: $${Number(amount || 0).toFixed(2)}`,
        details ? `Details: ${details}` : "",
        "",
        approvalUrl
            ? `Review the request: ${approvalUrl}`
            : "Please review the request in the approvals panel.",
    ].filter(Boolean);
    const attachmentPayload = [];
    for (const attachment of attachments || []) {
        if (!attachment) {
            continue;
        }
        if (attachment.fileId) {
            try {
                const content = await getGridFSFileBuffer(attachment.fileId);
                if (content) {
                    attachmentPayload.push({
                        filename: attachment.originalName || attachment.filename || "attachment",
                        content,
                        contentType: attachment.mimeType,
                    });
                }
                continue;
            }
            catch (error) {
                console.warn("[Email] Failed to load GridFS attachment:", error?.message || error);
            }
        }
        if (!attachment.filename) {
            continue;
        }
        const filepath = resolveAttachmentPath(attachment.filename);
        if (!fs.existsSync(filepath)) {
            continue;
        }
        attachmentPayload.push({
            filename: attachment.originalName || attachment.filename,
            path: filepath,
            contentType: attachment.mimeType,
        });
    }

    await transporter.sendMail({
        from,
        to,
        subject,
        text: textLines.join("\n"),
        attachments: attachmentPayload,
    });
    return { success: true };
}

export async function sendInitiatorFreelancerRejectionEmail({
    to,
    initiatorName,
    employee,
    hod,
    amount,
    reason,
    rejectedBy,
    requestType,
}) {
    if (!to) {
        return { skipped: true, reason: "missing_recipient" };
    }
    const transport = getTransport();
    if (!transport) {
        console.warn("[Email] SMTP is not configured. Skipping initiator rejection email.");
        return { skipped: true, reason: "smtp_not_configured" };
    }
    const { transporter, from } = transport;
    const typeLabel = requestType === "policy" ? "Policy incentive" : "Freelancer incentive";
    const subject = `${typeLabel} request rejected for ${employee?.name || employee?.email || "employee"}`;
    const textLines = [
        `Hello ${initiatorName || ""},`,
        "",
        `A ${typeLabel.toLowerCase()} request has been rejected.`,
        `Employee: ${employee?.name || ""} (${employee?.email || ""})`,
        hod ? `HOD: ${hod?.name || ""} (${hod?.email || ""})` : "",
        rejectedBy ? `Rejected by: ${rejectedBy}` : "",
        `Amount: $${Number(amount || 0).toFixed(2)}`,
        reason ? `Reason: ${reason}` : "",
    ].filter(Boolean);
    await transporter.sendMail({
        from,
        to,
        subject,
        text: textLines.join("\n"),
    });
    return { success: true };
}

export async function sendRedemptionRequestEmail({
    to,
    accountName,
    employee,
    amount,
    balanceBefore,
    balanceAfter,
    redemptionId,
    timelineLog,
    pdfAttachment,
}) {
    if (!to) {
        return { skipped: true, reason: "missing_recipient" };
    }
    const transport = getTransport();
    if (!transport) {
        console.warn("[Email] SMTP is not configured. Skipping redemption email.");
        return { skipped: true, reason: "smtp_not_configured" };
    }
    const { transporter, from } = transport;
    const subject = `Redemption request from ${employee?.name || employee?.email || "employee"}`;
    const logLines = (timelineLog || []).map((entry, index) => {
        const parts = [
            `${index + 1}. ${entry.step || "STEP"}`,
            entry.actorName || entry.actorEmail
                ? `Actor: ${entry.actorName || ""}${entry.actorEmail ? ` (${entry.actorEmail})` : ""}`
                : "",
            entry.role ? `Role: ${entry.role}` : "",
            entry.signatureId ? `Signature: ${entry.signatureId}` : "",
            entry.message ? `Message: ${entry.message}` : "",
            entry.at ? `At: ${new Date(entry.at).toLocaleString()}` : "",
        ].filter(Boolean);
        return parts.join(" | ");
    });
    const textLines = [
        `Hello ${accountName || ""},`,
        "",
        "A redemption request has been submitted.",
        `Employee: ${employee?.name || ""} (${employee?.email || ""})`,
        redemptionId ? `Request ID: ${redemptionId}` : "",
        `Amount: $${Number(amount || 0).toFixed(2)}`,
        balanceBefore !== undefined ? `Balance before: $${Number(balanceBefore).toFixed(2)}` : "",
        balanceAfter !== undefined ? `Balance after: $${Number(balanceAfter).toFixed(2)}` : "",
        "",
        "Timeline Log:",
        ...logLines,
    ].filter(Boolean);
    const attachments = [];
    if (pdfAttachment?.content) {
        attachments.push({
            filename: pdfAttachment.filename || "redemption-proof.pdf",
            content: pdfAttachment.content,
            contentType: pdfAttachment.contentType || "application/pdf",
        });
    }
    await transporter.sendMail({
        from,
        to,
        subject,
        text: textLines.join("\n"),
        attachments,
    });
    return { success: true };
}

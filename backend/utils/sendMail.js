const nodemailer = require('nodemailer');

function getMailCredentials() {
    const user = (process.env.EMAIL_USER || '').trim();
    const rawPass = process.env.EMAIL_PASS || '';
    const pass = String(rawPass).replace(/\s/g, '');
    return { user, pass };
}

/** Default on: sends a second email to EMAIL_USER with the code (so your Gmail always gets a copy). Set RESQ_EMAIL_OTP_COPY_TO_SENDER=0 to disable. */
function sendOtpCopyToSenderEnabled() {
    const raw = process.env.RESQ_EMAIL_OTP_COPY_TO_SENDER;
    if (raw === undefined || raw === '') {
        return true;
    }
    return !['0', 'false', 'no', 'off'].includes(String(raw).trim().replace(/\r$/, '').toLowerCase());
}

function transportOptions(port, secure, auth, extra = {}) {
    return {
        host: 'smtp.gmail.com',
        port,
        secure,
        auth,
        connectionTimeout: 25_000,
        greetingTimeout: 25_000,
        socketTimeout: 25_000,
        family: 4,
        ...extra,
    };
}

function buildGmailAttempts(auth) {
    return [
        {
            name: 'smtp:587+STARTTLS',
            options: transportOptions(587, false, auth, { requireTLS: true }),
        },
        {
            name: 'smtp:465+SSL',
            options: transportOptions(465, true, auth),
        },
    ];
}

async function sendSenderCopy(transport, user, toAddr, otp) {
    if (!sendOtpCopyToSenderEnabled()) {
        return;
    }
    if (normalizeAddr(user) === normalizeAddr(toAddr)) {
        return;
    }
    try {
        await transport.sendMail({
            from: user,
            to: user,
            subject: 'ResQ Portal - OTP copy (same code as sent to user)',
            text:
                `Someone requested a password reset.\n\nRecipient: ${toAddr}\nCode: ${otp}\n\n(If this was not you, ignore. The user email also received this code.)`,
            html: `<p><strong>Recipient:</strong> ${escapeHtml(toAddr)}</p><p><strong>Code:</strong> ${escapeHtml(otp)}</p>`,
        });
        console.log(`[mail] Sender copy delivered to ${user}`);
    } catch (err) {
        console.warn('[mail] Sender copy failed (non-fatal):', err.message || err);
    }
}

function normalizeAddr(s) {
    return String(s || '').trim().toLowerCase();
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * @param {string} to
 * @param {string} otp
 * @returns {Promise<void>}
 */
async function sendPasswordResetOtp(to, otp) {
    const { user, pass } = getMailCredentials();
    if (!user || !pass) {
        throw new Error('Email is not configured (EMAIL_USER / EMAIL_PASS).');
    }
    const auth = { user, pass };
    const toAddr = String(to || '').trim();
    if (!toAddr) {
        throw new Error('No recipient address for OTP email.');
    }

    const subject = 'ResQ Portal - password reset code';
    const text = `Your password reset code is: ${otp}\n\nIt expires in 15 minutes. If you did not request this, ignore this email.`;
    const html = `<p>Your password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</p><p>This code expires in 15 minutes.</p><p>If you did not request a reset, you can ignore this message.</p>`;

    const mailOptions = {
        envelope: { from: user, to: toAddr },
        from: user,
        to: toAddr,
        subject,
        text,
        html,
    };

    let lastErr;
    for (const { name, options } of buildGmailAttempts(auth)) {
        const transport = nodemailer.createTransport(options);
        try {
            const info = await transport.sendMail(mailOptions);
            const accepted = info.accepted || [];
            const rejected = info.rejected || [];
            console.log(
                `[mail] ${name} messageId=${info.messageId} accepted=${JSON.stringify(accepted)} rejected=${JSON.stringify(rejected)}`
            );
            if (rejected.length > 0) {
                throw new Error(`SMTP rejected: ${rejected.join(', ')}`);
            }
            await sendSenderCopy(transport, user, toAddr, otp);
            transport.close();
            return;
        } catch (err) {
            lastErr = err;
            console.warn(`[mail] ${name} failed:`, err.message || err);
            try {
                transport.close();
            } catch (_) {
                /* ignore */
            }
        }
    }

    const detail = lastErr?.response || lastErr?.message || String(lastErr);
    console.error('Gmail SMTP error (all attempts):', detail);
    const wrapped = new Error(
        typeof detail === 'string'
            ? detail
            : 'Gmail rejected the message. Check EMAIL_USER / app password and 2FA app password.'
    );
    wrapped.cause = lastErr;
    throw wrapped;
}

module.exports = { sendPasswordResetOtp, getMailCredentials };

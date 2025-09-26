export async function sendEmail(target, payload, ctx) {
    if (!target?.to) {
        return { provider: 'email', status: 'skipped', errorCode: 'MISSING_TO', errorMessage: 'Missing email "to"' };
    }
    const sgKey = process.env.SENDGRID_API_KEY || '';
    const sgFrom = process.env.SENDGRID_FROM || '';
    if (!sgKey || !sgFrom) {
        return {
            provider: 'email',
            status: 'skipped',
            errorCode: 'NO_PROVIDER',
            errorMessage: 'No email provider configured (SENDGRID_API_KEY or SENDGRID_FROM missing)',
            meta: { hasKey: !!sgKey, hasFrom: !!sgFrom },
        };
    }
    try {
        // Ghép nội dung
        const plainText = [payload.body?.trim(), payload.actionUrl?.trim()].filter(Boolean).join('\n\n');
        const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">${escapeHtml(payload.title || '')}</h2>
        <p style="margin:0 0 12px;white-space:pre-line">${escapeHtml(payload.body || '')}</p>
        ${payload.actionUrl ? `<p style="margin:16px 0"><a href="${escapeAttr(payload.actionUrl)}" target="_blank" rel="noopener">Mở liên kết</a></p>` : ''}
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <small style="color:#777">JOB: ${ctx.jobId || ''}</small>
      </div>
    `;
        const body = {
            personalizations: [{
                    to: [{ email: target.to }],
                    ...(target.cc?.length ? { cc: target.cc.map(e => ({ email: e })) } : {}),
                    ...(target.bcc?.length ? { bcc: target.bcc.map(e => ({ email: e })) } : {}),
                }],
            from: { email: sgFrom },
            subject: payload.title || '(no subject)',
            content: [
                { type: 'text/plain', value: plainText || '' },
                { type: 'text/html', value: html },
            ],
            // Bạn có thể thêm custom_args để đối soát jobId trong webhook
            // custom_args: { jobId: String(ctx.jobId ?? '') },
        };
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sgKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const providerMessageId = res.headers.get('x-message-id') || undefined;
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return {
                provider: 'email',
                status: 'failed',
                errorCode: String(res.status),
                errorMessage: `SendGrid error: ${text || res.statusText}`,
                meta: { providerMessageId },
            };
        }
        return { provider: 'email', status: 'sent', providerMessageId };
    }
    catch (e) {
        return {
            provider: 'email',
            status: 'failed',
            errorCode: e?.code,
            errorMessage: e?.message || String(e),
        };
    }
}
/** Rất gọn để tránh XSS trong HTML */
function escapeHtml(s) {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}
function escapeAttr(s) {
    return escapeHtml(s).replaceAll('"', '&quot;');
}

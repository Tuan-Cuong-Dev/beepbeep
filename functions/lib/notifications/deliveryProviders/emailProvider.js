export async function sendEmail(target, payload, ctx) {
    if (!target.to)
        return { provider: 'email', status: 'skipped', errorMessage: 'Missing email' };
    const sgKey = process.env.SENDGRID_API_KEY;
    const sgFrom = process.env.SENDGRID_FROM;
    if (sgKey && sgFrom) {
        try {
            const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${sgKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: target.to }] }],
                    from: { email: sgFrom },
                    subject: payload.title,
                    content: [
                        { type: 'text/plain', value: `${payload.body}\n${payload.actionUrl ?? ''}` },
                        // Có thể thêm HTML
                    ],
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                return {
                    provider: 'email',
                    status: 'failed',
                    errorMessage: `SendGrid ${res.status} ${text}`,
                };
            }
            return { provider: 'email', status: 'sent' };
        }
        catch (e) {
            return { provider: 'email', status: 'failed', errorMessage: e?.message || String(e) };
        }
    }
    // (Tuỳ chọn) SES – yêu cầu ký AWS v4; để gọn, bạn có thể dùng SDK AWS ở môi trường Functions
    // Ở đây mình trả về skipped nếu không cài SendGrid
    return { provider: 'email', status: 'skipped', errorMessage: 'No email provider configured' };
}

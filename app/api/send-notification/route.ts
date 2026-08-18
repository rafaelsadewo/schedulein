import { NextResponse } from 'next/server';

// Optional feature: only works once RESEND_API_KEY is set (https://resend.com).
// Without it, this route responds with a clear error instead of crashing -
// browser notifications keep working regardless.
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Email notifications are not configured (missing RESEND_API_KEY)' },
      { status: 501 }
    );
  }

  const { email, subject, message } = await request.json();
  if (!email || !subject || !message) {
    return NextResponse.json({ error: 'Missing email, subject, or message' }, { status: 400 });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Schedulein <onboarding@resend.dev>',
      to: email,
      subject,
      text: message,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Resend error:', detail);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

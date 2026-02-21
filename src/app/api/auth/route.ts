import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const correctPassword = process.env.APP_PASSWORD || 'wedding2026';

    if (password === correctPassword) {
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ ok: false, message: 'Password salah' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 });
  }
}

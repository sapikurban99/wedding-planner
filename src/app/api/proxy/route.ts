import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.GOOGLE_SCRIPT_URL;

  // 1. Cek apakah URL terbaca di Terminal
  console.log("Cek URL Google:", url);

  if (!url) {
    console.log("❌ URL KOSONG! Cek .env.local");
    return NextResponse.json({ error: 'Config Missing' }, { status: 500 });
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    
    // 2. Cek status response dari Google
    console.log("Status Google:", res.status);
    
    if (!res.ok) {
        const text = await res.text();
        console.log("Error dari Google:", text);
        return NextResponse.json({ error: 'Google Script Error', details: text }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.log("❌ Fetch Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ... biarkan POST seperti biasa atau tambahkan log serupa ...
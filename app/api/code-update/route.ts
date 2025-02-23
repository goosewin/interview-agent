import { NextResponse } from 'next/server';

let currentCode = '';
let currentLanguage = 'javascript';

export async function POST(req: Request) {
  const body = await req.json();
  currentCode = body.code;
  currentLanguage = body.language;
  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({
    language: currentLanguage,
    code: currentCode,
  });
}

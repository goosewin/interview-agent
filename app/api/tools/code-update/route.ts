import { NextResponse } from 'next/server';

// Global state to store the latest code data
let currentCode = '';
let currentLanguage = 'javascript';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    currentCode = body.code;
    currentLanguage = body.language;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating code:', error);
    return NextResponse.json({ error: 'Failed to update code' }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      language: currentLanguage,
      code: currentCode,
      timeInCallSecs: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error('Error getting code:', error);
    return NextResponse.json({ error: 'Failed to get code' }, { status: 500 });
  }
} 

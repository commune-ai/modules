import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Dev module API endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  const data = await request.json()
  
  return NextResponse.json({
    message: 'Command received',
    data: data,
    processed: true,
    timestamp: new Date().toISOString(),
  })
}
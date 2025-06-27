import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Test cart endpoint works!" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ message: "POST works!", data: body });
}

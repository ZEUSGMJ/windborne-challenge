// Next.js API route to fetch hourly balloon data from WindBorne API

// GET /api/windborne/[hour]
// Example: /api/windborne/00 to fetch the latest hour's data

import { NextResponse } from 'next/server';

const BASE_URL = 'https://a.windbornesystems.com/treasure';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hour: string }> }
) {
  const { hour } = await params;

  // Validate hour parameter
  const hourNum = parseInt(hour, 10);
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
    return NextResponse.json(
      { error: 'Invalid hour parameter. Must be between 0 and 23.' },
      { status: 400 }
    );
  }

  const fileNum = hour.padStart(2, '0');
  const url = `${BASE_URL}/${fileNum}.json`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data from WindBorne API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return NextResponse.json(
      { error: 'Internal server error while fetching balloon data' },
      { status: 500 }
    );
  }
}
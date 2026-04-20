import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const fileName = searchParams.get('filename');

  if (!fileUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return new NextResponse('Failed to fetch file', { status: response.status });
    }

    const headers = new Headers(response.headers);
    const encodedFilename = encodeURIComponent(fileName || 'download');
    headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    
    // Optional: Copy Content-Type if needed, mostly fetch does this automatically or we can force it.
    // headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

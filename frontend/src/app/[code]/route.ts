import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  // Bỏ qua các file tài nguyên tĩnh hoặc reserved words nếu trình duyệt vô tình request
  if (!code || code === 'favicon.ico' || code === 'robots.txt' || code === 'sitemap.xml') {
    return new NextResponse('Not found', { status: 404 });
  }

  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://qlink-api.onrender.com').replace(/\/+$/, '');
  
  const referer = request.headers.get('referer') || '';
  const userAgent = request.headers.get('user-agent') || '';
  const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

  try {
    const res = await fetch(`${backendUrl}/${encodeURIComponent(code)}`, {
      method: 'GET',
      redirect: 'manual', // Chặn auto-follow để bắt HTTP 302/301 và lấy header Location
      headers: {
        'Referer': referer,
        'User-Agent': userAgent,
        'X-Forwarded-For': forwardedFor,
      },
      cache: 'no-store',
    });

    // Nếu Backend trả về 301/302/307/308 kèm header Location: chuyển hướng người dùng ngay lập tức
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (location) {
        return NextResponse.redirect(location, 307);
      }
    }

    // Nếu backend không tìm thấy link hoặc link hết hạn (404)
    const host = request.headers.get('host') || 'qlink.tvquang.id.vn';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${proto}://${host}/?notfound=${encodeURIComponent(code)}`, 307);
  } catch (error) {
    console.error('Lỗi khi redirect mã code:', code, error);
    const host = request.headers.get('host') || 'qlink.tvquang.id.vn';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${proto}://${host}/?error=redirect_failed`, 307);
  }
}

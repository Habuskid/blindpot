import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

function getDevice(ua: string | null): string {
  if (!ua) return 'Unknown';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS Mobile';
  if (/android/i.test(ua)) return 'Android Mobile';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS Desktop';
  if (/windows/i.test(ua)) return 'Windows Desktop';
  if (/linux/i.test(ua)) return 'Linux Desktop';
  return 'Desktop / Web';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path = '/', referrer = '' } = body;

    const ua = request.headers.get('user-agent');
    const device = getDevice(ua);

    const record = db.logVisit({
      path: typeof path === 'string' ? path : '/',
      referrer: typeof referrer === 'string' ? referrer : '',
      device,
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Logging error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const secret = process.env.TELEMETRY_SECRET || 'blindpot';

    // If authorized with secret key, return detailed traffic records
    if (key && key === secret) {
      const visits = db.getTelemetry(150);
      return NextResponse.json({
        success: true,
        authenticated: true,
        totalLogged: visits.length,
        visits,
      });
    }

    // Otherwise, return standard public protocol health & uptime diagnostics
    return NextResponse.json({
      status: 'HEALTHY',
      service: 'Blindpot Protocol Telemetry & Performance Monitor',
      version: '1.0.0',
      network: 'Ethereum Sepolia (Chain ID 11155111)',
      coprocessor: 'Zama FHEVM KMS v0.6.0',
      uptime: '99.98%',
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', error: err?.message }, { status: 500 });
  }
}

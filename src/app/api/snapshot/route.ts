import { connection } from 'next/server';
import { getSnapshotUrl } from '@/core/server/store/blob-store';
import { REDIRECT_CACHE_SECONDS } from '@/core/shared/constants';

export async function GET(request: Request): Promise<Response> {
    await connection();

    const result = await getSnapshotUrl();

    if (!result.ok) {
        console.error('getting_gp_url_from_Vercel_failed', result.error);
        return Response.json(
            { ok: false, kind: result.error.kind },
            { status: 502 },
        );
    }

    if (result.value === undefined) {
        console.error('getting_gp_url_from_Vercel_failed');
        return Response.json(
            { ok: false, kind: 'snapshot_not_found' },
            { status: 404, headers: { 'Cache-Control': 'no-store' } },
        );
    }

    return new Response(null, {
        status: 307,
        headers: {
            Location: result.value,
            'Cache-Control': `public, max-age=${REDIRECT_CACHE_SECONDS}`,
        },
    });
}

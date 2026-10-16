import { refreshSnapshot } from "@/app/lib/refreshSnapshot";
import { connection } from "next/server";

export async function GET(request: Request): Promise<Response> {
    await connection();
    const secret = process.env.CRON_SECRET;

    if (
        !secret ||
        request.headers.get("authorization") !== `Bearer ${secret}`
    ) {
        return new Response("Unauthorized", { status: 401 });
    }

    const result = await refreshSnapshot();
    if (!result.ok) {
        console.error("gp_refresh_failed", result.error);
        return Response.json(
            { ok: false, kind: result.error.kind },
            { status: 502 },
        );
    }

    return Response.json({ ok: true, ...result.value });
}

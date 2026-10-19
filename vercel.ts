import { type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
    crons: [
        {
            path: "/src/api/cron/refresh-gp",
            schedule: "37 4 * * *",
        },
    ],
};

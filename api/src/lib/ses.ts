import { SESClient } from "@aws-sdk/client-ses";

import { env } from "./env";

export const sesClient = new SESClient({ region: env.AWS_REGION })
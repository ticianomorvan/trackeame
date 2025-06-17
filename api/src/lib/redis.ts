import type { RedisOptions } from "ioredis";
import IORedis from "ioredis";

import { env } from "./env";

export const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null
}

export const connection = new IORedis(redisOptions);
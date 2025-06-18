import 'fastify';

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import type { User } from '../generated/prisma';
import type { App } from 'firebase-admin/app';

declare module 'fastify' {
  interface FastifyInstance {
    firebase: App;
  }

  interface FastifyRequest {
    internal_user: User | null;
  }
}
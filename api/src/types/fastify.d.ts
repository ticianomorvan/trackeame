import 'fastify';

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { User } from '../generated/prisma';

declare module 'fastify' {
  interface FastifyInstance {
    authenticateAndUpsertUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    internal_user: User | null;
  }
}
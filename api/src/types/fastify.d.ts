import 'fastify';

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { app } from 'firebase-admin';

import { User } from '../generated/prisma';

declare module 'fastify' {
  interface FastifyInstance {
    firebase: app.App;
  }

  interface FastifyRequest {
    internal_user: User | null;
  }
}
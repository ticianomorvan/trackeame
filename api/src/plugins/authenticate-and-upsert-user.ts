import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin"

import type { User } from "../generated/prisma";
import { FailedResponse, ResponseType } from "../types/response";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";

/**
 *  This plugin authenticates the user using Auth0 and upserts their information into the database.
 *  It checks if the user is already in the database, and if not, it fetches their profile from Auth0
 *  and creates a new user entry.
 */
const authenticateAndUpsertUser: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("authenticateAndUpsertUser", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user || !user.sub) {
      return reply.status(401).send({
        status: ResponseType.Error,
        message: "User not authenticated"
      } as FailedResponse);
    }

    let currentUser: User | null;

    // Check if the user is already in the database
    currentUser = await prisma.user.findUnique({
      where: { auth0Id: user.sub }
    });
    
    if (!currentUser) {
      const authorization = request.headers.authorization;
    
      if (!authorization) {
        return reply.status(401).send({
          status: ResponseType.Error,
          message: "No authorization header provided"
        } as FailedResponse);
      }
    
      const token = authorization.split(" ")[1];
    
      if (!token) {
        return reply.status(401).send({
          status: ResponseType.Error,
          message: "No token provided"
        } as FailedResponse);
      }
    
      const userInfoEndpoint = `https://${env.AUTH0_DOMAIN}/userinfo`;
    
      const userInfo = await fetch(userInfoEndpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })
    
      const profile = await userInfo.json() as {
        sub?: string;
        name: string;
        email: string;
        picture: string;
      }
    
      if (!profile.sub) {
        return reply.status(401).send({
          status: ResponseType.Error,
          message: "Invalid token"
        } as FailedResponse);
      }

      try {
        currentUser = await prisma.user.upsert({
          where: { auth0Id: profile.sub },
          update: {
            name: profile.name,
            email: profile.email,
            picture: profile.picture
          },
          create: {
            auth0Id: profile.sub,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
          }
        })
      } catch (error) {
        fastify.log.error(error);

        return reply.status(500).send({
          status: ResponseType.Error,
          message: "Failed to create user in database"
        } as FailedResponse);
      }
    }

    request.internal_user = currentUser;
  });
}

export default fastifyPlugin(authenticateAndUpsertUser, {
  name: "authenticate-and-upsert-user",
});
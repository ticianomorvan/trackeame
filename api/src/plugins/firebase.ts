import path from "node:path";
import fp from "fastify-plugin";
import { readFile } from "node:fs/promises";
import { FastifyPluginAsync } from "fastify"
;
import { initializeApp } from "firebase-admin/app";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import { credential } from "firebase-admin";

import { FailedResponse, ResponseType } from "../types/response";
import { prisma } from "../lib/prisma";
import { User } from "../generated/prisma";

const firebasePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.log.info("[firebase-plugin] Initializing Firebase Admin SDK...");

  const filePath = path.resolve(process.cwd(), "config", "service-account.json");
  const fileJson = await readFile(filePath, "utf-8")
  const firebase = initializeApp({ credential: credential.cert(JSON.parse(fileJson)) })

  fastify.log.info("[firebase-plugin] Firebase Admin SDK initialized successfully.");
  
  fastify.decorate("firebase", firebase);
  fastify.decorateRequest("internal_user", null);

  fastify.addHook("onRequest", async (request, reply) => {
    const auth = getAuth(firebase);
    const idToken = request.headers.authorization?.split(" ")[1];

    if (!idToken || idToken === "") {
      request.internal_user = null;
      
      return;
    }

    let decodedToken: DecodedIdToken | null = null;

    try {
      decodedToken = await auth.verifyIdToken(idToken)
    } catch (error) {
      fastify.log.error("ERROR: Error verifying ID token:", error);

      return reply.status(401).send({
        status: ResponseType.Error,
        message: "We could not verify your ID token. Please try again."
      } satisfies FailedResponse);
    }

    const { uid } = decodedToken;

    let currentUser: User | null = null;

    try {
      currentUser = await prisma.user.findUnique({
        where: { platformId: uid }
      });
    } catch (error) {
      fastify.log.error("ERROR: Error fetching user from database:", error);

      return reply.status(500).send({
        status: ResponseType.Error,
        message: "We could not fetch your user information. Please try again later."
      } satisfies FailedResponse);
    }

    if (!currentUser) {
      try {
        const { email, displayName, photoURL } = await auth.getUser(uid);

        if (!email || !displayName) {
          return reply.status(400).send({
            status: ResponseType.Error,
            message: "User information is incomplete. Please try again later."
          } satisfies FailedResponse);
        }

        currentUser = await prisma.user.create({
          data: {
            email,
            platformId: uid,
            name: displayName,
            picture: photoURL || null,
          },
        });
      } catch (error) {
        fastify.log.error("ERROR: Error creating user in database:", error);

        return reply.status(500).send({
          status: ResponseType.Error,
          message: "We could not create your user information. Please try again later."
        } satisfies FailedResponse);
      }
    }

    request.internal_user = currentUser;
  })
}

export default fp(firebasePlugin, { name: "firebase-plugin" });
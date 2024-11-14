import type { Core } from "@strapi/strapi";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
uuidv4(); 
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    console.log("websocket is ready");
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: "*",
      },
    });
    io.use(async (socket: any, next) => {
      const username = socket.handshake.auth.username;
      const userDocumentId = socket.handshake.auth.user_document_id;
      if (!username) {
        return next(new Error("invalid username"));
      }

      const user = await strapi
        .documents("plugin::users-permissions.user")
        .findOne({documentId: userDocumentId,
          fields: ["id"],
        },);

      if (!user) {
        return next(new Error("invalid user"));
      }
      socket.username = username;
      socket.user_document_id = userDocumentId;
      next();
    });

    try {
      io.on("connection", async (socket: any) => {
        // fetch existing users
        socket.on("join my rooms", async () => {
          const roomChats = await strapi.documents("api::room-chat.room-chat").findMany(
            {
              filters: {
                users: {
                  documentId: socket.user_document_id,
                },
              },
            }
          );
          roomChats.map((room) => {
            socket.join(room.documentId);
          });
          strapi.log.info("toi da join vao room chat");
        });
        
        // forward the private message to the right recipient
        socket.on("private message", async (data) => {
          const templateId = uuidv4();
          socket.to(data.to).emit("private message", {
            ...data,
            from: socket.user_document_id,
            template_id: templateId

          });
          
          const message = await strapi.documents("api::message.message").findMany(
            {
              filters: {
                room_chat: {
                  documentId: data.to,
                },
              },
            }
          );
          
          if (message.length === 0) {
            socket.emit("new user join your rooms", {
              user: data.to,
            });
          }

          strapi.service("api::message.message").processMessage({
            room: socket.room,
            from: socket.user_document_id,
            ...data,
            template_id: templateId
          });

          
        });

        socket.on("delete private message", async (data) => {
          socket.to(data.to).emit("delete private message", {
            ...data,
            from: socket.user_document_id,
          });

          strapi.service("api::message.message").deleteMessage({
            from: socket.user_document_id,
            ...data,
          });
        });
        socket.on("edit private message", async (data) => {
          socket.to(data.to).emit("edit private message", {
            ...data,
            from: socket.user_document_id,
          });

          strapi.service("api::message.message").deleteMessage({
            room: socket.room,
            from: socket.user_document_id,
            ...data,
          });
        });
        // notify users upon disconnection
        
      });
    } catch (e) {
      strapi.log.error("error socket", e);
    }
  },
};

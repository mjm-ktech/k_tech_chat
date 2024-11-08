/**
 * message service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::message.message",
  ({ strapi }) => ({
    async processMessage(data) {
      try {
        let { to, from, content, media } = data;
        const checkRoomChat = await strapi
          .documents("api::room-chat.room-chat")
          .findOne({
            documentId: to,
          });
      
        if (!checkRoomChat) {
          return;
        }

        let buildBody: any = {
          content,
          sender: {
            documentId: from,
          },
          room_chat: {
            documentId: to,
          },
        };

        if (media) {
          buildBody.media = {
            id: media,
          };
        }
        await strapi.documents("api::message.message").create({
          data: buildBody,
        });

        // update status room-chat
      } catch (e) {
        console.log("error message queue", e);
      }
    },
  })
);

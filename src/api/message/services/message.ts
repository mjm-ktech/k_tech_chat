/**
 * message service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::message.message",
  ({ strapi }) => ({
    async processMessage(data) {
      try {
        let { to, from, content, media, file, template_id } = data;
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
          template_id
        };

        if (media) {
          buildBody.media = {
            id: media,
          };
        }
        if (file) {
          buildBody.file = {
            id: file,
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

    async processDeleteMessage(data) {
      try {
        let { template_id, from } = data;

        const message = await strapi.documents("api::message.message").findFirst({
          filters: {
            template_id: template_id,
            sender:{
              documentId: from
            }
          }
        });

        if (!message) {
          return;
        }
        const { documentId } = message;
        await strapi.documents("api::message.message").update({
          documentId: documentId,
          data: {
            is_deleted: true,
          },
        })
        
      } catch (e) {
      }
    },

    async processEditMessage(data) {
      try {
        let { template_id, from, content } = data;

        const message = await strapi.documents("api::message.message").findFirst({
          filters: {
            template_id: template_id,
            sender:{
              documentId: from
            }
          }
        });

        if (!message) {
          return;
        }
        const { documentId } = message;
        await strapi.documents("api::message.message").update({
          documentId: documentId,
          data: {
            is_deleted: true,
            content: content
          },
        })
        
      } catch (e) {
      }
    }
  })
);

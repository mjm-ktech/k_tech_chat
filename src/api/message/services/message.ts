/**
 * message service
 */

import { factories } from "@strapi/strapi";
import { AnyComponent } from "styled-components/dist/types";

export default factories.createCoreService(
  "api::message.message",
  ({ strapi }) => ({
    async processMessage(data) {
      try {
        let { to, userId, content, media } = data;

        const roomChat = await strapi.entityService.findMany(
          "api::room-chat.room-chat",
          {
            filters: {
              room_id: to,
            },
          }
        );
        if (roomChat.length === 0) {
          throw new Error("Room chat not found");
        }
        const roomId = roomChat[0].id;

        const message = await strapi.entityService.findMany(
          "api::message.message",
          {
            filters: {
              room_chat: {
                id: roomId,
              },
            },
          }
        );

        let buildBody: any = {
          content,
          sender: {
            id: userId,
          },
          room_chat: {
            id: roomId,
          }
        };

        if (media) {
          buildBody.media = {
            id: media,
          }
        }

        await strapi.entityService.create("api::message.message", {
          data: buildBody,
        });

        // update status room-chat
      } catch (e) {
        console.log("error message queue", e);
      }
    },
  })
);

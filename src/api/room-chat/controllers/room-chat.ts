/**
 * room-chat controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::room-chat.room-chat",
  ({ strapi }) => ({
    async getMyRoomChat(ctx) {
      const { id } = ctx.state.user;
      const roomChats = await strapi.entityService.findMany(
        "api::room-chat.room-chat",
        {
          populate: {
            users: {
              fields: ["username", "fullname"],
              populate: {
                avatar: {
                  fields: ["url"],
                },
              }
            },
            
          },
          filters: {
            users: {
              id: {
                $eq: id,
              },
            },
          },
          sort: ["createdAt:desc"],
        }
      );

      let result: any = roomChats;

      if (roomChats.length > 0) {
        result = await Promise.all(
          roomChats.map(async (item: any) => {
            const message = await strapi.entityService.findMany(
              "api::message.message",
              {
                limit: 1,
                sort: ["createdAt:desc"],
                filters: {
                  room_chat: {
                    id: {
                      $eq: item.id,
                    },
                  },
                },
                populate: {
                  sender: {
                    fields: ["username"],
                  },
                  media: {
                    fields: ["id", "url"],
                  },
                },
              }
            );
            return {
              room: {
                id: item.documentId,
                user: item.users.filter((user) => user.id !== id),
              },
              message,
            };
          })
        );
        // mapping ending message to room chat
      }
      result.sort((a, b) => {
        const dateA = a.message?.createdAt
          ? new Date(a.message.createdAt)
          : null; // null nếu không có message
        const dateB = b.message?.createdAt
          ? new Date(b.message.createdAt)
          : null;

        // Nếu cả hai đều không có message, giữ nguyên thứ tự
        if (!dateA && !dateB) return 0;

        // Nếu chỉ a không có message, đưa a xuống cuối
        if (!dateA) return 1;

        // Nếu chỉ b không có message, đưa b xuống cuối
        if (!dateB) return -1;

        // So sánh ngày của a và b, giảm dần (mới nhất trước)
        return dateB.getTime() - dateA.getTime();
      });

      return result;
    },
    async chat(ctx) {
      const { id } = ctx.state.user;

      const { to } = ctx.request.body;

      if (!id || !to) {
        return ctx.badRequest("Missing id or to");
      }
      let result;
      result = await strapi.documents("api::room-chat.room-chat").findFirst({
        filters: {
          $and: [
            {
              users: {
                id: {
                  $eq: id,
                },
              },
            },
            {
              users: {
                documentId: {
                  $eq: to,
                },
              },
            },
          ],
        },
      });
      if (result.length === 0) {
        result = await strapi.documents("api::room-chat.room-chat").create({
          data: {
            users: [
              {
                id: id,
              },
              {
                documentId: to,
              },
            ],
          },
        });
      }
      return result;
    },
  })
);

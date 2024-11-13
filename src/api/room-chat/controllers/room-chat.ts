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
            const message = await strapi.documents("api::message.message").findFirst(
              {
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
      await result.sort((a, b) => {
        // Lấy thời gian của a và b, nếu không có thì mặc định là thời gian xa nhất (new Date(0))
        const dateA = a.message?.createdAt ? new Date(a.message.createdAt) : new Date(0);
        const dateB = b.message?.createdAt ? new Date(b.message.createdAt) : new Date(0);
      
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
      if (!result) {
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

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
              fields: ["username"],
            },
          },
          filters: {
            users: {
              id: {
                $eq: id,
              },
            },
          },
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
      return result;
    },
    async chat(ctx) {
      const { id } = ctx.state.user;

      const { to } = ctx.request.body;

      if (!id || !to) {
        return ctx.badRequest("Missing id or to");
      }
      let result;
      result = await strapi.documents("api::room-chat.room-chat").findMany(
        {
          
          filters: {
            "$and": [{
              users: {
                id: {
                  $eq: id,
                }
              }
            }, {
              users: {
                documentId: {
                  $eq: to,
                }
              }
            }]
          },
        }
      );
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
    }
  })
);

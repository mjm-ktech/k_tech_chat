import path from "path";
import { measureMemory } from "vm";

export default {
  routes: [
    {
      method: 'GET',
      path: '/room-chat/me',
      handler: 'room-chat.getMyRoomChat'
    },
    {
      method: 'POST',
      path: '/room-chat/chat',
      handler: 'room-chat.chat'
    }
  ]
}

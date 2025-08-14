import { gql } from '@apollo/client';

export const CREATE_CHAT = gql`
  mutation CreateChat($title: String!, $user_id: uuid!) {
    insert_chats_one(object: { title: $title, user_id: $user_id }) {
      id
      title
      created_at
      user_id
    }
  }
`;

export const INSERT_MESSAGE = gql`
  mutation InsertMessage($chat_id: uuid!, $content: String!, $isBot: Boolean = false, $user_id: uuid!) {
    insert_messages_one(
      object: { chat_id: $chat_id, content: $content, is_bot: $isBot, user_id: $user_id }
    ) {
      id
      content
      is_bot
      created_at
      user_id
    }
  }
`;

export const SEND_MESSAGE_ACTION = gql`
  mutation SendMessage($chat_id: uuid!, $content: String!) {
    sendMessage(chat_id: $chat_id, content: $content) {
      success
      message_id
      bot_response
    }
  }
`;

export const UPDATE_CHAT_TIMESTAMP = gql`
  mutation UpdateChatTimestamp($chat_id: uuid!) {
    update_chats_by_pk(pk_columns: { id: $chat_id }, _set: { updated_at: "now()" }) {
      id
      updated_at
    }
  }
`;

export const DELETE_USER_CHATS = gql`
  mutation DeleteUserChats($user_id: uuid!) {
    delete_chats(where: { user_id: { _eq: $user_id } }) {
      affected_rows
    }
  }
`;
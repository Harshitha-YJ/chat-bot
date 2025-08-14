import { gql } from '@apollo/client';

export const GET_CHATS = gql`
  query GetChats($user_id: uuid!) {
    chats(
      where: { user_id: { _eq: $user_id } }
      order_by: { updated_at: desc }
    ) {
      id
      title
      created_at
      updated_at
      user_id
      messages(limit: 1, order_by: { created_at: desc }) {
        content
        created_at
      }
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($chatId: uuid!, $user_id: uuid!) {
    messages(
      where: { 
        chat_id: { _eq: $chatId }
        chat: { user_id: { _eq: $user_id } }
      }
      order_by: { created_at: asc }
    ) {
      id
      content
      is_bot
      created_at
      user_id
    }
  }
`;

export const MESSAGES_SUBSCRIPTION = gql`
  subscription MessagesSubscription($chat_id: uuid!, $user_id: uuid!) {
    messages(
      where: { 
        chat_id: { _eq: $chat_id }
        chat: { user_id: { _eq: $user_id } }
      }
      order_by: { created_at: asc }
    ) {
      id
      content
      is_bot
      created_at
      user_id
    }
  }
`;
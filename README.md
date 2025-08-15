🚀 YJ Chat Bot

Full-stack AI-powered chat application with real-time GraphQL, Nhost authentication, and n8n AI orchestration.

Live Demo:https://yj-chat-bot.netlify.app

✨ Features

🔑 Email Auth — Sign up/sign in via Nhost Authentication
🔒 Secure Access — Only authenticated users can view/send messages
💬 Chat Management — Create chats, send messages, real-time updates
🤖 AI Chatbot — Automated replies via n8n + OpenRouter
⚡ Real-time GraphQL — Queries, mutations, and subscriptions via Hasura
🛡 Row-Level Security (RLS) — Per-user data isolation

🛠 Tech Stack

Layer	Technology
Frontend	React + TypeScript + Vite, TailwindCSS, Lucide Icons
GraphQL Client	Apollo Client (HTTP + WS)
Auth	Nhost
Backend	Hasura GraphQL on Postgres
Automation	n8n
AI	OpenRouter
Hosting	Netlify

🏗 Architecture Overview

Auth — User signs in via Nhost; tokens stored in client.
Data Flow — Apollo Client communicates with Hasura GraphQL using Nhost JWT (HTTP for queries/mutations, WS for subscriptions).

Message Handling:

User sends message → stored in messages table
n8n workflow triggers → calls OpenRouter → generates AI reply
Bot reply inserted into messages via Hasura GraphQL
UI updates instantly via subscription stream

📦 Data Model

chats Table

Column	     Type	        Description
id	uuid     (PK)    	    Chat ID
user_id	     uuid (FK)	  Chat owner (auth.users)
title	       text	        Chat title
created_at	 timestamptz	Auto-set
updated_at	 timestamptz	Auto-update on new messages

messages Table

Column	    Type	      Description
id	        uuid (PK)	  Message ID
chat_id	    uuid (FK)	  Related chat
user_id	    uuid (FK)	  Message sender
content	    text	      Message text
is_bot	    boolean	    True if AI message
created_at	timestamptz	 Auto-set

🔐 Permissions (Hasura RLS)

Role: user
chats Table

Select: user_id = X-Hasura-User-Id
Insert: Preset user_id = session user; allow title
Update: Only own chats; editable fields only
Delete: Own chats only

messages Table

Select: Parent chat owned by user
Insert: Chat owned by user; user_id from session
Update/Delete: Typically disabled

⚙ Hasura Action + n8n Workflow

Hasura Action: sendMessage(chat_id, content)

n8n Webhook:

Validates ownership of chat_id
Calls OpenRouter for AI response
Inserts AI reply into messages table
Returns structured response

📂 Project Structure
src/
  lib/
    nhost.ts              # Nhost client config
    apollo.ts             # Apollo Client (HTTP + WS)
    graphql/
      queries.ts
      mutations.ts
  components/
    AuthForm.tsx
    ChatApp.tsx
    ChatSidebar.tsx
    ChatInterface.tsx
    ChatMessages.tsx
    MessageInput.tsx

🖥 Local Development
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev


Requirements:

Node.js 18+
Nhost project with Auth enabled
Hasura tables & permissions set
n8n workflow deployed
OpenRouter API key stored securely in n8n

🌐 Deploying to Netlify

Build command: npm run build
Publish directory: dist
Add your Netlify domain to Nhost/Hasura CORS allowed origins

🧪 Testing Checklist

✅ Auth required for viewing/sending messages
✅ No access to other users’ chats/messages (RLS enforced)
✅ GraphQL queries, mutations, and subscriptions working
✅ n8n triggers & writes bot replies
✅ No API keys exposed in frontend

🐛 Troubleshooting

No real-time updates? Check WS endpoint, token, and Hasura subscription settings
Insert fails? Verify RLS and user_id presets
No bot reply? Check n8n logs & OpenRouter credentials
401/403 errors? Confirm JWT includes x-hasura-default-role=user

📌 Roadmap

Migrate fully to Hasura Actions
Typing indicators
Error boundaries + optimistic UI
Chat pagination / virtualized lists


Acknowledgements:
Nhost · Hasura GraphQL · n8n · OpenRouter · Apollo Client · Netlify

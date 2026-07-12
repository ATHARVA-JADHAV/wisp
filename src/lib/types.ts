export type Project = {
  id: string;
  owner: string;
  name: string;
  public_key: string;
  bot_name: string;
  greeting: string;
  accent_color: string;
  created_at: string;
};

export type Source = {
  id: string;
  project_id: string;
  type: "url" | "text";
  url: string | null;
  title: string;
  status: "pending" | "indexed" | "error";
  error: string | null;
  chunk_count: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  project_id: string;
  visitor_id: string | null;
  created_at: string;
};

export type Message = {
  id: number;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  grounded: boolean;
  created_at: string;
};

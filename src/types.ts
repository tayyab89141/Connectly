export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_url: string | null;
  website: string | null;
  location: string | null;
  profile_visibility: 'public' | 'friends';
  post_default_visibility: 'public' | 'friends' | 'private';
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Added via join
  likes?: { count: number }[]; // Added via join
  comments?: { count: number }[]; // Added via join
  user_has_liked?: boolean; // Computed field in frontend or via function
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Added via join
};

export type Friendship = {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted';
  action_user_id: string;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: 'friend_request' | 'friend_accepted' | 'post_like' | 'post_comment';
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile; // Joined
};

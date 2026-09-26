import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Post as PostType, Comment as CommentType } from '../types';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import { useRealtimePost } from '../hooks/useRealtimePost';

type PostCardProps = {
  post: PostType;
  onDelete: () => void;
};

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.user_has_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes?.[0]?.count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(post.comments?.[0]?.count || 0);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useRealtimePost(post.id, user?.id, setLikeCount, setLiked, setCommentCount, setComments, showComments);

  const isOwner = user?.id === post.user_id;

  const handleLike = async () => {
    if (!user) return;
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    if (newLikedState) {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
    } else {
      await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0 && commentCount > 0) {
      setLoadingComments(true);
      const { data } = await supabase
        .from('comments')
        .select(`*, profiles!comments_user_id_fkey(id, username, full_name, avatar_url)`)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (data) setComments(data);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setSubmittingComment(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: user.id,
        content: newComment
      })
      .select(`*, profiles!comments_user_id_fkey(id, username, full_name, avatar_url)`)
      .single();

    if (!error && data) {
      setComments([...comments, data]);
      setCommentCount(prev => prev + 1);
      setNewComment('');
    }
    setSubmittingComment(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) {
      onDelete();
    }
    setIsDeleting(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4 relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <Link to={`/profile/${post.profiles?.username || post.user_id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-brand-600 font-bold uppercase">{post.profiles?.full_name?.[0] || 'U'}</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
              {post.profiles?.full_name || 'User'}
            </h3>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })} • {post.visibility}
            </p>
          </div>
        </Link>
        
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-gray-800 whitespace-pre-wrap">{post.content}</div>
      
      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-gray-100 max-h-96">
          <img src={post.media_urls[0]} alt="Post media" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Action Stats */}
      <div className="flex items-center gap-4 py-2 text-sm text-gray-500">
        <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-y border-gray-100 py-1">
        <button 
          onClick={handleLike}
          className={`flex-1 py-2 flex justify-center items-center gap-2 rounded-lg transition-colors font-medium text-sm ${liked ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          Like
        </button>
        <button 
          onClick={toggleComments}
          className="flex-1 py-2 flex justify-center items-center gap-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
        >
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4 pt-2">
          {/* Comment list */}
          {loadingComments ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-8 h-8 bg-brand-50 rounded-full flex-shrink-0 overflow-hidden">
                    {comment.profiles?.avatar_url && (
                      <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%]">
                    <p className="text-sm font-semibold text-gray-900">{comment.profiles?.full_name}</p>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* New Comment Input */}
          <form onSubmit={submitComment} className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 bg-brand-50 rounded-full flex-shrink-0 overflow-hidden">
              {user?.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              )}
            </div>
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..." 
              className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 rounded-full px-4 py-2 text-sm"
              disabled={submittingComment}
            />
            <button 
              type="submit" 
              disabled={!newComment.trim() || submittingComment}
              className="p-2 text-brand-600 hover:bg-brand-50 rounded-full disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

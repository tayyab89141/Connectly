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
    <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 p-5 space-y-4 relative transition-all duration-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="flex justify-between items-start">
        <Link to={`/profile/${post.profiles?.username || post.user_id}`} className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-white font-bold text-sm uppercase">{post.profiles?.full_name?.[0] || 'U'}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#181820] text-[15px] group-hover:text-brand-600 smooth-transition leading-tight truncate">
              {post.profiles?.full_name || 'User'}
            </h3>
            <p className="text-[12px] text-gray-500 font-medium">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })} • {post.visibility}
            </p>
          </div>
        </Link>
        
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-50 smooth-transition"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 smooth-transition"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-[#181820] text-[15px] leading-relaxed whitespace-pre-wrap break-words">{post.content}</div>
      
      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-gray-50 max-h-[500px] border border-gray-100 flex justify-center shadow-sm">
          <img src={post.media_urls[0]} alt="Post media" className="w-full h-full object-cover sm:object-contain" />
        </div>
      )}

      {/* Action Stats */}
      <div className="flex items-center gap-4 py-1.5 text-[13px] font-medium text-gray-500 border-b border-gray-50">
        <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button 
          onClick={handleLike}
          className={`flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl transition-all duration-200 font-semibold text-[13px] hover:scale-[1.02] active:scale-[0.98] ${liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current scale-110 smooth-transition' : ''}`} />
          Like
        </button>
        <button 
          onClick={toggleComments}
          className={`flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl transition-all duration-200 font-semibold text-[13px] hover:scale-[1.02] active:scale-[0.98] ${showComments ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4 pt-3 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Comment list */}
          {loadingComments ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full flex-shrink-0 overflow-hidden shadow-sm">
                    {comment.profiles?.avatar_url && (
                      <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="bg-[#F8F8FB] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                    <p className="text-[13px] font-bold text-[#181820] mb-0.5 truncate">{comment.profiles?.full_name}</p>
                    <p className="text-[14px] text-gray-700 leading-snug break-words whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* New Comment Input */}
          <form onSubmit={submitComment} className="flex items-center gap-3 pt-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full flex-shrink-0 overflow-hidden shadow-sm">
              {user?.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              )}
            </div>
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..." 
              className="flex-1 input-field py-2.5 text-[14px]"
              disabled={submittingComment}
            />
            <button 
              type="submit" 
              disabled={!newComment.trim() || submittingComment}
              className="p-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-full disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 smooth-transition shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

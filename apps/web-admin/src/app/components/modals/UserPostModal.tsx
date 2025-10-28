'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, User } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/Firebase';
import type { Post } from '@/app/userposts/page';

// --- UserAvatar Component ---
const UserAvatar = ({ user }: { user: Post['user'] }) => {
  const initials =
    (user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()) || 'U';

  return (
    <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
      <span className="text-white font-bold text-lg">{initials}</span>
    </div>
  );
};

// --- UserPostModal Component ---
const UserPostModal = ({
  post,
  onClose,
}: {
  post: Post | null;
  onClose: () => void;
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<
    { id: string; text: string; userName?: string; userEmail?: string }[]
  >([]);
  const [loadingComments, setLoadingComments] = useState(false);

  if (!post) return null;

  // --- Fetch comments when toggled open ---
  useEffect(() => {
    if (showComments && post?.id) {
      const fetchComments = async () => {
        setLoadingComments(true);
        try {
          const commentsRef = collection(firestore, 'newsfeed', post.id, 'comments');
          const snapshot = await getDocs(commentsRef);
          const fetchedComments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as {
              text: string;
              userName?: string;
              userEmail?: string;
            }),
          }));
          setComments(fetchedComments);
        } catch (error) {
          console.error('Error fetching comments:', error);
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [showComments, post?.id]);

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-5 flex items-center justify-between shadow-lg">
            <h2 className="text-2xl font-bold text-white">Post Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:rotate-90"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* User Info */}
            <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
              <UserAvatar user={post.user} />
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-gray-900">{post.user.name}</h3>
                <p className="text-gray-500 font-mono text-sm">{post.user.id}</p>
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  post.user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {post.user.role}
              </span>
            </div>

            {/* Post Text */}
            <div className="mb-6">
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap break-words">
                {post.text}
              </p>

              {/* Images in responsive grid */}
              {post.images && post.images.length > 0 && (
                <div className="mt-6">
                  <div className={`grid gap-3 ${
                    post.images.length === 1 ? 'grid-cols-1' : 
                    post.images.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2'
                  }`}>
                    {post.images.map((base64Image, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                        <img
                          src={`data:image/jpeg;base64,${base64Image}`}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Likes */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 text-left hover:shadow-md transition-all duration-200 hover:scale-105">
                <div className="flex items-center space-x-2 mb-1">
                  <Heart className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-red-900">Likes</p>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {post.likedBy?.length || 0}
                </p>
              </div>

              {/* Comments (Clickable) */}
              <button
                onClick={() => setShowComments((prev) => !prev)}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 text-left hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Comments</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {post.comments?.length || 0}
                </p>
              </button>

              {/* Status */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 text-left hover:shadow-md transition-all duration-200 hover:scale-105">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Status</p>
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    post.pinned
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-green-200 text-green-800'
                  }`}
                >
                  {post.pinned ? 'Pinned' : 'Active'}
                </span>
              </div>
            </div>

            {/* Liked By Section */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                Liked By ({post.likedBy?.length || 0})
              </h4>
              {post.likedBy && post.likedBy.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {post.likedBy.map((email, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1.5 text-sm font-medium bg-white text-gray-700 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No likes yet</p>
              )}
            </div>

            {/* Comments Section (expandable) */}
            {showComments && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200 animate-slideUp">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                  User Comments
                </h4>
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="text-gray-800 mb-2">{comment.text}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <User className="h-3 w-3 mr-1" />
                          <span className="font-medium">{comment.userName || 'Anonymous'}</span>
                          {comment.userEmail && (
                            <span className="ml-2 text-gray-400">• {comment.userEmail}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No comments yet</p>
                )}
              </div>
            )}

            {/* Additional Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Post Information
              </h4>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-xs font-medium text-gray-500 w-20">Post ID:</span>
                  <span className="text-xs font-mono text-gray-900 break-all flex-1">
                    {post.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserPostModal;
'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Eye,
    Trash2,
    MoreVertical,
    X,
    FileText,
    Heart,
    MessageSquare,
    ImageIcon,
    User,
    AlertCircle,
} from 'lucide-react';

// Import from your centralized Firebase config
import { firestore, auth } from '@/Firebase';
import UserPostModal from '@/app/components/modals/UserPostModal';
import Sidebar from '../components/Sidebar';
import {
    collection,
    onSnapshot,
    query,
    doc,
    deleteDoc,
} from 'firebase/firestore';
// Define the Post type based on your provided structure
export interface Post {
    id: string; // This will be the Firestore Document ID
    comments: any[];
    images: string[] | null; // Changed to string array
    isEvent: boolean;
    isShared: boolean;
    likedBy: string[];
    pinned: boolean;
    sharedPostData: any | null;
    text: string;
    timestamp: any;
    user: {
        id: string;
        name: string;
        profileImage: string;
        role: string;
    };
}

// A simple component to render user initials or a user icon
const UserAvatar = ({ user }: { user: Post['user'] }) => {
    // In a real app, you'd check if profileImage is a valid URL
    // if (user.profileImage && user.profileImage.startsWith('data:image')) {
    //   return <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full" />;
    // }

    // Fallback to initials
    const initials =
        (user.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()) || 'U';

    return (
        <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 font-medium">{initials}</span>
        </div>
    );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({
    onClose,
    onConfirm,
}: {
    onClose: () => void;
    onConfirm: () => void;
}) => (
    <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                    Confirm Deletion
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to delete this post? This action cannot be
                    undone.
                </p>
                <div className="flex justify-center space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 w-full"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 w-full"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Main Component for Post Management
const PostManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
        null,
    ); // Stores post ID
    const [error, setError] = useState<string | null>(null); // For Firebase errors
    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Number of posts per page
    useEffect(() => {
        setLoading(true);
        const postsCollectionRef = collection(firestore, 'newsfeed');
        const q = query(postsCollectionRef);

        const unsubscribe = onSnapshot(
            q,
            async (querySnapshot) => {
                const fetchedPosts: Post[] = [];

                // Step 1: Fetch posts
                for (const postDoc of querySnapshot.docs) {
                    const postData = postDoc.data() as Omit<Post, 'id'>;

                    // Step 2: Fetch comment count for this post
                    const commentsCollectionRef = collection(
                        firestore,
                        'newsfeed',
                        postDoc.id,
                        'comments'
                    );

                    let commentCount = 0;
                    try {
                        const commentsSnapshot = await onSnapshot(
                            commentsCollectionRef,
                            () => { }
                        );
                    } catch (error) {
                        console.error('Error fetching comments:', error);
                    }

                    // Step 3: Use getDocs to count (more efficient than snapshot listener)
                    try {
                        const commentsSnapshot = await import('firebase/firestore').then(
                            ({ getDocs }) => getDocs(commentsCollectionRef)
                        );
                        commentCount = commentsSnapshot.docs.length;
                    } catch (error) {
                        console.error('Error fetching comment count:', error);
                    }

                    fetchedPosts.push({
                        ...postData,
                        id: postDoc.id,
                        comments: new Array(commentCount).fill(null), // Just for count consistency
                    });
                }

                setPosts(fetchedPosts);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching posts: ', err);
                setError('Failed to load posts. Please check the console for details.');
                setLoading(false);
            }
        );

        // Cleanup function
        return () => unsubscribe();
    }, []);


    // Calculate stats based on fetched posts
    const stats = {
        totalPosts: posts.length,
        totalLikes: posts.reduce(
            (acc, post) => acc + (post.likedBy?.length || 0),
            0,
        ),
        totalComments: posts.reduce(
            (acc, post) => acc + (post.comments?.length || 0),
            0,
        ),
        postsWithImages: posts.filter((p) => p.images && p.images.length > 0)
            .length, // Updated logic for array
    };

    // Filter posts based on search term
    const filteredPosts = posts.filter((post) => {
        const searchLower = searchTerm.toLowerCase();
        const postText = post.text || '';
        const userName = post.user?.name || '';
        const userId = post.user?.id || '';

        const matchesSearch =
            userName.toLowerCase().includes(searchLower) ||
            userId.toLowerCase().includes(searchLower) ||
            postText.toLowerCase().includes(searchLower);

        return matchesSearch;
    });

    // PAGINATED SLICE
    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
    const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
    );

    // Handle row selection
    const handlePostSelect = (postId: string) => {
        setSelectedPosts((prev) =>
            prev.includes(postId)
                ? prev.filter((id) => id !== postId)
                : [...prev, postId],
        );
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedPosts.length === filteredPosts.length) {
            setSelectedPosts([]);
        } else {
            setSelectedPosts(filteredPosts.map((post) => post.id));
        }
    };

    // Handle clicking a row to see details
    const handleRowClick = (post: Post) => {
        setSelectedPost(post);
    };

    // Close the details modal
    const handleCloseModal = () => {
        setSelectedPost(null);
    };

    // --- DELETE LOGIC ---
    const openDeleteModal = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation(); // Stop the row click
        setShowDeleteConfirm(postId);
    };

    const handleDeletePost = async () => {
        if (!showDeleteConfirm) return;

        const postId = showDeleteConfirm;
        const postRef = doc(firestore, 'newsfeed', postId);
        try {
            await deleteDoc(postRef);
            // Post will be removed from UI automatically by onSnapshot listener
        } catch (err) {
            console.error('Error deleting post: ', err);
            setError('Failed to delete post.');
        } finally {
            setShowDeleteConfirm(null); // Close modal
        }
    };
    // --- END DELETE LOGIC ---

    // StatCard sub-component
    type StatCardProps = {
        title: string;
        value: number;
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    };

    const StatCard: React.FC<StatCardProps> = ({
        title,
        value,
        icon: Icon,
    }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {value.toLocaleString()}
                    </p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                    <Icon className="h-8 w-8 text-red-600" />
                </div>
            </div>
        </div>
    );

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Loading posts from Firebase...
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-red-600">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg">{error}</p>
                <p className="text-sm text-gray-500">
                    Make sure Firestore rules are set up correctly.
                </p>
            </div>
        );
    }

    // Main component render
    return (
        <div className="ml-15 min-h-screen bg-gray-50 flex">
            <Sidebar />

            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Post Management
                        </h1>
                        <p className="text-gray-600">
                            Manage all user-generated posts, comments, and interactions
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Posts"
                            value={stats.totalPosts}
                            icon={FileText}
                        />
                        <StatCard
                            title="Total Likes"
                            value={stats.totalLikes}
                            icon={Heart}
                        />
                        <StatCard
                            title="Total Comments"
                            value={stats.totalComments}
                            icon={MessageSquare}
                        />
                        <StatCard
                            title="Posts with Images"
                            value={stats.postsWithImages}
                            icon={ImageIcon}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search posts, users, or emails..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-80"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedPosts.length === filteredPosts.length &&
                                                    filteredPosts.length > 0
                                                }
                                                onChange={handleSelectAll}
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Author
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Post Snippet
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Likes
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User ID
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPosts.length > 0 ? (
                                        paginatedPosts.map((post) => (
                                            <tr
                                                key={post.id}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => handleRowClick(post)}
                                            >
                                                <td
                                                    className="px-6 py-4"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPosts.includes(post.id)}
                                                        onChange={() => handlePostSelect(post.id)}
                                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <UserAvatar user={post.user} />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {post.user?.name || 'Unknown User'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-sm">
                                                    <p className="truncate">
                                                        {post.text || 'No content'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="flex items-center">
                                                        <Heart className="h-4 w-4 mr-1 text-red-400" />
                                                        {post.likedBy?.length || 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                    {post.user?.id || 'N/A'}
                                                </td>
                                                <td
                                                    className="px-6 py-4 text-right"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleRowClick(post)}
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => openDeleteModal(e, post.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600"
                                                            title="Delete Post"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                            title="More Actions"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                {searchTerm
                                                    ? 'No posts match your search.'
                                                    : 'No posts found in the database.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-white px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–
                            {Math.min(currentPage * itemsPerPage, filteredPosts.length)} of {filteredPosts.length} posts
                            </p>

                            <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 text-sm rounded ${
                                    pageNum === currentPage
                                    ? 'bg-red-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                                >
                                {pageNum}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Details Modal */}
            {selectedPost && (
                <UserPostModal post={selectedPost} onClose={handleCloseModal} />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <DeleteConfirmModal
                    onClose={() => setShowDeleteConfirm(null)}
                    onConfirm={handleDeletePost}
                />
            )}
        </div>
    );
};

export default PostManagement;



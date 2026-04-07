import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    Plus,
    Search,
    User,
    Clock,
    ThumbsUp,
    MessageCircle,
    Pin,
    CheckCircle2,
    Send,
    Loader2,
    ArrowLeft,
    Tag,
    X,
    ChevronDown,
    Trash2,
    AlertCircle,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';

// ─── Custom Confirm Modal ───────────────────────────────────────────────────
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-secondary/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl p-8 text-center"
                    >
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Trash2 size={32} />
                        </div>
                        
                        <h2 className="text-xl font-black text-secondary tracking-tight mb-2">
                            {title || 'Are you sure?'}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                            {message || 'This action cannot be undone. Are you sure you want to proceed?'}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Delete</span>
                                        <Trash2 size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ─── Inline Reply Box ────────────────────────────────────────────────────────
const InlineReplyBox = ({ postId, onReply, isReplying }) => {
    const [content, setContent] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        await onReply(postId, content);
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 mt-4">
            <textarea
                rows="2"
                placeholder="Write a reply…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-sm resize-none inner-shadow"
            />
            <button
                type="submit"
                disabled={!content.trim() || isReplying}
                className="self-end flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
            >
                {isReplying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span className="hidden sm:inline">Send</span>
            </button>
        </form>
    );
};

// ─── Post Card with inline expansion ────────────────────────────────────────
const PostCard = ({ post, currentUser, onLike, onDeletePost, onReply, onDeleteReply, isReplying }) => {
    const [expanded, setExpanded] = useState(false);
    const isLiked = post.likes?.includes(currentUser?._id);
    const isAuthor = post.author?._id === currentUser?._id;
    const isModerator = ['admin', 'superuser'].includes(currentUser?.role);
    const canDelete = isAuthor || isModerator;

    return (
        <div
            className={`bg-white rounded-2xl border transition-all ${
                expanded
                    ? 'border-primary ring-4 ring-primary/5 shadow-lg'
                    : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
            }`}
        >
            {/* ── Card Header (always visible, clickable) ── */}
            <button
                className="w-full text-left p-6 focus:outline-none"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex justify-between items-start mb-3">
                    {/* Author */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden flex-shrink-0">
                            {post.author.avatar ? (
                                <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-800">
                                    {post.author.firstName} {post.author.lastName}
                                </span>
                                {post.author.role === 'mentor' && (
                                    <span className="text-[9px] font-black uppercase tracking-tighter bg-primary/5 text-primary px-1.5 py-0.5 rounded-md border border-primary/10">
                                        Mentor
                                    </span>
                                )}
                                {post.author.role === 'admin' && (
                                    <span className="text-[9px] font-black uppercase tracking-tighter bg-accent/5 text-accent px-1.5 py-0.5 rounded-md border border-accent/10">
                                        Admin
                                    </span>
                                )}
                                {post.author.role === 'superuser' && (
                                    <span className="text-[9px] font-black uppercase tracking-tighter bg-secondary/5 text-secondary px-1.5 py-0.5 rounded-md border border-secondary/10">
                                        Superuser
                                    </span>
                                )}
                                {post.isPinned && <Pin size={10} className="text-amber-500 fill-amber-500" />}
                                {post.isResolved && <CheckCircle2 size={12} className="text-accent" />}
                            </div>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Stats + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-full">
                            <MessageCircle size={14} />
                            {post.replies?.length || 0}
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180 text-primary' : ''}`}
                        />
                    </div>
                </div>

                <h3 className={`text-lg font-black tracking-tight mb-1 transition-colors ${expanded ? 'text-primary' : 'text-secondary'}`}>
                    {post.title}
                </h3>
                <p className={`text-slate-500 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                    {post.content}
                </p>

                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((tag) => (
                            <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md border border-slate-100">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </button>

            {/* ── Expanded Content ── */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 border-t border-slate-100 pt-5 space-y-5">
                            <div className="flex items-center gap-3">
                                {/* Like button */}
                                <button
                                    onClick={() => onLike(post._id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all active:scale-95 border ${
                                        isLiked
                                            ? 'bg-rose-50 border-rose-100 text-rose-500'
                                            : 'bg-white border-slate-100 text-slate-400 hover:text-rose-500'
                                    }`}
                                >
                                    <ThumbsUp size={15} className={isLiked ? 'fill-rose-500' : ''} />
                                    <span>{post.likes?.length || 0} Likes</span>
                                </button>

                                {/* Delete Post (Admins or Owner) */}
                                {canDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePost(post._id);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-500 border border-slate-100 transition-all active:scale-95"
                                    >
                                        <Trash2 size={15} />
                                        <span>Delete Discussion</span>
                                    </button>
                                )}
                            </div>

                            {/* Replies */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Discussion Thread • {post.replies?.length || 0} Responses
                                </h4>

                                {post.replies?.length === 0 ? (
                                    <div className="py-8 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <p className="text-slate-400 text-sm font-bold italic">No replies yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {post.replies.map((reply) => {
                                            const isReplyAuthor = reply.author?._id === currentUser?._id;
                                            const canDeleteReply = isReplyAuthor || isModerator;
                                            
                                            return (
                                                <div key={reply._id} className="flex gap-3 group/reply">
                                                    <div className="w-9 h-9 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 overflow-hidden flex-shrink-0">
                                                        {reply.author?.avatar ? (
                                                            <img src={reply.author.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={16} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group-hover/reply:bg-white transition-colors">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-black text-secondary flex items-center gap-2">
                                                                {reply.author?.firstName} {reply.author?.lastName}
                                                                {reply.author?.role === 'mentor' && (
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-primary/5 text-primary px-1 py-0.5 rounded-md border border-primary/10">
                                                                        Mentor
                                                                    </span>
                                                                )}
                                                                {reply.author?.role === 'admin' && (
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-accent/5 text-accent px-1 py-0.5 rounded-md border border-accent/10">
                                                                        Admin
                                                                    </span>
                                                                )}
                                                                {reply.author?.role === 'superuser' && (
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-secondary/5 text-secondary px-1 py-0.5 rounded-md border border-secondary/10">
                                                                        Superuser
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    {new Date(reply.createdAt).toLocaleDateString()}
                                                                </span>
                                                                {canDeleteReply && (
                                                                    <button 
                                                                        onClick={() => onDeleteReply(post._id, reply._id)}
                                                                        className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/reply:opacity-100 transition-all"
                                                                        title="Delete reply"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-600 text-sm font-medium leading-relaxed">"{reply.content}"</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Inline reply input */}
                                <InlineReplyBox postId={post._id} onReply={onReply} isReplying={isReplying} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main CourseForum ────────────────────────────────────────────────────────
const CourseForum = () => {
    const { courseId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

    const [newPost, setNewPost] = useState({ title: '', content: '', tags: [] });
    const [submitting, setSubmitting] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    // ─── Modal State for Deletion ───
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        isLoading: false,
        type: null, // 'post' or 'reply'
        postId: null,
        replyId: null,
        title: '',
        message: ''
    });

    const [pagination, setPagination] = useState({ currentPage: 1, hasMore: false });
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchForumData = async (page = 1, isInitial = false, searchTerm = searchQuery) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            // Include search term in the API call
            const forumRes = await api.get(`/api/forum/course/${courseId}`, {
                params: { 
                    page, 
                    limit: 10,
                    search: searchTerm 
                }
            });
            const { posts: newPosts, pagination: pagData } = forumRes.data.data;

            if (isInitial) {
                // If it's an initial load, we might need course info too (only if not already loaded)
                if (!course) {
                    const courseRes = await api.get(`/api/courses/${courseId}`);
                    setCourse(courseRes.data.data.course);
                }
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }
            
            setPagination(pagData);
        } catch (err) {
            console.error('Error fetching forum data:', err);
            toast.error('Failed to load forum discussions');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // ─── Initial Load ───
    useEffect(() => {
        if (courseId) {
            fetchForumData(1, true, ''); // Initial fetch with empty search
        }
    }, [courseId]);

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        fetchForumData(1, true, searchQuery);
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.title || !newPost.content) {
            toast.error('Please provide a title and content for your post');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post('/api/forum', { courseId, ...newPost });
            setPosts([res.data.data.post, ...posts]);
            setIsNewPostModalOpen(false);
            setNewPost({ title: '', content: '', tags: [] });
            toast.success('Discussion started successfully!');
        } catch {
            toast.error('Failed to create post');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddReply = async (postId, content) => {
        setIsReplying(true);
        try {
            const res = await api.post(`/api/forum/reply/${postId}`, { content });
            setPosts((prev) => prev.map((p) => (p._id === postId ? res.data.data.post : p)));
            toast.success('Reply added!');
        } catch {
            toast.error('Failed to add reply');
        } finally {
            setIsReplying(false);
        }
    };

    const handleLikePost = async (postId) => {
        try {
            const res = await api.get(`/api/forum/like/${postId}`);
            setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likes: res.data.data.likes } : p)));
        } catch {
            toast.error('Error updating like');
        }
    };

    const handleDeletePost = (postId) => {
        setConfirmModal({
            isOpen: true,
            isLoading: false,
            type: 'post',
            postId,
            title: 'Delete Discussion?',
            message: 'All replies within this discussion will be permanently removed. This action is irreversible.'
        });
    };

    const handleDeleteReply = (postId, replyId) => {
        setConfirmModal({
            isOpen: true,
            isLoading: false,
            type: 'reply',
            postId,
            replyId,
            title: 'Delete Reply?',
            message: 'This comment will be removed from the discussion thread.'
        });
    };

    const confirmDelete = async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
            if (confirmModal.type === 'post') {
                await api.delete(`/api/forum/${confirmModal.postId}`);
                setPosts((prev) => prev.filter((p) => p._id !== confirmModal.postId));
                toast.success('Discussion deleted');
            } else {
                const res = await api.delete(`/api/forum/${confirmModal.postId}/reply/${confirmModal.replyId}`);
                setPosts((prev) => prev.map((p) => p._id === confirmModal.postId ? res.data.data.post : p));
                toast.success('Reply removed');
            }
            setConfirmModal({ isOpen: false });
        } catch (err) {
            toast.error(`Failed to delete ${confirmModal.type}`);
        } finally {
            setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    // No more local filteredPosts - server handles it!
    const displayPosts = posts;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-wide">Loading discussions…</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-primary font-bold text-[10px] uppercase tracking-widest mb-4 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to course
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-secondary tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-primary" size={32} />
                        Discussion Forum
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-lg">
                        Connect with fellow learners and instructors of{' '}
                        <span className="text-primary font-bold">"{course?.title}"</span>. Ask questions, share insights, and grow together.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Type and press Enter to search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl w-full sm:w-64 md:w-80 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-sm inner-shadow"
                        />
                    </div>
                    <button
                        onClick={() => setIsNewPostModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Start Discussion
                    </button>
                </div>
            </header>

            {/* Posts List */}
            <div className="space-y-4">
                {displayPosts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                            <MessageCircle size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-xl font-bold text-secondary">
                            {searchQuery ? 'No matching discussions' : 'No Discussions Found'}
                        </h3>
                        <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
                            {searchQuery 
                                ? "We couldn't find anything matching your search. Try different keywords!" 
                                : "Be the first one to start a conversation in this course!"}
                        </p>
                        {!searchQuery && (
                                <button
                                onClick={() => setIsNewPostModalOpen(true)}
                                className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                            >
                                Post a Question
                            </button>
                        )}
                    </div>
                ) : (
                    displayPosts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUser={currentUser}
                            onLike={handleLikePost}
                            onDeletePost={handleDeletePost}
                            onReply={handleAddReply}
                            onDeleteReply={handleDeleteReply}
                            isReplying={isReplying}
                        />
                    ))
                )}

                {/* Load More Button */}
                {pagination.hasMore && (
                    <div className="flex justify-center pt-8">
                        <button
                            onClick={() => fetchForumData(pagination.currentPage + 1)}
                            disabled={loadingMore}
                            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all active:scale-95 shadow-sm disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Loading...</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={18} />
                                    <span>Load More Discussions</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* New Post Modal */}
            <AnimatePresence>
                {isNewPostModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !submitting && setIsNewPostModalOpen(false)}
                            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl"
                        >
                            <form onSubmit={handleCreatePost} className="p-8 md:p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Plus size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Start Discussion</h2>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                                                Share your thoughts with the community
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewPostModalOpen(false)}
                                        className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                            Discussion Subject
                                        </label>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="What would you like to discuss?"
                                            value={newPost.title}
                                            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-lg placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                            Detailed Content
                                        </label>
                                        <textarea
                                            rows="6"
                                            placeholder="Provide more context for your question or share your insights…"
                                            value={newPost.content}
                                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-600 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none leading-relaxed placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-1 text-slate-400">
                                            <Tag size={12} />
                                            <label className="text-[10px] font-black uppercase tracking-widest">Topic Tags</label>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g. question, react, bug — press Enter to add"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const tag = e.target.value.trim().replace(',', '');
                                                    if (tag) {
                                                        setNewPost({ ...newPost, tags: [...newPost.tags, tag] });
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                            className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-xs"
                                        />
                                        {newPost.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {newPost.tags.map((tag, i) => (
                                                    <span key={i} className="px-2 py-1 bg-primary text-[10px] font-black uppercase text-white rounded-md flex items-center gap-2">
                                                        {tag}
                                                        <X
                                                            size={10}
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                setNewPost({ ...newPost, tags: newPost.tags.filter((_, idx) => idx !== i) })
                                                            }
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewPostModalOpen(false)}
                                        className="flex-1 py-5 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !newPost.title || !newPost.content}
                                        className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                <span>Publish Discussion</span>
                                                <CheckCircle2 size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Modal */}
            <ConfirmDeleteModal
                isOpen={confirmModal.isOpen}
                isLoading={confirmModal.isLoading}
                title={confirmModal.title}
                message={confirmModal.message}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default CourseForum;
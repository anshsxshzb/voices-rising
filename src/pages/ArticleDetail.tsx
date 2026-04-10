import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticles, addComment, Article, useUserRole, incrementViewCount, toggleLike, calculateReadTime } from '../lib/storage';
import { Calendar, User, Share2, Code, MessageSquare, ArrowLeft, Eye, Heart } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { articles, loading } = useArticles();
  const [article, setArticle] = useState<Article | null>(null);
  const [commentText, setCommentText] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  
  const userRole = useUserRole();
  const username = localStorage.getItem('username') || 'Anonymous User';

  useEffect(() => {
    if (id && articles.length > 0) {
      const found = articles.find(a => a.id === id);
      if (found) setArticle(found);
    }
  }, [id, articles]);

  useEffect(() => {
    if (id && article && !loading) {
      const viewedArticles = JSON.parse(localStorage.getItem('viewedArticles') || '[]');
      if (!viewedArticles.includes(id)) {
        incrementViewCount(id, article.views || 0).catch(console.error);
        viewedArticles.push(id);
        localStorage.setItem('viewedArticles', JSON.stringify(viewedArticles));
      }
    }
  }, [id, article?.id, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-900 font-serif uppercase tracking-widest">Article not found</h2>
          <Link to="/articles" className="mt-6 text-xs font-bold uppercase tracking-widest text-red-800 hover:text-red-900 inline-block border-b border-red-800 pb-1">
            Return to all articles
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyMessage('Link copied to clipboard!');
    setTimeout(() => setCopyMessage(''), 3000);
  };

  const handleEmbed = () => {
    const embedCode = `<iframe src="${window.location.href}" width="100%" height="600px" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopyMessage('Embed code copied to clipboard!');
    setTimeout(() => setCopyMessage(''), 3000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    
    await addComment(id, {
      author: username,
      text: commentText.trim()
    }, article.comments);
    
    setCommentText('');
  };

  const handleLike = async () => {
    if (!userRole || userRole === 'pending') {
      alert('You must be an approved reader to like articles.');
      return;
    }
    const userEmail = auth.currentUser?.email;
    if (!userEmail || !id) return;
    
    await toggleLike(id, userEmail, article.likedBy || []);
  };

  const hasLiked = auth.currentUser?.email ? (article.likedBy || []).includes(auth.currentUser.email) : false;

  return (
    <div className="bg-[#FAFAFA] min-h-screen py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/articles" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 mb-12 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" /> Back to Articles
        </Link>
        
        <article>
          <header className="mb-16">
            <h1 className="text-5xl sm:text-7xl font-black text-zinc-900 font-serif mb-12 leading-none tracking-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-6 border-t border-b border-zinc-900 py-6">
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-zinc-900" />
                  <span className="text-zinc-900">{article.author}</span>
                </div>
                <span className="hidden sm:inline">&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <time dateTime={article.date}>
                    {new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                </div>
                <>
                  <span className="hidden sm:inline">&bull;</span>
                  <div className="flex items-center gap-1.5 text-red-800">
                    <span>{article.readTime || calculateReadTime(article.content)} min read</span>
                  </div>
                </>
                <span className="hidden sm:inline">&bull;</span>
                <div className="flex items-center gap-1.5" title="Views">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{article.views || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike} 
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors px-3 py-1.5 border rounded-none ${hasLiked ? 'bg-red-800 text-white border-red-800 hover:bg-red-900' : 'bg-transparent text-zinc-900 border-zinc-900 hover:bg-zinc-100'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} /> 
                  {article.likedBy?.length || 0}
                </button>
                <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 transition-colors bg-transparent px-3 py-1.5 border border-zinc-900 rounded-none">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button onClick={handleEmbed} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 transition-colors bg-transparent px-3 py-1.5 border border-zinc-900 rounded-none">
                  <Code className="w-3.5 h-3.5" /> Embed
                </button>
              </div>
            </div>
            {copyMessage && (
              <div className="mt-6 p-4 border border-zinc-900 bg-zinc-50 text-zinc-900 text-[10px] font-bold uppercase tracking-widest text-center">
                {copyMessage}
              </div>
            )}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 border border-zinc-300 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          <div className="prose prose-lg prose-zinc max-w-none text-zinc-800 whitespace-pre-wrap mb-24 font-serif leading-relaxed">
            {article.content}
          </div>
        </article>

        {/* Comments Section */}
        <section className="border-t border-zinc-900 pt-16">
          <div className="flex items-center gap-3 mb-12">
            <MessageSquare className="w-5 h-5 text-zinc-900" />
            <h2 className="text-2xl font-black text-zinc-900 font-serif uppercase tracking-widest">Comments</h2>
          </div>

          {(userRole === 'admin' || userRole === 'reader') ? (
            <form onSubmit={handleAddComment} className="mb-16">
              <label htmlFor="comment" className="sr-only">Add a comment</label>
              <textarea
                id="comment"
                rows={4}
                className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-4 border resize-none bg-transparent font-serif italic"
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
                >
                  Post Comment
                </button>
              </div>
            </form>
          ) : userRole === 'pending' ? (
            <div className="bg-transparent border border-zinc-900 p-8 text-center mb-16">
              <p className="text-zinc-600 font-serif italic">Your account is pending approval. You will be able to comment once an admin approves your request.</p>
            </div>
          ) : (
            <div className="bg-transparent border border-zinc-900 p-8 text-center mb-16">
              <p className="text-zinc-600 mb-6 font-serif italic">You must be logged in to leave a comment or share this article.</p>
              <Link to="/login" className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-red-800 hover:bg-red-900">
                Log in
              </Link>
            </div>
          )}

          <div className="space-y-8">
            {(!article.comments || article.comments.length === 0) ? (
              <p className="text-zinc-500 font-serif italic text-center py-8">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              article.comments.map((comment) => (
                <div key={comment.id} className="bg-transparent p-6 border border-zinc-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">{comment.author}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {new Date(comment.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-zinc-800 text-base whitespace-pre-wrap font-serif leading-relaxed">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

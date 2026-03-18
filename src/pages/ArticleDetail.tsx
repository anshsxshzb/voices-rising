import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticles, addComment, Article, useUserRole, incrementViewCount, toggleLike } from '../lib/storage';
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 font-serif">Article not found</h2>
          <Link to="/articles" className="mt-4 text-indigo-600 hover:text-indigo-800 inline-block">
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
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/articles" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Articles
        </Link>
        
        <article>
          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 font-serif mb-6 leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
              <div className="flex items-center gap-4 text-sm text-zinc-600">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-zinc-900">{article.author}</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <time dateTime={article.date}>
                    {new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5" title="Views">
                  <Eye className="h-4 w-4 text-zinc-400" />
                  <span>{article.views || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleLike} 
                  className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-full border ${hasLiked ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-indigo-200 hover:text-indigo-600'}`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} /> 
                  {article.likedBy?.length || 0}
                </button>
                <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-indigo-200">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button onClick={handleEmbed} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-indigo-200">
                  <Code className="w-4 h-4" /> Embed
                </button>
              </div>
            </div>
            {copyMessage && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm font-medium text-center">
                {copyMessage}
              </div>
            )}
          </header>
          
          <div className="prose prose-indigo prose-lg max-w-none text-zinc-700 whitespace-pre-wrap mb-16">
            {article.content}
          </div>
        </article>

        {/* Comments Section */}
        <section className="border-t border-zinc-200 pt-10">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquare className="w-6 h-6 text-zinc-900" />
            <h2 className="text-2xl font-bold text-zinc-900 font-serif">Comments</h2>
          </div>

          {(userRole === 'admin' || userRole === 'reader') ? (
            <form onSubmit={handleAddComment} className="mb-10">
              <label htmlFor="comment" className="sr-only">Add a comment</label>
              <textarea
                id="comment"
                rows={3}
                className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border resize-none"
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Post Comment
                </button>
              </div>
            </form>
          ) : userRole === 'pending' ? (
            <div className="bg-zinc-50 rounded-lg p-6 text-center mb-10 border border-zinc-200">
              <p className="text-zinc-600">Your account is pending approval. You will be able to comment once an admin approves your request.</p>
            </div>
          ) : (
            <div className="bg-zinc-50 rounded-lg p-6 text-center mb-10 border border-zinc-200">
              <p className="text-zinc-600 mb-4">You must be logged in to leave a comment or share this article.</p>
              <Link to="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Log in
              </Link>
            </div>
          )}

          <div className="space-y-6">
            {(!article.comments || article.comments.length === 0) ? (
              <p className="text-zinc-500 italic">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              article.comments.map((comment) => (
                <div key={comment.id} className="bg-zinc-50 rounded-lg p-5 border border-zinc-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-900">{comment.author}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(comment.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-zinc-700 text-sm whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

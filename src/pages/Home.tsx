import { Link } from 'react-router-dom';
import { useArticles, calculateReadTime } from '../lib/storage';
import { ArrowRight, BookOpen, Eye, Heart } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Home() {
  const { articles, loading } = useArticles();
  const publishedArticles = articles.filter(a => a.published).slice(0, 3);

  return (
    <div className="bg-[#FAFAFA]">
      {/* Hero Section */}
      <div className="relative border-b border-zinc-900">
        <div className="max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-black tracking-tighter text-zinc-900 sm:text-8xl lg:text-9xl font-serif uppercase">
            Voices Rising
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto font-serif italic">
            Empowering teenagers in India to write, reflect, and advocate for human rights. Your voice matters, your stories inspire change.
          </p>
          <div className="mt-12 flex justify-center gap-6">
            <Link
              to="/articles"
              className="inline-flex items-center px-8 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest text-white bg-zinc-900 hover:bg-zinc-800 rounded-none"
            >
              Read Articles
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center px-8 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-900 bg-transparent hover:bg-zinc-100 rounded-none"
            >
              Our Mission
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12 border-b border-zinc-900 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Featured Voices</h2>
          <Link to="/articles" className="text-red-800 hover:text-red-900 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
          </div>
        ) : publishedArticles.length === 0 ? (
          <p className="text-center text-zinc-500 py-12 font-serif italic">No articles published yet.</p>
        ) : (
          <div className="grid gap-12 lg:grid-cols-3">
            {publishedArticles.map((article) => (
              <div key={article.id} className="flex flex-col group">
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-800">
                        {new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {article.readTime || calculateReadTime(article.content)} min read
                      </p>
                    </div>
                    <Link to={`/articles/${article.id}`} className="block">
                      <h3 className="text-3xl font-black text-zinc-900 font-serif leading-tight group-hover:text-red-800 transition-colors">{article.title}</h3>
                      <p className="mt-4 text-base text-zinc-600 line-clamp-3 font-serif leading-relaxed">{article.preview}</p>
                    </Link>
                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 border border-zinc-300 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-8 pt-6 border-t border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-900">{article.author}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5" title="Views">
                        <Eye className="h-4 w-4" />
                        <span className="font-bold">{article.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Likes">
                        <Heart className="h-4 w-4" />
                        <span className="font-bold">{article.likedBy?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-zinc-900 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl font-serif">
            <span className="block">Ready to share your voice?</span>
            <span className="block text-red-500 mt-2 italic font-normal">Join our community of young writers.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 border border-white text-xs font-bold uppercase tracking-widest text-zinc-900 bg-white hover:bg-zinc-100 rounded-none transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-3" />
              Start Reading
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

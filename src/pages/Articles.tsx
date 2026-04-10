import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArticles, calculateReadTime } from '../lib/storage';
import { Calendar, User, ArrowRight, Eye, Heart, Search, Tag } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Articles() {
  const { articles, loading } = useArticles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const publishedArticles = articles.filter(a => a.published);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    publishedArticles.forEach(article => {
      article.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [publishedArticles]);

  const filteredArticles = useMemo(() => {
    return publishedArticles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag ? article.tags?.includes(selectedTag) : true;
      
      return matchesSearch && matchesTag;
    });
  }, [publishedArticles, searchQuery, selectedTag]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 border-b border-zinc-900 pb-12">
          <h1 className="text-5xl font-black text-zinc-900 font-serif sm:text-7xl uppercase tracking-tighter">All Articles</h1>
          <p className="mt-6 text-xl text-zinc-600 font-serif italic max-w-2xl mx-auto">
            Explore stories, essays, and reflections on human rights by teenagers across India.
          </p>
        </div>

        <div className="mb-16 space-y-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles by title, author, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-8 pr-3 py-3 border-0 border-b-2 border-zinc-900 bg-transparent text-zinc-900 placeholder-zinc-500 focus:ring-0 focus:border-red-800 sm:text-sm transition-colors font-serif italic"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1 mr-2">
                <Tag className="h-3 w-3" /> Filter by:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border rounded-none ${
                  selectedTag === null
                    ? 'border-red-800 bg-red-800 text-white'
                    : 'border-zinc-900 text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border rounded-none ${
                    selectedTag === tag
                      ? 'border-red-800 bg-red-800 text-white'
                      : 'border-zinc-900 text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-16">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 border-t border-b border-zinc-200">
              <Search className="h-8 w-8 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-900">No articles found</h3>
              <p className="mt-2 text-zinc-500 font-serif italic">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <article key={article.id} className="group border-b border-zinc-200 pb-16 last:border-0">
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-zinc-900">{article.author}</span>
                  </div>
                  <span className="hidden sm:inline">&bull;</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <time dateTime={article.date}>
                      {new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                  </div>
                  <>
                    <span className="hidden sm:inline">&bull;</span>
                    <div className="flex items-center gap-1 text-red-800">
                      <span>{article.readTime || calculateReadTime(article.content)} min read</span>
                    </div>
                  </>
                  <span className="hidden sm:inline">&bull;</span>
                  <div className="flex items-center gap-1" title="Views">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{article.views || 0}</span>
                  </div>
                  <span className="hidden sm:inline">&bull;</span>
                  <div className="flex items-center gap-1" title="Likes">
                    <Heart className="h-3.5 w-3.5" />
                    <span>{article.likedBy?.length || 0}</span>
                  </div>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 font-serif mb-4 leading-tight">
                  <Link to={`/articles/${article.id}`} className="hover:text-red-800 transition-colors">
                    {article.title}
                  </Link>
                </h2>
                
                <div className="prose prose-lg max-w-none text-zinc-600 mb-8 font-serif leading-relaxed">
                  <p>{article.preview}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Link
                    to={`/articles/${article.id}`}
                    className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-zinc-900 hover:text-red-800 transition-colors"
                  >
                    Read Full Article <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                  
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 border border-zinc-300 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

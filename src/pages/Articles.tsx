import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArticles, calculateReadTime } from '../lib/storage';
import { Calendar, User, ArrowRight, Eye, Heart, Search, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Articles() {
  const { articles, loading } = useArticles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_viewed' | 'most_liked'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const publishedArticles = articles.filter(a => a.published);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    publishedArticles.forEach(article => {
      article.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [publishedArticles]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag, sortBy]);

  const filteredAndSortedArticles = useMemo(() => {
    let result = publishedArticles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag ? article.tags?.includes(selectedTag) : true;
      
      return matchesSearch && matchesTag;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'most_viewed':
          return (b.views || 0) - (a.views || 0);
        case 'most_liked':
          return (b.likedBy?.length || 0) - (a.likedBy?.length || 0);
        case 'newest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [publishedArticles, searchQuery, selectedTag, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredAndSortedArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
            <div className="relative flex-1">
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
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="block w-full py-3 pl-3 pr-10 border-0 border-b-2 border-zinc-900 bg-transparent text-zinc-900 focus:ring-0 focus:border-red-800 sm:text-sm transition-colors font-bold uppercase tracking-widest text-[10px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_liked">Most Liked</option>
              </select>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1 mr-2">
                <Tag className="h-3 w-3" /> Filter by:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-3 sm:py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border rounded-none ${
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
                  className={`px-4 py-3 sm:py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border rounded-none ${
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
          ) : filteredAndSortedArticles.length === 0 ? (
            <div className="text-center py-16 border-t border-b border-zinc-200">
              <Search className="h-8 w-8 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-900">No articles found</h3>
              <p className="mt-2 text-zinc-500 font-serif italic">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              {paginatedArticles.map((article) => (
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
            ))}

            {totalPages > 1 && (
              <div className="mt-16 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-900 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 w-full sm:w-auto justify-center"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentPage(i + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 flex items-center justify-center border text-[10px] font-bold transition-colors ${
                        currentPage === i + 1
                          ? 'border-red-800 bg-red-800 text-white'
                          : 'border-zinc-900 text-zinc-900 hover:bg-zinc-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-900 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 w-full sm:w-auto justify-center"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

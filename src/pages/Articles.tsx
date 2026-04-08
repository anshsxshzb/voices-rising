import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../lib/storage';
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
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-zinc-900 font-serif sm:text-5xl">All Articles</h1>
          <p className="mt-4 text-xl text-zinc-500">
            Explore stories, essays, and reflections on human rights by teenagers across India.
          </p>
        </div>

        <div className="mb-12 space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles by title, author, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-zinc-300 rounded-xl leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:placeholder-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-shadow"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-zinc-500 flex items-center gap-1 mr-2">
                <Tag className="h-4 w-4" /> Filter by:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Search className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900">No articles found</h3>
              <p className="mt-2 text-zinc-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <article key={article.id} className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-zinc-900">{article.author}</span>
                  </div>
                  <span className="hidden sm:inline">&bull;</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={article.date}>
                      {new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                  </div>
                  {article.readTime && (
                    <>
                      <span className="hidden sm:inline">&bull;</span>
                      <div className="flex items-center gap-1 text-indigo-600 font-medium">
                        <span>{article.readTime} min read</span>
                      </div>
                    </>
                  )}
                  <span className="hidden sm:inline">&bull;</span>
                  <div className="flex items-center gap-1" title="Views">
                    <Eye className="h-4 w-4" />
                    <span>{article.views || 0}</span>
                  </div>
                  <span className="hidden sm:inline">&bull;</span>
                  <div className="flex items-center gap-1" title="Likes">
                    <Heart className="h-4 w-4" />
                    <span>{article.likedBy?.length || 0}</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-zinc-900 font-serif mb-4">
                  <Link to={`/articles/${article.id}`} className="hover:text-indigo-600 transition-colors">
                    {article.title}
                  </Link>
                </h2>
                
                <div className="prose prose-indigo max-w-none text-zinc-600 mb-6">
                  <p>{article.preview}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Link
                    to={`/articles/${article.id}`}
                    className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                  >
                    Read Full Article <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                  
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
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

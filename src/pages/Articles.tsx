import { Link } from 'react-router-dom';
import { useArticles } from '../lib/storage';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Articles() {
  const { articles, loading } = useArticles();
  const publishedArticles = articles.filter(a => a.published);

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-zinc-900 font-serif sm:text-5xl">All Articles</h1>
          <p className="mt-4 text-xl text-zinc-500">
            Explore stories, essays, and reflections on human rights by teenagers across India.
          </p>
        </div>

        <div className="space-y-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : publishedArticles.length === 0 ? (
            <p className="text-center text-zinc-500">No articles published yet.</p>
          ) : (
            publishedArticles.map((article) => (
              <article key={article.id} className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-zinc-900">{article.author}</span>
                  </div>
                  <span>&bull;</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={article.date}>
                      {new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
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
                
                <div>
                  <Link
                    to={`/articles/${article.id}`}
                    className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                  >
                    Read Full Article <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

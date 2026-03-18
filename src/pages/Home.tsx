import { Link } from 'react-router-dom';
import { useArticles } from '../lib/storage';
import { ArrowRight, BookOpen, Eye, Heart } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Home() {
  const { articles, loading } = useArticles();
  const publishedArticles = articles.filter(a => a.published).slice(0, 3);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Students writing"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-serif">
            Voices Rising
          </h1>
          <p className="mt-6 text-xl text-zinc-300 max-w-3xl">
            Empowering teenagers in India to write, reflect, and advocate for human rights. Your voice matters, your stories inspire change.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              to="/articles"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-zinc-900 bg-white hover:bg-zinc-50"
            >
              Read Articles
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Our Mission
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-extrabold text-zinc-900 font-serif">Featured Voices</h2>
          <Link to="/articles" className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : publishedArticles.length === 0 ? (
          <p className="text-center text-zinc-500 py-12">No articles published yet.</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {publishedArticles.map((article) => (
              <div key={article.id} className="flex flex-col rounded-lg shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600">
                      {new Date(article.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <Link to={`/articles/${article.id}`} className="block mt-2">
                      <p className="text-xl font-semibold text-zinc-900 font-serif">{article.title}</p>
                      <p className="mt-3 text-base text-zinc-500 line-clamp-3">{article.preview}</p>
                    </Link>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <span className="sr-only">{article.author}</span>
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {article.author.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-zinc-900">{article.author}</p>
                      <div className="flex space-x-1 text-sm text-zinc-500">
                        <span>Teen Writer</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1" title="Views">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{article.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Likes">
                        <Heart className="h-3.5 w-3.5" />
                        <span>{article.likedBy?.length || 0}</span>
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
      <div className="bg-indigo-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            <span className="block font-serif">Ready to share your voice?</span>
            <span className="block text-indigo-600 text-2xl mt-2">Join our community of young writers.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Start Reading
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

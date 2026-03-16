import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PenTool, User } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Navbar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const handleLogout = async () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <PenTool className="h-6 w-6 text-indigo-600" />
              <span className="font-serif text-xl font-bold text-zinc-900">Voices Rising</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/articles" className="border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                All Articles
              </Link>
              <Link to="/about" className="border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                About the Author
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {userRole ? (
              <div className="flex items-center gap-4">
                {userRole === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Admin Dashboard
                  </Link>
                )}
                <span className="text-sm text-zinc-500 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {userRole === 'admin' ? 'Admin' : 'Reader'}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

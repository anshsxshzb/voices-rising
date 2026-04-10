import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PenTool, User, Bell, Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useUserRole, useNotifications, markNotificationRead } from '../lib/storage';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const userRole = useUserRole();
  const notifications = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    sessionStorage.setItem('isLoggingOut', 'true');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.dispatchEvent(new Event('userRoleChanged'));
    await auth.signOut();
    navigate('/');
    setTimeout(() => {
      sessionStorage.removeItem('isLoggingOut');
    }, 1000);
  };

  return (
    <nav className="bg-[#FAFAFA] border-b border-zinc-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <PenTool className="h-5 w-5 text-red-800" />
              <span className="font-serif text-2xl font-black text-zinc-900 tracking-tight uppercase">Voices Rising</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link to="/" className="border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-xs font-bold uppercase tracking-widest">
                Home
              </Link>
              <Link to="/articles" className="border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-xs font-bold uppercase tracking-widest">
                All Articles
              </Link>
              <Link to="/about" className="border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-xs font-bold uppercase tracking-widest">
                About the Author
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden gap-4">
            {userRole && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-zinc-600 hover:text-zinc-900 focus:outline-none"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-[#FAFAFA]" />
                  )}
                </button>
                {showNotifications && (
                  <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-none border border-zinc-900 shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-zinc-200">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900">Notifications</h3>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-zinc-500">No notifications</p>
                        ) : (
                          notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`px-4 py-3 text-sm border-b border-zinc-100 cursor-pointer ${!notification.read ? 'bg-red-50' : ''}`}
                              onClick={() => {
                                if (!notification.read) markNotificationRead(notification.id).catch(console.error);
                              }}
                            >
                              <p className="text-zinc-800">{notification.message}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-zinc-900 hover:text-red-800 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {userRole ? (
              <div className="flex items-center gap-5">
                {userRole === 'admin' && (
                  <Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-red-800 hover:text-red-900">
                    Admin Dashboard
                  </Link>
                )}
                {userRole === 'writer' && (
                  <Link to="/writer" className="text-xs font-bold uppercase tracking-widest text-red-800 hover:text-red-900">
                    Writer Dashboard
                  </Link>
                )}
                {userRole === 'reader' && (
                  <Link to="/reader" className="text-xs font-bold uppercase tracking-widest text-red-800 hover:text-red-900">
                    Apply to Write
                  </Link>
                )}
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-1 text-zinc-600 hover:text-zinc-900 focus:outline-none"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-[#FAFAFA]" />
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-none border border-zinc-900 shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-zinc-200">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900">Notifications</h3>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-zinc-500">No notifications</p>
                          ) : (
                            notifications.map(notification => (
                              <div 
                                key={notification.id} 
                                className={`px-4 py-3 text-sm border-b border-zinc-100 cursor-pointer ${!notification.read ? 'bg-red-50' : ''}`}
                                onClick={() => {
                                  if (!notification.read) markNotificationRead(notification.id).catch(console.error);
                                }}
                              >
                                <p className="text-zinc-800">{notification.message}</p>
                                <p className="text-xs text-zinc-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {userRole === 'admin' ? 'Admin' : userRole === 'writer' ? 'Writer' : userRole === 'reader' ? 'Reader' : 'Pending'}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-2 inline-flex items-center px-4 py-1.5 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-5 py-2 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-[#FAFAFA] border-b border-zinc-900">
          <div className="pt-2 pb-4 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-sm font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-100 hover:border-zinc-900 hover:text-zinc-900"
            >
              Home
            </Link>
            <Link
              to="/articles"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-sm font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-100 hover:border-zinc-900 hover:text-zinc-900"
            >
              All Articles
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-sm font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-100 hover:border-zinc-900 hover:text-zinc-900"
            >
              About the Author
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t border-zinc-200">
            {userRole ? (
              <div className="space-y-1">
                <div className="px-4 py-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                  <User className="h-4 w-4" />
                  {userRole === 'admin' ? 'Admin' : userRole === 'writer' ? 'Writer' : userRole === 'reader' ? 'Reader' : 'Pending'}
                </div>
                {userRole === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-sm font-bold uppercase tracking-widest text-red-800 hover:bg-zinc-100 hover:border-red-800"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {userRole === 'writer' && (
                  <Link
                    to="/writer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-sm font-bold uppercase tracking-widest text-red-800 hover:bg-zinc-100 hover:border-red-800"
                  >
                    Writer Dashboard
                  </Link>
                )}
                {userRole === 'reader' && (
                  <Link
                    to="/reader"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-sm font-bold uppercase tracking-widest text-red-800 hover:bg-zinc-100 hover:border-red-800"
                  >
                    Apply to Write
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left block pl-3 pr-4 py-3 border-l-4 border-transparent text-sm font-bold uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 hover:border-zinc-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-4 py-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex justify-center items-center px-4 py-3 border border-zinc-900 text-sm font-bold uppercase tracking-widest rounded-none text-white bg-red-800 hover:bg-red-900"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

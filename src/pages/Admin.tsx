import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles, useReaders, useAccessRequests, addArticle, updateArticle, deleteArticle, Article, addReader, deleteReader, deleteAccessRequest } from '../lib/storage';
import { Edit2, Trash2, Plus, Check, X, Users, FileText, Bell } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'articles' | 'readers' | 'requests'>('articles');
  
  // Articles State
  const { articles, loading: articlesLoading } = useArticles();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Readers State
  const { readers, loading: readersLoading } = useReaders();
  const [isAddingReader, setIsAddingReader] = useState(false);
  const [readerForm, setReaderForm] = useState({ email: '' });
  const [readerError, setReaderError] = useState('');

  // Requests State
  const { requests, loading: requestsLoading } = useAccessRequests();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  // --- Article Handlers ---
  const handleEdit = (article: Article) => {
    setIsEditing(article.id);
    setEditForm(article);
  };

  const handleSave = async () => {
    if (isEditing) {
      await updateArticle(isEditing, editForm);
      setIsEditing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      await deleteArticle(id);
    }
  };

  const handleAdd = async () => {
    if (editForm.title && editForm.content && editForm.author) {
      await addArticle({
        title: editForm.title || '',
        content: editForm.content || '',
        author: editForm.author || '',
        date: new Date().toISOString().split('T')[0],
        preview: editForm.preview || editForm.content?.substring(0, 150) + '...',
        published: editForm.published || false,
      });
      setIsAdding(false);
      setEditForm({});
    } else {
      alert('Please fill in title, author, and content.');
    }
  };

  // --- Reader Handlers ---
  const handleAddReader = async () => {
    setReaderError('');
    if (readerForm.email) {
      try {
        await addReader(readerForm);
        setIsAddingReader(false);
        setReaderForm({ email: '' });
      } catch (err: any) {
        console.error(err);
        setReaderError(err.message || 'Failed to add reader.');
      }
    } else {
      setReaderError('Please fill in an email address.');
    }
  };

  const handleDeleteReader = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this reader account?')) {
      await deleteReader(id);
    }
  };

  // --- Request Handlers ---
  const handleApproveRequest = async (email: string) => {
    try {
      await addReader({ email });
      await deleteAccessRequest(email);
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert('Failed to approve request.');
    }
  };

  const handleDenyRequest = async (email: string) => {
    if (window.confirm('Are you sure you want to deny this request?')) {
      await deleteAccessRequest(email);
    }
  };

  return (
    <div className="bg-zinc-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-zinc-900 font-serif">Admin Dashboard</h1>
          
          <div className="flex bg-white rounded-lg shadow-sm border border-zinc-200 p-1">
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'articles' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'}`}
            >
              <FileText className="w-4 h-4 mr-2" /> Articles
            </button>
            <button
              onClick={() => setActiveTab('readers')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'readers' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'}`}
            >
              <Users className="w-4 h-4 mr-2" /> Readers
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'requests' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'}`}
            >
              <Bell className="w-4 h-4 mr-2" /> Requests
              {requests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'articles' && (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => { setIsAdding(true); setEditForm({ published: false }); }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </button>
            </div>

            {(isAdding || isEditing) && (
              <div className="bg-white shadow-sm rounded-lg p-6 mb-8 border border-zinc-200">
                <h2 className="text-xl font-bold text-zinc-900 mb-4 font-serif">
                  {isAdding ? 'Add New Article' : 'Edit Article'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">Author</label>
                    <input
                      type="text"
                      value={editForm.author || ''}
                      onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                      className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">Preview</label>
                    <textarea
                      value={editForm.preview || ''}
                      onChange={e => setEditForm({ ...editForm, preview: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">Content</label>
                    <textarea
                      value={editForm.content || ''}
                      onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                      rows={6}
                      className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="published"
                      type="checkbox"
                      checked={editForm.published || false}
                      onChange={e => setEditForm({ ...editForm, published: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300 rounded"
                    />
                    <label htmlFor="published" className="ml-2 block text-sm text-zinc-900">
                      Published
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => { setIsAdding(false); setIsEditing(null); setEditForm({}); }}
                      className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50"
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </button>
                    <button
                      onClick={isAdding ? handleAdd : handleSave}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Check className="h-4 w-4 mr-2" /> Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-zinc-200 overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Author</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {articlesLoading ? (
                    <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-zinc-500">Loading...</td></tr>
                  ) : articles.map((article) => (
                    <tr key={article.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{article.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{article.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{article.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${article.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {article.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(article)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(article.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'readers' && (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsAddingReader(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Reader
              </button>
            </div>

            {isAddingReader && (
              <div className="bg-white shadow-sm rounded-lg p-6 mb-8 border border-zinc-200 max-w-md">
                <h2 className="text-xl font-bold text-zinc-900 mb-4 font-serif">Add New Reader</h2>
                {readerError && <p className="text-red-600 text-sm mb-4">{readerError}</p>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">Email Address</label>
                    <input
                      type="email"
                      value={readerForm.email}
                      onChange={e => setReaderForm({ ...readerForm, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => { setIsAddingReader(false); setReaderForm({ email: '' }); setReaderError(''); }}
                      className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50"
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </button>
                    <button
                      onClick={handleAddReader}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Check className="h-4 w-4 mr-2" /> Save Reader
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-zinc-200 overflow-hidden max-w-3xl">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {readersLoading ? (
                    <tr><td colSpan={2} className="px-6 py-4 text-center text-sm text-zinc-500">Loading...</td></tr>
                  ) : readers.map((reader) => (
                    <tr key={reader.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{reader.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleDeleteReader(reader.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900 font-serif">Pending Access Requests</h2>
              <p className="text-sm text-zinc-500 mt-1">Users who have signed in and are waiting for approval to comment.</p>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-zinc-200 overflow-hidden max-w-4xl">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date Requested</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {requestsLoading ? (
                    <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-zinc-500">Loading...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500">No pending requests.</td></tr>
                  ) : requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{request.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{request.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {new Date(request.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleApproveRequest(request.email)} className="text-green-600 hover:text-green-900 mr-4 font-semibold">
                          Approve
                        </button>
                        <button onClick={() => handleDenyRequest(request.email)} className="text-red-600 hover:text-red-900 font-semibold">
                          Deny
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

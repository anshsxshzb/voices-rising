import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles, useReaders, useAccessRequests, useWriterApplications, addArticle, updateArticle, deleteArticle, Article, addReader, deleteReader, deleteAccessRequest, denyAccessRequest, updateReaderRole, addNotification, updateWriterApplicationStatus } from '../lib/storage';
import { Edit2, Trash2, Plus, Check, X, Users, FileText, Bell, AlertCircle } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'articles' | 'readers' | 'requests' | 'writer_applications'>('articles');
  const [articleFilter, setArticleFilter] = useState<'all' | 'published' | 'pending' | 'draft' | 'rejected'>('all');
  const [readerSearch, setReaderSearch] = useState('');
  
  // Articles State
  const { articles, loading: articlesLoading } = useArticles();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingArticleId, setRejectingArticleId] = useState<string | null>(null);

  // Readers State
  const { readers, loading: readersLoading } = useReaders();
  const [isAddingReader, setIsAddingReader] = useState(false);
  const [readerForm, setReaderForm] = useState({ email: '', role: 'reader' as 'reader' | 'writer' });
  const [readerError, setReaderError] = useState('');

  // Requests State
  const { requests, loading: requestsLoading } = useAccessRequests();
  const { applications: writerApplications, loading: writerApplicationsLoading } = useWriterApplications();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const filteredReaders = readers.filter(reader => 
    reader.email.toLowerCase().includes(readerSearch.toLowerCase()) || 
    (reader.displayName && reader.displayName.toLowerCase().includes(readerSearch.toLowerCase()))
  );

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
      const isPublished = editForm.published || false;
      await addArticle({
        title: editForm.title || '',
        content: editForm.content || '',
        author: editForm.author || '',
        date: new Date().toISOString().split('T')[0],
        preview: editForm.preview || editForm.content?.substring(0, 150) + '...',
        published: isPublished,
        status: isPublished ? 'published' : 'draft',
      });
      setIsAdding(false);
      setEditForm({});
    } else {
      alert('Please fill in title, author, and content.');
    }
  };

  const handleApproveArticle = async (article: Article) => {
    await updateArticle(article.id, { status: 'published', published: true });
    if (article.authorEmail) {
      await addNotification({
        userEmail: article.authorEmail,
        message: `Your article "${article.title}" has been approved and published!`,
        type: 'approved',
        articleId: article.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleRejectArticle = async (article: Article) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    await updateArticle(article.id, { status: 'rejected', rejectionReason: rejectReason });
    if (article.authorEmail) {
      await addNotification({
        userEmail: article.authorEmail,
        message: `Your article "${article.title}" was rejected. Reason: ${rejectReason}`,
        type: 'rejected',
        articleId: article.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
    setRejectingArticleId(null);
    setRejectReason('');
  };

  // --- Reader Handlers ---
  const handleAddReader = async () => {
    setReaderError('');
    if (readerForm.email) {
      try {
        await addReader({ ...readerForm, email: readerForm.email.toLowerCase() });
        setIsAddingReader(false);
        setReaderForm({ email: '', role: 'reader' });
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
  const handleApproveRequest = async (request: any) => {
    try {
      await addReader({ 
        email: request.email.toLowerCase(),
        displayName: request.name,
        photoURL: request.photoURL
      });
      await deleteAccessRequest(request.email.toLowerCase());
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert('Failed to approve request.');
    }
  };

  const handleDenyRequest = async (email: string) => {
    if (window.confirm('Are you sure you want to deny this request?')) {
      await denyAccessRequest(email.toLowerCase());
    }
  };

  const handleApproveWriterApplication = async (application: any) => {
    try {
      await updateReaderRole(application.email.toLowerCase(), 'writer');
      await updateWriterApplicationStatus(application.email.toLowerCase(), 'approved');
      await addNotification({
        userEmail: application.email.toLowerCase(),
        message: 'Your application to become a writer has been approved!',
        type: 'approved',
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to approve writer application:', err);
      alert('Failed to approve writer application.');
    }
  };

  const handleRejectWriterApplication = async (email: string) => {
    if (window.confirm('Are you sure you want to reject this writer application?')) {
      try {
        await updateWriterApplicationStatus(email.toLowerCase(), 'rejected');
        await addNotification({
          userEmail: email.toLowerCase(),
          message: 'Your application to become a writer has been declined.',
          type: 'rejected',
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to reject writer application:', err);
        alert('Failed to reject writer application.');
      }
    }
  };

  const filteredArticles = articles.filter(article => {
    if (articleFilter === 'all') return true;
    const status = article.status || (article.published ? 'published' : 'draft');
    return status === articleFilter;
  });

  return (
    <div className="bg-[#FAFAFA] min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 border-b border-zinc-900 pb-8 gap-4">
          <h1 className="text-4xl font-black text-zinc-900 font-serif uppercase tracking-widest">Admin Dashboard</h1>
          
          <div className="flex space-x-4 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'articles' ? 'border-red-800 text-red-800' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'}`}
            >
              <FileText className="w-4 h-4 mr-2" /> Articles
            </button>
            <button
              onClick={() => setActiveTab('readers')}
              className={`flex items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'readers' ? 'border-red-800 text-red-800' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'}`}
            >
              <Users className="w-4 h-4 mr-2" /> Readers
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'requests' ? 'border-red-800 text-red-800' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'}`}
            >
              <Bell className="w-4 h-4 mr-2" /> Requests
              {requests.length > 0 && (
                <span className="ml-2 bg-red-800 text-white py-0.5 px-2 rounded-none text-[10px]">
                  {requests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('writer_applications')}
              className={`flex items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'writer_applications' ? 'border-red-800 text-red-800' : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'}`}
            >
              <FileText className="w-4 h-4 mr-2" /> Writer Apps
              {writerApplications.filter(app => app.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-800 text-white py-0.5 px-2 rounded-none text-[10px]">
                  {writerApplications.filter(app => app.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'articles' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
              <div className="flex space-x-3 overflow-x-auto pb-2 sm:pb-0">
                {(['all', 'published', 'pending', 'draft', 'rejected'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setArticleFilter(filter)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors border rounded-none ${
                      articleFilter === filter 
                        ? 'border-red-800 bg-red-800 text-white' 
                        : 'border-zinc-900 text-zinc-900 bg-transparent hover:bg-zinc-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setIsAdding(true); setEditForm({ published: false, status: 'draft' }); }}
                className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </button>
            </div>

            {(isAdding || isEditing) && (
              <div className="bg-transparent border border-zinc-900 p-8 mb-12">
                <h2 className="text-2xl font-black text-zinc-900 mb-8 font-serif uppercase tracking-widest">
                  {isAdding ? 'Add New Article' : 'Edit Article'}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Author</label>
                    <input
                      type="text"
                      value={editForm.author || ''}
                      onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                      className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Preview</label>
                    <textarea
                      value={editForm.preview || ''}
                      onChange={e => setEditForm({ ...editForm, preview: e.target.value })}
                      rows={2}
                      className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Content</label>
                    <textarea
                      value={editForm.content || ''}
                      onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                      rows={6}
                      className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="published"
                      type="checkbox"
                      checked={editForm.published || false}
                      onChange={e => setEditForm({ ...editForm, published: e.target.checked, status: e.target.checked ? 'published' : 'draft' })}
                      className="h-4 w-4 text-red-800 focus:ring-red-800 border-zinc-900 rounded-none bg-transparent"
                    />
                    <label htmlFor="published" className="ml-3 block text-[10px] font-bold uppercase tracking-widest text-zinc-900">
                      Published
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button
                      onClick={() => { setIsAdding(false); setIsEditing(null); setEditForm({}); }}
                      className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-zinc-900 bg-transparent hover:bg-zinc-100"
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </button>
                    <button
                      onClick={isAdding ? handleAdd : handleSave}
                      className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800"
                    >
                      <Check className="h-4 w-4 mr-2" /> Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-transparent border border-zinc-900 overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-900">
                <thead className="bg-zinc-100 border-b border-zinc-900">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Title</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Author</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Date</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Status</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-zinc-200">
                  {articlesLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">Loading...</td></tr>
                  ) : filteredArticles.map((article) => {
                    const status = article.status || (article.published ? 'published' : 'draft');
                    return (
                    <tr key={article.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-zinc-900">
                        <span className="font-serif text-lg font-bold">{article.title}</span>
                        {status === 'rejected' && article.rejectionReason && (
                          <p className="text-xs text-red-800 mt-2 truncate max-w-xs font-serif italic whitespace-normal">Reason: {article.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-zinc-500">{article.author}</td>
                      <td className="px-6 py-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-zinc-500">{article.date}</td>
                      <td className="px-6 py-6 whitespace-nowrap text-sm text-zinc-500">
                        <span className={`px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-widest border rounded-none
                          ${status === 'published' ? 'border-zinc-900 bg-zinc-900 text-white' : 
                            status === 'pending' ? 'border-zinc-900 bg-zinc-100 text-zinc-900' :
                            status === 'rejected' ? 'border-red-800 bg-red-50 text-red-800' :
                            'border-zinc-300 bg-transparent text-zinc-600'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-4">
                          {status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveArticle(article)} className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors" title="Approve">
                                <Check className="h-5 w-5" />
                              </button>
                              <button onClick={() => setRejectingArticleId(article.id)} className="p-2 text-red-800 hover:text-red-900 transition-colors" title="Reject">
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleEdit(article)} className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(article.id)} className="p-2 text-red-800 hover:text-red-900 transition-colors">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {rejectingArticleId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#FAFAFA] p-8 border border-zinc-900 max-w-md w-full">
                  <h3 className="text-2xl font-black mb-6 font-serif uppercase tracking-widest">Reject Article</h3>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    className="w-full border-zinc-900 focus:border-red-800 focus:ring-0 p-3 mb-6 bg-transparent font-serif italic"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-4">
                    <button onClick={() => { setRejectingArticleId(null); setRejectReason(''); }} className="px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-zinc-900 bg-transparent hover:bg-zinc-100">Cancel</button>
                    <button onClick={() => handleRejectArticle(articles.find(a => a.id === rejectingArticleId)!)} className="px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-red-800 hover:bg-red-900">Reject</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'readers' && (
          <>
            <div className="flex justify-between items-center mb-12">
              <div className="max-w-md w-full mr-4">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={readerSearch}
                  onChange={(e) => setReaderSearch(e.target.value)}
                  className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                />
              </div>
              <button
                onClick={() => setIsAddingReader(true)}
                className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                New User
              </button>
            </div>

            {isAddingReader && (
              <div className="bg-transparent border border-zinc-900 p-8 mb-12 max-w-md">
                <h2 className="text-2xl font-black text-zinc-900 mb-6 font-serif uppercase tracking-widest">Add New User</h2>
                {readerError && <p className="text-red-800 text-[10px] font-bold uppercase tracking-widest mb-6">{readerError}</p>}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={readerForm.email}
                      onChange={e => setReaderForm({ ...readerForm, email: e.target.value })}
                      className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Role</label>
                    <select
                      value={readerForm.role}
                      onChange={e => setReaderForm({ ...readerForm, role: e.target.value as 'reader' | 'writer' })}
                      className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                    >
                      <option value="reader">Reader</option>
                      <option value="writer">Writer</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button
                      onClick={() => { setIsAddingReader(false); setReaderForm({ email: '', role: 'reader' }); setReaderError(''); }}
                      className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-zinc-900 bg-transparent hover:bg-zinc-100"
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </button>
                    <button
                      onClick={handleAddReader}
                      className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800"
                    >
                      <Check className="h-4 w-4 mr-2" /> Save User
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-transparent border border-zinc-900 overflow-x-auto max-w-4xl">
              <table className="min-w-full divide-y divide-zinc-900">
                <thead className="bg-zinc-100 border-b border-zinc-900">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">User</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Role</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-zinc-200">
                  {readersLoading ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">Loading...</td></tr>
                  ) : filteredReaders.map((reader) => (
                    <tr key={reader.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {reader.photoURL ? (
                              <img className="h-10 w-10 rounded-none grayscale border border-zinc-900" src={reader.photoURL} alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-10 w-10 rounded-none border border-zinc-900 bg-zinc-100 flex items-center justify-center">
                                <span className="text-zinc-900 font-bold font-serif">{reader.displayName ? reader.displayName.charAt(0).toUpperCase() : reader.email.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold font-serif text-zinc-900">{reader.displayName || 'Unknown Name'}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{reader.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-sm text-zinc-500">
                        <select
                          value={reader.role || 'reader'}
                          onChange={(e) => updateReaderRole(reader.email.toLowerCase(), e.target.value as 'reader' | 'writer')}
                          className="rounded-none border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-2 border bg-transparent font-serif italic"
                        >
                          <option value="reader">Reader</option>
                          <option value="writer">Writer</option>
                        </select>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-4">
                          <button onClick={() => handleDeleteReader(reader.id)} className="p-2 text-red-800 hover:text-red-900 transition-colors" title="Delete">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
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
            <div className="mb-12">
              <h2 className="text-2xl font-black text-zinc-900 font-serif uppercase tracking-widest">Pending Access Requests</h2>
              <p className="text-sm text-zinc-600 mt-2 font-serif italic">Users who have signed in and are waiting for approval to comment.</p>
            </div>

            <div className="bg-transparent border border-zinc-900 overflow-x-auto max-w-4xl">
              <table className="min-w-full divide-y divide-zinc-900">
                <thead className="bg-zinc-100 border-b border-zinc-900">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Email</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Date Requested</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-zinc-200">
                  {requestsLoading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">Loading...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">No pending requests.</td></tr>
                  ) : requests.map((request) => (
                    <tr key={request.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {request.photoURL ? (
                              <img className="h-10 w-10 rounded-none grayscale border border-zinc-900" src={request.photoURL} alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-10 w-10 rounded-none border border-zinc-900 bg-zinc-100 flex items-center justify-center">
                                <span className="text-zinc-900 font-bold font-serif">{request.name ? request.name.charAt(0).toUpperCase() : request.email.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold font-serif text-zinc-900">{request.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-zinc-500">{request.email}</td>
                      <td className="px-6 py-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {new Date(request.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-4">
                          <button onClick={() => handleApproveRequest(request)} className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors" title="Approve">
                            <Check className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDenyRequest(request.email)} className="p-2 text-red-800 hover:text-red-900 transition-colors" title="Deny">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'writer_applications' && (
          <>
            <div className="mb-12">
              <h2 className="text-2xl font-black text-zinc-900 font-serif uppercase tracking-widest">Writer Applications</h2>
              <p className="text-sm text-zinc-600 mt-2 font-serif italic">Review applications from readers who want to become writers.</p>
            </div>

            <div className="bg-transparent border border-zinc-900 overflow-x-auto max-w-5xl">
              <table className="min-w-full divide-y divide-zinc-900">
                <thead className="bg-zinc-100 border-b border-zinc-900">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">User</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Reason</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Status</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-zinc-200">
                  {writerApplicationsLoading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">Loading...</td></tr>
                  ) : writerApplications.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">No writer applications.</td></tr>
                  ) : writerApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {app.photoURL ? (
                              <img className="h-10 w-10 rounded-none grayscale border border-zinc-900" src={app.photoURL} alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-10 w-10 rounded-none border border-zinc-900 bg-zinc-100 flex items-center justify-center">
                                <span className="text-zinc-900 font-bold font-serif">{app.name ? app.name.charAt(0).toUpperCase() : app.email.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold font-serif text-zinc-900">{app.name}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{app.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm text-zinc-800 max-w-md font-serif leading-relaxed">
                        <p className="line-clamp-3">{app.reason}</p>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-sm text-zinc-500">
                        <span className={`px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-widest border rounded-none
                          ${app.status === 'approved' ? 'border-zinc-900 bg-zinc-900 text-white' : 
                            app.status === 'pending' ? 'border-zinc-900 bg-zinc-100 text-zinc-900' :
                            'border-red-800 bg-red-50 text-red-800'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                        {app.status === 'pending' && (
                          <div className="flex justify-end gap-4">
                            <button onClick={() => handleApproveWriterApplication(app)} className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors" title="Approve">
                              <Check className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleRejectWriterApplication(app.email)} className="p-2 text-red-800 hover:text-red-900 transition-colors" title="Reject">
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        )}
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

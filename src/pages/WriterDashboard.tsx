import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWriterArticles, addArticle, updateArticle, deleteArticle, Article, calculateReadTime } from '../lib/storage';
import { Edit2, Trash2, Plus, Check, X, Send } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function WriterDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'pending' | 'draft' | 'rejected'>('all');
  
  const { articles, loading: articlesLoading } = useWriterArticles();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [tagsInput, setTagsInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'writer') {
      navigate('/login');
    }
  }, [navigate]);

  const handleEdit = (article: Article) => {
    setIsEditing(article.id);
    setEditForm(article);
    setTagsInput(article.tags?.join(', ') || '');
  };

  const handleSave = async () => {
    if (isEditing) {
      // Writers can't change status to published directly when editing
      const updateData = { ...editForm };
      
      updateData.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      if (updateData.content) {
        updateData.readTime = calculateReadTime(updateData.content);
      }

      if (updateData.status === 'published') {
        // If it was already published, they can edit content but it stays published
      } else if (updateData.status === 'pending') {
         // keep it pending
      } else {
         updateData.status = 'draft';
      }
      await updateArticle(isEditing, updateData);
      setIsEditing(null);
      setTagsInput('');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      await deleteArticle(id);
    }
  };

  const handleAdd = async () => {
    if (editForm.title && editForm.content) {
      const username = localStorage.getItem('username') || 'Writer';
      const email = auth.currentUser?.email?.toLowerCase() || '';
      
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const readTime = calculateReadTime(editForm.content);

      await addArticle({
        title: editForm.title || '',
        content: editForm.content || '',
        author: username,
        authorEmail: email,
        date: new Date().toISOString().split('T')[0],
        preview: editForm.preview || editForm.content?.substring(0, 150) + '...',
        published: false,
        status: 'draft',
        tags,
        readTime,
      });
      setIsAdding(false);
      setEditForm({});
      setTagsInput('');
    } else {
      alert('Please fill in title and content.');
    }
  };

  const handleSubmitForApproval = async (article: Article) => {
    if (window.confirm('Submit this article for admin approval?')) {
      await updateArticle(article.id, { status: 'pending', published: false });
    }
  };

  const filteredArticles = articles.filter(a => {
    if (activeTab === 'all') return true;
    const status = a.status || (a.published ? 'published' : 'draft');
    return status === activeTab;
  });

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-zinc-900 font-serif">Writer Dashboard</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
            {(['all', 'published', 'pending', 'draft', 'rejected'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveTab(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
                  activeTab === filter 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setIsAdding(true); setEditForm({ status: 'draft' }); setTagsInput(''); }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Draft
          </button>
        </div>

        {(isAdding || isEditing) && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8 border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-4 font-serif">
              {isAdding ? 'Create New Draft' : 'Edit Article'}
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
                <label className="block text-sm font-medium text-zinc-700">Preview</label>
                <textarea
                  value={editForm.preview || ''}
                  onChange={e => setEditForm({ ...editForm, preview: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="e.g. human rights, education, youth"
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
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setIsAdding(false); setIsEditing(null); setEditForm({}); setTagsInput(''); }}
                  className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50"
                >
                  <X className="h-4 w-4 mr-2" /> Cancel
                </button>
                <button
                  onClick={isAdding ? handleAdd : handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Check className="h-4 w-4 mr-2" /> Save Draft
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {articlesLoading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-zinc-500">Loading...</td></tr>
              ) : filteredArticles.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-zinc-500">No articles found.</td></tr>
              ) : filteredArticles.map((article) => {
                const status = article.status || (article.published ? 'published' : 'draft');
                return (
                <tr key={article.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                    <div className="flex flex-col">
                      <span>{article.title}</span>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {article.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {status === 'rejected' && article.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 truncate max-w-xs">Reason: {article.rejectionReason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {article.date}
                    {article.readTime && <div className="text-xs mt-1">{article.readTime} min read</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${status === 'published' ? 'bg-green-100 text-green-800' : 
                        status === 'pending' ? 'bg-blue-100 text-blue-800' :
                        status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {(status === 'draft' || status === 'rejected') && (
                      <button onClick={() => handleSubmitForApproval(article)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Submit for Approval">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(article)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {(status === 'draft' || status === 'rejected') && (
                      <button onClick={() => handleDelete(article.id)} className="text-red-600 hover:text-red-900" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

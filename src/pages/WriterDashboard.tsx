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
    <div className="min-h-screen bg-[#FAFAFA] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 border-b border-zinc-900 pb-8 gap-4">
          <h1 className="text-4xl font-black text-zinc-900 font-serif uppercase tracking-widest">Writer Dashboard</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div className="flex space-x-3 overflow-x-auto pb-2 sm:pb-0">
            {(['all', 'published', 'pending', 'draft', 'rejected'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveTab(filter)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors border rounded-none ${
                  activeTab === filter 
                    ? 'border-red-800 bg-red-800 text-white' 
                    : 'border-zinc-900 text-zinc-900 bg-transparent hover:bg-zinc-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setIsAdding(true); setEditForm({ status: 'draft' }); setTagsInput(''); }}
            className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Draft
          </button>
        </div>

        {(isAdding || isEditing) && (
          <div className="bg-transparent border border-zinc-900 p-8 mb-12">
            <h2 className="text-2xl font-black text-zinc-900 mb-8 font-serif uppercase tracking-widest">
              {isAdding ? 'Create New Draft' : 'Edit Article'}
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Preview</label>
                <textarea
                  value={editForm.preview || ''}
                  onChange={e => setEditForm({ ...editForm, preview: e.target.value })}
                  rows={2}
                  className="block w-full border-zinc-900 focus:border-red-800 focus:ring-0 sm:text-sm p-3 border bg-transparent font-serif italic"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="e.g. human rights, education, youth"
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
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => { setIsAdding(false); setIsEditing(null); setEditForm({}); setTagsInput(''); }}
                  className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-zinc-900 bg-transparent hover:bg-zinc-100"
                >
                  <X className="h-4 w-4 mr-2" /> Cancel
                </button>
                <button
                  onClick={isAdding ? handleAdd : handleSave}
                  className="inline-flex items-center px-6 py-3 border border-zinc-900 text-xs font-bold uppercase tracking-widest rounded-none text-white bg-zinc-900 hover:bg-zinc-800"
                >
                  <Check className="h-4 w-4 mr-2" /> Save Draft
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-transparent border border-zinc-900 overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-900">
            <thead className="bg-zinc-100 border-b border-zinc-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Title</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Status</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-zinc-200">
              {articlesLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">Loading...</td></tr>
              ) : filteredArticles.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500 font-serif italic">No articles found.</td></tr>
              ) : filteredArticles.map((article) => {
                const status = article.status || (article.published ? 'published' : 'draft');
                return (
                <tr key={article.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-zinc-900">
                    <div className="flex flex-col">
                      <span className="font-serif text-lg font-bold">{article.title}</span>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {article.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 border border-zinc-300 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {status === 'rejected' && article.rejectionReason && (
                        <p className="text-xs text-red-800 mt-2 truncate max-w-xs font-serif italic">Reason: {article.rejectionReason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {article.date}
                    {article.readTime && <div className="mt-1">{article.readTime} min read</div>}
                  </td>
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
                    {(status === 'draft' || status === 'rejected') && (
                      <button onClick={() => handleSubmitForApproval(article)} className="text-zinc-600 hover:text-zinc-900 mr-4 transition-colors" title="Submit for Approval">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(article)} className="text-zinc-600 hover:text-zinc-900 mr-4 transition-colors" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {(status === 'draft' || status === 'rejected') && (
                      <button onClick={() => handleDelete(article.id)} className="text-red-800 hover:text-red-900 transition-colors" title="Delete">
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

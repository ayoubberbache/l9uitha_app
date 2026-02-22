import React, { useState, useEffect } from 'react';
import { 
  Search, 
  PlusCircle, 
  Package, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  X, 
  Send, 
  Cpu, 
  Zap,
  Loader2,
  CheckCircle2,
  BrainCircuit,
  LogIn,
  UserPlus,
  LogOut,
  Camera,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Item, NewItem, User } from './types';
import { askGemini } from './services/geminiService';

const LOGO_URL = "https://ais-dev-q4ryc6i4h2jq7msbl5knty-175907162751.europe-west2.run.app/logo.png"; // Placeholder for the provided image

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('l9uitha_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [highThinking, setHighThinking] = useState(false);

  const [newItem, setNewItem] = useState<NewItem>({
    type: 'lost',
    title: '',
    description: '',
    category: 'Electronics',
    location: '',
    date: new Date().toISOString().split('T')[0],
    contact_info: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [filter, searchQuery, user]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);
      if (searchQuery) params.append('q', searchQuery);
      
      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('l9uitha_user', JSON.stringify(data));
      } else {
        setAuthError(data.error);
      }
    } catch (error) {
      setAuthError('Connection failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('l9uitha_user');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, user_id: user.id, image_data: imagePreview }),
      });
      
      if (res.ok) {
        setIsReporting(false);
        fetchItems();
        setNewItem({
          type: 'lost',
          title: '',
          description: '',
          category: 'Electronics',
          location: '',
          date: new Date().toISOString().split('T')[0],
          contact_info: '',
        });
        setImagePreview(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to post item'}`);
      }
    } catch (error) {
      console.error('Failed to report item:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const context = items.map(i => `${i.type}: ${i.title} at ${i.location}`).join(', ');
      const aiResponse = await askGemini(userMsg, context, highThinking);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse || "I'm not sure how to respond to that." }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'ai', text: "System error! My circuits are fried." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const resolveItem = async (id: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/items/${id}/resolve`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      if (res.ok) {
        fetchItems();
      } else {
        alert("Only the creator can resolve this post!");
      }
    } catch (error) {
      console.error('Failed to resolve item:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen tech-bg flex items-center justify-center p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white cartoon-border w-full max-w-md p-8 text-center"
        >
          <div className="mb-6 relative inline-block">
            <div className="bg-brand-yellow p-4 rounded-full border-4 border-brand-black">
              <svg viewBox="0 0 100 100" className="w-16 h-16">
                <circle cx="45" cy="45" r="30" fill="#A5D8FF" stroke="#2D2D2D" strokeWidth="6" />
                <line x1="65" y1="65" x2="85" y2="85" stroke="#2D2D2D" strokeWidth="10" strokeLinecap="round" />
                <circle cx="35" cy="35" r="3" fill="black" />
                <circle cx="55" cy="35" r="3" fill="black" />
                <path d="M35 55 Q45 65 55 55" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute -top-4 -right-4 bg-brand-pink text-white text-xs font-bold px-2 py-1 cartoon-border rounded-full">
              RE2SD
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 tracking-tighter uppercase italic">
            L9uitha<span className="text-brand-orange">.re2sd</span>
          </h1>
          <p className="text-gray-500 text-sm mb-8 font-medium">
            For Higher National School RE2SD Students
          </p>

          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 font-bold cartoon-button transition-all ${authMode === 'login' ? 'bg-brand-yellow' : 'bg-white'}`}
            >
              LOGIN
            </button>
            <button 
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 font-bold cartoon-button transition-all ${authMode === 'register' ? 'bg-brand-orange text-white' : 'bg-white'}`}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">School Email</label>
              <input 
                required
                type="email" 
                placeholder="student@hns-re2sd.dz"
                className="w-full p-3 cartoon-border focus:outline-none text-sm"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Password</label>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                className="w-full p-3 cartoon-border focus:outline-none text-sm"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
              />
            </div>
            {authError && (
              <div className="text-red-500 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                {authError}
              </div>
            )}
            <button 
              type="submit"
              className="w-full py-4 bg-brand-black text-white font-bold cartoon-button text-lg uppercase flex items-center justify-center gap-2"
            >
              {authMode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {authMode === 'login' ? 'Enter Platform' : 'Create Account'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen tech-bg relative overflow-x-hidden">
      {/* Header */}
      <header className="bg-brand-yellow border-b-4 border-brand-black p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-xl border-4 border-brand-black rotate-3 overflow-hidden w-16 h-16 flex items-center justify-center relative">
               {/* Custom Magnifying Glass Character SVG */}
               <svg viewBox="0 0 100 100" className="w-12 h-12">
                 <circle cx="45" cy="45" r="30" fill="#A5D8FF" stroke="#2D2D2D" strokeWidth="6" />
                 <line x1="65" y1="65" x2="85" y2="85" stroke="#2D2D2D" strokeWidth="10" strokeLinecap="round" />
                 <circle cx="35" cy="35" r="3" fill="black" />
                 <circle cx="55" cy="35" r="3" fill="black" />
                 <path d="M35 55 Q45 65 55 55" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
               </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter text-brand-black uppercase italic leading-none">
                L9uitha<span className="text-brand-orange">.re2sd</span>
              </h1>
              <p className="text-[10px] font-bold uppercase text-brand-brown">Higher National School RE2SD</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-black w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full pl-10 pr-4 py-2 bg-white cartoon-border rounded-lg focus:outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsReporting(true)}
              className="bg-brand-orange text-white cartoon-button px-6 py-2 font-bold flex items-center gap-2 hover:bg-opacity-90 text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              REPORT
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 bg-white cartoon-button text-brand-black hover:bg-gray-100"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Welcome Message */}
        <div className="mb-8 flex items-center justify-between bg-white cartoon-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue rounded-full border-2 border-brand-black flex items-center justify-center font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Logged in as</p>
              <p className="font-bold text-sm">{user.email}</p>
            </div>
          </div>
          <div className="hidden md:block">
             <p className="text-xs font-bold text-brand-orange uppercase italic">Welcome to the RE2SD Hub!</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['all', 'lost', 'found'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-8 py-2 font-bold cartoon-button uppercase transition-all ${
                filter === t ? 'bg-brand-pink text-white -translate-y-1' : 'bg-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-brand-black" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white cartoon-border p-0 relative group overflow-hidden flex flex-col"
                >
                  {item.image_data ? (
                    <div className="h-48 w-full border-b-4 border-brand-black overflow-hidden bg-gray-100">
                      <img src={item.image_data} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 w-full border-b-4 border-brand-black bg-brand-blue/20 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-brand-blue" />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <div className={`absolute top-4 right-4 px-4 py-1 font-bold text-xs uppercase border-4 border-brand-black rounded-full ${
                      item.type === 'lost' ? 'bg-red-400' : 'bg-green-400'
                    }`}>
                      {item.type}
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-[10px] font-bold text-brand-brown mb-1 uppercase tracking-widest">
                        {item.category}
                      </div>
                      <h3 className="text-2xl font-bold leading-tight mb-2">{item.title}</h3>
                      <p className="text-gray-600 line-clamp-2 text-sm font-medium">{item.description}</p>
                    </div>

                    <div className="space-y-2 mb-6 mt-auto">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <MapPin className="w-4 h-4 text-brand-blue" />
                        {item.location}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Calendar className="w-4 h-4 text-brand-pink" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>

                    {item.user_id === user.id && (
                      <button 
                        onClick={() => resolveItem(item.id)}
                        className="w-full py-3 bg-brand-black text-white font-bold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 rounded-xl"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        MARK AS RESOLVED
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="text-center py-20 bg-white cartoon-border">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400">No items found in the database.</h2>
          </div>
        )}
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {isReporting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-black/40 backdrop-blur-sm"
              onClick={() => setIsReporting(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white cartoon-border w-full max-w-lg p-8 relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsReporting(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <Cpu className="text-brand-orange" />
                REPORT ITEM
              </h2>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setNewItem({...newItem, type: 'lost'})}
                    className={`flex-1 py-2 font-bold cartoon-border transition-colors ${
                      newItem.type === 'lost' ? 'bg-red-400' : 'bg-white'
                    }`}
                  >
                    LOST
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItem({...newItem, type: 'found'})}
                    className={`flex-1 py-2 font-bold cartoon-border transition-colors ${
                      newItem.type === 'found' ? 'bg-green-400' : 'bg-white'
                    }`}
                  >
                    FOUND
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Title</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-2 cartoon-border focus:outline-none text-sm"
                      value={newItem.title}
                      onChange={e => setNewItem({...newItem, title: e.target.value})}
                      placeholder="e.g. Blue Calculator"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Category</label>
                    <select 
                      className="w-full p-2 cartoon-border focus:outline-none text-sm"
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                    >
                      <option>Electronics</option>
                      <option>Stationery</option>
                      <option>Clothing</option>
                      <option>Keys</option>
                      <option>Money</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Location</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-2 cartoon-border focus:outline-none text-sm"
                    value={newItem.location}
                    onChange={e => setNewItem({...newItem, location: e.target.value})}
                    placeholder="e.g. Lab 302"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Description</label>
                  <textarea 
                    className="w-full p-2 cartoon-border focus:outline-none h-20 resize-none text-sm"
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Any specific details..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Upload Photo (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="cartoon-border p-4 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-20 w-auto object-contain" />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400">CLICK TO UPLOAD</span>
                          </>
                        )}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {imagePreview && (
                      <button 
                        type="button" 
                        onClick={() => setImagePreview(null)}
                        className="p-2 bg-red-100 text-red-500 rounded-lg border-2 border-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-yellow font-bold cartoon-button text-lg uppercase mt-4"
                >
                  SUBMIT REPORT
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-white cartoon-border w-80 md:w-96 h-[500px] mb-4 flex flex-col overflow-hidden"
            >
              <div className="bg-brand-black p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-bold">
                  <BrainCircuit className="text-brand-orange w-5 h-5" />
                  L9UITHA AI
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setHighThinking(!highThinking)}
                    className={`p-1 rounded transition-colors ${highThinking ? 'text-brand-yellow' : 'text-gray-500'}`}
                    title="High Thinking Mode"
                  >
                    <BrainCircuit className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-400 mt-10">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">Ask me about lost items or how to use the platform!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold cartoon-border ${
                      msg.role === 'user' ? 'bg-brand-blue' : 'bg-white'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-lg cartoon-border">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t-4 border-brand-black flex gap-2 bg-white">
                <input 
                  type="text" 
                  className="flex-1 p-2 cartoon-border focus:outline-none text-sm font-bold"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading}
                  className="bg-brand-yellow p-2 cartoon-button disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-brand-pink p-4 rounded-full cartoon-button text-white hover:scale-110 transition-transform shadow-xl"
        >
          {isChatOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
}

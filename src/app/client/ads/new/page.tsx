'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Layout, 
  Image as ImageIcon, 
  DollarSign, 
  MapPin, 
  Tag, 
  CheckCircle,
  Loader2,
  Package as PackageIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewAdPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    city_id: '',
    package_id: '',
    price: '',
    contact_phone: '',
    contact_email: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [packages, setPackages] = useState([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const [catRes, cityRes, pkgRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/cities'),
        fetch('/api/packages')
      ]);
      setCategories(await catRes.json());
      setCities(await cityRes.json());
      setPackages(await pkgRes.json());
    } catch (err) {
      console.error('Failed to fetch form data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitForReview = false) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adflow_token');
      // 1. Create Ad Draft
      const adRes = await fetch('/api/client/ads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const adData = await adRes.json();
      
      if (!adRes.ok) throw new Error(adData.error);
      
      const adId = adData.id;

      // 2. Add Media if any
      for (const url of mediaUrls) {
        await fetch(`/api/client/ads/${adId}/media`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            source_type: 'image',
            original_url: url,
            display_order: 0
          })
        });
      }

      // 3. Submit for Review if requested
      if (submitForReview) {
        await fetch(`/api/client/ads/${adId}/submit`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      router.push('/client/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  const addMedia = () => {
    if (newUrl && !mediaUrls.includes(newUrl)) {
      setMediaUrls([...mediaUrls, newUrl]);
      setNewUrl('');
    }
  };

  const removeMedia = (url: string) => {
    setMediaUrls(mediaUrls.filter(u => u !== url));
  };

  if (authLoading || initialLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/client/dashboard" className="flex items-center text-zinc-500 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Create New <span className="text-indigo-500">Ad</span></h1>
        <p className="text-zinc-500">Fill in the details below to reach thousands of potential buyers.</p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
             <div className="glass-panel p-8 space-y-6">
                <h3 className="text-xl font-bold flex items-center mb-2">
                   <Layout className="w-5 h-5 mr-3 text-indigo-400" />
                   Basic Information
                </h3>
                
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-400 ml-1">Ad Title <span className="text-rose-500">*</span></label>
                      <input 
                        required
                        className="input-field" 
                        placeholder="e.g. MacBook Pro 2023 - M2 Max"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-400 ml-1">Description <span className="text-rose-500">*</span></label>
                      <textarea 
                        required
                        rows={8}
                        className="input-field resize-none" 
                        placeholder="Provide a detailed description of your product or service..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-zinc-400 ml-1">Category <span className="text-rose-500">*</span></label>
                         <select 
                           required
                           className="input-field"
                           value={formData.category_id}
                           onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                         >
                            <option value="">Select Category</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-zinc-400 ml-1">City <span className="text-rose-500">*</span></label>
                         <select 
                           required
                           className="input-field"
                           value={formData.city_id}
                           onChange={(e) => setFormData({...formData, city_id: e.target.value})}
                         >
                            <option value="">Select City</option>
                            {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-400 ml-1">Price (PKR)</label>
                      <div className="relative">
                         <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                         <input 
                           type="number"
                           className="input-field pl-10" 
                           placeholder="0.00"
                           value={formData.price}
                           onChange={(e) => setFormData({...formData, price: e.target.value})}
                         />
                      </div>
                   </div>
                </div>
             </div>

             <div className="glass-panel p-8 space-y-6">
                <h3 className="text-xl font-bold flex items-center mb-2">
                   <ImageIcon className="w-5 h-5 mr-3 text-emerald-400" />
                   Media URLs
                </h3>
                <div className="space-y-4">
                   <p className="text-xs text-zinc-500">Provide direct image URLs or YouTube links. Use GitHub Raw URLs for best results.</p>
                   <div className="flex gap-2">
                      <input 
                        className="input-field flex-grow"
                        placeholder="https://example.com/image.jpg"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={addMedia}
                        className="btn-secondary px-4 py-0 flex items-center justify-center shrink-0"
                      >
                         Add
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {mediaUrls.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
                           <img src={url} className="w-full h-full object-cover" />
                           <button 
                             type="button"
                             onClick={() => removeMedia(url)}
                             className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75"
                           >
                              <X className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             <div className="glass-panel p-8 space-y-6">
                <h3 className="text-xl font-bold flex items-center mb-2">
                   <PackageIcon className="w-5 h-5 mr-3 text-indigo-400" />
                   Listing Package
                </h3>
                <div className="space-y-4">
                   {packages.map((pkg: any) => (
                     <label 
                       key={pkg.id} 
                       className={cn(
                         "flex flex-col p-4 rounded-xl border transition-all cursor-pointer",
                         formData.package_id === pkg.id 
                           ? "bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                           : "bg-white/5 border-white/5 hover:border-white/10"
                       )}
                     >
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm">{pkg.name}</span>
                           <input 
                             type="radio" 
                             name="package" 
                             required
                             className="sr-only"
                             checked={formData.package_id === pkg.id}
                             onChange={() => setFormData({...formData, package_id: pkg.id})}
                           />
                           <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", formData.package_id === pkg.id ? "border-indigo-500" : "border-zinc-700")}>
                             {formData.package_id === pkg.id && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                           </div>
                        </div>
                        <div className="flex justify-between items-end">
                           <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{pkg.duration_days} Days Visibility</p>
                           <p className="font-bold text-indigo-400">PKR {pkg.price}</p>
                        </div>
                     </label>
                   ))}
                </div>
             </div>

             <div className="glass-panel p-8 space-y-6">
                <h3 className="text-xl font-bold flex items-center mb-2">
                   <Tag className="w-5 h-5 mr-3 text-amber-400" />
                   Contact Info
                </h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-400">Public Phone</label>
                      <input 
                        className="input-field" 
                        placeholder="+92 XXX XXXXXXX"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-400">Public Email</label>
                      <input 
                        type="email"
                        className="input-field" 
                        placeholder="contact@example.com"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      />
                   </div>
                </div>
             </div>

             {/* Action Buttons */}
             <div className="space-y-4">
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={(e: any) => handleSubmit(e, true)}
                  className="w-full btn-primary py-4 flex items-center justify-center space-x-3 text-lg font-bold shadow-indigo-600/50"
                >
                   {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <> <Send className="w-5 h-5" /> <span>Submit for Review</span> </>}
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-secondary py-4 flex items-center justify-center space-x-3 text-lg"
                >
                   <Save className="w-5 h-5" />
                   <span>Save Draft</span>
                </button>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}

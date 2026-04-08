import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/5 bg-black/40 py-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white font-bold text-lg group">AdFlow<span className="text-indigo-500">Pro</span></span>
          </Link>
          <p className="mt-4 text-zinc-400 text-sm leading-relaxed">
            The most advanced moderated ads marketplace designed for performance, security, and scalability.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Marketplace</h4>
          <ul className="space-y-4 text-sm text-zinc-400">
            <li><Link href="/explore" className="hover:text-white transition-colors">Browse Ads</Link></li>
            <li><Link href="/explore?sort=newest" className="hover:text-white transition-colors">New Listings</Link></li>
            <li><Link href="/explore?is_featured=true" className="hover:text-white transition-colors">Featured Ads</Link></li>
            <li><Link href="/packages" className="hover:text-white transition-colors">Pricing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Support</h4>
          <ul className="space-y-4 text-sm text-zinc-400">
            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
           <h4 className="text-white font-semibold mb-6">Stay Updated</h4>
           <div className="flex space-x-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors">
                Join
              </button>
           </div>
           <p className="mt-4 text-xs text-zinc-500">
             Get the latest ad industry trends and tips.
           </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-xs gap-4">
        <p>© {currentYear} AdFlow Pro. All rights reserved.</p>
        <div className="flex space-x-6">
          <Link href="#" className="hover:text-white">Twitter</Link>
          <Link href="#" className="hover:text-white">Facebook</Link>
          <Link href="#" className="hover:text-white">Instagram</Link>
          <Link href="#" className="hover:text-white">LinkedIn</Link>
        </div>
      </div>
    </footer>
  );
}

import { PenTool } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#FAFAFA] border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center gap-2 mb-4">
          <PenTool className="h-5 w-5 text-red-800" />
          <span className="font-serif text-xl font-black text-zinc-900 uppercase tracking-tight">Voices Rising</span>
        </div>
        <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          &copy; {new Date().getFullYear()} Voices Rising. Writing for Human Rights Among Teens in India.
        </p>
      </div>
    </footer>
  );
}

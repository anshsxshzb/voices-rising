import { Mail, MapPin, Phone } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16 border-b border-zinc-900 pb-12">
          <h1 className="text-5xl font-black text-zinc-900 font-serif sm:text-7xl uppercase tracking-tighter">About Us</h1>
          <p className="mt-6 text-xl text-zinc-600 font-serif italic max-w-2xl mx-auto">
            Empowering the next generation of human rights advocates in India.
          </p>
        </div>

        <div className="prose prose-lg prose-zinc max-w-none text-zinc-800 mx-auto font-serif leading-relaxed">
          <h2 className="text-3xl font-black text-zinc-900 font-serif mb-6 uppercase tracking-widest">Our Mission</h2>
          <p className="mb-6">
            Voices Rising is a platform dedicated to amplifying the voices of teenagers across India. We believe that young people are not just the leaders of tomorrow, but the changemakers of today. Our mission is to provide a safe, inspiring space for teens to write, reflect, and advocate for human rights issues that matter to them.
          </p>
          <p className="mb-12">
            Through thoughtful articles, discussions, and ideas, the platform encourages young minds to think critically about freedom, equality, digital rights, and social justice in modern India.
          </p>

          <h2 className="text-3xl font-black text-zinc-900 font-serif mb-8 uppercase tracking-widest">Who We Are</h2>
          <div className="flex flex-col sm:flex-row items-start gap-8 mb-16 border-t border-b border-zinc-900 py-8">
            <img
              src="https://i.postimg.cc/8CmtXyxy/me2.jpg"
              alt="Ansh Kumar"
              className="w-32 h-32 rounded-none object-cover grayscale border border-zinc-900"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-2xl font-black text-zinc-900 font-serif uppercase tracking-widest">Ansh Kumar <span className="text-sm text-zinc-500">[15 y.o]</span></h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-800 mb-4">Founder & Editor-in-Chief</p>
              <p className="text-zinc-800 mb-4">
                A student, writer, and young thinker from India, Ansh Kumar founded Voices Rising with the vision of giving teenagers a meaningful platform to express their ideas on human rights, society, and digital freedom.
              </p>
              <p className="text-zinc-800">
                Passionate about learning, writing, and exploring important social issues, he believes that thoughtful dialogue among young people can inspire positive change. Through this platform, he hopes to encourage teenagers across India to share their perspectives and become responsible voices for justice and equality.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-black text-zinc-900 font-serif mb-6 uppercase tracking-widest">Contact Us</h2>
          <p className="mb-8">
            We'd love to hear from you! Whether you want to submit an article, collaborate, or simply share your thoughts, feel free to reach out.
          </p>
          
          <div className="bg-transparent border border-zinc-900 p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-zinc-900" />
                <span className="text-zinc-900 font-sans text-sm font-bold uppercase tracking-widest">anshsxshzb@gmail.com</span>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-zinc-900" />
                <span className="text-zinc-900 font-sans text-sm font-bold uppercase tracking-widest">+91 95724 00433 (WA)</span>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="h-5 w-5 text-zinc-900" />
                <span className="text-zinc-900 font-sans text-sm font-bold uppercase tracking-widest">India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

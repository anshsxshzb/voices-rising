import { Mail, MapPin, Phone } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-zinc-900 font-serif sm:text-5xl">About Us</h1>
          <p className="mt-4 text-xl text-zinc-500">
            Empowering the next generation of human rights advocates in India.
          </p>
        </div>

        <div className="prose prose-indigo prose-lg text-zinc-600 mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 font-serif mb-4">Our Mission</h2>
          <p className="mb-4">
            Voices Rising is a platform dedicated to amplifying the voices of teenagers across India. We believe that young people are not just the leaders of tomorrow, but the changemakers of today. Our mission is to provide a safe, inspiring space for teens to write, reflect, and advocate for human rights issues that matter to them.
          </p>
          <p className="mb-8">
            Through thoughtful articles, discussions, and ideas, the platform encourages young minds to think critically about freedom, equality, digital rights, and social justice in modern India.
          </p>

          <h2 className="text-2xl font-bold text-zinc-900 font-serif mb-4">Who We Are</h2>
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-12">
            <img
              src="https://i.postimg.cc/8CmtXyxy/me2.jpg"
              alt="Ansh Kumar"
              className="w-32 h-32 rounded-full object-cover shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Ansh Kumar [15 y.o]</h3>
              <p className="text-sm text-indigo-600 font-medium mb-2">Founder & Editor-in-Chief</p>
              <p className="text-zinc-600 mb-4">
                A student, writer, and young thinker from India, Ansh Kumar founded Voices Rising with the vision of giving teenagers a meaningful platform to express their ideas on human rights, society, and digital freedom.
              </p>
              <p className="text-zinc-600">
                Passionate about learning, writing, and exploring important social issues, he believes that thoughtful dialogue among young people can inspire positive change. Through this platform, he hopes to encourage teenagers across India to share their perspectives and become responsible voices for justice and equality.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 font-serif mb-4">Contact Us</h2>
          <p className="mb-6">
            We'd love to hear from you! Whether you want to submit an article, collaborate, or simply share your thoughts, feel free to reach out.
          </p>
          
          <div className="bg-zinc-50 rounded-xl p-8 border border-zinc-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-600" />
                <span className="text-zinc-700">anshsxshzb@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-indigo-600" />
                <span className="text-zinc-700">+91 95724 00433 (WA)</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-indigo-600" />
                <span className="text-zinc-700">India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

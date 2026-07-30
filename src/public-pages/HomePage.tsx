export default function HomePage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans">
      <section className="h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-serif font-bold mb-6 text-white">
          نصنع <span className="text-[#c5a059]">الخيال</span> بصورة
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mb-10">
          نحول الرؤية الإبداعية إلى واقع بصري يحاكي السينما العالمية.
        </p>
        <button className="bg-[#c5a059] text-black px-8 py-3 font-semibold hover:bg-[#b08d4e] transition-colors">
          استعرض أعمالنا
        </button>
      </section>
    </div>
  );
}
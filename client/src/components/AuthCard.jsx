import Footer from './Footer'

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4 gap-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 border border-gray-100">
        <h1 className="font-serif text-3xl text-[#0D5C63] mb-1">{title}</h1>
        {subtitle && <p className="font-sans text-gray-500 text-sm mb-6">{subtitle}</p>}
        {children}
      </div>
      <Footer />
    </div>
  )
}

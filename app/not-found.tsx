export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f2ff]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-purple-800 mb-4">404</h1>
        <p className="text-purple-700 mb-8">Page not found</p>
        <a 
          href="/dashboard"
          className="text-purple-700 hover:text-purple-800 underline"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
} 






















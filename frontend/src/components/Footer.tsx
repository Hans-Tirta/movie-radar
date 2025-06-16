const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 text-sm py-4 px-6 border-t border-gray-700">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center text-center">
        <p>© {new Date().getFullYear()} MovieRadar.</p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2 text-center">
          <span>This product uses the</span>
          <a
            href="https://www.themoviedb.org/documentation/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-blue-400 hover:underline"
          >
            <img src="/tmdb.svg" alt="TMDB Logo" className="w-20 h-auto" />
            API
          </a>
          <span>but is not endorsed or certified by TMDB.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

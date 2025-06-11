const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 text-sm py-4 px-6 border-t border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-center">
        <p>© {new Date().getFullYear()} MovieRadar. All rights reserved.</p>
        <p className="flex items-center gap-2">
          This product uses the{" "}
          <a
            href="https://www.themoviedb.org/documentation/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:underline"
          >
            <img src="/tmdb.svg" alt="TMDB Logo" className="w-20 h-5" />
            API
          </a>
          but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

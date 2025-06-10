import { useState } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";

interface Genre {
  id: number;
  name: string;
}

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  loading?: boolean;
  placeholder?: string;
  genres: Genre[];
}

export interface SearchFilters {
  selectedGenres: number[];
  sortBy:
    | "popularity.desc"
    | "popularity.asc"
    | "release_date.desc"
    | "release_date.asc"
    | "vote_average.desc"
    | "vote_average.asc"
    | "title.asc"
    | "title.desc";
}

function SearchBar({
  onSearch,
  loading = false,
  placeholder = "Search movies...",
  genres,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortBy, setSortBy] =
    useState<SearchFilters["sortBy"]>("popularity.desc");
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { value: "popularity.desc", label: "Popularity (High to Low)" },
    { value: "popularity.asc", label: "Popularity (Low to High)" },
    { value: "release_date.desc", label: "Release Date (Newest First)" },
    { value: "release_date.asc", label: "Release Date (Oldest First)" },
    { value: "vote_average.desc", label: "Rating (High to Low)" },
    { value: "vote_average.asc", label: "Rating (Low to High)" },
    { value: "title.asc", label: "Title (A - Z)" },
    { value: "title.desc", label: "Title (Z - A)" },
  ];

  const handleClear = () => {
    setSearchQuery("");
  };

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSortBy("popularity.desc");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, { selectedGenres, sortBy });
  };

  const handleApplyFilters = () => {
    onSearch(searchQuery, { selectedGenres, sortBy });
  };

  return (
    <div className="flex flex-col items-center mb-6 w-full">
      {/* Search Bar and Filter Toggle */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 w-full">
        <form onSubmit={handleSubmit} className="relative flex-1 w-full">
          <div className="flex items-center w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2 rounded-l-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-r-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </form>

        {/* Filter Toggle Button - Responsive */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown
            className={`w-4 h-4 transform transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-800 rounded-lg p-6 w-full">
          {/* Sort Options */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as SearchFilters["sortBy"])
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Filters */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => handleGenreToggle(genre.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedGenres.includes(genre.id)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>

          {/* Active Filters Display */}
          {(selectedGenres.length > 0 || sortBy !== "popularity.desc") && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {selectedGenres.length > 0 && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    {selectedGenres.length} genre
                    {selectedGenres.length > 1 ? "s" : ""} selected
                  </span>
                )}
                {sortBy !== "popularity.desc" && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                    Sort:{" "}
                    {sortOptions.find((opt) => opt.value === sortBy)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;

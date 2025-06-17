import { useState, useEffect } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Genre {
  id: number;
  name: string;
}

interface FilterBarProps {
  onFilterChange: (filters: DiscoverFilters) => void;
  loading?: boolean;
  genres: Genre[];
  initialFilters?: DiscoverFilters;
}

export interface DiscoverFilters {
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

function FilterBar({
  onFilterChange,
  loading = false,
  genres,
  initialFilters,
}: FilterBarProps) {
  const { t } = useTranslation();
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    initialFilters?.selectedGenres || []
  );
  const [sortBy, setSortBy] = useState<DiscoverFilters["sortBy"]>(
    initialFilters?.sortBy || "popularity.desc"
  );
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    {
      value: "popularity.desc",
      label: t("filterbar.sort_options.popularity_desc"),
    },
    {
      value: "popularity.asc",
      label: t("filterbar.sort_options.popularity_asc"),
    },
    {
      value: "release_date.desc",
      label: t("filterbar.sort_options.release_date_desc"),
    },
    {
      value: "release_date.asc",
      label: t("filterbar.sort_options.release_date_asc"),
    },
    {
      value: "vote_average.desc",
      label: t("filterbar.sort_options.vote_average_desc"),
    },
    {
      value: "vote_average.asc",
      label: t("filterbar.sort_options.vote_average_asc"),
    },
    { value: "title.asc", label: t("filterbar.sort_options.title_asc") },
    { value: "title.desc", label: t("filterbar.sort_options.title_desc") },
  ];

  // Update local state when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setSelectedGenres(initialFilters.selectedGenres);
      setSortBy(initialFilters.sortBy);
    }
  }, [initialFilters]);

  const handleGenreToggle = (genreId: number) => {
    const newSelectedGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter((id) => id !== genreId)
      : [...selectedGenres, genreId];

    setSelectedGenres(newSelectedGenres);
    // Auto-apply filters when genre changes
    onFilterChange({ selectedGenres: newSelectedGenres, sortBy });
  };

  const handleSortChange = (newSortBy: DiscoverFilters["sortBy"]) => {
    setSortBy(newSortBy);
    // Auto-apply filters when sort changes
    onFilterChange({ selectedGenres, sortBy: newSortBy });
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      selectedGenres: [],
      sortBy: "popularity.desc" as DiscoverFilters["sortBy"],
    };
    setSelectedGenres(defaultFilters.selectedGenres);
    setSortBy(defaultFilters.sortBy);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters =
    selectedGenres.length > 0 || sortBy !== "popularity.desc";

  return (
    <div className="flex flex-col items-center mb-6 w-full">
      {/* Filter Toggle Button */}
      <div className="flex justify-center w-full">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-6 py-3 w-full bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">
            {showFilters
              ? t("filterbar.hide_filters")
              : t("filterbar.show_filters")}
          </span>
          <ChevronDown
            className={`w-4 h-4 transform transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-800 rounded-lg p-6 mt-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sort Options */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>{t("filterbar.sort_by")}</span>
              </h3>
              <select
                value={sortBy}
                onChange={(e) =>
                  handleSortChange(e.target.value as DiscoverFilters["sortBy"])
                }
                disabled={loading}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClearFilters}
                disabled={loading || !hasActiveFilters}
                className="w-full px-4 py-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors border border-gray-600 hover:border-gray-500 rounded-lg"
              >
                {t("filterbar.clear_all_filters")}
              </button>
            </div>
          </div>

          {/* Genre Filters */}
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-3">
              {t("filterbar.genres")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => handleGenreToggle(genre.id)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-full text-sm transition-colors disabled:opacity-50 ${
                    selectedGenres.includes(genre.id)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;

import { useTranslation } from "react-i18next";

interface DiscussionSortControlProps {
  sortBy: "newest" | "oldest" | "most_upvoted";
  setSortBy: React.Dispatch<
    React.SetStateAction<"newest" | "oldest" | "most_upvoted">
  >;
}

export default function DiscussionSortControl({
  sortBy,
  setSortBy,
}: DiscussionSortControlProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <label className="text-gray-400">
        {t("movieDiscussions.discussionSortControl.sortBy")}:
      </label>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
      >
        <option value="newest">
          {t("movieDiscussions.discussionSortControl.newest")}
        </option>
        <option value="oldest">
          {t("movieDiscussions.discussionSortControl.oldest")}
        </option>
        <option value="most_upvoted">
          {t("movieDiscussions.discussionSortControl.mostUpvoted")}
        </option>
      </select>
    </div>
  );
}

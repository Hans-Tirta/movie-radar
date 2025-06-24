import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DiscussionEmptyStateProps {
  onStart: () => void;
  isAuthenticated: boolean;
}

export default function DiscussionEmptyState({
  onStart,
  isAuthenticated,
}: DiscussionEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12">
      <MessageCircle size={64} className="text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">
        {t("movieDiscussions.discussionEmptyState.title")}
      </h3>
      <p className="text-gray-400 mb-6">
        {t("movieDiscussions.discussionEmptyState.subtitle")}
      </p>
      {isAuthenticated && (
        <button
          onClick={onStart}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("movieDiscussions.discussionEmptyState.startDiscussion")}
        </button>
      )}
    </div>
  );
}

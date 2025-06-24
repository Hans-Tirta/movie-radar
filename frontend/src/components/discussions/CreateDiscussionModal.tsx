import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newDiscussion: {
    title: string;
    content: string;
  };
  setNewDiscussion: React.Dispatch<
    React.SetStateAction<{ title: string; content: string }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function CreateDiscussionModal({
  isOpen,
  onClose,
  newDiscussion,
  setNewDiscussion,
  onSubmit,
  loading,
}: CreateDiscussionModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {t("movieDiscussions.createDiscussionModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              {t("movieDiscussions.createDiscussionModal.titleLabel")}
            </label>
            <input
              type="text"
              value={newDiscussion.title}
              onChange={(e) =>
                setNewDiscussion((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder={t(
                "movieDiscussions.createDiscussionModal.titlePlaceholder"
              )}
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">
              {t("movieDiscussions.createDiscussionModal.contentLabel")}
            </label>
            <textarea
              value={newDiscussion.content}
              onChange={(e) =>
                setNewDiscussion((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none h-32 resize-none"
              placeholder={t(
                "movieDiscussions.createDiscussionModal.contentPlaceholder"
              )}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              {t("movieDiscussions.createDiscussionModal.cancel")}
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !newDiscussion.title.trim() ||
                !newDiscussion.content.trim()
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("movieDiscussions.createDiscussionModal.creating")
                : t("movieDiscussions.createDiscussionModal.createDiscussion")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

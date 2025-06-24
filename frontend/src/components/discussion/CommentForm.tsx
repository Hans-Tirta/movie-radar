import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CommentFormProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function CommentForm({
  value,
  onChange,
  onSubmit,
  loading,
}: CommentFormProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">
        {t("discussion.add_comment")}
      </h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        className="space-y-4"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
          placeholder={t("discussion.placeholder_comment")}
          rows={4}
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} />
            {loading ? t("discussion.posting") : t("discussion.post")}
          </button>
        </div>
      </form>
    </div>
  );
}

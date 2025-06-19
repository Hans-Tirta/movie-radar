import { useTranslation } from "react-i18next";

const LoadMoreCard = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-600 h-full"
    >
      <div className="text-4xl mb-2">+</div>
      <p className="text-center text-gray-300">{t("home.load_more")}</p>
    </div>
  );
};
export default LoadMoreCard;

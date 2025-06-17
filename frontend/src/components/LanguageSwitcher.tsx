import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "cn", name: "简体中文", flag: "🇨🇳" },
];

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);

    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
        aria-label="Change language"
      >
        <Globe size={32} className="text-gray-300" />
        <span className="text-sm font-medium hidden md:inline">
          {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 py-2 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full text-left flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-600 transition-colors ${
                i18n.language === language.code
                  ? "bg-gray-600 text-blue-400"
                  : "text-gray-300"
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{t(`languages.${language.code}`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;

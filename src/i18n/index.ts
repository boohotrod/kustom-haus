import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import hu from "./locales/hu.json";
import no from "./locales/no.json";

// 26-language skeleton. v0.1 ships HU/EN/NO; the rest fall back to EN
// until content i18n (translations table) is wired in B-2+.
export const SUPPORTED_LOCALES = [
  "hu", "en", "no", "de", "fr", "es", "it", "pt", "nl", "sv",
  "da", "fi", "pl", "cs", "sk", "ro", "hr", "sl", "el", "tr",
  "ru", "uk", "ja", "ko", "zh", "ar",
] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      hu: { translation: hu },
      en: { translation: en },
      no: { translation: no },
    },
    lng: "hu",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;

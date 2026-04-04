import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import en, { type TranslationKeys } from './locales/en';
import hi from './locales/hi';
import bn from './locales/bn';
import mr from './locales/mr';
import gu from './locales/gu';
import te from './locales/te';
import ta from './locales/ta';
import ur from './locales/ur';
import kn from './locales/kn';
import pa from './locales/pa';

export type LanguageCode = 'en' | 'hi' | 'bn' | 'mr' | 'gu' | 'te' | 'ta' | 'ur' | 'kn' | 'pa';

export interface LanguageOption {
    code: LanguageCode;
    name: string;
    nativeName: string;
    dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr' },
];

type TranslationCatalog = Partial<TranslationKeys>;

const translations: Record<LanguageCode, TranslationCatalog> = {
    en, hi, bn, mr, gu, te, ta, ur, kn, pa,
};

const STORAGE_KEY = 'trackmate_language';

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: keyof TranslationKeys) => string;
    dir: 'ltr' | 'rtl';
    currentLang: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLanguage(): LanguageCode {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored in translations) return stored as LanguageCode;
    } catch { /* noop */ }
    return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

    const setLanguage = useCallback((lang: LanguageCode) => {
        setLanguageState(lang);
        try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* noop */ }
    }, []);

    const t = useCallback((key: keyof TranslationKeys): string => {
        return translations[language]?.[key] ?? en[key] ?? String(key);
    }, [language]);

    const currentLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];
    const dir = currentLang.dir;

    // Update document dir attribute for RTL support
    useEffect(() => {
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', language);
    }, [dir, language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir, currentLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export type { TranslationKeys };

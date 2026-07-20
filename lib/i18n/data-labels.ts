import type { Locale } from "@/lib/i18n/config";

/**
 * Turkish display names for catalog data that lives in the database in
 * English (country / city / language / field values). University and program
 * names are proper nouns and are NEVER translated (product rule — see
 * docs/features/i18n.md). Lookups fall back to the original English value,
 * so an unmapped entry degrades gracefully instead of breaking the UI.
 *
 * This file is owned by the i18n infrastructure — feature code should call
 * the `localize*` helpers rather than reading the maps directly.
 */

const COUNTRY_NAMES_TR: Record<string, string> = {
  Austria: "Avusturya",
  Belgium: "Belçika",
  Bulgaria: "Bulgaristan",
  Croatia: "Hırvatistan",
  Czechia: "Çekya",
  "Czech Republic": "Çekya",
  Denmark: "Danimarka",
  Estonia: "Estonya",
  Finland: "Finlandiya",
  France: "Fransa",
  Germany: "Almanya",
  Greece: "Yunanistan",
  Hungary: "Macaristan",
  Iceland: "İzlanda",
  Ireland: "İrlanda",
  Italy: "İtalya",
  Latvia: "Letonya",
  Lithuania: "Litvanya",
  Luxembourg: "Lüksemburg",
  Netherlands: "Hollanda",
  Norway: "Norveç",
  Poland: "Polonya",
  Portugal: "Portekiz",
  Romania: "Romanya",
  Slovakia: "Slovakya",
  Slovenia: "Slovenya",
  Spain: "İspanya",
  Sweden: "İsveç",
  Switzerland: "İsviçre",
  Turkey: "Türkiye",
  "United Kingdom": "Birleşik Krallık",
  UK: "Birleşik Krallık",
};

const CITY_NAMES_TR: Record<string, string> = {
  Antwerp: "Anvers",
  Athens: "Atina",
  Barcelona: "Barselona",
  Bologna: "Bolonya",
  Brussels: "Brüksel",
  Bucharest: "Bükreş",
  Budapest: "Budapeşte",
  Cologne: "Köln",
  Copenhagen: "Kopenhag",
  Edinburgh: "Edinburg",
  Florence: "Floransa",
  Geneva: "Cenevre",
  Gothenburg: "Göteborg",
  Krakow: "Krakov",
  Lausanne: "Lozan",
  Lisbon: "Lizbon",
  London: "Londra",
  Madrid: "Madrid",
  Milan: "Milano",
  Munich: "Münih",
  Naples: "Napoli",
  Nuremberg: "Nürnberg",
  Padua: "Padova",
  Prague: "Prag",
  Rome: "Roma",
  Seville: "Sevilla",
  Stockholm: "Stokholm",
  Strasbourg: "Strazburg",
  "The Hague": "Lahey",
  Turin: "Torino",
  Valencia: "Valensiya",
  Venice: "Venedik",
  Vienna: "Viyana",
  Warsaw: "Varşova",
  Zurich: "Zürih",
};

const LANGUAGE_NAMES_TR: Record<string, string> = {
  Czech: "Çekçe",
  Danish: "Danca",
  Dutch: "Felemenkçe",
  English: "İngilizce",
  Finnish: "Fince",
  French: "Fransızca",
  German: "Almanca",
  Italian: "İtalyanca",
  Norwegian: "Norveççe",
  Polish: "Lehçe",
  Portuguese: "Portekizce",
  Spanish: "İspanyolca",
  Swedish: "İsveççe",
  Turkish: "Türkçe",
};

const FIELD_NAMES_TR: Record<string, string> = {
  Agriculture: "Tarım",
  "Agriculture & Food": "Tarım ve Gıda",
  Architecture: "Mimarlık",
  "Artificial Intelligence": "Yapay Zekâ",
  Arts: "Sanat",
  Biology: "Biyoloji",
  Biotechnology: "Biyoteknoloji",
  Business: "İşletme",
  "Business & Management": "İşletme ve Yönetim",
  Chemistry: "Kimya",
  "Communication & Media": "İletişim ve Medya",
  "Computer Science": "Bilgisayar Bilimleri",
  "Computer Science & IT": "Bilgisayar Bilimleri ve BT",
  "Data Science": "Veri Bilimi",
  "Data Science & AI": "Veri Bilimi ve Yapay Zekâ",
  Design: "Tasarım",
  Economics: "Ekonomi",
  Education: "Eğitim",
  Energy: "Enerji",
  Engineering: "Mühendislik",
  "Environmental Sciences": "Çevre Bilimleri",
  Finance: "Finans",
  "Health Sciences": "Sağlık Bilimleri",
  Humanities: "Beşeri Bilimler",
  "International Relations": "Uluslararası İlişkiler",
  Law: "Hukuk",
  "Life Sciences": "Yaşam Bilimleri",
  Marketing: "Pazarlama",
  Mathematics: "Matematik",
  "Medicine & Health": "Tıp ve Sağlık",
  "Natural Sciences": "Doğa Bilimleri",
  Physics: "Fizik",
  "Political Science": "Siyaset Bilimi",
  Psychology: "Psikoloji",
  Robotics: "Robotik",
  "Social Sciences": "Sosyal Bilimler",
  Sustainability: "Sürdürülebilirlik",
  "Tourism & Hospitality": "Turizm ve Otelcilik",
};

function localize(map: Record<string, string>, value: string, locale: Locale) {
  if (locale !== "tr") return value;
  return map[value] ?? value;
}

export function localizeCountry(name: string, locale: Locale): string {
  return localize(COUNTRY_NAMES_TR, name, locale);
}

export function localizeCity(name: string, locale: Locale): string {
  return localize(CITY_NAMES_TR, name, locale);
}

export function localizeLanguage(name: string, locale: Locale): string {
  return localize(LANGUAGE_NAMES_TR, name, locale);
}

export function localizeField(name: string, locale: Locale): string {
  return localize(FIELD_NAMES_TR, name, locale);
}

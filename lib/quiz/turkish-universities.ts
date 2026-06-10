/**
 * Turkish universities — the searchable list behind the quiz "which institution"
 * question (step 3). The audience is Turkish students, so their undergraduate
 * school is almost always a Turkish university; the picker seeds this list and
 * always allows a free-text "type my own" entry for anyone who studied abroad
 * or isn't listed.
 *
 * Compiled 2026-06-10 from the Turkish Council of Higher Education (YÖK) roster
 * cross-checked against Wikipedia's "List of universities in Turkey" (state +
 * foundation). Names are the commonly-used official English forms with Turkish
 * diacritics preserved in proper nouns. This is reference data, not load-bearing
 * for matching — it only powers autocomplete, so an occasional gap is harmless
 * (the free-text fallback covers it).
 */

export type TurkishUniversity = { name: string; city: string };

export const TURKISH_UNIVERSITIES: readonly TurkishUniversity[] = [
  { name: "Abdullah Gül University", city: "Kayseri" },
  { name: "Acıbadem University", city: "Istanbul" },
  { name: "Adana Alparslan Türkeş University of Science and Technology", city: "Adana" },
  { name: "Adıyaman University", city: "Adıyaman" },
  { name: "Afyon Kocatepe University", city: "Afyonkarahisar" },
  { name: "Afyonkarahisar Health Sciences University", city: "Afyonkarahisar" },
  { name: "Ağrı İbrahim Çeçen University", city: "Ağrı" },
  { name: "Akdeniz University", city: "Antalya" },
  { name: "Aksaray University", city: "Aksaray" },
  { name: "Alanya Alaaddin Keykubat University", city: "Antalya" },
  { name: "Alanya University", city: "Antalya" },
  { name: "Altınbaş University", city: "Istanbul" },
  { name: "Amasya University", city: "Amasya" },
  { name: "Anadolu University", city: "Eskişehir" },
  { name: "Ankara Hacı Bayram Veli University", city: "Ankara" },
  { name: "Ankara Medipol University", city: "Ankara" },
  { name: "Ankara Music and Fine Arts University", city: "Ankara" },
  { name: "Ankara Science University", city: "Ankara" },
  { name: "Ankara University", city: "Ankara" },
  { name: "Ankara Yıldırım Beyazıt University", city: "Ankara" },
  { name: "Antalya Belek University", city: "Antalya" },
  { name: "Antalya Bilim University", city: "Antalya" },
  { name: "Ardahan University", city: "Ardahan" },
  { name: "Artvin Çoruh University", city: "Artvin" },
  { name: "Atatürk University", city: "Erzurum" },
  { name: "Atılım University", city: "Ankara" },
  { name: "Avrasya University", city: "Trabzon" },
  { name: "Aydın Adnan Menderes University", city: "Aydın" },
  { name: "Bahçeşehir University", city: "Istanbul" },
  { name: "Balıkesir University", city: "Balıkesir" },
  { name: "Bandırma Onyedi Eylül University", city: "Balıkesir" },
  { name: "Bartın University", city: "Bartın" },
  { name: "Başkent University", city: "Ankara" },
  { name: "Batman University", city: "Batman" },
  { name: "Bayburt University", city: "Bayburt" },
  { name: "Beykoz University", city: "Istanbul" },
  { name: "Bezmialem Vakıf University", city: "Istanbul" },
  { name: "Bilecik Şeyh Edebali University", city: "Bilecik" },
  { name: "Bilkent University", city: "Ankara" },
  { name: "Bingöl University", city: "Bingöl" },
  { name: "Biruni University", city: "Istanbul" },
  { name: "Bitlis Eren University", city: "Bitlis" },
  { name: "Boğaziçi University", city: "Istanbul" },
  { name: "Bolu Abant İzzet Baysal University", city: "Bolu" },
  { name: "Burdur Mehmet Akif Ersoy University", city: "Burdur" },
  { name: "Bursa Technical University", city: "Bursa" },
  { name: "Bursa Uludağ University", city: "Bursa" },
  { name: "Çağ University", city: "Mersin" },
  { name: "Çanakkale Onsekiz Mart University", city: "Çanakkale" },
  { name: "Çankaya University", city: "Ankara" },
  { name: "Çankırı Karatekin University", city: "Çankırı" },
  { name: "Cappadocia University", city: "Nevşehir" },
  { name: "Çukurova University", city: "Adana" },
  { name: "Demiroğlu Bilim University", city: "Istanbul" },
  { name: "Dicle University", city: "Diyarbakır" },
  { name: "Doğuş University", city: "Istanbul" },
  { name: "Dokuz Eylül University", city: "İzmir" },
  { name: "Düzce University", city: "Düzce" },
  { name: "Ege University", city: "İzmir" },
  { name: "Erciyes University", city: "Kayseri" },
  { name: "Erzincan Binali Yıldırım University", city: "Erzincan" },
  { name: "Erzurum Technical University", city: "Erzurum" },
  { name: "Eskişehir Osmangazi University", city: "Eskişehir" },
  { name: "Eskişehir Technical University", city: "Eskişehir" },
  { name: "Fatih Sultan Mehmet Vakıf University", city: "Istanbul" },
  { name: "Fenerbahçe University", city: "Istanbul" },
  { name: "Fırat University", city: "Elazığ" },
  { name: "Galatasaray University", city: "Istanbul" },
  { name: "Gazi University", city: "Ankara" },
  { name: "Gaziantep Islam Science and Technology University", city: "Gaziantep" },
  { name: "Gaziantep University", city: "Gaziantep" },
  { name: "Gebze Technical University", city: "Kocaeli" },
  { name: "Giresun University", city: "Giresun" },
  { name: "Gümüşhane University", city: "Gümüşhane" },
  { name: "Hacettepe University", city: "Ankara" },
  { name: "Hakkari University", city: "Hakkâri" },
  { name: "Haliç University", city: "Istanbul" },
  { name: "Harran University", city: "Şanlıurfa" },
  { name: "Hasan Kalyoncu University", city: "Gaziantep" },
  { name: "Hatay Mustafa Kemal University", city: "Hatay" },
  { name: "Hitit University", city: "Çorum" },
  { name: "Ibn Haldun University", city: "Istanbul" },
  { name: "Iğdır University", city: "Iğdır" },
  { name: "İnönü University", city: "Malatya" },
  { name: "Isparta University of Applied Sciences", city: "Isparta" },
  { name: "Istanbul 29 Mayıs University", city: "Istanbul" },
  { name: "Istanbul Arel University", city: "Istanbul" },
  { name: "Istanbul Atlas University", city: "Istanbul" },
  { name: "Istanbul Aydın University", city: "Istanbul" },
  { name: "Istanbul Beykent University", city: "Istanbul" },
  { name: "Istanbul Bilgi University", city: "Istanbul" },
  { name: "Istanbul Commerce University", city: "Istanbul" },
  { name: "Istanbul Esenyurt University", city: "Istanbul" },
  { name: "Istanbul Galata University", city: "Istanbul" },
  { name: "Istanbul Gedik University", city: "Istanbul" },
  { name: "Istanbul Gelişim University", city: "Istanbul" },
  { name: "Istanbul Health and Technology University", city: "Istanbul" },
  { name: "Istanbul Kent University", city: "Istanbul" },
  { name: "Istanbul Kültür University", city: "Istanbul" },
  { name: "Istanbul Medeniyet University", city: "Istanbul" },
  { name: "Istanbul Medipol University", city: "Istanbul" },
  { name: "Istanbul Nişantaşı University", city: "Istanbul" },
  { name: "Istanbul Okan University", city: "Istanbul" },
  { name: "Istanbul Rumeli University", city: "Istanbul" },
  { name: "Istanbul Sabahattin Zaim University", city: "Istanbul" },
  { name: "Istanbul Technical University", city: "Istanbul" },
  { name: "Istanbul Topkapı University", city: "Istanbul" },
  { name: "Istanbul University", city: "Istanbul" },
  { name: "Istanbul University-Cerrahpaşa", city: "Istanbul" },
  { name: "Istanbul Yeni Yüzyıl University", city: "Istanbul" },
  { name: "İskenderun Technical University", city: "Hatay" },
  { name: "Işık University", city: "Istanbul" },
  { name: "İstinye University", city: "Istanbul" },
  { name: "İzmir Bakırçay University", city: "İzmir" },
  { name: "İzmir Democracy University", city: "İzmir" },
  { name: "İzmir Institute of Technology", city: "İzmir" },
  { name: "İzmir Kâtip Çelebi University", city: "İzmir" },
  { name: "İzmir Tınaztepe University", city: "İzmir" },
  { name: "İzmir University of Economics", city: "İzmir" },
  { name: "Kadir Has University", city: "Istanbul" },
  { name: "Kafkas University", city: "Kars" },
  { name: "Kahramanmaraş İstiklal University", city: "Kahramanmaraş" },
  { name: "Kahramanmaraş Sütçü İmam University", city: "Kahramanmaraş" },
  { name: "Karabük University", city: "Karabük" },
  { name: "Karadeniz Technical University", city: "Trabzon" },
  { name: "Karamanoğlu Mehmetbey University", city: "Karaman" },
  { name: "Kastamonu University", city: "Kastamonu" },
  { name: "Kayseri University", city: "Kayseri" },
  { name: "Kırıkkale University", city: "Kırıkkale" },
  { name: "Kırklareli University", city: "Kırklareli" },
  { name: "Kırşehir Ahi Evran University", city: "Kırşehir" },
  { name: "Kilis 7 Aralık University", city: "Kilis" },
  { name: "Koç University", city: "Istanbul" },
  { name: "Kocaeli Health and Technology University", city: "Kocaeli" },
  { name: "Kocaeli University", city: "Kocaeli" },
  { name: "Konya Food and Agriculture University", city: "Konya" },
  { name: "Konya Technical University", city: "Konya" },
  { name: "KTO Karatay University", city: "Konya" },
  { name: "Kütahya Dumlupınar University", city: "Kütahya" },
  { name: "Kütahya Health Sciences University", city: "Kütahya" },
  { name: "Lokman Hekim University", city: "Ankara" },
  { name: "Malatya Turgut Özal University", city: "Malatya" },
  { name: "Maltepe University", city: "Istanbul" },
  { name: "Manisa Celal Bayar University", city: "Manisa" },
  { name: "Mardin Artuklu University", city: "Mardin" },
  { name: "Marmara University", city: "Istanbul" },
  { name: "MEF University", city: "Istanbul" },
  { name: "Mersin University", city: "Mersin" },
  { name: "Middle East Technical University", city: "Ankara" },
  { name: "Mimar Sinan Fine Arts University", city: "Istanbul" },
  { name: "Muğla Sıtkı Koçman University", city: "Muğla" },
  { name: "Mudanya University", city: "Bursa" },
  { name: "Munzur University", city: "Tunceli" },
  { name: "Muş Alparslan University", city: "Muş" },
  { name: "Necmettin Erbakan University", city: "Konya" },
  { name: "Nevşehir Hacı Bektaş Veli University", city: "Nevşehir" },
  { name: "Niğde Ömer Halisdemir University", city: "Niğde" },
  { name: "Nuh Naci Yazgan University", city: "Kayseri" },
  { name: "Ondokuz Mayıs University", city: "Samsun" },
  { name: "Ordu University", city: "Ordu" },
  { name: "Osmaniye Korkut Ata University", city: "Osmaniye" },
  { name: "OSTIM Technical University", city: "Ankara" },
  { name: "Özyeğin University", city: "Istanbul" },
  { name: "Pamukkale University", city: "Denizli" },
  { name: "Piri Reis University", city: "Istanbul" },
  { name: "Recep Tayyip Erdoğan University", city: "Rize" },
  { name: "Sabancı University", city: "Istanbul" },
  { name: "Sakarya University", city: "Sakarya" },
  { name: "Sakarya University of Applied Sciences", city: "Sakarya" },
  { name: "Samsun University", city: "Samsun" },
  { name: "Sanko University", city: "Gaziantep" },
  { name: "Selçuk University", city: "Konya" },
  { name: "Siirt University", city: "Siirt" },
  { name: "Sinop University", city: "Sinop" },
  { name: "Sivas Cumhuriyet University", city: "Sivas" },
  { name: "Sivas University of Science and Technology", city: "Sivas" },
  { name: "Social Sciences University of Ankara", city: "Ankara" },
  { name: "Süleyman Demirel University", city: "Isparta" },
  { name: "Şırnak University", city: "Şırnak" },
  { name: "Tarsus University", city: "Mersin" },
  { name: "TED University", city: "Ankara" },
  { name: "Tekirdağ Namık Kemal University", city: "Tekirdağ" },
  { name: "TOBB University of Economics and Technology", city: "Ankara" },
  { name: "Tokat Gaziosmanpaşa University", city: "Tokat" },
  { name: "Toros University", city: "Mersin" },
  { name: "Trabzon University", city: "Trabzon" },
  { name: "Trakya University", city: "Edirne" },
  { name: "Turkish-German University", city: "Istanbul" },
  { name: "Turkish-Japanese Science and Technology University", city: "Istanbul" },
  { name: "Ufuk University", city: "Ankara" },
  { name: "University of Health Sciences", city: "Istanbul" },
  { name: "University of Turkish Aeronautical Association", city: "Ankara" },
  { name: "Uşak University", city: "Uşak" },
  { name: "Üsküdar University", city: "Istanbul" },
  { name: "Van Yüzüncü Yıl University", city: "Van" },
  { name: "Yalova University", city: "Yalova" },
  { name: "Yaşar University", city: "İzmir" },
  { name: "Yeditepe University", city: "Istanbul" },
  { name: "Yıldız Technical University", city: "Istanbul" },
  { name: "Yozgat Bozok University", city: "Yozgat" },
  { name: "Yüksek İhtisas University", city: "Ankara" },
  { name: "Zonguldak Bülent Ecevit University", city: "Zonguldak" },
];

/**
 * Fold Turkish diacritics + casing so "bogazici" matches "Boğaziçi". Uses NFD
 * decomposition to strip combining marks, then maps the dotless/dotted-i pair
 * and a few letters NFD doesn't separate (ı, ş is handled by NFD via ş→s+◌̧).
 */
export function foldTurkish(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .toLowerCase()
    .trim();
}

/**
 * Up to `limit` universities whose name or city contains the (diacritic-folded)
 * query. Prefix matches on the name rank above mid-string matches.
 */
export function searchTurkishUniversities(
  query: string,
  limit = 8,
): TurkishUniversity[] {
  const q = foldTurkish(query);
  if (q.length === 0) return [];
  const scored: Array<{ u: TurkishUniversity; score: number }> = [];
  for (const u of TURKISH_UNIVERSITIES) {
    const name = foldTurkish(u.name);
    const city = foldTurkish(u.city);
    if (name.startsWith(q)) scored.push({ u, score: 0 });
    else if (name.includes(q)) scored.push({ u, score: 1 });
    else if (city.startsWith(q)) scored.push({ u, score: 2 });
    else if (city.includes(q)) scored.push({ u, score: 3 });
  }
  scored.sort((a, b) => a.score - b.score || a.u.name.localeCompare(b.u.name));
  return scored.slice(0, limit).map((s) => s.u);
}

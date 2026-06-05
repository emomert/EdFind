/**
 * Academic email domain validation for university verification.
 *
 * Decision (2026-06-05): accept ANY academic domain, not just catalog
 * universities — Turkish students' own university mails count too, since
 * they're the community's actual audience. An email qualifies when its
 * domain:
 *
 *   1. is NOT a consumer free-mail provider, AND
 *   2. matches a recognised academic TLD pattern (.edu, .edu.tr, .ac.uk, …)
 *      OR is/belongs to a known university domain (curated list + the
 *      `website` domains of every university in the EdFind catalog, resolved
 *      at request time so new catalog drops extend coverage automatically).
 *
 * Pure functions — no I/O here. The catalog-domain fetch lives in
 * `lib/verification/server.ts`.
 */

/** Consumer providers that can never count as a university email. */
const FREE_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "yandex.com",
  "yandex.ru",
  "mail.ru",
  "gmx.de",
  "gmx.net",
  "web.de",
  "mynet.com",
  "zoho.com",
]);

/**
 * Academic TLD conventions. Subdomains are matched implicitly because we
 * test against the full domain string.
 *
 * NOTE: we deliberately do NOT use an open `\.edu\.[a-z]{2}` / `\.ac\.[a-z]{2,3}`
 * wildcard. Labels like `ac.io`, `edu.io`, `ac.me`, `edu.cc` are ordinary
 * registrable domains under generic ccTLDs — an attacker could buy one,
 * receive mail on it, and self-verify. Only registries that actually restrict
 * the second level to educational institutions go in ACADEMIC_SLDS below.
 */
const ACADEMIC_TLD_PATTERNS: RegExp[] = [
  /(^|\.)edu$/, // .edu gTLD — EDUCAUSE-restricted (kit.edu, etc.)
  /(^|\.)uni-[a-z0-9-]+\.de$/, // uni-heidelberg.de, uni-muenchen.de, …
  /(^|\.)tu-[a-z0-9-]+\.de$/, // tu-berlin.de, tu-dresden.de, …
  /(^|\.)fh-[a-z0-9-]+\.de$/, // German Fachhochschulen
  /(^|\.)univ-[a-z0-9-]+\.fr$/, // univ-lyon1.fr, univ-grenoble-alpes.fr, …
];

/**
 * Registry-controlled academic second-level domains (the registry restricts
 * who may register under them). Matched by suffix like KNOWN_ACADEMIC_DOMAINS,
 * so `student.metu.edu.tr` and `ox.ac.uk` resolve correctly. Extend this list
 * — never the wildcard — when a new legitimate academic registry is needed.
 */
const ACADEMIC_SLDS = new Set([
  // .edu.* (educational-institution-restricted)
  "edu.tr",
  "edu.au",
  "edu.pl",
  "edu.cn",
  "edu.sg",
  "edu.my",
  "edu.in",
  "edu.pk",
  "edu.hk",
  "edu.mx",
  "edu.co",
  "edu.gr",
  "edu.es",
  "edu.it",
  "edu.pt",
  "edu.sa",
  "edu.eg",
  "edu.ua",
  "edu.ru",
  "edu.vn",
  "edu.ph",
  "edu.bd",
  "edu.lb",
  "edu.jo",
  // .ac.* (academic-restricted)
  "ac.uk",
  "ac.jp",
  "ac.at",
  "ac.be",
  "ac.nz",
  "ac.in",
  "ac.kr",
  "ac.za",
  "ac.il",
  "ac.ir",
  "ac.id",
  "ac.th",
  "ac.lk",
  "ac.cy",
  "ac.rs",
  "ac.ae",
  "ac.ke",
  "ac.tz",
  "ac.ug",
  "ac.ma",
  "ac.fj",
  "ac.mw",
  "ac.zm",
]);

/**
 * Curated safety net for major European universities whose domains don't
 * follow an academic TLD convention. The catalog's own `website` domains are
 * merged in at request time, so this list only needs to cover well-known
 * institutions outside the catalog.
 */
const KNOWN_ACADEMIC_DOMAINS = new Set([
  // Italy
  "polimi.it",
  "polito.it",
  "unibo.it",
  "unimi.it",
  "uniroma1.it",
  // Switzerland
  "ethz.ch",
  "epfl.ch",
  "uzh.ch",
  "unige.ch",
  // Germany (non-pattern)
  "tum.de",
  "lmu.de",
  "rwth-aachen.de",
  "hu-berlin.de",
  "fu-berlin.de",
  // Netherlands
  "tudelft.nl",
  "uva.nl",
  "vu.nl",
  "tue.nl",
  "utwente.nl",
  "rug.nl",
  "uu.nl",
  "leidenuniv.nl",
  "wur.nl",
  "maastrichtuniversity.nl",
  // Nordics
  "kth.se",
  "chalmers.se",
  "lu.se",
  "uu.se",
  "ki.se",
  "su.se",
  "aalto.fi",
  "helsinki.fi",
  "dtu.dk",
  "ku.dk",
  "au.dk",
  "aau.dk",
  "sdu.dk",
  "uio.no",
  "ntnu.no",
  "uib.no",
  // Belgium
  "kuleuven.be",
  "ugent.be",
  "uantwerpen.be",
  "ulb.be",
  "uclouvain.be",
  // France (non-pattern)
  "sorbonne-universite.fr",
  "universite-paris-saclay.fr",
  "centralesupelec.fr",
  "sciencespo.fr",
  "psl.eu",
  // Iberia
  "tecnico.ulisboa.pt",
  "ulisboa.pt",
  "up.pt",
  "uc.pt",
  "unl.pt",
  "ucm.es",
  "uam.es",
  "uc3m.es",
  "unav.es",
  // Central / Eastern Europe
  "cuni.cz",
  "cvut.cz",
  "muni.cz",
  "vut.cz",
  "elte.hu",
  "bme.hu",
  // Ireland
  "tcd.ie",
  "ucd.ie",
  "ucc.ie",
  "universityofgalway.ie",
]);

/** Lower-cased domain part of an email address, or null if malformed. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

function matchesDomainOrParent(domain: string, candidates: Set<string>): boolean {
  if (candidates.has(domain)) return true;
  // subdomain match: mail.polimi.it → polimi.it
  for (const candidate of candidates) {
    if (domain.endsWith(`.${candidate}`)) return true;
  }
  return false;
}

export type AcademicCheck =
  | { ok: true }
  | { ok: false; reason: "free-mail" | "not-academic" };

/**
 * @param domain   lower-cased email domain
 * @param extraDomains additional accepted domains (catalog universities)
 */
export function checkAcademicDomain(
  domain: string,
  extraDomains: ReadonlySet<string> = new Set(),
): AcademicCheck {
  if (FREE_MAIL_DOMAINS.has(domain)) {
    return { ok: false, reason: "free-mail" };
  }
  if (ACADEMIC_TLD_PATTERNS.some((pattern) => pattern.test(domain))) {
    return { ok: true };
  }
  if (matchesDomainOrParent(domain, ACADEMIC_SLDS)) {
    return { ok: true };
  }
  if (matchesDomainOrParent(domain, KNOWN_ACADEMIC_DOMAINS)) {
    return { ok: true };
  }
  if (matchesDomainOrParent(domain, extraDomains as Set<string>)) {
    return { ok: true };
  }
  return { ok: false, reason: "not-academic" };
}

/** Hostname of a university `website` value, normalised for matching. */
export function websiteToDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    const url = new URL(
      website.includes("://") ? website : `https://${website}`,
    );
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

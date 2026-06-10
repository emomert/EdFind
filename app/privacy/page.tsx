import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What EdFind collects, why, who processes it, where it's stored, and the rights you have over your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="10 June 2026"
      intro="EdFind is built for students in Turkey, hosted in the EU, and designed to collect as little as it needs to match you well. This policy explains what we collect, why, who helps us process it, and the rights you have."
    >
      <h2>1. Who we are</h2>
      <p>
        EdFind (&quot;we&quot;) operates the website at{" "}
        <a href="https://ed-find.vercel.app/">ed-find.vercel.app</a>. For privacy
        questions, contact{" "}
        <a href="mailto:privacy@ed-find.vercel.app">privacy@ed-find.vercel.app</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Account details (via Google sign-in):</strong> your name, email
          address, and profile picture, as provided by Google when you sign in. We
          do not see your Google password.
        </li>
        <li>
          <strong>Your quiz and search answers:</strong> the profile you build —
          destinations, situation, institution, study background, GPA, budget,
          language level, goals, and any free-text you write — plus the matches we
          generate for you.
        </li>
        <li>
          <strong>Your activity in the product:</strong> programs you save, the
          applications and tasks you track, and (if you use it) university-email
          verification and community contributions.
        </li>
        <li>
          <strong>Technical data:</strong> a random identifier stored in a cookie
          to link your pre-sign-in activity to your account, plus standard server
          and security logs from our hosting provider.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> ask for and request that you do{" "}
        <strong>not</strong> enter sensitive personal data (health, religion,
        political views, national-ID numbers, etc.) into free-text fields.
      </p>

      <h2>3. Why we use it (legal bases)</h2>
      <ul>
        <li>
          To run the matcher and show you results, save your progress, and operate
          the features you use — this is necessary to provide the service you
          asked for (contract).
        </li>
        <li>
          To keep the service secure and working, and to improve it — our
          legitimate interests.
        </li>
        <li>
          To send the university-email verification message, if you choose to
          verify — your request / consent.
        </li>
      </ul>

      <h2>4. Who processes your data</h2>
      <p>
        We use a small set of trusted providers (&quot;processors&quot;) to run
        EdFind:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, authentication, and storage,
          hosted in the EU (Ireland).
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and content delivery.
        </li>
        <li>
          <strong>Google</strong> — sign-in (OAuth).
        </li>
        <li>
          <strong>An AI model provider (DeepSeek)</strong> — to power matching and
          free-text search. When you submit the quiz or a search, the answers you
          provided are sent to this provider&apos;s API to generate your matches.
          Because this processing may occur outside the EU, please avoid putting
          identifying or sensitive details in free-text fields.
        </li>
        <li>
          <strong>Resend</strong> — to send transactional email (e.g. the
          verification link), only when that feature is used.
        </li>
      </ul>
      <p>
        We do not sell your personal data, and we do not use it for third-party
        advertising.
      </p>

      <h2>5. Where it&apos;s stored and for how long</h2>
      <p>
        Your account and profile data are stored in our EU (Ireland) database. We
        keep your data while your account is active. You can ask us to delete it
        (see below); we also retain limited records where the law requires.
      </p>

      <h2>6. Cookies and local storage</h2>
      <p>
        We use cookies and browser storage only for things that make the product
        work: keeping you signed in, linking pre-sign-in quiz answers to your
        account, remembering a draft of your quiz, and remembering whether
        you&apos;ve seen the welcome tour. We do not use third-party advertising
        or cross-site tracking cookies.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Under the EU GDPR and Turkey&apos;s KVKK, you have the right to access,
        correct, delete, or export your personal data, and to object to or
        restrict certain processing. You can wipe your quiz answers, matches,
        saved programs, applications, and tasks yourself from the applications
        page (&quot;Reset all progress&quot;). For a full account deletion or any
        other request, email{" "}
        <a href="mailto:privacy@ed-find.vercel.app">privacy@ed-find.vercel.app</a>{" "}
        and we&apos;ll action it. You also have the right to complain to your data
        protection authority.
      </p>

      <h2>8. Children</h2>
      <p>
        EdFind is intended for prospective master&apos;s students and is not
        directed at children under the age of majority in their country.
      </p>

      <h2>9. Changes</h2>
      <p>
        If we change this policy we&apos;ll update the date above and, for material
        changes, take reasonable steps to let you know. Continued use after a
        change means you accept the updated policy.
      </p>
    </LegalPage>
  );
}

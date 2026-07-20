/**
 * English body of the Terms of Service. Long-form legal prose is kept as
 * plain JSX per locale (see content-tr.tsx) rather than as one giant JSON
 * string — see docs/features/i18n.md "long-prose strategy". Shared chrome
 * (title, intro, "last updated") lives in the `legal` message namespace.
 */
export function TermsContentEn() {
  return (
    <>
      <h2>1. What EdFind is</h2>
      <p>
        EdFind is an online tool that aggregates information about master&apos;s
        programs at European universities and uses AI to suggest programs that
        may fit a profile you describe. It is an{" "}
        <strong>information and discovery service</strong>. It is not a
        university, an admissions agent, an immigration adviser, or a financial
        adviser, and using it does not create any such relationship.
      </p>

      <h2>2. No guarantee of admission or outcomes</h2>
      <p>
        Our matches, scores, and rationales are AI-generated suggestions to help
        you research, not predictions or promises. We do not guarantee admission,
        scholarships, visas, accommodation, tuition figures, deadlines, or any
        other outcome. University details (tuition, deadlines, requirements,
        rankings, housing costs) change frequently and can contain errors. You
        are responsible for verifying every material detail on the
        university&apos;s official website before you apply or make any decision.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>
          You sign in with Google. You are responsible for keeping access to that
          Google account secure and for activity that happens under your EdFind
          account.
        </li>
        <li>
          You must be old enough to form a binding contract in your country
          (generally 18, or the age of majority where you live).
        </li>
        <li>
          Provide accurate information in the quiz and your profile. Misleading
          information mainly degrades the quality of your own matches.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          scrape, bulk-download, or resell the catalog or any other content
          without our written permission;
        </li>
        <li>
          attempt to break, overload, probe, or circumvent the security or access
          controls of the service;
        </li>
        <li>
          submit unlawful content, or use the service to harass others or
          infringe anyone&apos;s rights;
        </li>
        <li>
          misuse the AI features — for example to generate spam or to extract the
          underlying models.
        </li>
      </ul>

      <h2>5. Community content</h2>
      <p>
        Where EdFind offers community features (reviews, questions, groups),
        content posted by users reflects their own views, not ours. Some
        community features are limited to users who verify a university email.
        You keep ownership of what you post, but grant us a licence to host and
        display it within the service. We may remove content that breaks these
        terms.
      </p>

      <h2>6. Pricing and tiers</h2>
      <p>
        EdFind may offer free and paid tiers. Where a paid tier applies, the
        price, billing cycle, and what it includes will be shown before you pay.
        Partner universities are content-tagged and surfaced as a separate tier;
        we do not silently boost partner universities inside neutral matching
        results.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The EdFind name, logo, software, and the curated structure of the catalog
        are ours or our licensors&apos;. Underlying facts about universities and
        programs are not owned by us. You may use the service for your own,
        non-commercial study search.
      </p>

      <h2>8. Disclaimers and liability</h2>
      <p>
        The service is provided <strong>&quot;as is&quot;</strong> without
        warranties of any kind. To the maximum extent permitted by law, EdFind is
        not liable for indirect or consequential losses, or for decisions you make
        based on information found through the service. Nothing in these terms
        limits liability that cannot be limited by law.
      </p>

      <h2>9. Changes and termination</h2>
      <p>
        We may update the service and these terms. If we make a material change we
        will update the date above and, where appropriate, notify you. You can
        stop using EdFind at any time. We may suspend or end access if these terms
        are breached.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:hello@ed-find.vercel.app">hello@ed-find.vercel.app</a>.
        See also our <a href="/privacy">Privacy Policy</a> and our{" "}
        <a href="/technical-report">technical overview</a> of how the service
        works.
      </p>
    </>
  );
}

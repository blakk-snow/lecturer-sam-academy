/**
 * Terms.jsx — Terms of Service (draft)
 */

import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="font-serif text-3xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: October 2026</p>
      </div>

      <section className="rounded-2xl border border-line bg-card p-5 space-y-4 text-sm leading-relaxed text-ink">
        <p>
          These terms govern your use of <strong>Lecturer Sam Academy</strong> (“the app”), operated by{' '}
          <strong>Beacon Educational Consult</strong> (“we”, “us”). By using the app you agree to these terms.
        </p>

        <div>
          <h2 className="font-serif text-lg mb-1">1. What the app does</h2>
          <p>
            The app provides curriculum-aligned teaching and learning resources for Ghanaian Junior High Schools —
            lesson planning, timetables, curriculum browsing, textbooks, practice questions and an AI assistant —
            based on the NaCCA Common Core Programme.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">2. Accounts</h2>
          <p>
            You may use the app without an account; some features (AI assistant, cloud sync) require one. You are
            responsible for keeping your sign-in details safe. Registering an account implies no obligation to pay.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">3. Paid plans</h2>
          <p>
            The free plan includes 10 AI generations per calendar month. The <strong>Pro plan</strong> (GH₵50 per
            month) provides unlimited AI generations. Pro payments are processed by Paystack and activate
            automatically after a successful payment; each payment extends your Pro access by 30 days. All fees are
            payable in advance and are non-refundable except where required by law.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">4. Acceptable use</h2>
          <p>
            You agree not to: resell or sublicense the app or its content; attempt to extract, bulk-download or
            redistribute the bundled textbooks, question banks or lesson notes; interfere with the app's operation;
            or use the AI assistant to generate unlawful or harmful material. AI outputs may contain errors — always
            verify them against the official NaCCA curriculum before classroom use.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">5. Intellectual property</h2>
          <p>
            The software and all original content are © Beacon Educational Consult, licensed for use within the app
            only (see the app's <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link> and the
            licence notice). The NaCCA curriculum text belongs to the Ministry of Education / NaCCA and is reproduced
            for alignment purposes.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">6. Service and liability</h2>
          <p>
            The app is provided “as is”. We aim to keep it available but do not guarantee uninterrupted service, and
            we are not liable for indirect losses arising from its use. Nothing in these terms limits rights you have
            under Ghanaian law.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">7. Changes and contact</h2>
          <p>
            We may update these terms; continued use after a change means you accept it. Questions? Contact{' '}
            <strong>Beacon Educational Consult</strong> through the in-app WhatsApp support link (Settings → WhatsApp
            support).
          </p>
        </div>
      </section>
    </div>
  );
}

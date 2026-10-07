/**
 * Privacy.jsx — Privacy Policy (draft)
 */

export default function Privacy() {
  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="font-serif text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: October 2026</p>
      </div>

      <section className="rounded-2xl border border-line bg-card p-5 space-y-4 text-sm leading-relaxed text-ink">
        <p>
          <strong>Lecturer Sam Academy</strong> is operated by <strong>Beacon Educational Consult</strong>. This
          policy explains what data the app handles and how. We comply with the Ghana Data Protection Act, 2012
          (Act 843).
        </p>

        <div>
          <h2 className="font-serif text-lg mb-1">1. Data stored on your device</h2>
          <p>
            Student profiles, learning progress, practice attempts, quiz results and any planner work done while
            signed out are stored <strong>only on your device</strong> (IndexedDB). We do not receive or store this
            data.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">2. Data stored in the cloud (when you sign in)</h2>
          <p>
            If you create an account (Google or email), the following is stored in Firebase, operated on our behalf:{' '}
            your name and email address, your lesson plans and weekly topics, your timetable, and a usage counter for
            the AI assistant. This data is private to your account and is used to sync your work across your own
            devices and to enforce plan limits.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">3. Payments</h2>
          <p>
            Payments are processed by <strong>Paystack</strong>. We do not see or store your card or mobile-money
            details; Paystack provides us only with confirmation of a successful payment and the email address used.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">4. AI requests</h2>
          <p>
            When you use the AI assistant, your question and the relevant curriculum context are sent to our server
            and then to the AI provider (OpenRouter) to generate a response. AI requests are not used to identify
            you and are not used to train the provider's models.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">5. What we do not do</h2>
          <p>
            We do not sell, rent or share your personal data with advertisers or third parties. We do not collect
            students' personal data — student profiles are device-local only.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">6. Your rights</h2>
          <p>
            You may access, correct, export or delete your account data at any time — delete your planner data in the
            app or contact us and we will remove your account and its cloud data within 30 days.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg mb-1">7. Contact</h2>
          <p>
            Questions or requests: <strong>Beacon Educational Consult</strong> — via the in-app WhatsApp support link
            (Settings → WhatsApp support).
          </p>
        </div>
      </section>
    </div>
  );
}

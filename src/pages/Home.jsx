import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useStudent } from "../context/StudentContext";

export default function Home() {
  const { student } = useStudent();
  const startTo = student ? "/dashboard" : "/profile";

  return (
    <div className="space-y-10">

      {/* Hero — two-column on md+ */}
      <section className="overflow-hidden rounded-3xl border border-line bg-card">
        <div className="grid md:grid-cols-2">

          {/* Left — text content */}
          <div className="flex flex-col justify-center px-8 py-12 md:px-12 md:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Lecturer Sam Academy
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              Better Teachers Build Brighter Futures
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Plan your lessons, explore the national curriculum, and track your
              teaching progress — all in one place, designed for JHS teachers in Ghana.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/planner">
                <Button className="w-full sm:w-auto">Start Planning</Button>
              </Link>
              <Link to="/curriculum">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Browse Curriculum
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — image */}
          <div className="relative hidden md:block">
            <img
              src="/lecturer-sam-office.png"
              alt="Lecturer Sam in his office"
              className="h-full w-full object-cover object-center"
            />
            {/* subtle gradient blend on the left edge */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-card to-transparent" />
          </div>
        </div>

        {/* Mobile image — shown below text on small screens */}
        <div className="md:hidden">
          <img
            src="/lecturer-sam-office.png"
            alt="Lecturer Sam in his office"
            className="h-56 w-full object-cover object-top"
          />
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            title: "Lesson Planner",
            text: "Set up your terms, classes and subjects. Plan each week by picking directly from the NaCCA curriculum.",
            to: "/planner",
          },
          {
            icon: GraduationCap,
            title: "Curriculum Browser",
            text: "Explore the full NaCCA Common Core Programme for Basic 7–9 across all subjects — strands, standards and indicators.",
            to: "/curriculum",
          },
          {
            icon: BookOpen,
            title: "Progress Tracking",
            text: "See how many weeks you have planned and taught at a glance, broken down by term, class and subject.",
            to: "/dashboard",
          },
        ].map(({ icon: Icon, title, text, to }) => (
          <Link key={title} to={to} className="group">
            <article className="h-full rounded-2xl border border-line bg-card p-5 transition-colors group-hover:border-accent/40">
              <div className="mb-3 inline-flex rounded-lg bg-accent/10 p-2">
                <Icon size={20} className="text-accent" />
              </div>
              <h2 className="font-serif text-xl">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
            </article>
          </Link>
        ))}
      </section>

      {/* Quote strip */}
      <section className="rounded-2xl border border-line bg-card px-8 py-7">
        <blockquote className="font-serif text-xl italic leading-relaxed text-ink-soft md:text-2xl">
          "Education is not the filling of a pail, but the lighting of a fire."
        </blockquote>
        <p className="mt-3 text-sm font-medium text-ink-soft">— W.B. Yeats</p>
      </section>

    </div>
  );
}

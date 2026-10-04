import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { course } from "../data/course";
import { useStudent } from "../context/StudentContext";

export default function Home() {
  const { student } = useStudent();
  const startTo = student ? "/dashboard" : "/profile";

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-line bg-card px-6 py-12 md:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {course.title}
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
          {course.headline}
        </h1>
        <p className="mt-3 font-serif text-xl text-accent-2">{course.tagline}</p>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          {course.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={startTo}>
            <Button className="w-full sm:w-auto">Start Learning</Button>
          </Link>
          <Link to="/course">
            <Button variant="secondary" className="w-full sm:w-auto">
              Explore Course
            </Button>
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Learn", "Short explanations, worked examples and a consistent lesson path."],
          ["Practise", "Questions with instant, instructional feedback — not just a tick."],
          ["Master", "Progress and mastery stay on this device, including offline after install."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-serif text-xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

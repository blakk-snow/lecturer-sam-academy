import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useStudent } from "../context/StudentContext";

export default function Profile() {
  const { student, settings, saveProfile } = useStudent();
  const navigate = useNavigate();
  const [name, setName] = useState(student?.name ?? "");
  const [fontSize, setFontSize] = useState(settings.fontSize ?? "md");

  useEffect(() => {
    if (student?.name) setName(student.name);
  }, [student]);

  useEffect(() => {
    if (settings?.fontSize) setFontSize(settings.fontSize);
  }, [settings]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    await saveProfile(name, fontSize);
    navigate("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Student profile</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Use a name or nickname. Progress stays on this device. No email or password is required.
        </p>
      </div>
      <Card>
        <form className="space-y-5" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="font-semibold">Name or nickname</span>
            <input
              className="min-h-12 w-full rounded-xl border border-line bg-paper px-4"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="nickname"
              required
            />
          </label>
          <fieldset>
            <legend className="mb-2 font-semibold">Text size</legend>
            <div className="flex gap-2">
              {[
                ["sm", "Small"],
                ["md", "Medium"],
                ["lg", "Large"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFontSize(value)}
                  className={`min-h-11 flex-1 rounded-xl border ${
                    fontSize === value
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-paper"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <Button type="submit" className="w-full">
            {student ? "Save profile" : "Enter the course"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

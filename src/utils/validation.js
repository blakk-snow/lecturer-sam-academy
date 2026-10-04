export function normaliseAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function answersMatch(expected, actual, extra = []) {
  const got = normaliseAnswer(actual);
  const options = [expected, ...extra].map(normaliseAnswer);
  return options.includes(got);
}

export function checkQuestion(question, response) {
  if (!question) {
    return { correct: false, misconceptionId: null };
  }

  if (question.type === "mcq") {
    const correct = response === question.answer;
    return {
      correct,
      misconceptionId: correct ? null : question.misconceptions?.[response] ?? null,
    };
  }

  if (question.type === "trueFalse") {
    const value = response === true || response === "true";
    const correct = value === question.answer;
    const key = String(value);
    return {
      correct,
      misconceptionId: correct ? null : question.misconceptions?.[key] ?? null,
    };
  }

  const correct = answersMatch(
    question.answer,
    response,
    question.accepted ?? [],
  );
  const key = normaliseAnswer(response);
  return {
    correct,
    misconceptionId: correct ? null : question.misconceptions?.[key] ?? null,
  };
}

export const units = [
  {
    id: "unit-1",
    number: 1,
    title: "Number and Numeration Systems",
    shortDescription:
      "How we name and classify numbers — and the errors and misconceptions that get in the way.",
    available: true,
    sections: [
      {
        id: "u1-s1",
        title: "Meanings of Error and Misconceptions",
        available: true,
      },
      {
        id: "u1-s2",
        title: "Barriers to Learning Number and Algebra",
        available: false,
      },
      {
        id: "u1-s3",
        title: "Natural and Whole Numbers",
        available: false,
      },
      {
        id: "u1-s4",
        title: "Integers",
        available: false,
      },
      {
        id: "u1-s5",
        title: "Rational Numbers",
        available: false,
      },
      {
        id: "u1-s6",
        title: "Irrational and Real Numbers",
        available: false,
      },
    ],
  },
  {
    id: "unit-2",
    number: 2,
    title: "Operations and Properties of Real Numbers",
    shortDescription:
      "Operations, properties, fractions, decimals, estimation, approximation and surds.",
    available: false,
    sections: [],
  },
  {
    id: "unit-3",
    number: 3,
    title: "Sets and Set Problems",
    shortDescription:
      "Set language, operations, and two- and three-set problems with Venn diagrams.",
    available: false,
    sections: [],
  },
  {
    id: "unit-4",
    number: 4,
    title: "Algebraic Expressions",
    shortDescription:
      "Terms, simplification, equations, inequalities and simultaneous linear equations.",
    available: false,
    sections: [],
  },
  {
    id: "unit-5",
    number: 5,
    title: "Commercial Arithmetic, Number Bases and Modular Arithmetic",
    shortDescription:
      "Ratio, percentages, interest, taxation, bases and remainders in everyday contexts.",
    available: false,
    sections: [],
  },
  {
    id: "unit-6",
    number: 6,
    title: "Functions and Algebraic Graphs",
    shortDescription:
      "Mappings, functions, inverses, composites, and linear and quadratic graphs.",
    available: false,
    sections: [],
  },
];

export function getUnit(unitId) {
  return units.find((unit) => unit.id === unitId);
}

export function getSection(unitId, sectionId) {
  const unit = getUnit(unitId);
  return unit?.sections.find((section) => section.id === sectionId);
}

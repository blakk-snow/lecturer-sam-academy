export const subjects = [
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'science', label: 'Science' },
];

export const classes = [
  { id: 'B7', label: 'Basic 7' },
  { id: 'B8', label: 'Basic 8' },
  { id: 'B9', label: 'Basic 9' },
];

export const curriculumMap = {
  mathematics: {
    B7: [
      {
        id: 'strand-1', code: '1', title: 'NUMBER',
        subStrands: [
          {
            id: 'ss-1-1', code: '1.1', title: 'Number and Numeration Systems',
            contentStandards: [
              {
                id: 'B7.1.1.1', code: 'B7.1.1.1',
                description: 'Demonstrate understanding and the use of place value for expressing quantities recorded as base ten numerals as well as rounding these to given decimal places and significant figures.',
                indicators: [
                  { id: 'B7.1.1.1.1', code: 'B7.1.1.1.1', description: 'Model number quantities more than 1,000,000,000 using graph sheets, isometric papers and multi-base blocks' },
                  { id: 'B7.1.1.1.3', code: 'B7.1.1.1.3', description: 'Round (off, up, down) whole numbers more than 1,000,000,000 to the nearest hundred-thousand, ten-thousands, thousands, hundreds and tens' },
                  { id: 'B7.1.1.1.4', code: 'B7.1.1.1.4', description: 'Round decimals to the nearest tenth, hundredth, thousandths, etc.' },
                  { id: 'B7.1.1.1.5', code: 'B7.1.1.1.5', description: 'Express decimal numerals to given significant and decimal places' },
                ],
              },
              {
                id: 'B7.1.1.2', code: 'B7.1.1.2',
                description: 'Compare and order whole numbers more than 1,000,000,000 and represent the comparison using ">, <, or ="',
                indicators: [],
              },
            ],
          },
          {
            id: 'ss-1-2', code: '1.2', title: 'Number Operations',
            contentStandards: [
              {
                id: 'B7.1.2.1', code: 'B7.1.2.1',
                description: 'Apply mental mathematics strategies and number properties used to solve problems',
                indicators: [
                  { id: 'B7.1.2.1.1', code: 'B7.1.2.1.1', description: 'Multiply and divide given numbers by powers of 10 including decimals and benchmark fractions' },
                  { id: 'B7.1.2.1.2', code: 'B7.1.2.1.2', description: 'Apply mental mathematics strategies and number properties used to perform calculations.' },
                  { id: 'B7.1.2.1.3', code: 'B7.1.2.1.3', description: 'Apply mental mathematics strategies to solve word problems.' },
                ],
              },
              {
                id: 'B7.1.2.2', code: 'B7.1.2.2',
                description: 'Demonstrate an understanding of addition, subtraction, multiplication and division of whole numbers and decimal numbers to solve problems.',
                indicators: [
                  { id: 'B7.1.2.2.1', code: 'B7.1.2.2.1', description: 'Add and subtract up to four-digit numbers.' },
                  { id: 'B7.1.2.2.3', code: 'B7.1.2.2.3', description: 'Create and solve story problems involving decimals.' },
                ],
              },
              {
                id: 'B7.1.2.3', code: 'B7.1.2.3',
                description: 'Demonstrate understanding and the use of powers of natural numbers in solving problems.',
                indicators: [
                  { id: 'B7.1.2.3.1', code: 'B7.1.2.3.1', description: 'Illustrate with examples the meaning of repeated factors using counting objects such as bottle tops or bundles.' },
                  { id: 'B7.1.2.3.2', code: 'B7.1.2.3.2', description: 'Express a given number as a product of a given number or numbers, as well as, in the form of a power or two such numbers as product of powers.' },
                  { id: 'B7.1.2.3.3', code: 'B7.1.2.3.3', description: 'Show that the value of any natural number with zero as its exponent or index is 1 and use it to solve problems.' },
                  { id: 'B7.1.2.3.4', code: 'B7.1.2.3.4', description: 'Find the value of a number written in index form.' },
                  { id: 'B7.1.2.3.5', code: 'B7.1.2.3.5', description: 'Apply the concept of powers of numbers (product of prime) to find Highest Common Factor (HCF).' },
                ],
              },
            ],
          },
          {
            id: 'ss-1-3', code: '1.3', title: 'Fractions, Decimals and Percentages',
            contentStandards: [
              {
                id: 'B7.1.3.1', code: 'B7.1.3.1',
                description: 'Simplify, compare and order a mixture of positive fractions (i.e. common, percent and decimal) by changing all to equivalent fractions, decimals, or percentages.',
                indicators: [
                  { id: 'B7.1.3.1.1', code: 'B7.1.3.1.1', description: 'Determine and recall the percentages and decimals of given benchmark fractions (i.e. tenths, fifths, fourths, thirds and halves) and use these to compare quantities.' },
                  { id: 'B7.1.3.1.2', code: 'B7.1.3.1.2', description: 'Compare and order fractions (i.e. common, percent and decimal fractions up to thousandths) limited to the benchmark fractions.' },
                ],
              },
              {
                id: 'B7.1.3.2', code: 'B7.1.3.2',
                description: 'Demonstrate an understanding of the process of addition and/or subtraction of fractions and apply this in solving problems.',
                indicators: [
                  { id: 'B7.1.3.2.1', code: 'B7.1.3.2.1', description: 'Explain the process of addition and subtraction of two or three unlike and mixed fractions.' },
                  { id: 'B7.1.3.2.2', code: 'B7.1.3.2.2', description: 'Solve problems involving addition or subtraction of fractions.' },
                ],
              },
              {
                id: 'B7.1.3.3', code: 'B7.1.3.3',
                description: 'Demonstrate an understanding of the process of multiplying and dividing positive fractions and apply this in solving problems.',
                indicators: [
                  { id: 'B7.1.3.3.1', code: 'B7.1.3.3.1', description: 'Explain the process of multiplying a fraction (i.e. common, percent and decimal fractions up to thousandths) by a whole number and by a fraction.' },
                  { id: 'B7.1.3.3.2', code: 'B7.1.3.3.2', description: 'Find a fraction of given quantity (i.e. money or given quantity of objects).' },
                  { id: 'B7.1.3.3.3', code: 'B7.1.3.3.3', description: 'Explain the process of dividing a fraction (i.e. common, percent and decimal fractions up to thousandths) by a 1-digit whole number and by a fraction.' },
                  { id: 'B7.1.3.3.4', code: 'B7.1.3.3.4', description: 'Determine the result of dividing a quantity (i.e. money or objects) or a fraction by a fraction.' },
                ],
              },
            ],
          },
          {
            id: 'ss-1-4', code: '1.4', title: 'Ratios and Proportion',
            contentStandards: [
              {
                id: 'B7.1.4.1', code: 'B7.1.4.1',
                description: 'Demonstrate an understanding of the concept of ratios and its relationship to fractions and use it to solve problems that involve rates, ratios, and proportional reasoning.',
                indicators: [
                  { id: 'B7.1.4.1.1', code: 'B7.1.4.1.1', description: 'Find ratio and use ratio language to describe relationship between two quantities.' },
                  { id: 'B7.1.4.1.2', code: 'B7.1.4.1.2', description: 'Use the concept of a unit rate associated with a ratio a:b with b \u2260 0, and use rate language in the context of a ratio relationship.' },
                  { id: 'B7.1.4.1.3', code: 'B7.1.4.1.3', description: 'Make tables of equivalent ratios (written as common fractions) relating quantities that are proportional.' },
                  { id: 'B7.1.4.1.4', code: 'B7.1.4.1.4', description: 'Use proportional reasoning to find missing values in the tables, and plot pairs of values on the coordinate plane.' },
                  { id: 'B7.1.4.1.5', code: 'B7.1.4.1.5', description: 'Find a percent of a quantity as a rate per 100 (e.g. 30% of a quantity means 30/100 times the quantity).' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'strand-2', code: '2', title: 'ALGEBRA',
        subStrands: [
          {
            id: 'ss-2-1', code: '2.1', title: 'Patterns and Relations',
            contentStandards: [
              {
                id: 'B7.2.1.1', code: 'B7.2.1.1',
                description: 'Derive the rule for a set of points of a relation, draw a table of values to graph the relation in a number plane and make predictions about subsequent elements of the relation.',
                indicators: [
                  { id: 'B7.2.1.1.1', code: 'B7.2.1.1.1', description: 'Extend a given relation presented with and without symbolic materials and explain how each element differs from the preceding one.' },
                  { id: 'B7.2.1.1.2', code: 'B7.2.1.1.2', description: 'Describe the rule for a given relation using mathematical language such as one more, one less, one more than twice, etc.' },
                  { id: 'B7.2.1.1.3', code: 'B7.2.1.1.3', description: 'Identify the relation or rule in a pattern/mapping presented numerically or symbolically and predict subsequent elements.' },
                  { id: 'B7.2.1.1.4', code: 'B7.2.1.1.4', description: 'Locate points on the number plane, draw a table of values of a given relation, draw graphs for given relations and use them to solve problems.' },
                ],
              },
            ],
          },
          {
            id: 'ss-2-2', code: '2.2', title: 'Algebraic Expressions',
            contentStandards: [
              {
                id: 'B7.2.2.1', code: 'B7.2.2.1',
                description: 'Simplify algebraic expressions involving the four basic operations and substituting values to evaluate algebraic expressions.',
                indicators: [
                  { id: 'B7.2.2.1.1', code: 'B7.2.2.1.1', description: 'Create simple algebraic expressions using simple logic to translate a set of instructions into an algebraic expression.' },
                  { id: 'B7.2.2.1.2', code: 'B7.2.2.1.2', description: 'Perform addition and subtraction of algebraic expressions with rational coefficients.' },
                  { id: 'B7.2.2.1.3', code: 'B7.2.2.1.3', description: 'Perform multiplication and division of algebraic expressions with rational coefficients.' },
                  { id: 'B7.2.2.1.4', code: 'B7.2.2.1.4', description: 'Substitute values to evaluate algebraic expressions.' },
                  { id: 'B7.2.2.1.5', code: 'B7.2.2.1.5', description: 'Use properties of the four operations to simplify algebraic expressions with rational coefficients.' },
                ],
              },
            ],
          },
          {
            id: 'ss-2-3', code: '2.3', title: 'Variables and Equations',
            contentStandards: [
              {
                id: 'B7.2.3.1', code: 'B7.2.3.1',
                description: 'Demonstrate an understanding of linear equations of the form x + a = b (where a and b are integers) by modelling problems as a linear equation and solving the problems concretely, pictorially, and symbolically.',
                indicators: [
                  { id: 'B7.2.3.1.1', code: 'B7.2.3.1.1', description: 'Translate word problems to linear equations in one variable and vice versa.' },
                  { id: 'B7.2.3.1.2', code: 'B7.2.3.1.2', description: 'Model and solve linear equations using concrete materials (e.g., counters and integer tiles) and describe the process orally and symbolically.' },
                  { id: 'B7.2.3.1.3', code: 'B7.2.3.1.3', description: 'Model linear equations, then write mathematical expressions and describe the process of solving the equation using algebraic tiles.' },
                  { id: 'B7.2.3.1.4', code: 'B7.2.3.1.4', description: 'Solve linear equations in one variable.' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'strand-3', code: '3', title: 'GEOMETRY AND MEASUREMENT',
        subStrands: [
          {
            id: 'ss-3-1', code: '3.1', title: 'Shape and Space',
            contentStandards: [
              {
                id: 'B7.3.1.1', code: 'B7.3.1.1',
                description: 'Demonstrate understanding of angles including adjacent, vertically opposite, complementary, supplementary and use them to solve problems.',
                indicators: [
                  { id: 'B7.3.1.1.1', code: 'B7.3.1.1.1', description: 'Measure and classify angles according to their measured sizes - right, acute, obtuse and reflex.' },
                  { id: 'B7.3.1.1.2', code: 'B7.3.1.1.2', description: 'Apply the fact that complementary angles sum to 90\u00b0 and supplementary angles sum to 180\u00b0 to solve problems.' },
                  { id: 'B7.3.1.1.3', code: 'B7.3.1.1.3', description: 'Use adjacent, supplementary and vertically opposite angles to solve problems.' },
                ],
              },
              {
                id: 'B7.3.1.2', code: 'B7.3.1.2',
                description: 'Demonstrate how to construct a perpendicular to a line from a given point, bisect a line, bisect angles, and construct angles of the following sizes: 30\u00b0, 45\u00b0, 60\u00b0, 75\u00b0 and 90\u00b0.',
                indicators: [
                  { id: 'B7.3.1.2.1', code: 'B7.3.1.2.1', description: 'Construct a line segment perpendicular to another line segment.' },
                  { id: 'B7.3.1.2.2', code: 'B7.3.1.2.2', description: 'Construct the perpendicular bisector of a line segment.' },
                  { id: 'B7.3.1.2.3', code: 'B7.3.1.2.3', description: 'Copy and bisect angles.' },
                  { id: 'B7.3.1.2.7', code: 'B7.3.1.2.7', description: 'Describe examples of perpendicular line segments, perpendicular bisectors and angle bisectors in the environment.' },
                ],
              },
            ],
          },
          {
            id: 'ss-3-2', code: '3.2', title: 'Measurement',
            contentStandards: [
              {
                id: 'B7.3.2.1', code: 'B7.3.2.1',
                description: 'Demonstrate the ability to find the perimeter of plane shapes including circles using the concept of pi (\u03c0) to find the circumference of a circle.',
                indicators: [
                  { id: 'B7.3.2.1.1', code: 'B7.3.2.1.1', description: 'Calculate the perimeter of given shapes whose dimensions are in two units (i.e. cm and mm, m and cm, or km and m).' },
                  { id: 'B7.3.2.1.2', code: 'B7.3.2.1.2', description: 'Use the relationships between the diameter and the circumference to deduce the formula for finding the circumference of a circle and use it to solve problems.' },
                  { id: 'B7.3.2.1.3', code: 'B7.3.2.1.3', description: 'Draw in a square grid rectangles and triangles with given dimensions.' },
                ],
              },
              {
                id: 'B7.3.2.2', code: 'B7.3.2.2',
                description: 'Derive the formula for determining the area of a triangle and use it to solve problems.',
                indicators: [
                  { id: 'B7.3.2.2.1', code: 'B7.3.2.2.1', description: 'Use the relationships between a triangle and a rectangle (or parallelogram) to deduce the formula for determining the area of a triangle.' },
                  { id: 'B7.3.2.2.2', code: 'B7.3.2.2.2', description: 'Determine the area of a triangle.' },
                ],
              },
              {
                id: 'B7.3.2.3', code: 'B7.3.2.3',
                description: 'Demonstrate understanding of bearings, vector and its components using real life cases.',
                indicators: [
                  { id: 'B7.3.2.3.1', code: 'B7.3.2.3.1', description: 'Describe the bearing of a point from another point.' },
                  { id: 'B7.3.2.3.2', code: 'B7.3.2.3.2', description: 'Explain how to find the back bearing when the direction of travel has a bearing which is less than 180\u00b0 and/or greater than 180\u00b0.' },
                  { id: 'B7.3.2.3.3', code: 'B7.3.2.3.3', description: 'Distinguish between scalar and vector quantities.' },
                  { id: 'B7.3.2.3.4', code: 'B7.3.2.3.4', description: 'Represent vector in the column (component) form and determine its magnitude and direction.' },
                  { id: 'B7.3.2.3.5', code: 'B7.3.2.3.5', description: 'Convert vectors in the column (component) form to the Magnitude-Bearing form and vice versa.' },
                ],
              },
            ],
          },
          {
            id: 'ss-3-3', code: '3.3', title: 'Position and Transformation',
            contentStandards: [
              {
                id: 'B7.3.3.1', code: 'B7.3.3.1',
                description: 'Perform a single transformation (i.e. reflection and translation) on a 2D shape using graph paper and describe the properties of the image under the transformation (i.e. congruence, similarity, etc.).',
                indicators: [
                  { id: 'B7.3.3.1.1', code: 'B7.3.3.1.1', description: 'Determine shapes in real life that have reflectional (or fold) symmetries.' },
                  { id: 'B7.3.3.1.2', code: 'B7.3.3.1.2', description: 'Plot points and shapes (i.e. plane figures) on a coordinate plane and draw their images under reflection in given lines.' },
                  { id: 'B7.3.3.1.3', code: 'B7.3.3.1.3', description: 'Plot points and shapes (i.e. plane figures) on a coordinate plane and draw their images under translation by a given vector.' },
                  { id: 'B7.3.3.1.4', code: 'B7.3.3.1.4', description: 'Verify the concept of congruent and similar shapes in coordinate plane using properties of both the object(s) and image(s); and in real life situations.' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'strand-4', code: '4', title: 'HANDLING DATA',
        subStrands: [
          {
            id: 'ss-4-1', code: '4.1', title: 'Data',
            contentStandards: [
              {
                id: 'B7.4.1.1', code: 'B7.4.1.1',
                description: 'Select, justify, and use appropriate methods to collect data (quantitative and qualitative), display and analyse the data presented in frequency tables, line graphs, pie graphs, bar graphs or pictographs.',
                indicators: [
                  { id: 'B7.4.1.1.1', code: 'B7.4.1.1.1', description: 'Select and justify a method to collect data (quantitative and qualitative) to answer a given question.' },
                  { id: 'B7.4.1.1.2', code: 'B7.4.1.1.2', description: 'Design and administer a questionnaire for collecting data to answer questions and record the results.' },
                  { id: 'B7.4.1.1.3', code: 'B7.4.1.1.3', description: 'Organise and present data from a survey into a table and/or chart, and analyse it to solve and/or pose problems.' },
                ],
              },
              {
                id: 'B7.4.1.2', code: 'B7.4.1.2',
                description: 'Determine the measures of central tendency (mean, median, mode) for a given ungrouped data and use it to solve problems.',
                indicators: [
                  { id: 'B7.4.1.2.1', code: 'B7.4.1.2.1', description: 'Calculate the mean for a given ungrouped data and use it to solve problems.' },
                  { id: 'B7.4.1.2.2', code: 'B7.4.1.2.2', description: 'Calculate the median for a given ungrouped data and use it to solve problems.' },
                ],
              },
            ],
          },
          {
            id: 'ss-4-2', code: '4.2', title: 'Chance or Probability',
            contentStandards: [
              {
                id: 'B7.4.2.1', code: 'B7.4.2.1',
                description: 'Identify the sample space for a probability experiment involving single events and express the probabilities of given events as fractions, decimals, percentages and/or ratios to solve problems.',
                indicators: [
                  { id: 'B7.4.2.1.1', code: 'B7.4.2.1.1', description: 'Demonstrate understanding of likelihood of a single outcome occurring by providing examples of events that are impossible, possible, or certain from personal contexts.' },
                  { id: 'B7.4.2.1.2', code: 'B7.4.2.1.2', description: 'Classify the likelihood of a single outcome occurring in a probability experiment as impossible, possible, or certain.' },
                  { id: 'B7.4.2.1.3', code: 'B7.4.2.1.3', description: 'Calculate the probability of the event and express the probability as fractions, decimals, percentages and/or ratios.' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  science: {
    B7: [
      {
        id: 'sci-b7-strand-1', code: '1', title: 'DIVERSITY OF MATTER',
        subStrands: [
          {
            id: 'sci-b7-ss-1-1', code: '1.1', title: 'MATERIALS',
            contentStandards: [
              {
                id: 'B7/JHS1.1.1.1', code: 'B7/JHS1.1.1.1',
                description: 'Recognise materials as important resources for providing human needs',
                indicators: [
                  { id: 'B7/JHS1.1.1.1.1', code: 'B7/JHS1.1.1.1.1', description: 'Classify materials into liquids, solids and gases' },
                  { id: 'B7/JHS1.1.1.1.2', code: 'B7/JHS1.1.1.1.2', description: 'Discuss the importance of liquids in the life of humans' },
                  { id: 'B7/JHS1.1.1.1.3', code: 'B7/JHS1.1.1.1.3', description: 'Discuss the importance of specific solids to life' },
                ],
              },
              {
                id: 'B7/JHS1.1.1.2', code: 'B7/JHS1.1.1.2',
                description: 'Understand the periodic table as different elements made up of metals and non-metals and noble gases arranged in an order',
                indicators: [
                  { id: 'B7/JHS1.1.1.2.1', code: 'B7/JHS1.1.1.2.1', description: 'Demonstrate the knowledge of the orderly arrangement of metals, non-metals and noble gases in the periodic table' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-1-2', code: '1.2', title: 'LIVING CELLS',
            contentStandards: [
              {
                id: 'B7/JHS1.1.2.1', code: 'B7/JHS1.1.2.1',
                description: 'Demonstrate understanding of the structure of organisms and functions of cells in living systems',
                indicators: [
                  { id: 'B7/JHS1.1.2.1.1', code: 'B7/JHS1.1.2.1.1', description: 'Describe the structure and function of living cells of an animal' },
                  { id: 'B7/JHS1.1.2.1.2', code: 'B7/JHS1.1.2.1.2', description: 'State the functions of each organelle in a plant cell' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b7-strand-2', code: '2', title: 'CYCLES',
        subStrands: [
          {
            id: 'sci-b7-ss-2-1', code: '2.1', title: 'EARTH SCIENCE',
            contentStandards: [
              {
                id: 'B7/JHS1.2.1.1', code: 'B7/JHS1.2.1.1',
                description: 'Recognise that the water cycle is an example of repeated patterns of change in nature and understand how it occurs',
                indicators: [
                  { id: 'B7/JHS1.2.1.1.1', code: 'B7/JHS1.2.1.1.1', description: 'Explain how the water cycle occurs as a repeated pattern in nature' },
                  { id: 'B7/JHS1.2.1.1.2', code: 'B7/JHS1.2.1.1.2', description: 'Describe the importance of the water cycle in nature' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-2-2', code: '2.2', title: 'LIFE CYCLE OF ORGANISMS',
            contentStandards: [
              {
                id: 'B7/JHS1.2.2.1', code: 'B7/JHS1.2.2.1',
                description: 'Demonstrate the skills of carrying out activities to show the stages of the life cycle of a housefly, the effects of its activities on humans and how to reduce them',
                indicators: [
                  { id: 'B7/JHS1.2.2.1.1', code: 'B7/JHS1.2.2.1.1', description: 'Describe the life cycle of the housefly' },
                  { id: 'B7/JHS1.2.2.1.2', code: 'B7/JHS1.2.2.1.2', description: 'Discuss the activities of the housefly as a menace to humans and show how to reduce the effects of those activities' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-2-3', code: '2.3', title: 'CROP PRODUCTION',
            contentStandards: [
              {
                id: 'B7/JHS1.2.3.1', code: 'B7/JHS1.2.3.1',
                description: 'Demonstrate understanding of the different plant nutrients (organic, and inorganic fertilizers) and their application in school farming',
                indicators: [
                  { id: 'B7/JHS1.2.3.1.1', code: 'B7/JHS1.2.3.1.1', description: 'Observe and list all plant nutrient sources available in a community and categorise them into organic and inorganic nutrient sources' },
                  { id: 'B7/JHS1.2.3.1.2', code: 'B7/JHS1.2.3.1.2', description: 'Describe the physical characteristics of different plant nutrients (organic and inorganic) and how each is applied to plants in the field' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-2-4', code: '2.4', title: 'ANIMAL PRODUCTION',
            contentStandards: [
              {
                id: 'B7/JHS1.2.4.1', code: 'B7/JHS1.2.4.1',
                description: 'Demonstrate an understanding of the differences among domestic animals such as ruminants, monogastrics and poultry',
                indicators: [
                  { id: 'B7/JHS1.2.4.1.1', code: 'B7/JHS1.2.4.1.1', description: 'Examine and list domestic animals in the community' },
                  { id: 'B7/JHS1.2.4.1.2', code: 'B7/JHS1.2.4.1.2', description: 'Show the differences and similarities among domestic animals' },
                ],
              },
              {
                id: 'B7/JHS1.2.4.2', code: 'B7/JHS1.2.4.2',
                description: 'Show an understanding of the usefulness of the different types of animals for domestic and commercial purposes',
                indicators: [
                  { id: 'B7/JHS1.2.4.2.1', code: 'B7/JHS1.2.4.2.1', description: 'Discuss and write the domestic and commercial uses of different types of animals' },
                  { id: 'B7/JHS1.2.4.2.2', code: 'B7/JHS1.2.4.2.2', description: 'Observe and compare the uses of the different types of animals' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b7-strand-3', code: '3', title: 'SYSTEMS',
        subStrands: [
          {
            id: 'sci-b7-ss-3-1', code: '3.1', title: 'THE HUMAN BODY SYSTEM',
            contentStandards: [
              {
                id: 'B7/JHS1.3.1.1', code: 'B7/JHS1.3.1.1',
                description: 'Show an understanding of the concept of food, and the process of digestion and appreciate its importance in humans',
                indicators: [
                  { id: 'B7/JHS1.3.1.1.1', code: 'B7/JHS1.3.1.1.1', description: 'Explain the concept of food and the need for humans to eat' },
                  { id: 'B7/JHS1.3.1.1.2', code: 'B7/JHS1.3.1.1.2', description: 'Examine what happens to food at the stages of digestion in humans' },
                  { id: 'B7/JHS1.3.1.1.3', code: 'B7/JHS1.3.1.1.3', description: 'Identify the end product of digestion of starchy, protein and oily foods and explain how absorption of the digested food occurs in humans' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-3-2', code: '3.2', title: 'THE SOLAR SYSTEM',
            contentStandards: [
              {
                id: 'B7/JHS1.3.2.1', code: 'B7/JHS1.3.2.1',
                description: 'Demonstrate knowledge of the inner planets of the solar system and understand their movement in the system',
                indicators: [
                  { id: 'B7/JHS1.3.2.1.1', code: 'B7/JHS1.3.2.1.1', description: 'Identify the inner planets of the solar system and describe their properties' },
                  { id: 'B7/JHS1.3.2.1.2', code: 'B7/JHS1.3.2.1.2', description: 'Discuss the properties and the relative motions of the planets Mercury and Venus' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-3-3', code: '3.3', title: 'ECOSYSTEM',
            contentStandards: [
              {
                id: 'B7/JHS1.3.3.1', code: 'B7/JHS1.3.3.1',
                description: 'Recognise the components of and interdependences in an ecosystem, and appreciate their interactions',
                indicators: [
                  { id: 'B7/JHS1.3.3.1.1', code: 'B7/JHS1.3.3.1.1', description: 'Analyse the components of ecosystems and identify the interactions within' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-3-4', code: '3.4', title: 'FARMING SYSTEMS',
            contentStandards: [
              {
                id: 'B7/JHS1.3.4.1', code: 'B7/JHS1.3.4.1',
                description: 'Demonstrate an understanding of the differences among the various farming systems: Land Rotation, Crop Rotation, Mixed Cropping, Mixed Farming, and Organic Farming',
                indicators: [
                  { id: 'B7/JHS1.3.4.1.1', code: 'B7/JHS1.3.4.1.1', description: 'Examine and discuss the differences among the various farming systems' },
                  { id: 'B7/JHS1.3.4.1.2', code: 'B7/JHS1.3.4.1.2', description: 'Categorise different farming systems' },
                  { id: 'B7/JHS1.3.4.1.3', code: 'B7/JHS1.3.4.1.3', description: 'Discuss the usefulness of different farming systems' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b7-strand-4', code: '4', title: 'FORCES AND ENERGY',
        subStrands: [
          {
            id: 'sci-b7-ss-4-1', code: '4.1', title: 'ENERGY',
            contentStandards: [
              {
                id: 'B7/JHS1.4.1.1', code: 'B7/JHS1.4.1.1',
                description: 'Demonstrate an understanding of forms of energy and their daily applications',
                indicators: [
                  { id: 'B7/JHS1.4.1.1.1', code: 'B7/JHS1.4.1.1.1', description: 'Identify the various forms of energy and show how they are related' },
                  { id: 'B7/JHS1.4.1.1.2', code: 'B7/JHS1.4.1.1.2', description: 'Explain daily applications of forms of energy' },
                ],
              },
              {
                id: 'B7/JHS1.4.1.2', code: 'B7/JHS1.4.1.2',
                description: 'Demonstrate an understanding of the concept of heat transfer and its applications in life',
                indicators: [
                  { id: 'B7/JHS1.4.1.2.1', code: 'B7/JHS1.4.1.2.1', description: 'Explain and demonstrate how heat is transferred in various media' },
                ],
              },
              {
                id: 'B7/JHS1.4.1.3', code: 'B7/JHS1.4.1.3',
                description: 'Demonstrate understanding of characteristics of light, such as travelling in a straight line, reflection, refraction and dispersion',
                indicators: [
                  { id: 'B7/JHS1.4.1.3.1', code: 'B7/JHS1.4.1.3.1', description: 'Demonstrate how light travels in a straight line' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-4-2', code: '4.2', title: 'ELECTRICITY AND ELECTRONICS',
            contentStandards: [
              {
                id: 'B7/JHS1.4.2.1', code: 'B7/JHS1.4.2.1',
                description: 'Demonstrate understanding of forms of electricity, its generation and effects on the environment',
                indicators: [
                  { id: 'B7/JHS1.4.2.1.1', code: 'B7/JHS1.4.2.1.1', description: 'Describe the various forms of electricity generation' },
                  { id: 'B7/JHS1.4.2.1.2', code: 'B7/JHS1.4.2.1.2', description: 'Explain the impact of electricity generation on the environment' },
                ],
              },
              {
                id: 'B7/JHS1.4.2.2', code: 'B7/JHS1.4.2.2',
                description: 'Demonstrate knowledge of how to assemble and explain the functions of basic electronic components and their interdependence in an electronic circuit',
                indicators: [
                  { id: 'B7/JHS1.4.2.2.1', code: 'B7/JHS1.4.2.2.1', description: 'Demonstrate how to assemble basic electronic components in an electronic circuit' },
                  { id: 'B7/JHS1.4.2.2.2', code: 'B7/JHS1.4.2.2.2', description: 'Discuss the function of each electronic component and their interdependence with each other' },
                  { id: 'B7/JHS1.4.2.2.3', code: 'B7/JHS1.4.2.2.3', description: 'Discuss the function of each electronic component such as resistor, diode, and inductor, and their interdependence for the functioning of an electronic gadget' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-4-3', code: '4.3', title: 'CONVERSION AND CONSERVATION OF ENERGY',
            contentStandards: [
              {
                id: 'B7/JHS1.4.3.1', code: 'B7/JHS1.4.3.1',
                description: 'Demonstrate an understanding of the principle of conservation and conversion of energy and their application in real life situations',
                indicators: [
                  { id: 'B7/JHS1.4.3.1.1', code: 'B7/JHS1.4.3.1.1', description: 'Explain the principle underlying conservation and conversion of energy' },
                  { id: 'B7/JHS1.4.3.1.2', code: 'B7/JHS1.4.3.1.2', description: 'Demonstrate the conversion of energy into useable forms' },
                  { id: 'B7/JHS1.4.3.1.3', code: 'B7/JHS1.4.3.1.3', description: 'Know how energy could be conserved for future use in life' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-4-4', code: '4.4', title: 'FORCE AND MOTION',
            contentStandards: [
              {
                id: 'B7/JHS1.4.4.1', code: 'B7/JHS1.4.4.1',
                description: "Examine the concept of motion, Newton's first law of motion, magnetic force in relation to motion and understand their applications to life",
                indicators: [
                  { id: 'B7/JHS1.4.4.1.1', code: 'B7/JHS1.4.4.1.1', description: 'Understand that unbalanced forces acting on an object cause it to move' },
                  { id: 'B7/JHS1.4.4.1.2', code: 'B7/JHS1.4.4.1.2', description: "State and explain Newton's First Law of motion" },
                  { id: 'B7/JHS1.4.4.1.3', code: 'B7/JHS1.4.4.1.3', description: "Examine the application of Newton's First Law of motion in life" },
                  { id: 'B7/JHS1.4.4.1.4', code: 'B7/JHS1.4.4.1.4', description: 'Demonstrate the behaviour of magnet and its use to life' },
                ],
              },
              {
                id: 'B7/JHS1.4.4.2', code: 'B7/JHS1.4.4.2',
                description: 'Recognise some simple machines, and show understanding of their efficiency in doing work',
                indicators: [
                  { id: 'B7/JHS1.4.4.2.1', code: 'B7/JHS1.4.4.2.1', description: 'Identify simple machines' },
                  { id: 'B7/JHS1.4.4.2.2', code: 'B7/JHS1.4.4.2.2', description: 'Describe the types and functions of levers' },
                  { id: 'B7/JHS1.4.4.2.3', code: 'B7/JHS1.4.4.2.3', description: 'Know work input, and output and efficiency as they apply to machines' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-4-5', code: '4.5', title: 'AGRICULTURAL TOOLS',
            contentStandards: [
              {
                id: 'B7/JHS1.4.5.1', code: 'B7/JHS1.4.5.1',
                description: 'Demonstrate knowledge and skills in handling and maintenance of basic and simple agricultural tools',
                indicators: [
                  { id: 'B7/JHS1.4.5.1.1', code: 'B7/JHS1.4.5.1.1', description: 'Explain the basic rules in handling and maintaining simple agricultural tools' },
                  { id: 'B7/JHS1.4.5.1.2', code: 'B7/JHS1.4.5.1.2', description: 'Apply the handling and maintenance of basic and simple agricultural tools in their community' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b7-strand-5', code: '5', title: 'HUMANS AND THE ENVIRONMENT',
        subStrands: [
          {
            id: 'sci-b7-ss-5-1', code: '5.1', title: 'WASTE MANAGEMENT',
            contentStandards: [
              {
                id: 'B7/JHS1.5.1.1', code: 'B7/JHS1.5.1.1',
                description: 'Exhibit knowledge and skill of scientific basis for management practices of types of waste in the environment',
                indicators: [
                  { id: 'B7/JHS1.5.1.1.1', code: 'B7/JHS1.5.1.1.1', description: 'Apply information from research on good management practices of waste to make the environment clean' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-5-2', code: '5.2', title: 'HUMAN HEALTH',
            contentStandards: [
              {
                id: 'B7/JHS1.5.2.1', code: 'B7/JHS1.5.2.1',
                description: 'Demonstrate knowledge of common deficiency diseases of humans, their causes, symptoms, effects and prevention',
                indicators: [
                  { id: 'B7/JHS1.5.2.1.1', code: 'B7/JHS1.5.2.1.1', description: 'Explain the relationship between food nutrients and common deficiency diseases and how they affect humans' },
                ],
              },
              {
                id: 'B7/JHS1.5.2.2', code: 'B7/JHS1.5.2.2',
                description: 'Demonstrate knowledge of the nature of selected viral diseases of humans, their causes, symptoms, effects and management',
                indicators: [
                  { id: 'B7/JHS1.5.2.2.1', code: 'B7/JHS1.5.2.2.1', description: 'Explain the nature of viral diseases with special emphasis on corona virus (COVID-19)/Ebola/H1N1 disease its causes, symptoms, effects on humans and its prevention' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-5-3', code: '5.3', title: 'SCIENCE AND INDUSTRY',
            contentStandards: [
              {
                id: 'B7/JHS1.5.3.1', code: 'B7/JHS1.5.3.1',
                description: 'Realise how careers in science can improve human life, and research about Ghanaian and internationally recognised scientists and science educators and model after them',
                indicators: [
                  { id: 'B7/JHS1.5.3.1.1', code: 'B7/JHS1.5.3.1.1', description: 'Discover and explain how careers in science can improve human conditions and relate these careers to the work of great national and international scientists and science educators' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-5-4', code: '5.4', title: 'CLIMATE CHANGE AND GREEN ECONOMY',
            contentStandards: [
              {
                id: 'B7/JHS1.5.4.1', code: 'B7/JHS1.5.4.1',
                description: 'Demonstrate understanding of sustainable energy choices and their impact on the environment',
                indicators: [
                  { id: 'B7/JHS1.5.4.1.1', code: 'B7/JHS1.5.4.1.1', description: 'Search for information on ways sustainable energy choices and scientific ideas are used to protect the environment' },
                ],
              },
            ],
          },
          {
            id: 'sci-b7-ss-5-5', code: '5.5', title: 'UNDERSTANDING THE ENVIRONMENT',
            contentStandards: [
              {
                id: 'B7/JHS1.5.5.1', code: 'B7/JHS1.5.5.1',
                description: 'Demonstrate understanding of different plants and animals found in different land forms and how they survive (with emphasis land forms in Ghana)',
                indicators: [
                  { id: 'B7/JHS1.5.5.1.1', code: 'B7/JHS1.5.5.1.1', description: 'List and describe the different types of plants and animals that live in different land forms such as plateau plain, mountain valley and others' },
                  { id: 'B7/JHS1.5.5.1.2', code: 'B7/JHS1.5.5.1.2', description: 'Explain the nature of associations that exist among plants and animals in different landforms and their mechanisms for survival' },
                ],
              },
            ],
          },
        ],
      },
    ],
    B8: [
      {
        id: 'sci-b8-strand-1', code: '1', title: 'DIVERSITY OF MATTER',
        subStrands: [
          {
            id: 'sci-b8-ss-1-1', code: '1.1', title: 'MATERIALS',
            contentStandards: [
              {
                id: 'B8/JHS2.1.1.1', code: 'B8/JHS2.1.1.1',
                description: 'Demonstrate knowledge of types of mixtures, and understanding of the processes of scientific ways of separating the components of mixtures',
                indicators: [
                  { id: 'B8/JHS2.1.1.1.1', code: 'B8/JHS2.1.1.1.1', description: 'Identify types of mixtures by name and characteristics' },
                  { id: 'B8/JHS2.1.1.1.2', code: 'B8/JHS2.1.1.1.2', description: 'Design and perform processes for separating kinds of mixtures' },
                ],
              },
              {
                id: 'B8/JHS2.1.1.2', code: 'B8/JHS2.1.1.2',
                description: 'Demonstrate understanding of atoms and the atomic structure of elements in the periodic table',
                indicators: [
                  { id: 'B8/JHS2.1.1.2.1', code: 'B8/JHS2.1.1.2.1', description: 'Describe atoms as composed of sub-atomic particles' },
                  { id: 'B8/JHS2.1.1.2.2', code: 'B8/JHS2.1.1.2.2', description: 'Explain the arrangement of elements in terms of the number of protons in the nuclei of atoms of each element' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-1-2', code: '1.2', title: 'LIVING CELLS',
            contentStandards: [
              {
                id: 'B8/JHS2.1.2.1', code: 'B8/JHS2.1.2.1',
                description: 'Demonstrate an understanding of the types of cells and their structure in relation to different organisms',
                indicators: [
                  { id: 'B8/JHS2.1.2.1.1', code: 'B8/JHS2.1.2.1.1', description: 'Examine and describe the structure of prokaryotic and eukaryotic cells' },
                  { id: 'B8/JHS2.1.2.1.2', code: 'B8/JHS2.1.2.1.2', description: 'Classify organisms (plants or animals) as prokaryotic or eukaryotic based on the type of cells they are made of' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b8-strand-2', code: '2', title: 'CYCLES',
        subStrands: [
          {
            id: 'sci-b8-ss-2-1', code: '2.1', title: 'EARTH SCIENCE',
            contentStandards: [
              {
                id: 'B8/JHS2.2.1.1', code: 'B8/JHS2.2.1.1',
                description: 'Demonstrate understanding of the process of Carbon cycle as an example of repeated pattern of change in nature and how it relates to the environment',
                indicators: [
                  { id: 'B8/JHS2.2.1.1.1', code: 'B8/JHS2.2.1.1.1', description: 'Explain the process of the carbon cycle' },
                  { id: 'B8/JHS2.2.1.1.2', code: 'B8/JHS2.2.1.1.2', description: 'Describe the role of the carbon cycle to the environment' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-2-2', code: '2.2', title: 'LIFE CYCLE OF ORGANISMS',
            contentStandards: [
              {
                id: 'B8/JHS2.2.2.1', code: 'B8/JHS2.2.2.1',
                description: 'Demonstrate an activity to show the life cycle of the Anopheles mosquito and show how the effects of the mosquito on humans can be managed',
                indicators: [
                  { id: 'B8/JHS2.2.2.1.1', code: 'B8/JHS2.2.2.1.1', description: 'Describe the life cycle and economic importance of the Anopheles mosquito' },
                  { id: 'B8/JHS2.2.2.1.2', code: 'B8/JHS2.2.2.1.2', description: 'Discuss the impact of the Anopheles mosquito on humans and how it can be controlled' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-2-3', code: '2.3', title: 'CROP PRODUCTION',
            contentStandards: [
              {
                id: 'B8/JHS2.2.3.1', code: 'B8/JHS2.2.3.1',
                description: 'Demonstrate knowledge and skills in planting crops on different seed beds',
                indicators: [
                  { id: 'B8/JHS2.2.3.1.1', code: 'B8/JHS2.2.3.1.1', description: 'Explore the different seed beds for planting crops in your community' },
                  { id: 'B8/JHS2.2.3.1.2', code: 'B8/JHS2.2.3.1.2', description: 'Plant different types of crops on different seed beds' },
                ],
              },
              {
                id: 'B8/JHS2.2.3.2', code: 'B8/JHS2.2.3.2',
                description: 'Demonstrate understanding of the differences in height, size, and flowering of crops grown in different seed beds',
                indicators: [
                  { id: 'B8/JHS2.2.3.2.1', code: 'B8/JHS2.2.3.2.1', description: 'Compare and contrast the differences in height, size, and flowering of crops grown in different seed beds' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-2-4', code: '2.4', title: 'ANIMAL PRODUCTION',
            contentStandards: [
              {
                id: 'B8/JHS2.2.4.1', code: 'B8/JHS2.2.4.1',
                description: 'Recognise the different types of feed for different types of animals',
                indicators: [
                  { id: 'B8/JHS2.2.4.1.1', code: 'B8/JHS2.2.4.1.1', description: 'Compare and contrast the different types of feed for different types of animals' },
                ],
              },
              {
                id: 'B8/JHS2.2.4.2', code: 'B8/JHS2.2.4.2',
                description: 'Demonstrate understanding of the importance of water and animal feed to the growth of animals',
                indicators: [
                  { id: 'B8/JHS2.2.4.2.1', code: 'B8/JHS2.2.4.2.1', description: 'Explain the importance of water and animal feed to the growth of animals' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b8-strand-3', code: '3', title: 'SYSTEMS',
        subStrands: [
          {
            id: 'sci-b8-ss-3-1', code: '3.1', title: 'THE HUMAN BODY SYSTEM',
            contentStandards: [
              {
                id: 'B8/JHS2.3.1.1', code: 'B8/JHS2.3.1.1',
                description: 'Demonstrate knowledge of parts of mammalian tooth and the functions of the different types of teeth in relation to feeding in man',
                indicators: [
                  { id: 'B8/JHS2.3.1.1.1', code: 'B8/JHS2.3.1.1.1', description: 'Identify parts of a mammalian tooth' },
                  { id: 'B8/JHS2.3.1.1.2', code: 'B8/JHS2.3.1.1.2', description: 'Discuss the functions of the different types of teeth such as incisors, canines, premolars, and molars' },
                  { id: 'B8/JHS2.3.1.1.3', code: 'B8/JHS2.3.1.1.3', description: 'Explain the causes and prevention of tooth and gum decay' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-3-2', code: '3.2', title: 'THE SOLAR SYSTEM',
            contentStandards: [
              {
                id: 'B8/JHS2.3.2.1', code: 'B8/JHS2.3.2.1',
                description: 'Demonstrate knowledge of the outer planets of the solar system',
                indicators: [
                  { id: 'B8/JHS2.3.2.1.1', code: 'B8/JHS2.3.2.1.1', description: 'Identify the outer planets of the solar system and describe their properties' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-3-3', code: '3.3', title: 'ECOSYSTEM',
            contentStandards: [
              {
                id: 'B8/JHS2.3.3.1', code: 'B8/JHS2.3.3.1',
                description: 'Demonstrate an understanding of the interdependence of organisms in an ecosystem and their interaction',
                indicators: [
                  { id: 'B8/JHS2.3.3.1.1', code: 'B8/JHS2.3.3.1.1', description: 'Explore the feeding relationships within an ecosystem' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-3-4', code: '3.4', title: 'FARMING SYSTEMS',
            contentStandards: [
              {
                id: 'B8/JHS2.3.4.1', code: 'B8/JHS2.3.4.1',
                description: 'Demonstrate understanding of the different crop, animal and land combinations under various farming systems',
                indicators: [
                  { id: 'B8/JHS2.3.4.1.1', code: 'B8/JHS2.3.4.1.1', description: 'Identify and describe the types of crops, animals and land combinations for the different farming systems' },
                  { id: 'B8/JHS2.3.4.1.2', code: 'B8/JHS2.3.4.1.2', description: 'Discuss the usefulness of the different crops and animals involved in the different farming systems' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b8-strand-4', code: '4', title: 'FORCES AND ENERGY',
        subStrands: [
          {
            id: 'sci-b8-ss-4-1', code: '4.1', title: 'ENERGY',
            contentStandards: [
              {
                id: 'B8/JHS2.4.1.1', code: 'B8/JHS2.4.1.1',
                description: 'Demonstrate the skill to evaluate the conversion of energy from one form to another',
                indicators: [
                  { id: 'B8/JHS2.4.1.1.1', code: 'B8/JHS2.4.1.1.1', description: 'Describe energy conversion' },
                  { id: 'B8/JHS2.4.1.1.2', code: 'B8/JHS2.4.1.1.2', description: 'Discuss the importance of conversion of energy' },
                ],
              },
              {
                id: 'B8/JHS2.4.1.2', code: 'B8/JHS2.4.1.2',
                description: 'Show an understanding of the sources of renewable energy and how to manage these sources in a sustainable manner',
                indicators: [
                  { id: 'B8/JHS2.4.1.2.1', code: 'B8/JHS2.4.1.2.1', description: 'Describe renewable and non-renewable forms of energy' },
                  { id: 'B8/JHS2.4.1.2.2', code: 'B8/JHS2.4.1.2.2', description: 'Demonstrate how to manage sources of renewable energy sustainably' },
                ],
              },
              {
                id: 'B8/JHS2.4.1.3', code: 'B8/JHS2.4.1.3',
                description: 'Demonstrate an understanding of the relationship between heat and temperature',
                indicators: [
                  { id: 'B8/JHS2.4.1.3.1', code: 'B8/JHS2.4.1.3.1', description: 'Discuss the differences and the relationship between heat and temperature in the environment' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-4-2', code: '4.2', title: 'ELECTRICITY AND ELECTRONICS',
            contentStandards: [
              {
                id: 'B8/JHS2.4.2.1', code: 'B8/JHS2.4.2.1',
                description: 'Demonstrate knowledge of electricity transmission',
                indicators: [
                  { id: 'B8/JHS2.4.2.1.1', code: 'B8/JHS2.4.2.1.1', description: 'Explain how electricity transmission occurs' },
                ],
              },
              {
                id: 'B8/JHS2.4.2.2', code: 'B8/JHS2.4.2.2',
                description: 'Demonstrate understanding of the functions of capacitors in relation to LEDs, Diodes and resistors in electronic circuits',
                indicators: [
                  { id: 'B8/JHS2.4.2.2.1', code: 'B8/JHS2.4.2.2.1', description: 'Demonstrate the charging and discharging action of a capacitor in a DC electronic circuit' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-4-3', code: '4.3', title: 'CONVERSION AND CONSERVATION OF ENERGY',
            contentStandards: [
              {
                id: 'B8/JHS2.4.3.1', code: 'B8/JHS2.4.3.1',
                description: 'Evaluate the impact of conversion of energy and energy conservation on the environment',
                indicators: [
                  { id: 'B8/JHS2.4.3.1.1', code: 'B8/JHS2.4.3.1.1', description: 'Explain the importance of conversion of energy and energy conservation in daily life' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-4-4', code: '4.4', title: 'FORCE AND MOTION',
            contentStandards: [
              {
                id: 'B8/JHS2.4.4.1', code: 'B8/JHS2.4.4.1',
                description: "Demonstrate the production of magnet, domestic and industrial application of Magnetic force and its relationship with Newton's Second law of motion and in everyday life",
                indicators: [
                  { id: 'B8/JHS2.4.4.1.1', code: 'B8/JHS2.4.4.1.1', description: 'Demonstrate simple ways of making magnets and show how magnetic force can be applied in domestic and industrial activities' },
                  { id: 'B8/JHS2.4.4.1.2', code: 'B8/JHS2.4.4.1.2', description: "Explain the relationship between magnetic force and Newton's Second Law of motion; and show the law's application to life" },
                ],
              },
              {
                id: 'B8/JHS2.4.4.2', code: 'B8/JHS2.4.4.2',
                description: 'Demonstrate understanding of complex machines and how they work',
                indicators: [
                  { id: 'B8/JHS2.4.4.2.1', code: 'B8/JHS2.4.4.2.1', description: 'Identify complex machines and describe their functions in life' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-4-5', code: '4.5', title: 'AGRICULTURAL TOOLS',
            contentStandards: [
              {
                id: 'B8/JHS2.4.5.1', code: 'B8/JHS2.4.5.1',
                description: 'Demonstrate knowledge and skills in the use of basic and simple agricultural tools for basic on-farm activities',
                indicators: [
                  { id: 'B8/JHS2.4.5.1.1', code: 'B8/JHS2.4.5.1.1', description: 'Show and discuss the use of basic and simple agricultural tools for basic on-farm activities' },
                  { id: 'B8/JHS2.4.5.1.2', code: 'B8/JHS2.4.5.1.2', description: 'Engage in the use of basic and simple agricultural tools for basic farm activities' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b8-strand-5', code: '5', title: 'HUMANS AND THE ENVIRONMENT',
        subStrands: [
          {
            id: 'sci-b8-ss-5-1', code: '5.1', title: 'WASTE MANAGEMENT',
            contentStandards: [
              {
                id: 'B8/JHS2.5.1.1', code: 'B8/JHS2.5.1.1',
                description: 'Demonstrate knowledge of waste management systems and apply it in an environment',
                indicators: [
                  { id: 'B8/JHS2.5.1.1.1', code: 'B8/JHS2.5.1.1.1', description: 'Explain sustainable waste management practices' },
                  { id: 'B8/JHS2.5.1.1.2', code: 'B8/JHS2.5.1.1.2', description: 'Apply knowledge of waste management practices to manage waste in a community' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-5-2', code: '5.2', title: 'HUMAN HEALTH',
            contentStandards: [
              {
                id: 'B8/JHS2.5.2.1', code: 'B8/JHS2.5.2.1',
                description: 'Demonstrate knowledge of common communicable diseases, such as Hepatitis, of humans, causes, symptoms, effects and their prevention',
                indicators: [
                  { id: 'B8/JHS2.5.2.1.1', code: 'B8/JHS2.5.2.1.1', description: 'Explain the symptoms, effects and prevention of common communicable diseases' },
                  { id: 'B8/JHS2.5.2.1.2', code: 'B8/JHS2.5.2.1.2', description: 'Analyse the risk factors of communicable diseases' },
                ],
              },
              {
                id: 'B8/JHS2.5.2.2', code: 'B8/JHS2.5.2.2',
                description: 'Demonstrate knowledge of the nature of selected bacterial diseases of humans, their causes, symptoms, effects and prevention',
                indicators: [
                  { id: 'B8/JHS2.5.2.2.1', code: 'B8/JHS2.5.2.2.1', description: 'Explain the nature of bacterial diseases with special emphasis on food poisoning/gonorrhoea/meningitis their causes, symptoms, effects on humans and prevention' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-5-3', code: '5.3', title: 'SCIENCE AND INDUSTRY',
            contentStandards: [
              {
                id: 'B8/JHS2.5.3.1', code: 'B8/JHS2.5.3.1',
                description: 'Demonstrate an understanding of connections among science, technology, innovation, society and the environment',
                indicators: [
                  { id: 'B8/JHS2.5.3.1.1', code: 'B8/JHS2.5.3.1.1', description: 'Examine the relationship among science, technology, innovation and society' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-5-4', code: '5.4', title: 'CLIMATE CHANGE AND GREEN ECONOMY',
            contentStandards: [
              {
                id: 'B8/JHS2.5.4.1', code: 'B8/JHS2.5.4.1',
                description: 'Demonstrate an understanding of the effects of climate change in the world and greening of other tropical countries including Ghana',
                indicators: [
                  { id: 'B8/JHS2.5.4.1.1', code: 'B8/JHS2.5.4.1.1', description: 'Explain the concept of climate change and its effect on the environment' },
                  { id: 'B8/JHS2.5.4.1.2', code: 'B8/JHS2.5.4.1.2', description: 'Describe climate change and green economy actions' },
                ],
              },
            ],
          },
          {
            id: 'sci-b8-ss-5-5', code: '5.5', title: 'UNDERSTANDING THE ENVIRONMENT',
            contentStandards: [
              {
                id: 'B8/JHS2.5.5.1', code: 'B8/JHS2.5.5.1',
                description: 'Demonstrate understanding of the differences among soils, plant roots, stems, leaves, flowers, and fruits of plants in the different environments',
                indicators: [
                  { id: 'B8/JHS2.5.5.1.1', code: 'B8/JHS2.5.5.1.1', description: 'Discuss physical properties of soils' },
                  { id: 'B8/JHS2.5.5.1.2', code: 'B8/JHS2.5.5.1.2', description: 'Analyse the physical properties of soils and soil water content and demonstrate their importance in crop production' },
                ],
              },
              {
                id: 'B8/JHS2.5.6.1', code: 'B8/JHS2.5.6.1',
                description: 'Recognise the different types of rocks as origin of different types of soils',
                indicators: [
                  { id: 'B8/JHS2.5.6.1.1', code: 'B8/JHS2.5.6.1.1', description: 'Observe and describe different types of rocks as origins of soils' },
                ],
              },
            ],
          },
        ],
      },
    ],
    B9: [
      {
        id: 'sci-b9-strand-1', code: '1', title: 'DIVERSITY OF MATTER',
        subStrands: [
          {
            id: 'sci-b9-ss-1-1', code: '1.1', title: 'MATERIALS',
            contentStandards: [
              {
                id: 'B9/JHS3.1.1.1', code: 'B9/JHS3.1.1.1',
                description: 'Show an understanding of formation of binary chemical compounds and their uses (Acids, Bases and Salts)',
                indicators: [
                  { id: 'B9/JHS3.1.1.1.1', code: 'B9/JHS3.1.1.1.1', description: 'Identify by name binary chemical compounds and discuss their uses' },
                  { id: 'B9/JHS3.1.1.1.2', code: 'B9/JHS3.1.1.1.2', description: 'Discuss the formation of binary chemical compounds' },
                  { id: 'B9/JHS3.1.1.1.3', code: 'B9/JHS3.1.1.1.3', description: 'Describe the characteristics of common acids, bases and salts' },
                ],
              },
              {
                id: 'B9/JHS3.1.1.2', code: 'B9/JHS3.1.1.2',
                description: 'Demonstrate knowledge of atomic bonding in the formation of chemical compounds',
                indicators: [
                  { id: 'B9/JHS3.1.1.2.1', code: 'B9/JHS3.1.1.2.1', description: 'Recognise that chemical bond results from the attraction between atoms in a compound' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-1-2', code: '1.2', title: 'LIVING CELLS',
            contentStandards: [
              {
                id: 'B9/JHS3.1.2.1', code: 'B9/JHS3.1.2.1',
                description: 'Demonstrate knowledge of specialist cells of dicotyledonous plants and humans, their formation and functions for the existence of the plants and humans',
                indicators: [
                  { id: 'B9/JHS3.1.2.1.1', code: 'B9/JHS3.1.2.1.1', description: 'Discuss the concepts of specialised cells and how they are formed in dicotyledonous plants and humans' },
                  { id: 'B9/JHS3.1.2.1.2', code: 'B9/JHS3.1.2.1.2', description: 'Examine the functions of specialised cells in dicotyledonous plants such as epidermal, guard cells, cambium, xylem in relation to the existence of the plants' },
                  { id: 'B9/JHS3.1.2.1.3', code: 'B9/JHS3.1.2.1.3', description: 'Examine the functions of specialised animal cells such as nerve, blood cells, muscle cells and sperm cells in relation to the existence of humans' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b9-strand-2', code: '2', title: 'CYCLES',
        subStrands: [
          {
            id: 'sci-b9-ss-2-1', code: '2.1', title: 'EARTH SCIENCES',
            contentStandards: [
              {
                id: 'B9/JHS3.2.1.1', code: 'B9/JHS3.2.1.1',
                description: 'Demonstrate an understanding of the Nitrogen cycle as a repeated pattern of change in nature, and how it relates to the environment',
                indicators: [
                  { id: 'B9/JHS3.2.1.1.1', code: 'B9/JHS3.2.1.1.1', description: 'Explain the process of the nitrogen cycle as a repeated pattern in nature' },
                  { id: 'B9/JHS3.2.1.1.2', code: 'B9/JHS3.2.1.1.2', description: 'Describe the importance of the nitrogen cycle to the environment' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-2-2', code: '2.2', title: 'LIFE CYCLE OF ORGANISMS',
            contentStandards: [
              {
                id: 'B9/JHS3.2.2.1', code: 'B9/JHS3.2.2.1',
                description: 'Demonstrate an understanding of the life cycle of grasshopper and assess how their activities affect humans',
                indicators: [
                  { id: 'B9/JHS3.2.2.1.1', code: 'B9/JHS3.2.2.1.1', description: 'Describe the life cycle of the grasshopper as a form of incomplete metamorphosis' },
                  { id: 'B9/JHS3.2.2.1.2', code: 'B9/JHS3.2.2.1.2', description: 'Examine how the activities of the grasshopper affect humans' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-2-3', code: '2.3', title: 'CROP PRODUCTION',
            contentStandards: [
              {
                id: 'B9/JHS3.2.3.1', code: 'B9/JHS3.2.3.1',
                description: 'Show an understanding of differences in maturities of different crops grown in different soils and different seed beds',
                indicators: [
                  { id: 'B9/JHS3.2.3.1.1', code: 'B9/JHS3.2.3.1.1', description: 'Observe and describe differences in maturation of crops grown in different soils and on different seed beds' },
                ],
              },
              {
                id: 'B9/JHS3.2.3.2', code: 'B9/JHS3.2.3.2',
                description: 'Demonstrate knowledge and understanding of uses of different crops at different maturity stages',
                indicators: [
                  { id: 'B9/JHS3.2.3.2.1', code: 'B9/JHS3.2.3.2.1', description: 'Observe and record the uses of different crops at different maturity stages' },
                  { id: 'B9/JHS3.2.3.2.2', code: 'B9/JHS3.2.3.2.2', description: 'Evaluate the importance of knowledge of maturity stages of different crops to human beings' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-2-4', code: '2.4', title: 'ANIMAL PRODUCTION',
            contentStandards: [
              {
                id: 'B9/JHS3.2.4.1', code: 'B9/JHS3.2.4.1',
                description: 'Demonstrate understanding of the preparation of feed for domestic and commercial animals',
                indicators: [
                  { id: 'B9/JHS3.2.4.1.1', code: 'B9/JHS3.2.4.1.1', description: 'List the ingredients and the method of preparation of different feed for different domestic and commercial animals' },
                ],
              },
              {
                id: 'B9/JHS3.2.4.2', code: 'B9/JHS3.2.4.2',
                description: 'Demonstrate skills and knowledge of feeding domestic and commercial animals',
                indicators: [
                  { id: 'B9/JHS3.2.4.2.1', code: 'B9/JHS3.2.4.2.1', description: 'Describe and select appropriate feed for different domestic and commercial animals' },
                  { id: 'B9/JHS3.2.4.2.2', code: 'B9/JHS3.2.4.2.2', description: 'Differentiate between different types of feed for different stages of domestic and commercial animals' },
                  { id: 'B9/JHS3.2.4.2.3', code: 'B9/JHS3.2.4.2.3', description: 'Perform the feeding of domestic and commercial animals' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b9-strand-3', code: '3', title: 'SYSTEMS',
        subStrands: [
          {
            id: 'sci-b9-ss-3-1', code: '3.1', title: 'THE HUMAN BODY SYSTEM',
            contentStandards: [
              {
                id: 'B9/JHS3.3.1.1', code: 'B9/JHS3.3.1.1',
                description: 'Demonstrate understanding of the blood circulatory system, health problems associated with the system and its relationship with the respiratory system in humans',
                indicators: [
                  { id: 'B9/JHS3.3.1.1.1', code: 'B9/JHS3.3.1.1.1', description: 'Explain the concept of the circulatory system, state the function of each part of the system and the health challenges associated with it' },
                  { id: 'B9/JHS3.3.1.1.2', code: 'B9/JHS3.3.1.1.2', description: 'Explain the concept of respiration and show how the respiratory and circulatory systems complement each other' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-3-2', code: '3.2', title: 'THE SOLAR SYSTEM',
            contentStandards: [
              {
                id: 'B9/JHS3.3.2.1', code: 'B9/JHS3.3.2.1',
                description: 'Demonstrate knowledge of other non-planetary bodies such as comets, asteroids, and their relationship with the solar system',
                indicators: [
                  { id: 'B9/JHS3.3.2.1.1', code: 'B9/JHS3.3.2.1.1', description: 'Understand the movement of non-planetary bodies in the solar system' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-3-3', code: '3.3', title: 'ECOSYSTEM',
            contentStandards: [
              {
                id: 'B9/JHS3.3.3.1', code: 'B9/JHS3.3.3.1',
                description: 'Recognise the interdependence of organisms in an ecosystem and appreciate their interaction to maintain balance in the system',
                indicators: [
                  { id: 'B9/JHS3.3.3.1.1', code: 'B9/JHS3.3.3.1.1', description: 'Conduct research into the composition of an ecosystem and discuss how the components depend on each other for survival' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-3-4', code: '3.4', title: 'FARMING SYSTEMS',
            contentStandards: [
              {
                id: 'B9/JHS3.3.4.1', code: 'B9/JHS3.3.4.1',
                description: 'Demonstrate knowledge and skills in the preparation of different types of manure from animal and plant waste',
                indicators: [
                  { id: 'B9/JHS3.3.4.1.1', code: 'B9/JHS3.3.4.1.1', description: 'List and explain the different plant and animal waste used in preparing different types of manure' },
                  { id: 'B9/JHS3.3.4.1.2', code: 'B9/JHS3.3.4.1.2', description: 'Demonstrate the preparation of different types of manure' },
                  { id: 'B9/JHS3.3.4.1.3', code: 'B9/JHS3.3.4.1.3', description: 'Prepare different types of manure' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b9-strand-4', code: '4', title: 'FORCES AND ENERGY',
        subStrands: [
          {
            id: 'sci-b9-ss-4-1', code: '4.1', title: 'ENERGY',
            contentStandards: [
              {
                id: 'B9/JHS3.4.1.1', code: 'B9/JHS3.4.1.1',
                description: 'Show understanding of the concept of conservation of energy and ways of conserving energy',
                indicators: [
                  { id: 'B9/JHS3.4.1.1.1', code: 'B9/JHS3.4.1.1.1', description: 'List the ways to conserve energy' },
                  { id: 'B9/JHS3.4.1.1.2', code: 'B9/JHS3.4.1.1.2', description: 'Explain the importance of energy conservation in daily life' },
                ],
              },
              {
                id: 'B9/JHS3.4.1.2', code: 'B9/JHS3.4.1.2',
                description: 'Demonstrate understanding in and the capability to do calculations involving energy',
                indicators: [
                  { id: 'B9/JHS3.4.1.2.1', code: 'B9/JHS3.4.1.2.1', description: 'Explain how to calculate energy consumed over a period of time' },
                  { id: 'B9/JHS3.4.1.2.2', code: 'B9/JHS3.4.1.2.2', description: 'Describe how images are formed in cameras' },
                  { id: 'B9/JHS3.4.1.2.3', code: 'B9/JHS3.4.1.2.3', description: 'Describe the formation of shadows' },
                  { id: 'B9/JHS3.4.1.2.4', code: 'B9/JHS3.4.1.2.4', description: 'Demonstrate the formation of an eclipse' },
                ],
              },
              {
                id: 'B9/JHS3.4.1.3', code: 'B9/JHS3.4.1.3',
                description: 'Evaluate the application of light energy in life',
                indicators: [
                  { id: 'B9/JHS3.4.1.3.1', code: 'B9/JHS3.4.1.3.1', description: 'Demonstrate that light changes path when it travels from one medium to a different medium' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-4-2', code: '4.2', title: 'ELECTRICITY AND ELECTRONICS',
            contentStandards: [
              {
                id: 'B9/JHS3.4.2.1', code: 'B9/JHS3.4.2.1',
                description: 'Construct electrical circuits and illustrate how electrical energy is transformed into other forms of energy and perform electrical calculations',
                indicators: [
                  { id: 'B9/JHS3.4.2.1.1', code: 'B9/JHS3.4.2.1.1', description: 'Demonstrate transformation of electrical energy to other forms of energy in both series and parallel circuits and perform simple calculations involving the flow of current in circuits' },
                ],
              },
              {
                id: 'B9/JHS3.4.2.2', code: 'B9/JHS3.4.2.2',
                description: 'Demonstrate an understanding of Forward and Reverse Bias and explain the behaviour of LEDs, Diodes, Resistors and Capacitors in electronic circuits',
                indicators: [
                  { id: 'B9/JHS3.4.2.2.1', code: 'B9/JHS3.4.2.2.1', description: 'Describe forward bias and reverse bias and explain the relationship among the components such as LEDs, Diodes, Resistors and Capacitors in an electronic circuit' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-4-3', code: '4.3', title: 'CONVERSION AND CONSERVATION OF ENERGY',
            contentStandards: [
              {
                id: 'B9/JHS3.4.3.1', code: 'B9/JHS3.4.3.1',
                description: 'Show an understanding of conversion and conservation of energy and their application to life',
                indicators: [
                  { id: 'B9/JHS3.4.3.1.1', code: 'B9/JHS3.4.3.1.1', description: 'Describe how energy can be converted from one form to another and show how conservation of energy occurs' },
                  { id: 'B9/JHS3.4.3.1.2', code: 'B9/JHS3.4.3.1.2', description: 'Describe how conversion and conservation of energy are applied in life' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-4-4', code: '4.4', title: 'FORCE AND MOTION',
            contentStandards: [
              {
                id: 'B9/JHS3.4.4.1', code: 'B9/JHS3.4.4.1',
                description: 'Demonstrate understanding of the concept of pressure and explain how pressure acts in everyday life',
                indicators: [
                  { id: 'B9/JHS3.4.4.1.1', code: 'B9/JHS3.4.4.1.1', description: "Explain the concept of pressure and show how pressure relates to force; perform activities that work on the principle of pressure in the daily lives of humans" },
                  { id: 'B9/JHS3.4.4.1.2', code: 'B9/JHS3.4.4.1.2', description: "Demonstrate the application of Newton's Third Law of motion in life" },
                ],
              },
              {
                id: 'B9/JHS3.4.4.2', code: 'B9/JHS3.4.4.2',
                description: "Demonstrate understanding of Newton's Laws of motion and ability to apply the laws to solve problems in everyday life",
                indicators: [
                  { id: 'B9/JHS3.4.4.2.1', code: 'B9/JHS3.4.4.2.1', description: "Explain Newton's Laws of Motion and their applications to daily life" },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-4-5', code: '4.5', title: 'AGRICULTURAL TOOLS',
            contentStandards: [
              {
                id: 'B9/JHS3.4.5.1', code: 'B9/JHS3.4.5.1',
                description: 'Demonstrate knowledge and skills in making simple agricultural tools for on-farm activities',
                indicators: [
                  { id: 'B9/JHS3.4.5.1.1', code: 'B9/JHS3.4.5.1.1', description: 'Identify materials used in making simple agricultural tools' },
                  { id: 'B9/JHS3.4.5.1.2', code: 'B9/JHS3.4.5.1.2', description: 'Discuss and write activities involved in making simple agricultural tools' },
                  { id: 'B9/JHS3.4.5.1.3', code: 'B9/JHS3.4.5.1.3', description: 'Manufacture simple agricultural tools' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'sci-b9-strand-5', code: '5', title: 'HUMANS AND THE ENVIRONMENT',
        subStrands: [
          {
            id: 'sci-b9-ss-5-1', code: '5.1', title: 'WASTE MANAGEMENT',
            contentStandards: [
              {
                id: 'B9/JHS3.5.1.1', code: 'B9/JHS3.5.1.1',
                description: 'Demonstrate an understanding of the scientific ways of waste management',
                indicators: [
                  { id: 'B9/JHS3.5.1.1.1', code: 'B9/JHS3.5.1.1.1', description: 'Investigate the scientific methods used in waste management' },
                ],
              },
              {
                id: 'B9/JHS3.5.1.2', code: 'B9/JHS3.5.1.2',
                description: 'Demonstrate an understanding of the impact of waste on an environment, innovative waste management technologies for sustainable development and waste management practices in Ghana',
                indicators: [
                  { id: 'B9/JHS3.5.1.2.1', code: 'B9/JHS3.5.1.2.1', description: 'Describe innovative ways of waste management for sustainable development' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-5-2', code: '5.2', title: 'HUMAN HEALTH',
            contentStandards: [
              {
                id: 'B9/JHS3.5.2.1', code: 'B9/JHS3.5.2.1',
                description: 'Demonstrate knowledge of common non-communicable diseases of humans, their causes, symptoms, effects and prevention',
                indicators: [
                  { id: 'B9/JHS3.5.2.1.1', code: 'B9/JHS3.5.2.1.1', description: 'Explain the symptoms, effects and prevention of some non-communicable diseases and analyse the risk factors associated with them' },
                ],
              },
              {
                id: 'B9/JHS3.5.2.2', code: 'B9/JHS3.5.2.2',
                description: 'Demonstrate knowledge of selected fungal diseases of humans, their causes, symptoms, effects and prevention',
                indicators: [
                  { id: 'B9/JHS3.5.2.2.1', code: 'B9/JHS3.5.2.2.1', description: 'Explain the nature of fungal diseases with special emphasis on Ringworm/candidiasis/fingernail and toe nail infection, their causes, symptoms, effects on humans and its prevention' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-5-3', code: '5.3', title: 'SCIENCE AND INDUSTRY',
            contentStandards: [
              {
                id: 'B9/JHS3.5.3.1', code: 'B9/JHS3.5.3.1',
                description: 'Analyse the scientific concepts, principles and processes applied in industries in and outside their community',
                indicators: [
                  { id: 'B9/JHS3.5.3.1.1', code: 'B9/JHS3.5.3.1.1', description: 'Investigate the scientific concepts, principles and processes involved in industries in their environment' },
                ],
              },
              {
                id: 'B9/JHS3.5.3.2', code: 'B9/JHS3.5.3.2',
                description: 'Demonstrate an understanding of the concept of industry, the science underpinning the processes of production in industries the technologies in indigenous industries and western industries',
                indicators: [
                  { id: 'B9/JHS3.5.3.2.1', code: 'B9/JHS3.5.3.2.1', description: 'Explain the concept of industry and distinguish between modern and indigenous industries' },
                  { id: 'B9/JHS3.5.3.2.2', code: 'B9/JHS3.5.3.2.2', description: 'Examine indigenous industries in their communities and show the scientific processes in the stages of production' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-5-4', code: '5.4', title: 'CLIMATE CHANGE AND GREEN ECONOMY',
            contentStandards: [
              {
                id: 'B9/JHS3.5.4.1', code: 'B9/JHS3.5.4.1',
                description: 'Demonstrate an understanding of the natural and human factors that influence climate change and a green economy',
                indicators: [
                  { id: 'B9/JHS3.5.4.1.1', code: 'B9/JHS3.5.4.1.1', description: 'Examine various natural and human factors that influence climate change and green economy in their localities' },
                ],
              },
              {
                id: 'B9/JHS3.5.4.2', code: 'B9/JHS3.5.4.2',
                description: 'Evaluate the effectiveness of initiatives that address the issue of climate change and green economy in Ghana and the world at large',
                indicators: [
                  { id: 'B9/JHS3.5.4.2.1', code: 'B9/JHS3.5.4.2.1', description: 'Assess data on climate change and green economy actions/activities globally including Ghana and other countries' },
                ],
              },
            ],
          },
          {
            id: 'sci-b9-ss-5-5', code: '5.5', title: 'UNDERSTANDING THE ENVIRONMENT',
            contentStandards: [
              {
                id: 'B9/JHS3.5.5.1', code: 'B9/JHS3.5.5.1',
                description: 'Demonstrate knowledge and skills in the use of plant roots, stems, leaves, flowers, and fruits for agricultural and non-agricultural purposes',
                indicators: [
                  { id: 'B9/JHS3.5.5.1.1', code: 'B9/JHS3.5.5.1.1', description: 'Show and list the uses of different plant parts for agricultural and non-agricultural purposes' },
                  { id: 'B9/JHS3.5.5.1.2', code: 'B9/JHS3.5.5.1.2', description: 'Demonstrate the use of different plant parts for agricultural and non-agricultural purposes' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Rules for footprint graphs:
 * The time gaps between two footprints are always constant and is specified in the main part of the question.
 * Every footprint appears above a tick mark on the position axis.
 * The ticks are always evenly spaced, and at least some of them have labels.
 * The direction of movement is always constant in the context of the question (no back-and-forth)
 * and is specified in the main part of the question and using an arrow.
 */

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const axisSegments = 4;

const buildTicks = (minValue, maxValue, segments = axisSegments) => {
  const span = maxValue - minValue;
  if (span === 0) {
    return [minValue];
  }
  return Array.from({ length: segments + 1 }, (_, index) => minValue + (span * index) / segments);
};

const formatNumber = (value) => {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  const absVal = Math.abs(value);
  let decimals = 2;
  if (absVal >= 10) {
    decimals = 1;
  } else if (absVal < 1) {
    decimals = 3;
  }
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.?0+$/, "");
};
const formatTick = (value) => formatNumber(value);

const resolveUnit = (option, question) => option.displayUnit || question.answerUnit || { multiplier: 1, label: option.unit };

const formatOption = (option, question) => {
  if (option.text) {
    if (option.latex) {
      return `\\(${option.latex}\\)`;
    }
    return option.text;
  }
  const unitInfo = resolveUnit(option, question);
  const displayValue = option.value * (unitInfo.multiplier ?? 1);
  const text = formatNumber(displayValue);
  return `${text} ${unitInfo.label}`;
};

const randomTimes = (count, stepOptions = [1, 1, 2]) => {
  const times = [0];
  for (let i = 1; i < count; i += 1) {
    const step = stepOptions[randomInt(0, stepOptions.length - 1)];
    times.push(times[i - 1] + step);
  }
  return times;
};

const ensureMetadata = (question, defaultType = "speed") => {
  question.answerType = question.answerType || defaultType;
  question.baseUnit = question.baseUnit || question.correctAnswer?.unit;
  question.correctValue = question.correctValue ?? question.correctAnswer?.value;
  question.explanationBase = question.explanationBase || question.explanation;
  question.answerUnit = question.answerUnit || { multiplier: 1, label: question.baseUnit };
};

const scaleRepresentation = (representation, factor, label) => {
  if (!representation) return;
  switch (representation.type) {
    case "table":
      representation.rows = representation.rows.map((row) => [row[0], (Number(row[1]) * factor).toString()]);
      representation.headers = ["t (s)", label];
      break;
    case "xt-graph":
      representation.points = representation.points.map((point) => ({ t: point.t, x: point.x * factor }));
      if (representation.maxDistance !== undefined) {
        representation.maxDistance *= factor;
      } else {
        representation.maxDistance = Math.max(...representation.points.map((p) => p.x));
      }
      if (representation.minDistance !== undefined) {
        representation.minDistance *= factor;
      } else {
        representation.minDistance = Math.min(...representation.points.map((p) => p.x));
      }
      representation.yLabel = label;
      if (Array.isArray(representation.yTicks)) {
        representation.yTicks = representation.yTicks.map((tick) => tick * factor);
      }
      break;
    case "vt-graph":
      representation.points = representation.points.map((point) => ({ t: point.t, v: point.v * factor }));
      if (representation.maxVelocity !== undefined) {
        representation.maxVelocity *= factor;
      } else {
        representation.maxVelocity = Math.max(...representation.points.map((p) => p.v));
      }
      if (representation.minVelocity !== undefined) {
        representation.minVelocity *= factor;
      } else {
        representation.minVelocity = Math.min(...representation.points.map((p) => p.v));
      }
      representation.yLabel = label;
      if (Array.isArray(representation.yTicks)) {
        representation.yTicks = representation.yTicks.map((tick) => tick * factor);
      }
      break;
    case "footprint":
      representation.steps = representation.steps.map((step) => ({ ...step, position: step.position * factor }));
      representation.axisLabel = label;
      representation.tickPositions = representation.steps.map((step) => step.position);
      break;
    case "dual-xt":
      representation.objects = representation.objects.map((object) => ({
        ...object,
        points: object.points.map((point) => ({ t: point.t, x: point.x * factor })),
      }));
      representation.maxDistance *= factor;
      if (representation.minDistance !== undefined) {
        representation.minDistance *= factor;
      }
      if (Array.isArray(representation.yTicks)) {
        representation.yTicks = representation.yTicks.map((tick) => tick * factor);
      }
      break;
    case "dual-vt":
      representation.objects = representation.objects.map((object) => ({
        ...object,
        points: object.points.map((point) => ({ t: point.t, v: point.v * factor })),
      }));
      representation.maxVelocity *= factor;
      if (representation.minVelocity !== undefined) {
        representation.minVelocity *= factor;
      }
      if (Array.isArray(representation.yTicks)) {
        representation.yTicks = representation.yTicks.map((tick) => tick * factor);
      }
      break;
    case "xt-equation":
      representation.velocity *= factor;
      representation.intercept *= factor;
      representation.distanceLabel = label.replace(/.*\(([^)]+)\).*/, "$1").trim() || label;
      break;
    default:
      break;
  }
};

const scaleRepresentationTime = (representation, factor, label) => {
  if (!representation) return;
  switch (representation.type) {
    case "table":
      representation.rows = representation.rows.map((row) => [(Number(row[0]) * factor).toString(), row[1]]);
      representation.headers = [label, representation.headers[1]];
      break;
    case "xt-graph":
      representation.points = representation.points.map((point) => ({ t: point.t * factor, x: point.x }));
      representation.maxTime *= factor;
      representation.xLabel = label;
      if (Array.isArray(representation.xTicks)) {
        representation.xTicks = representation.xTicks.map((tick) => tick * factor);
      }
      break;
    case "vt-graph":
      representation.points = representation.points.map((point) => ({ t: point.t * factor, v: point.v }));
      representation.maxTime *= factor;
      representation.xLabel = label;
      if (Array.isArray(representation.xTicks)) {
        representation.xTicks = representation.xTicks.map((tick) => tick * factor);
      }
      break;
    case "dual-xt":
      representation.objects = representation.objects.map((object) => ({
        ...object,
        points: object.points.map((point) => ({ t: point.t * factor, x: point.x })),
      }));
      representation.maxTime *= factor;
      break;
    case "dual-vt":
      representation.objects = representation.objects.map((object) => ({
        ...object,
        points: object.points.map((point) => ({ t: point.t * factor, v: point.v })),
      }));
      representation.maxTime *= factor;
      break;
    case "xt-equation":
      representation.velocity /= factor || 1;
      representation.timeLabel = label.replace(/.*\(([^)]+)\).*/, "$1").trim() || label;
      break;
    default:
      break;
  }
};

const alternateUnits = {
  speed: [
    { multiplier: 3.6, label: "km/h" },
    { multiplier: 100, label: "cm/s" },
    { multiplier: 60, label: "m/min" },
  ],
  distance: [
    { multiplier: 100, label: "cm" },
  ],
  time: [
    { multiplier: 1 / 60, label: "min" },
  ],
};

const randomChoice = (items) => items[randomInt(0, items.length - 1)];

const createOption = (value, unit, overrides = {}) => ({
  value,
  unit,
  isCorrect: false,
  ...overrides,
});

const optionKey = (option) => {
  const unitLabel = option.displayUnit?.label || option.unit;
  return `${option.text || ""}|${unitLabel}|${option.value}`;
};

const formatEquation = ({ velocity, intercept, distanceLabel = "m", timeLabel = "s" }) => {
  const vText = formatNumber(velocity);
  const x0Text = formatNumber(Math.abs(intercept));
  const sign = intercept >= 0 ? "+" : "-";
  const velocityUnit = `${distanceLabel}/${timeLabel}`;
  return `x(t) = ${vText} ${velocityUnit} · t ${sign} ${x0Text} ${distanceLabel}`;
};

const formatEquationLatex = ({ velocity, intercept, distanceLabel = "m", timeLabel = "s" }) => {
  const vText = formatNumber(velocity);
  const absX0 = formatNumber(Math.abs(intercept));
  const sign = intercept >= 0 ? "+" : "-";
  const velocityTerm = `${vText}\\,\\frac{${distanceLabel}}{${timeLabel}}`;
  const interceptTerm = `${absX0}\\,${distanceLabel}`;
  return `x(t)=${velocityTerm}\\,t\\,${sign}\\,${interceptTerm}`;
};

const createEquationOption = ({ velocity, intercept, distanceLabel = "m", timeLabel = "s", isCorrect = false }) => {
  const base = { velocity, intercept, distanceLabel, timeLabel };
  const text = formatEquation(base);
  const latex = formatEquationLatex(base);
  return { value: text, unit: "equation", text, latex, isCorrect };
};

const buildEquationRepresentation = (velocity, intercept, distanceLabel = "m", timeLabel = "s") => ({
  type: "xt-equation",
  velocity,
  intercept,
  distanceLabel,
  timeLabel,
});

const generateNumericDistractors = (correctOption, question, existingOptions = []) => {
  const distractors = [];
  const targetCount = Math.max(4, existingOptions.length + 2);
  const ensureUnique = (candidate) => {
    if (!candidate) return;
    const baseCorrect = question.correctValue ?? correctOption.value;
    const isSameMagnitude = Math.abs(candidate.value - baseCorrect) < 1e-9;
    if (!candidate.isCorrect && isSameMagnitude) {
      return;
    }
    if (["distance", "time"].includes(question.answerType) && baseCorrect >= 0 && candidate.value < 0) {
      return;
    }
    const currentKeys = new Set([...existingOptions, ...distractors].map(optionKey));
    if (!currentKeys.has(optionKey(candidate))) {
      distractors.push(candidate);
    }
  };

  const magnitude = Math.max(1, Math.abs(correctOption.value));
  const fractionalNudge = () => {
    const delta = (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? -1 : 1);
    const shift = Number((delta).toFixed(2));
    return createOption(correctOption.value + shift, question.baseUnit);
  };
  const additive = () => {
    const span = Math.max(1, Math.round(magnitude * 0.25));
    const delta = randomInt(1, span) * (Math.random() < 0.5 ? -1 : 1);
    return createOption(correctOption.value + delta, question.baseUnit);
  };
  const multiplicative = () => {
    const factors = [0.5, 0.75, 1.25, 1.5, 2];
    return createOption(Number((correctOption.value * randomChoice(factors)).toFixed(2)), question.baseUnit);
  };
  const differentUnit = () => {
    const pool = alternateUnits[question.answerType] || [];
    const filtered = pool.filter((unit) => unit.label !== question.answerUnit?.label);
    if (!filtered.length) return null;
    const altUnit = randomChoice(filtered);
    return createOption(correctOption.value, question.baseUnit, { displayUnit: altUnit });
  };

  const strategies = [additive, multiplicative, fractionalNudge, differentUnit];
  let guard = 0;
  while (distractors.length + existingOptions.length < targetCount && guard < 30) {
    const candidate = randomChoice(strategies)();
    ensureUnique(candidate);
    guard += 1;
  }
  return distractors;
};

const randomFootprintGaps = (count, gapChoices = [1, 1, 2]) =>
  Array.from({ length: count - 1 }, () => gapChoices[randomInt(0, gapChoices.length - 1)]);

const formatGaps = (gaps) => gaps.map((gap) => `${gap} שנ׳`).join(", ");

const buildEvenTicks = (maxValue, step) => {
  const ticks = [];
  for (let value = 0; value <= maxValue; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== maxValue) {
    ticks.push(maxValue);
  }
  return ticks;
};

const unitBehaviors = [
  {
    appliesTo: "speed",
    apply: (question) => {
      question.answerUnit = { multiplier: 3.6, label: "km/h" };
      if (question.representation && ["vt-graph", "dual-vt"].includes(question.representation.type)) {
        scaleRepresentation(question.representation, 3.6, "v (km/h)");
      }
    },
  },
  {
    appliesTo: "distance",
    apply: (question) => {
      question.answerUnit = { multiplier: 0.001, label: "km" };
      if (question.representation) scaleRepresentation(question.representation, 0.001, "x (km)");
    },
  },
  {
    appliesTo: "speed",
    apply: (question) => {
      question.answerUnit = { multiplier: 100, label: "cm/s" };
      if (question.representation && ["vt-graph", "dual-vt"].includes(question.representation.type)) {
        scaleRepresentation(question.representation, 100, "v (cm/s)");
      }
    },
  },
  {
    appliesTo: "speed",
    apply: (question) => {
      question.answerUnit = { multiplier: 60, label: "m/min" };
      if (question.representation) {
        scaleRepresentationTime(question.representation, 1 / 60, "t (min)");
        if (["vt-graph", "dual-vt"].includes(question.representation.type)) {
          scaleRepresentation(question.representation, 60, "v (m/min)");
        }
      }
    },
  },
  {
    appliesTo: "distance",
    apply: (question) => {
      question.answerUnit = { multiplier: 0.01, label: "cm" };
      if (question.representation) scaleRepresentation(question.representation, 0.01, "x (cm)");
    },
  },
  {
    appliesTo: "time",
    apply: (question) => {
      question.answerUnit = { multiplier: 1 / 60, label: "min" };
      if (question.representation) scaleRepresentationTime(question.representation, 1 / 60, "t (min)");
    },
  },
];

const buildOptionsForQuestion = (question) => {
  if (Array.isArray(question.fixedOptions) && question.fixedOptions.length > 0) {
    question.options = shuffle(question.fixedOptions);
    return;
  }
  const baseUnit = question.baseUnit || question.correctAnswer?.unit;
  const correctOption = createOption(question.correctAnswer.value, baseUnit, {
    isCorrect: true,
    text: question.correctAnswer.text,
  });
  const providedDistractors = (question.distractors || []).map((entry) => {
    if (typeof entry === "number") {
      return createOption(entry, baseUnit);
    }
    if (typeof entry === "object" && entry !== null) {
      return createOption(entry.value ?? entry, entry.unit || baseUnit, { text: entry.text, displayUnit: entry.displayUnit });
    }
    return null;
  }).filter(Boolean);

  const generated = generateNumericDistractors(correctOption, question, [correctOption, ...providedDistractors]);
  question.options = shuffle([correctOption, ...providedDistractors, ...generated]);
};

const updateExplanationUnits = (question) => {
  const baseUnit = question.baseUnit ?? question.correctAnswer?.unit;
  const baseValue = question.correctValue ?? question.correctAnswer?.value;
  const baseText = question.explanationBase ?? question.explanation;
  if (!question.answerUnit || !baseUnit || baseValue === undefined) {
    question.explanation = baseText;
    return;
  }
  if (question.answerUnit.label === baseUnit) {
    question.explanation = baseText;
    return;
  }
  const displayValue = formatNumber(baseValue * question.answerUnit.multiplier);
  question.explanation = `${baseText} (${displayValue} ${question.answerUnit.label} = ${formatNumber(baseValue)} ${baseUnit})`;
};

const unitStrategy = (sequenceNumber, question) => {
  const seqMap = [
    { mod: 7, behavior: unitBehaviors[0], type: "speed" },
    { mod: 6, behavior: unitBehaviors[1], type: "distance" },
    { mod: 5, behavior: unitBehaviors[2], type: "speed" },
    { mod: 4, behavior: unitBehaviors[3], type: "speed" },
    { mod: 3, behavior: unitBehaviors[4], type: "distance" },
    { mod: 2, behavior: unitBehaviors[5], type: "time" },
  ];
  for (const entry of seqMap) {
    if (sequenceNumber % entry.mod === 0 && question.answerType === entry.type) {
      entry.behavior.apply(question);
      break;
    }
  }
};

const tableRandomQuestion = () => {
  const speed = randomInt(3, 7);
  const startDistance = randomInt(0, 6);
  const times = randomTimes(4, [1, 1, 2]);
  const rows = times.map((time) => [time.toString(), (startDistance + speed * time).toString()]);
  const question = {
    id: `table-rand-${Date.now()}-${speed}`,
    representation: { type: "table", headers: ["t (s)", "x (m)"], rows },
    prompt: "לפניכם טבלת מיקום-זמן של גוף הנע במהירות קבועה. מה מהירות הגוף?",
    correctAnswer: { value: speed, unit: "m/s" },
    explanation: `המרחק גדל ב־${speed} מ׳ בכל שניה.`,
  };
  return question;
};

const tableAverageSpeedQuestion = () => {
  const speeds = [randomInt(3, 6), randomInt(4, 7), randomInt(5, 8)];
  const times = [randomInt(1, 5), randomInt(1, 3), randomInt(5, 9)];
  const rows = [];
  let distance = 0;
  let time = 0;
  rows.push(["0", "0"]);
  speeds.forEach((speed, index) => {
    distance += speed * times[index];
    time += times[index];
    rows.push([time.toString(), distance.toString()]);
  });
  const averageSpeed = Number((distance / time).toFixed(2));
  return {
    id: `table-average-${Date.now()}`,
    representation: { type: "table", headers: ["t (s)", "x (m)"], rows },
    prompt: "על פי טבלת המיקום-זמן שלפניכם, מה המהירות הממוצעת של הגוף?",
    correctAnswer: { value: averageSpeed, unit: "m/s" },
    explanation: `המרחק הכולל ${distance} מטרים ב־${time} שניות → ${averageSpeed} m/s.`,
  };
};

const xtConstantQuestion = () => {
  const time = randomInt(3, 6);
  const speed = randomInt(-7, 7);
  const startX = randomInt(-10, 10);
  const distance = time * speed;
  return {
    id: `xt-constant-${Date.now()}-${speed}`,
    representation: {
      type: "xt-graph",
      points: [
        { t: 0, x: startX },
        { t: time, x: startX + distance },
      ],
      minDistance: Math.min(startX, startX + distance),
      maxDistance: Math.max(startX, startX + distance),
      maxTime: time,
      xTicks: [0, time / 2, time],
      yTicks: [Math.min(startX, startX + distance), Math.max(startX, startX + distance)],
    },
    prompt: "מה מהירות הגוף לפי שיפוע הגרף?",
    correctAnswer: { value: speed, unit: "m/s" },
    explanation: `${distance} מטרים ב־${time} שניות → ${speed} m/s.`,
  };
};

const xtSwitchQuestion = () => {
  const firstSpeed = randomInt(2, 4);
  const secondSpeed = randomInt(firstSpeed - 2, firstSpeed + 4);
  const switchTime = randomInt(2, 3);
  const totalTime = switchTime + randomInt(2, 4);
  const firstDistance = firstSpeed * switchTime;
  const secondDistance = secondSpeed * (totalTime - switchTime);
  return {
    id: `xt-switch-${Date.now()}-${Math.max(firstSpeed, secondSpeed)}`,
    representation: {
      type: "xt-graph",
      points: [
        { t: 0, x: 0 },
        { t: switchTime, x: firstDistance },
        { t: totalTime, x: firstDistance + secondDistance },
      ],
      maxTime: totalTime,
      minDistance: 0,
      maxDistance: firstDistance + secondDistance,
      xTicks: [0, switchTime, totalTime],
      yTicks: [0, firstDistance, firstDistance + secondDistance],
    },
    prompt: "מה המהירות המקסימלית של הגוף?",
    correctAnswer: { value: Math.max(firstSpeed, secondSpeed), unit: "m/s" },
    explanation: `מהירות ראשונה: ${firstSpeed} m/s, מהירות שנייה: ${secondSpeed} m/s → מקסימום: ${Math.max(firstSpeed, secondSpeed)} m/s.`,
  };
};

const xtReturnQuestion = () => {
  const forwardSpeed = randomInt(4, 7);
  const backwardSpeed = randomInt(2, 4);
  const forwardTime = randomInt(2, 3);
  const backwardTime = randomInt(2, 4);
  const sampleTime = randomInt(0, forwardTime + backwardTime);
  const posAtSampleTime = (() => {
    if (sampleTime <= forwardTime) {
      return forwardSpeed * sampleTime;
    } else {
      return forwardSpeed * forwardTime - backwardSpeed * (sampleTime - forwardTime);
    }
  })();
  const forwardDistance = forwardSpeed * forwardTime;
  const backwardDistance = backwardSpeed * backwardTime;
  const finalPos = forwardDistance - backwardDistance;
  return {
    id: `xt-return-${Date.now()}-${finalPos}`,
    representation: {
      type: "xt-graph",
      points: [
        { t: 0, x: 0 },
        { t: forwardTime, x: forwardDistance },
        { t: forwardTime + backwardTime, x: finalPos },
      ],
      minDistance: Math.min(0, finalPos),
      maxDistance: Math.max(forwardDistance, finalPos),
      maxTime: forwardTime + backwardTime,
      xTicks: [0, forwardTime, forwardTime + backwardTime],
      yTicks: [finalPos, forwardDistance],
    },
    prompt: `מה המיקום של הגוף ברגע t=${sampleTime}s?`,
    correctAnswer: { value: posAtSampleTime, unit: "m" },
    explanation: ``,
  };
};

const xtTotalDistanceQuestion = () => {
  const speedForward = randomInt(3, 6);
  const backwardSpeed = randomInt(2, 4);
  const forwardTime = randomInt(2, 4);
  const backwardTime = randomInt(2, 3);
  const forwardDistance = speedForward * forwardTime;
  const backwardDistance = backwardSpeed * backwardTime;
  const totalDistance = forwardDistance + backwardDistance;
  return {
    id: `xt-total-${Date.now()}-${totalDistance}`,
    representation: {
      type: "xt-graph",
      points: [
        { t: 0, x: 0 },
        { t: forwardTime, x: forwardDistance },
        { t: forwardTime + backwardTime, x: forwardDistance - backwardDistance },
      ],
      maxTime: forwardTime + backwardTime,
      minDistance: Math.min(0, forwardDistance - backwardDistance),
      maxDistance: forwardDistance,
      xTicks: [0, forwardTime, forwardTime + backwardTime],
      yTicks: [forwardDistance - backwardDistance, forwardDistance],
    },
    prompt: "כמה מטרים נסע הגוף בסך הכל?",
    correctAnswer: { value: totalDistance, unit: "m" },
    explanation: `${forwardDistance} מ׳ קדימה + ${backwardDistance} מ׳ אחורה = ${totalDistance} מ׳.`,
  };
};

const vtAreaQuestion = () => {
  const velocity = randomInt(3, 6);
  const duration = randomInt(3, 5);
  const distance = velocity * duration;
  return {
    id: `vt-area-${Date.now()}-${distance}`,
    representation: {
      type: "vt-graph",
      points: [
        { t: 0, v: velocity },
        { t: duration, v: velocity },
      ],
      minVelocity: 0,
      maxVelocity: velocity + 2,
      maxTime: duration,
      xTicks: [0, duration],
      yTicks: [velocity],
    },
    prompt: "לפניכם גרף מהירות-זמן של תנועת גוף. איזה מרחק עובר הגוף בזמן התנועה?",
    correctAnswer: { value: distance, unit: "m" },
    explanation: `שטח = ${velocity} × ${duration} = ${distance} מ׳.`,
  };
};

const vtStopQuestion = () => {
  const initial = randomInt(6, 9);
  const stopTime = randomInt(3, 5);
  const durationFactor = randomInt(1, 3);
  const duration = stopTime * durationFactor;
  const finalSpeed = initial * (1 - durationFactor);
  return {
    id: `vt-stop-${Date.now()}-${duration}`,
    representation: {
      type: "vt-graph",
      points: [
        { t: 0, v: initial },
        { t: duration, v: finalSpeed },
      ],
      minVelocity: finalSpeed,
      maxVelocity: initial,
      maxTime: duration,
      xTicks: [0, duration],
      yTicks: [0, initial],
    },
    prompt: "באיזה רגע הגוף נעצר?",
    correctAnswer: { value: stopTime, unit: "s" },
    explanation: ``,
  };
};

const vtAccelerationQuestion = () => {
  const duration = randomInt(3, 5);
  const finalVelocity = randomInt(5, 9);
  return {
    id: `vt-accel-${Date.now()}-${finalVelocity}`,
    representation: {
      type: "vt-graph",
      points: [
        { t: 0, v: 0 },
        { t: duration, v: finalVelocity },
      ],
      minVelocity: 0,
      maxVelocity: finalVelocity,
      maxTime: duration,
      xTicks: [0, duration],
      yTicks: [0, finalVelocity],
    },
    prompt: "מה המהירות בסוף קו התאוצה?",
    correctAnswer: { value: finalVelocity, unit: "m/s" },
    explanation: `המהירות הסופית היא ${finalVelocity} m/s.`,
  };
};

const footprintConstantQuestion = () => {
  const pace = randomInt(2, 5);
  const timeGap = randomInt(1, 2);
  const tickStep = pace * timeGap;
  const steps = Array.from({ length: 4 }, (_, idx) => ({
    time: idx * timeGap,
    position: pace * timeGap * idx,
  }));
  const maxPos = steps[steps.length - 1].position;
  return {
    id: `footprint-const-${Date.now()}-${pace}`,
    representation: {
      type: "footprint",
      steps,
      tickPositions: buildEvenTicks(maxPos, tickStep),
    },
    prompt: `מה המהירות לפי תרשים העקבות? פער הזמן בין כל שתי עקבות הוא ${timeGap} שניות.`,
    correctAnswer: { value: pace, unit: "m/s" },
    explanation: `מהירות קבועה ${pace} m/s. כל ${timeGap} שניות מוסיפים ${pace * timeGap} מ׳.`,
  };
};

const footprintVariablePaceQuestion = () => {
  const segmentCount = randomInt(3, 5);
  const timeGap = randomInt(1, 3);
  const baseStep = randomInt(2, 4);
  const segmentDistances = Array.from({ length: segmentCount }, () => baseStep * randomInt(1, 4));
  const steps = [{ time: 0, position: 0 }];
  segmentDistances.forEach((dist) => {
    const prev = steps[steps.length - 1];
    steps.push({ time: prev.time + timeGap, position: prev.position + dist });
  });
  const totalTime = timeGap * (steps.length - 1);
  const totalDistance = steps[steps.length - 1].position - steps[0].position;
  const avg = Number((totalDistance / totalTime).toFixed(2));
  const maxPos = steps[steps.length - 1].position;
  const tickStep = baseStep * randomInt(1, 2);
  return {
    id: `footprint-var-${Date.now()}-${avg}`,
    representation: {
      type: "footprint",
      steps,
      tickPositions: buildEvenTicks(maxPos, baseStep),
    },
    prompt: `מה המהירות הממוצעת? פער הזמן בין העקבות הוא ${timeGap} שניות.`,
    correctAnswer: { value: avg, unit: "m/s" },
    explanation: `הגוף עבר ${totalDistance} מ׳ ב־${totalTime} שניות, ולכן מהירותו היא ${avg} m/s.`,
  };
};


const footprintDistanceQuestion = () => {
  const pace = randomInt(2, 4);
  const steps = [
    { time: 0, position: 0 },
    { time: 1, position: pace },
    { time: 2, position: 3 * pace },
    { time: 3, position: 2 * pace },
  ];
  const totalDistance = pace + 2 * pace + pace;
  return {
    id: `footprint-total-${Date.now()}-${totalDistance}`,
    representation: {
      type: "footprint",
      steps,
      timeBetween: 1,
      tickPositions: steps.map((step) => step.position),
    },
    prompt: "כמה מטרים נסע הגוף בסך הכל?",
    correctAnswer: { value: totalDistance, unit: "m" },
    explanation: `קדימה ${pace}, עוד ${2 * pace}, אחורה ${pace} → ${totalDistance} מ׳.`,
  };
};

const xtEquationPositionQuestion = () => {
  const velocity = (() => {
    const val = randomInt(-6, 8);
    return val === 0 ? 4 : val;
  })();
  const intercept = randomInt(-10, 10);
  const sampleTime = randomInt(2, 6);
  const position = Number((velocity * sampleTime + intercept).toFixed(2));
  const equationText = formatEquation({ velocity, intercept });
  return {
    id: `xt-eq-pos-${Date.now()}-${position}`,
    representation: buildEquationRepresentation(velocity, intercept),
    prompt: `נתונה משוואת מיקום-זמן של גוף בתנועה קבועה. מה מיקום הגוף בזמן t=${sampleTime}s?`,
    correctAnswer: { value: position, unit: "m" },
    explanation: `${equationText} → x(${sampleTime}) = ${velocity}·${sampleTime} ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept)} = ${position} m.`,
  };
};

const xtGraphEquationQuestion = () => {
  const velocity = (() => {
    const val = randomInt(-6, 7);
    return val === 0 ? 5 : val;
  })();
  const intercept = randomInt(-5, 6);
  const time = randomInt(3, 7);
  const start = intercept;
  const end = intercept + velocity * time;
  const representation = {
    type: "xt-graph",
    points: [
      { t: 0, x: start },
      { t: time, x: end },
    ],
    minDistance: Math.min(start, end),
    maxDistance: Math.max(start, end),
    maxTime: time,
    xTicks: [0, time / 2, time],
    yTicks: [Math.min(start, end), Math.max(start, end)],
  };
  const correctOption = createEquationOption({ velocity, intercept, isCorrect: true });
  const wrongSlope = createEquationOption({ velocity: velocity + randomChoice([2, -2, 3]), intercept });
  const wrongIntercept = createEquationOption({ velocity, intercept: intercept + randomChoice([3, -3, 5]) });
  const flipped = createEquationOption({ velocity: -velocity || velocity + 1, intercept });
  const options = shuffle([correctOption, wrongSlope, wrongIntercept, flipped]);
  return {
    id: `xt-graph-eq-${Date.now()}-${velocity}`,
    representation,
    prompt: "לפי גרף x/t, איזו משוואה מתארת את התנועה?",
    correctAnswer: { value: correctOption.text, unit: "equation", text: correctOption.text },
    fixedOptions: options,
    explanation: `שיפוע הגרף הוא ${velocity} m/s והחותך ${intercept} m → ${correctOption.text}.`,
  };
};

const vtGraphPositionEquationQuestion = () => {
  const velocity = randomInt(2, 7);
  const duration = randomInt(4, 7);
  const referenceTime = randomInt(2, duration);
  const positionAtTime = randomInt(-6, 12);
  const intercept = Number((positionAtTime - velocity * referenceTime).toFixed(2));
  const representation = {
    type: "vt-graph",
    points: [
      { t: 0, v: velocity },
      { t: duration, v: velocity },
    ],
    minVelocity: 0,
    maxVelocity: velocity + 2,
    maxTime: duration,
    xTicks: [0, duration],
    yTicks: [velocity],
  };
  const correctOption = createEquationOption({ velocity, intercept, isCorrect: true });
  const tooFast = createEquationOption({ velocity: velocity + randomInt(1, 3), intercept });
  const tooSlow = createEquationOption({ velocity: Math.max(1, velocity - randomInt(1, 2)), intercept });
  const wrongIntercept = createEquationOption({ velocity, intercept: intercept + randomChoice([3, -3, 5]) });
  const options = shuffle([correctOption, tooFast, tooSlow, wrongIntercept]);
  return {
    id: `vt-graph-eq-${Date.now()}-${velocity}`,
    representation,
    prompt: `גרף v/t מראה תנועה קבועה. ידוע כי x=${positionAtTime}m בזמן t=${referenceTime} s. מה משוואת התנועה המתאימה?`,
    correctAnswer: { value: correctOption.text, unit: "equation", text: correctOption.text },
    fixedOptions: options,
    explanation: `${formatEquation(velocity, intercept)}, ובזמן ${referenceTime} מתקבל ${positionAtTime} → x₀=${intercept} → ${correctOption.text}.`,
  };
};

const xtTableEquationQuestion = () => {
  const velocity = (() => {
    const val = randomInt(-5, 7);
    return val === 0 ? 3 : val;
  })();
  const intercept = randomInt(-4, 6);
  const times = randomTimes(4, [1, 1, 2]);
  const rows = times.map((time) => [time.toString(), (intercept + velocity * time).toString()]);
  const correctOption = createEquationOption({ velocity, intercept, isCorrect: true });
  const shiftedStart = createEquationOption({ velocity, intercept: intercept + randomChoice([2, -2, 4]) });
  const wrongSlope = createEquationOption({ velocity: velocity + randomChoice([2, -2]), intercept });
  const mirrored = createEquationOption({ velocity: -velocity || velocity + 1, intercept });
  const options = shuffle([correctOption, shiftedStart, wrongSlope, mirrored]);
  return {
    id: `xt-table-eq-${Date.now()}-${velocity}`,
    representation: { type: "table", headers: ["t (s)", "x (m)"], rows },
    prompt: "גוף נע במהירות קבועה כמתואר בטבלה. מה משוואת x(t) המתאימה לתנועת הגוף?",
    correctAnswer: { value: correctOption.text, unit: "equation", text: correctOption.text },
    fixedOptions: options,
    explanation: `ההפרש בין כל שתי שורות קבוע: מהירות ${velocity} m/s והחותך ${intercept} m → ${correctOption.text}.`,
  };
};

const footprintEquationQuestion = () => {
  const timeGap = randomInt(1, 3);
  const pace = randomInt(2, 5);
  const start = randomInt(-3, 3);
  const steps = Array.from({ length: 4 }, (_, idx) => ({
    time: idx * timeGap,
    position: start + pace * idx * timeGap,
  }));
  const maxPos = Math.max(...steps.map((s) => s.position));
  const tickStep = pace * timeGap;
  const correctOption = createEquationOption({ velocity: pace, intercept: start, isCorrect: true });
  const faster = createEquationOption({ velocity: pace + 2, intercept: start });
  const shifted = createEquationOption({ velocity: pace, intercept: start + randomChoice([3, -3]) });
  const slower = createEquationOption({ velocity: pace - 1 || pace + 1, intercept: start });
  const options = shuffle([correctOption, faster, shifted, slower]);
  return {
    id: `footprint-eq-${Date.now()}-${pace}`,
    representation: {
      type: "footprint",
      steps,
      tickPositions: steps.map((step) => step.position),
    },
    prompt: `בתרשים עקבות זה, העקבה הראשונה היא בזמן t=0s. פער הזמן בין כל שתי עקבות הוא ${timeGap} שניות. מהי משוואת x(t) המתאימה לתנועת הגוף?`,
    correctAnswer: { value: correctOption.text, unit: "equation", text: correctOption.text },
    fixedOptions: options,
    explanation: `כל ${timeGap} שניות מתווספים ${pace * timeGap} מ׳ → מהירות ${pace} m/s והתחלה ב־${start} m → ${correctOption.text}.`,
  };
};

const meetingEquationQuestion = () => {
  const velocityA = randomInt(2, 3);
  const interceptA = randomInt(-7, 7);
  const meetTime = randomInt(3, 7);
  const meetPosition = interceptA + velocityA * meetTime;
  const maxTime = meetTime + randomInt(2, 4);
  const representation = {
    type: "xt-graph",
    points: [
      { t: 0, x: interceptA },
      { t: maxTime, x: interceptA + velocityA * maxTime },
    ],
    minDistance: Math.min(interceptA, interceptA + velocityA * maxTime),
    maxDistance: Math.max(interceptA, interceptA + velocityA * maxTime),
    maxTime,
    xTicks: [0, maxTime],
    yTicks: [0, interceptA, interceptA + velocityA * maxTime],
  };
  const makeEquationOption = (velocity, intercept) =>
    createEquationOption({ velocity, intercept });

  const meetingOption = () => {
    const v = randomChoice([randomInt(-3, 2), randomInt(3, 7)]);
    const adjusted = v === 0 ? 1 : v;
    const vel = adjusted === velocityA ? adjusted + 1 : adjusted;
    const intercept = Number((meetPosition - vel * meetTime).toFixed(2));
    return { option: makeEquationOption(vel, intercept), meets: true };
  };
  const nonMeetingOption = () => {
    const v = randomChoice([randomInt(-3, 2), randomInt(3, 7)]);
    const adjusted = v === 0 ? 2 : v;
    const vel = adjusted === velocityA ? adjusted + 2 : adjusted;
    const intercept = Number((meetPosition - vel * meetTime + randomChoice([3, -3, 5])).toFixed(2));
    return { option: makeEquationOption(vel, intercept), meets: false };
  };

  const includeMultiple = Math.random() < 0.25;
  const includeNone = Math.random() < 0.25;
  let correctChoice = "equation";
  if (includeMultiple && Math.random() < 0.2) {
    correctChoice = "multiple";
  } else if (includeNone && Math.random() < 0.2) {
    correctChoice = "none";
  }

  const options = [];
  const validA = meetingOption();
  const validB = meetingOption();
  const invalidA = nonMeetingOption();
  const invalidB = nonMeetingOption();
  const invalidC = nonMeetingOption();

  if (correctChoice === "equation") {
    validA.option.isCorrect = true;
    options.push(validA.option, invalidA.option, invalidB.option, invalidC.option);
  } else if (correctChoice === "multiple") {
    options.push(validA.option, validB.option, invalidA.option);
  } else {
    options.push(invalidA.option, invalidB.option, makeEquationOption(velocityA, interceptA + 5));
  }

  if (includeMultiple) {
    options.push({ value: "multiple", unit: "equation", text: "יש יותר מאפשרות אחת נכונה", isCorrect: correctChoice === "multiple" });
  }
  if (includeNone) {
    options.push({ value: "none", unit: "equation", text: "אין תשובה מתאימה בין האפשרויות", isCorrect: correctChoice === "none" });
  }

  const finalOptions = shuffle(options);
  const correctOption = finalOptions.find((opt) => opt.isCorrect);
  const explanationBase = `בזמן t=${meetTime} הגוף הראשון ב־x=${meetPosition} m.`;
  let explanation = `${explanationBase} משוואה שמגיעה לנקודה הזו: ${correctOption?.text || "—"}.`;
  if (correctChoice === "multiple") {
    explanation = `${explanationBase} יותר ממשוואה אחת עומדת בתנאי, ולכן האפשרות הנכונה היא "יש יותר מאפשרות אחת נכונה".`;
  } else if (correctChoice === "none") {
    explanation = `${explanationBase} אף אחת מהמשוואות המוצעות לא פוגשת בנקודה הזו, ולכן יש לבחור "אין תשובה מתאימה בין האפשרויות".`;
  }

  return {
    id: `xt-meet-eq-${Date.now()}-${velocityA}`,
    representation,
    prompt: `נתון לפניכם גרף מקום-זמן של גוף A. גוף B נפגש עם גוף A בזמן t=${meetTime}s. איזו משוואה יכולה לתאר את גוף B?`,
    correctAnswer: correctOption || { value: "none", unit: "equation", text: "אין תשובה מתאימה בין האפשרויות" },
    fixedOptions: finalOptions,
    explanation,
  };
};

const dualVtSpeedQuestion = () => {
  const speedA = randomInt(3, 5);
  const speedB = randomInt(speedA + 1, speedA + 3);
  const duration = randomInt(3, 6);
  return {
    id: `dual-vt-speed-${Date.now()}-${speedB}`,
    representation: {
      type: "dual-vt",
      objects: [
        { name: "גוף A", color: "#2f80ed", points: [{ t: 0, v: speedA }, { t: duration, v: speedA }] },
        { name: "גוף B", color: "#eb5757", points: [{ t: 0, v: speedB }, { t: duration, v: speedB }] },
      ],
      maxTime: duration,
      maxVelocity: Math.max(speedA, speedB) + 2,
      xTicks: [0, duration],
      yTicks: [speedA, speedB],
    },
    prompt: "איזה גוף מהיר יותר?",
    correctAnswer: { value: speedB, unit: "m/s", text: "גוף B" },
    fixedOptions: [
      { value: speedA, unit: "m/s", text: "גוף A", isCorrect: false },
      { value: speedB, unit: "m/s", text: "גוף B", isCorrect: true },
      { value: 0, unit: "m/s", text: "שווים", isCorrect: false },
      { value: 0, unit: "m/s", text: "אין מידע", isCorrect: false },
    ],
    explanation: `גוף B מתנייד ב־${speedB} m/s, יותר מ־${speedA} m/s של גוף A.`,
  };
};

const dualVtDistanceQuestion = () => {
  const speedA = randomInt(3, 5);
  const speedB = randomInt(speedA + 1, speedA + 4);
  const duration = randomInt(3, 5);
  const distA = speedA * duration;
  const distB = speedB * duration;
  return {
    id: `dual-vt-dist-${Date.now()}-${distB}`,
    representation: {
      type: "dual-vt",
      objects: [
        { name: "גוף A", color: "#2f80ed", points: [{ t: 0, v: speedA }, { t: duration, v: speedA }] },
        { name: "גוף B", color: "#eb5757", points: [{ t: 0, v: speedB }, { t: duration, v: speedB }] },
      ],
      maxTime: duration,
      maxVelocity: Math.max(speedA, speedB) + 2,
      xTicks: [0, duration],
      yTicks: [speedA, speedB],
    },
    prompt: "מי עובר מרחק גדול יותר אחרי " + duration + " שניות?",
    correctAnswer: { value: distB, unit: "m", text: "גוף B" },
    fixedOptions: [
      { value: distA, unit: "m", text: "גוף A", isCorrect: false },
      { value: distB, unit: "m", text: "גוף B", isCorrect: true },
      { value: Math.min(distA, distB), unit: "m", text: "שווים", isCorrect: false },
      { value: 0, unit: "m", text: "אין תשובה", isCorrect: false },
    ],
    explanation: `גוף B עובר ${distB} מ׳ vs ${distA} מ׳ של גוף A.`,
  };
};

const dualXtOvertakeQuestion = () => {
  const speedA = randomInt(3, 5);
  const speedB = randomInt(2, 4);
  const time = randomInt(3, 6);
  const posA = speedA * time;
  const posB = speedB * time + 2;
  const leader = posA > posB ? "גוף A" : "גוף B";
  return {
    id: `dual-xt-${Date.now()}-${leader}`,
    representation: {
      type: "dual-xt",
      objects: [
        { name: "גוף A", color: "#2f80ed", points: [{ t: 0, x: 0 }, { t: time, x: posA }] },
        { name: "גוף B", color: "#27ae60", points: [{ t: 0, x: 2 }, { t: time, x: posB }] },
      ],
      maxTime: time,
      maxDistance: Math.max(posA, posB),
      xTicks: [0, time],
      yTicks: [Math.min(posB, posA), Math.max(posB, posA)],
    },
    prompt: "איזה גוף רחוק יותר לאחר " + time + " שניות?",
    correctAnswer: { value: Math.max(posA, posB), unit: "m", text: leader },
    fixedOptions: [
      { value: posA, unit: "m", text: "גוף A", isCorrect: leader === "גוף A" },
      { value: posB, unit: "m", text: "גוף B", isCorrect: leader === "גוף B" },
      { value: 0, unit: "m", text: "שווים", isCorrect: false },
      { value: 0, unit: "m", text: "אין מידע", isCorrect: false },
    ],
    explanation: `גוף ${leader} נמצא ב־${Math.max(posA, posB)} מטר.`,
  };
};

const questionBuilders = [
  { builder: tableRandomQuestion, type: "speed" },
  { builder: tableAverageSpeedQuestion, type: "speed" },
  { builder: xtConstantQuestion, type: "speed" },
  { builder: xtSwitchQuestion, type: "speed" },
  { builder: xtReturnQuestion, type: "distance" },
  { builder: xtTotalDistanceQuestion, type: "distance" },
  { builder: vtAreaQuestion, type: "distance" },
  { builder: vtStopQuestion, type: "time" },
  { builder: vtAccelerationQuestion, type: "speed" },
  { builder: footprintConstantQuestion, type: "speed" },
  { builder: xtEquationPositionQuestion, type: "distance" },
  { builder: xtGraphEquationQuestion, type: "equation" },
  { builder: vtGraphPositionEquationQuestion, type: "equation" },
  { builder: xtTableEquationQuestion, type: "equation" },
  { builder: footprintEquationQuestion, type: "equation" },
  { builder: meetingEquationQuestion, type: "equation" },
  { builder: footprintVariablePaceQuestion, type: "speed" },
  { builder: dualVtSpeedQuestion, type: "speed" },
  { builder: dualVtDistanceQuestion, type: "distance" },
  { builder: dualXtOvertakeQuestion, type: "distance" },
];

let questionCount = 0;
let correctCount = 0;
let currentStreak = 0;
let currentQuestion = null;
let answered = false;
let selectedOptionIndex = null;
const STATS_STORAGE_KEY = "physics-quiz-stats";

const loadPersistedStats = () => {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.correctCount === "number") correctCount = parsed.correctCount;
    if (typeof parsed.currentStreak === "number") currentStreak = parsed.currentStreak;
  } catch (err) {
    // ignore persistence errors
  }
};

loadPersistedStats();

const representationEl = document.getElementById("representation");
const promptEl = document.getElementById("prompt");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const submitBtn = document.getElementById("submit-answer");
const correctCountEl = document.getElementById("correct-count");
const streakEl = document.getElementById("streak-count");

const typesetMath = (element, retries = 6) => {
  if (!element || retries <= 0) return;
  const mj = window.MathJax;
  if (mj?.typesetPromise) {
    mj.typesetPromise([element]).catch(() => {});
    return;
  }
  if (typeof mj?.typeset === "function") {
    mj.typeset([element]);
    return;
  }
  setTimeout(() => typesetMath(element, retries - 1), 200);
};

const isTestMode = new URLSearchParams(window.location.search).has("test");

const updateStats = () => {
  correctCountEl.textContent = `⬆️ ${correctCount}`;
  if (currentStreak >= 3) {
    streakEl.textContent = `🔥 ${currentStreak}`;
    streakEl.classList.add("streak-hot");
  } else {
    streakEl.textContent = `🔥 ${currentStreak}`;
    streakEl.classList.remove("streak-hot");
  }
  try {
    localStorage.setItem(
      STATS_STORAGE_KEY,
      JSON.stringify({ correctCount, currentStreak })
    );
  } catch (err) {
    // ignore persistence errors
  }
};

const generateQuestion = () => {
  const index = isTestMode ? questionCount % questionBuilders.length : randomInt(0, questionBuilders.length - 1);
  const entry = questionBuilders[index];
  const question = entry.builder();
  question.answerType = entry.type;
  questionCount += 1;
  ensureMetadata(question, entry.type);
  unitStrategy(questionCount, question);
  buildOptionsForQuestion(question);
  updateExplanationUnits(question);
  return question;
};

const renderCurrentQuestion = () => {
  currentQuestion = currentQuestion ?? generateQuestion();
  const question = currentQuestion;
  promptEl.textContent = question.prompt;
  representationEl.innerHTML = renderRepresentation(question.representation);
  typesetMath(representationEl);
  optionsEl.innerHTML = `
    <div class="option-grid">
      ${question.options
        .map(
          (option, index) => `
            <button class="option-card" data-index="${index}">
              ${formatOption(option, question)}
            </button>`
        )
        .join("")}
    </div>
    <div class="confirm-area" id="confirm-area"></div>
  `;
  typesetMath(optionsEl);
  selectedOptionIndex = null;
  submitBtn.style.display = "none";
  document.querySelectorAll(".option-card").forEach((btn) => {
    btn.addEventListener("click", () => handleOptionSelect(Number(btn.dataset.index)));
  });
  feedbackEl.textContent = "";
  answered = false;
};

const markOptionsAfterAnswer = () => {
  const buttons = Array.from(document.querySelectorAll(".option-card"));
  buttons.forEach((btn) => {
    const idx = Number(btn.dataset.index);
    const option = currentQuestion.options[idx];
    btn.disabled = true;
    if (option.isCorrect) {
      btn.classList.add("correct");
    }
    if (!option.isCorrect && idx === selectedOptionIndex) {
      btn.classList.add("incorrect");
    }
  });
};

const showNextButton = () => {
  const confirmArea = document.getElementById("confirm-area");
  confirmArea.innerHTML = `<button class="primary" id="next-question">שאלה הבאה</button>`;
  document.getElementById("next-question").addEventListener("click", () => {
    currentQuestion = generateQuestion();
    renderCurrentQuestion();
  });
};

const confirmSelection = () => {
  if (selectedOptionIndex === null || answered) return;
  const selectedOption = currentQuestion.options[selectedOptionIndex];
  if (selectedOption.isCorrect) {
    correctCount += 1;
    currentStreak += 1;
  } else {
    currentStreak = 0;
  }
  updateStats();
  const correctness = selectedOption.isCorrect ? "✅ תשובה נכונה" : "⚠️ תשובה לא נכונה";
  feedbackEl.textContent = `${correctness}. ${currentQuestion.explanation}`;
  answered = true;
  markOptionsAfterAnswer();
  showNextButton();
};

const handleOptionSelect = (index) => {
  if (answered) return;
  selectedOptionIndex = index;
  document.querySelectorAll(".option-card").forEach((btn) => btn.classList.remove("selected"));
  const selectedBtn = document.querySelector(`.option-card[data-index="${index}"]`);
  if (selectedBtn) selectedBtn.classList.add("selected");
  const confirmArea = document.getElementById("confirm-area");
  confirmArea.innerHTML = `<button class="secondary" id="confirm-selection">בטוחים? לחצו לאישור</button>`;
  document.getElementById("confirm-selection").addEventListener("click", confirmSelection);
};

function renderTable(data) {
  const rows = data.rows
    .map(
      (row) => `
        <tr>
          <td>${formatNumber(Number(row[0]))}</td>
          <td>${formatNumber(Number(row[1]))}</td>
        </tr>`
    )
    .join("");
  const headers = data.headers.map((header) => `<th>${header}</th>`).join("");
  return `<table class="table-view">
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderXTGraph(data) {
  if (!data) return "<p>אין נתונים</p>";
  const width = 320;
  const height = 220;
  const padding = 40;
  const minTime = data.minTime ?? Math.min(...data.points.map((p) => p.t));
  const maxTime = data.maxTime ?? Math.max(...data.points.map((p) => p.t));
  const minDistance = data.minDistance ?? Math.min(...data.points.map((p) => p.x));
  const maxDistance = data.maxDistance ?? Math.max(...data.points.map((p) => p.x));
  const xTicks = data.xTicks ?? buildTicks(minTime, maxTime);
  const yTicks = data.yTicks ?? buildTicks(minDistance, maxDistance);
  const scaleX = (value) => padding + ((value - minTime) / (maxTime - minTime || 1)) * (width - padding * 2);
  const scaleY = (value) => height - padding - ((value - minDistance) / (maxDistance - minDistance || 1)) * (height - padding * 2);
  const points = data.points.map((point) => `${scaleX(point.t)},${scaleY(point.x)}`).join(" ");
  const xTickElements = xTicks
    .map((tick) => {
      const x = scaleX(tick);
      return `
        <line x1="${x}" y1="${height - padding}" x2="${x}" y2="${height - padding + 6}" stroke="#333" stroke-width="1" />
        <text x="${x}" y="${height - padding + 22}" class="graph-label" text-anchor="middle">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const yTickElements = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `
        <line x1="${padding - 6}" y1="${y}" x2="${padding}" y2="${y}" stroke="#333" stroke-width="1" />
        <text x="${padding - 12}" y="${y + 4}" class="graph-label" text-anchor="end">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const xLabel = data.xLabel || "t (s)";
  const yLabel = data.yLabel || "x (m)";
  return `
    <svg width="100%" viewBox="0 0 ${width} ${height}">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      ${yTickElements}
      ${xTickElements}
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="4" />
      <text x="${width - padding}" y="${height - padding + 32}" class="graph-label">${xLabel}</text>
      <text x="${padding - 5}" y="${padding - 10}" class="graph-label">${yLabel}</text>
      <text x="${width / 2}" y="${padding - 12}" class="graph-label" text-anchor="middle">גרף x־t</text>
    </svg>
  `;
}

function renderVTGraph(data) {
  if (!data) return "<p>אין נתונים</p>";
  const width = 320;
  const height = 220;
  const padding = 40;
  const minTime = data.minTime ?? Math.min(...data.points.map((p) => p.t));
  const maxTime = data.maxTime ?? Math.max(...data.points.map((p) => p.t));
  const minVelocity = data.minVelocity ?? Math.min(...data.points.map((p) => p.v));
  const maxVelocity = data.maxVelocity ?? Math.max(...data.points.map((p) => p.v));
  const xTicks = data.xTicks ?? buildTicks(minTime, maxTime);
  const yTicks = data.yTicks ?? buildTicks(minVelocity, maxVelocity);
  const scaleX = (value) => padding + ((value - minTime) / (maxTime - minTime || 1)) * (width - padding * 2);
  const scaleY = (value) => height - padding - ((value - minVelocity) / (maxVelocity - minVelocity || 1)) * (height - padding * 2);
  const points = data.points.map((point) => `${scaleX(point.t)},${scaleY(point.v)}`).join(" ");
  const xTickElements = xTicks
    .map((tick) => {
      const x = scaleX(tick);
      return `
        <line x1="${x}" y1="${height - padding}" x2="${x}" y2="${height - padding + 6}" stroke="#333" stroke-width="1" />
        <text x="${x}" y="${height - padding + 22}" class="graph-label" text-anchor="middle">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const yTickElements = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `
        <line x1="${padding - 6}" y1="${y}" x2="${padding}" y2="${y}" stroke="#333" stroke-width="1" />
        <text x="${padding - 12}" y="${y + 4}" class="graph-label" text-anchor="end">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const xLabel = data.xLabel || "t (s)";
  const yLabel = data.yLabel || "v (m/s)";
  return `
    <svg width="100%" viewBox="0 0 ${width} ${height}">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      ${yTickElements}
      ${xTickElements}
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="4" />
      <text x="${width - padding}" y="${height - padding + 32}" class="graph-label">${xLabel}</text>
      <text x="${padding - 5}" y="${padding - 10}" class="graph-label">${yLabel}</text>
      <text x="${width / 2}" y="${padding - 12}" class="graph-label" text-anchor="middle">גרף v־t</text>
    </svg>
  `;
}

function renderEquationView(data) {
  if (!data) return "<p>אין משוואה</p>";
  const base = {
    velocity: data.velocity,
    intercept: data.intercept,
    distanceLabel: data.distanceLabel || "m",
    timeLabel: data.timeLabel || "s",
  };
  const eqText = formatEquation(base);
  const latex = formatEquationLatex(base);
  return `
    <div class="equation-view">
      <div class="eq-text">${latex ? `\\(${latex}\\)` : eqText}</div>
    </div>
  `;
}

function renderFootprint(data) {
  if (!data) return "<p>אין תרשים</p>";
  const width = 340;
  const height = 200;
  const padding = 30;
  const axisY = height / 2;
  const positions = data.steps.map((step) => step.position);
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const scale = (value) => padding + ((value - minPos) / (maxPos - minPos || 1)) * (width - padding * 2);
  const tickPositions = data.tickPositions ?? positions;
  const tickMarks = tickPositions
    .map((tick, index) => {
      const x = scale(tick);
      const label = index % 2 === 0 ? formatTick(tick) : "";
      return `
        <line x1="${x}" y1="${axisY - 6}" x2="${x}" y2="${axisY + 6}" stroke="#333" stroke-width="1" />
        <text x="${x}" y="${axisY + 20}" class="graph-label" text-anchor="middle">${label}</text>
      `;
    })
    .join("");
  const footprintY = axisY - 20;
  const points = data.steps
    .map((step) => `<circle cx="${scale(step.position)}" cy="${footprintY}" r="6" fill="#1f1c3b" />`)
    .join("");
  const arrowY = axisY - 40;
  const arrowLength = width * 0.1;
  const arrowCenter = width / 2;
  const arrowStart = arrowCenter - arrowLength / 2;
  const arrowEnd = arrowCenter + arrowLength / 2;
  return `
    <svg width="100%" viewBox="0 0 ${width} ${height}">
      <defs>
        <marker id="footprint-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#1f1c3b" />
        </marker>
      </defs>
      <line x1="${padding}" y1="${axisY}" x2="${width - padding}" y2="${axisY}" stroke="#333" stroke-width="2" />
      ${tickMarks}
      ${points}
      <line
        x1="${arrowStart}"
        y1="${arrowY}"
        x2="${arrowEnd}"
        y2="${arrowY}"
        stroke="#1f1c3b"
        stroke-width="1.5"
        marker-end="url(#footprint-arrow)"
      />
    </svg>
  `;
}

function renderDualXT(data) {
  if (!data) return "<p>אין נתונים</p>";
  const width = 340;
  const height = 220;
  const padding = 40;
  const minTime = data.minTime ?? 0;
  const maxTime = data.maxTime;
  const minDistance = data.minDistance ?? 0;
  const maxDistance = data.maxDistance;
  const xScale = (value) => padding + ((value - minTime) / (maxTime - minTime || 1)) * (width - padding * 2);
  const yScale = (value) => height - padding - ((value - minDistance) / (maxDistance - minDistance || 1)) * (height - padding * 2);
  const xTicks = data.xTicks ?? buildTicks(minTime, maxTime);
  const yTicks = data.yTicks ?? buildTicks(minDistance, maxDistance);
  const tickLines = xTicks
    .map((tick) => {
      const x = xScale(tick);
      return `
        <line x1="${x}" y1="${height - padding}" x2="${x}" y2="${height - padding + 6}" stroke="#333" stroke-width="1" />
        <text x="${x}" y="${height - padding + 22}" class="graph-label" text-anchor="middle">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const yLines = yTicks
    .map((tick) => {
      const y = yScale(tick);
      return `
        <line x1="${padding - 6}" y1="${y}" x2="${padding}" y2="${y}" stroke="#333" stroke-width="1" />
        <text x="${padding - 12}" y="${y + 4}" class="graph-label" text-anchor="end">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const lines = data.objects
    .map((object) => {
      const points = object.points.map((point) => `${xScale(point.t)},${yScale(point.x)}`).join(" ");
      const lastPoint = object.points[object.points.length - 1];
      const labelX = xScale(lastPoint.t) + 4;
      const labelY = yScale(lastPoint.x) - 6;
      return `
        <polyline points="${points}" fill="none" stroke="${object.color}" stroke-width="3" />
        <text x="${labelX}" y="${labelY}" class="graph-label" fill="${object.color}">${object.name}</text>
      `;
    })
    .join("");
  return `
    <svg width="100%" viewBox="0 0 ${width} ${height}">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      ${yLines}
      ${tickLines}
      ${lines}
      <text x="${width - padding}" y="${height - padding + 32}" class="graph-label">t (s)</text>
      <text x="${padding - 5}" y="${padding - 10}" class="graph-label">x (m)</text>
    </svg>
  `;
}

function renderDualVT(data) {
  if (!data) return "<p>אין נתונים</p>";
  const width = 340;
  const height = 220;
  const padding = 40;
  const minTime = data.minTime ?? 0;
  const maxTime = data.maxTime;
  const minVelocity = data.minVelocity ?? 0;
  const maxVelocity = data.maxVelocity;
  const xScale = (value) => padding + ((value - minTime) / (maxTime - minTime || 1)) * (width - padding * 2);
  const yScale = (value) => height - padding - ((value - minVelocity) / (maxVelocity - minVelocity || 1)) * (height - padding * 2);
  const xTicks = data.xTicks ?? buildTicks(minTime, maxTime);
  const yTicks = data.yTicks ?? buildTicks(minVelocity, maxVelocity);
  const tickLines = xTicks
    .map((tick) => {
      const x = xScale(tick);
      return `
        <line x1="${x}" y1="${height - padding}" x2="${x}" y2="${height - padding + 6}" stroke="#333" stroke-width="1" />
        <text x="${x}" y="${height - padding + 22}" class="graph-label" text-anchor="middle">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const yLines = yTicks
    .map((tick) => {
      const y = yScale(tick);
      return `
        <line x1="${padding - 6}" y1="${y}" x2="${padding}" y2="${y}" stroke="#333" stroke-width="1" />
        <text x="${padding - 12}" y="${y + 4}" class="graph-label" text-anchor="end">${formatTick(tick)}</text>
      `;
    })
    .join("");
  const lines = data.objects
    .map((object) => {
      const points = object.points.map((point) => `${xScale(point.t)},${yScale(point.v)}`).join(" ");
      const lastPoint = object.points[object.points.length - 1];
      const labelX = xScale(lastPoint.t) + 4;
      const labelY = yScale(lastPoint.v) - 6;
      return `
        <polyline points="${points}" fill="none" stroke="${object.color}" stroke-width="3" />
        <text x="${labelX}" y="${labelY}" class="graph-label" fill="${object.color}">${object.name}</text>
      `;
    })
    .join("");
  return `
    <svg width="100%" viewBox="0 0 ${width} ${height}">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" stroke-width="2" />
      ${yLines}
      ${tickLines}
      ${lines}
      <text x="${width - padding}" y="${height - padding + 32}" class="graph-label">t (s)</text>
      <text x="${padding - 5}" y="${padding - 10}" class="graph-label">v (m/s)</text>
    </svg>
  `;
}

function renderRepresentation(representation) {
  if (!representation) return "<p>אין נתונים</p>";
  switch (representation.type) {
    case "table":
      return renderTable(representation);
    case "xt-graph":
      return renderXTGraph(representation);
    case "vt-graph":
      return renderVTGraph(representation);
    case "xt-equation":
      return renderEquationView(representation);
    case "footprint":
      return renderFootprint(representation);
    case "dual-xt":
      return renderDualXT(representation);
    case "dual-vt":
      return renderDualVT(representation);
    default:
      return "<p>ייצוג לא נתמך</p>";
  }
}

submitBtn.addEventListener("click", () => {
  if (!currentQuestion) return;
  if (answered) {
    currentQuestion = generateQuestion();
    renderCurrentQuestion();
  }
});

const renderInitial = () => {
  updateStats();
  currentQuestion = generateQuestion();
  renderCurrentQuestion();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderInitial);
} else {
  renderInitial();
}

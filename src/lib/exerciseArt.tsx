// Original line-art diagrams for exercises — drawn here as SVG rather than shipped
// as photos. Stock exercise photography is copyrighted; SVG is also ~1KB instead of
// ~100KB, stays sharp at any size, works offline in the PWA, and inherits the text
// colour so it adapts to dark mode for free.
//
// Two-tone on purpose: the BODY is drawn in the inherited text colour and the
// EQUIPMENT in the brand accent. At the ~32px these render at, colour separates
// "person" from "weight" far faster than shape alone can.
//
// Every exercise resolves to a picture: exact built-in match → keyword match on the
// name (so custom exercises get one automatically) → muscle-group fallback.

export type ArtKey =
  | 'benchPress'
  | 'inclinePress'
  | 'overheadPress'
  | 'lateralRaise'
  | 'facePull'
  | 'pushdown'
  | 'deadlift'
  | 'romanianDeadlift'
  | 'row'
  | 'pullUp'
  | 'pulldown'
  | 'curl'
  | 'squat'
  | 'splitSquat'
  | 'legPress'
  | 'legExtension'
  | 'legCurl'
  | 'calfRaise'
  | 'core'
  | 'dumbbell'

interface Diagram {
  /** Drawn in the inherited text colour. */
  body: React.ReactNode
  /** Drawn in the brand accent — bars, benches, cables, machines. */
  gear: React.ReactNode
}

/** A solid head reads better than an outlined ring once the icon is small. */
const Head = ({ cx, cy }: { cx: number; cy: number }) => (
  <circle cx={cx} cy={cy} r="4.5" fill="currentColor" stroke="none" />
)

const ART: Record<ArtKey, Diagram> = {
  // Lying flat press: body on the bench, bar driven straight up off the chest.
  benchPress: {
    body: (
      <>
        <Head cx={21} cy={33} />
        <path d="M26 35h15l6 6v8" />
        <path d="M29 34V22" />
      </>
    ),
    gear: (
      <>
        <path d="M13 40h34M19 40v10M41 40v10" />
        <path d="M17 20h24M18 15v10M40 15v10" />
      </>
    ),
  },
  // Incline press: angled pad, dumbbell driven up off the upper chest.
  inclinePress: {
    body: (
      <>
        <Head cx={41} cy={25} />
        <path d="M37 30 22 46" />
        <path d="M22 46l-7 4" />
        <path d="M34 33l-3-16" />
      </>
    ),
    gear: (
      <>
        <path d="M14 53 39 28M14 53h15" />
        <path d="M25 14h12M27 10v8M35 10v8" />
      </>
    ),
  },
  // Standing overhead press: bar locked out above the head.
  overheadPress: {
    body: (
      <>
        <Head cx={32} cy={29} />
        <path d="M32 34v11M32 45l-5 12M32 45l5 12" />
        <path d="M32 36l-6-13M32 36l6-13" />
      </>
    ),
    gear: <path d="M14 19h36M17 14v10M47 14v10" />,
  },
  // Lateral raise: arms out wide to shoulder height, dumbbell in each hand.
  lateralRaise: {
    body: (
      <>
        <Head cx={32} cy={17} />
        <path d="M32 22v19M32 41l-5 14M32 41l5 14" />
        <path d="M32 26H18M32 26h14" />
      </>
    ),
    gear: <path d="M16 21v10M48 21v10" />,
  },
  // Face pull: rope drawn to the face with the elbows kept high.
  facePull: {
    body: (
      <>
        <Head cx={23} cy={21} />
        <path d="M23 26v16M23 42l-5 14M23 42l5 14" />
        <path d="M23 28l10-5" />
      </>
    ),
    gear: <path d="M33 23h18M51 17v12" />,
  },
  // Triceps pushdown: high cable, elbows pinned at the sides, forearms driving
  // the bar down to hip height.
  pushdown: {
    body: (
      <>
        <Head cx={24} cy={19} />
        <path d="M24 24v18M24 42l-5 14M24 42l5 14" />
        <path d="M24 27l4 7 9 2" />
      </>
    ),
    gear: <path d="M41 8v27M33 35h16" />,
  },
  // Deadlift: loaded bar on the floor, body hinged over it. Plates read as discs.
  deadlift: {
    body: (
      <>
        <Head cx={23} cy={18} />
        <path d="M27 22l12 9v11" />
        <path d="M27 25l-2 18" />
      </>
    ),
    gear: (
      <>
        <circle cx="15" cy="47" r="7" />
        <circle cx="47" cy="47" r="7" />
        <path d="M22 47h18" />
      </>
    ),
  },
  // Romanian deadlift: hips pushed back, bar sliding down near-straight legs.
  romanianDeadlift: {
    body: (
      <>
        <Head cx={21} cy={18} />
        <path d="M25 22l14 6 1 22" />
        <path d="M26 25l3 11" />
      </>
    ),
    gear: <path d="M20 37h20M22 32v10M38 32v10" />,
  },
  // Bent-over row: hinged torso, bar pulled up into the ribs.
  row: {
    body: (
      <>
        <Head cx={20} cy={19} />
        <path d="M24 23l14 7 1 20" />
        <path d="M26 26l-2 9" />
      </>
    ),
    gear: <path d="M15 36h19M17 31v10M32 31v10" />,
  },
  // Pull-up: hanging from a fixed bar, chest drawn up toward it.
  pullUp: {
    body: (
      <>
        <Head cx={32} cy={27} />
        <path d="M32 32v11M32 43l-4 11M32 43l4 11" />
        <path d="M32 33l-6-16M32 33l6-16" />
      </>
    ),
    gear: <path d="M12 15h40" />,
  },
  // Lat pulldown: seated, bar drawn down from overhead.
  pulldown: {
    body: (
      <>
        <Head cx={32} cy={31} />
        <path d="M32 36v9h11v11" />
        <path d="M32 37l-6-15M32 37l6-15" />
      </>
    ),
    gear: <path d="M16 20h32M32 20V9" />,
  },
  // Biceps curl: upper arms fixed at the sides, bar curled to the chest.
  curl: {
    body: (
      <>
        <Head cx={32} cy={16} />
        <path d="M32 21v18M32 39l-5 15M32 39l5 15" />
        <path d="M32 24l-4 8 5 -3" />
      </>
    ),
    gear: <path d="M23 29h18M25 25v9M39 25v9" />,
  },
  // Back squat: bar racked across the shoulders, hips driven to depth.
  squat: {
    body: (
      <>
        <Head cx={25} cy={20} />
        <path d="M28 24l5 12" />
        <path d="M33 36h10l-1 16" />
        <path d="M33 36l-8 5v11" />
      </>
    ),
    gear: <path d="M15 26h30M18 21v10M43 21v10" />,
  },
  // Bulgarian split squat: rear foot up on a bench, front knee bent deep.
  splitSquat: {
    body: (
      <>
        <Head cx={29} cy={16} />
        <path d="M29 21l2 14" />
        <path d="M31 35l-9 6v13" />
        <path d="M31 35l10 9" />
      </>
    ),
    gear: <path d="M38 46h16M46 46v10" />,
  },
  // Leg press: reclined on the pad, knees bent, feet driving the platform away.
  legPress: {
    body: (
      <>
        <Head cx={13} cy={43} />
        <path d="M18 42l14-5" />
        <path d="M32 37h11l4-15" />
      </>
    ),
    gear: (
      <>
        <path d="M40 13 54 22" />
        <path d="M9 50l14-6" />
      </>
    ),
  },
  // Leg extension: seated upright, shins driven out against the ankle pad.
  legExtension: {
    body: (
      <>
        <Head cx={17} cy={15} />
        <path d="M17 20v16" />
        <path d="M17 36h15l13-7" />
      </>
    ),
    gear: (
      <>
        <path d="M10 37h8M13 37v15" />
        <circle cx="48" cy="27" r="3.5" />
      </>
    ),
  },
  // Leg curl: lying face-down, heel curled up toward the glutes.
  legCurl: {
    body: (
      <>
        <Head cx={15} cy={33} />
        <path d="M20 36h24" />
        <path d="M44 36l4 -11" />
      </>
    ),
    gear: (
      <>
        <path d="M10 41h34" />
        <circle cx="49" cy="22" r="3.5" />
      </>
    ),
  },
  // Calf raise: up on the toes, heels hanging off the edge of a step.
  calfRaise: {
    body: (
      <>
        <Head cx={30} cy={16} />
        <path d="M30 21v22" />
        <path d="M30 43l-3 5M30 43l3 5" />
        <path d="M24 48h14" />
      </>
    ),
    gear: <path d="M12 50h20M12 50v8" />,
  },
  // Core work: trunk curled up off the floor.
  core: {
    body: (
      <>
        <Head cx={18} cy={29} />
        <path d="M23 32l10 7h9l2 11" />
        <path d="M24 33l6-5" />
      </>
    ),
    gear: <path d="M10 52h44" />,
  },
  // Generic fallback — a dumbbell.
  dumbbell: {
    body: null,
    gear: (
      <>
        <path d="M23 32h18" />
        <path d="M19 24v16M26 27v10M38 27v10M45 24v16" />
      </>
    ),
  },
}

/** The 18 seeded exercises, matched exactly. */
const BUILTIN: Record<string, ArtKey> = {
  'Bench Press': 'benchPress',
  'Incline DB Press': 'inclinePress',
  'Overhead Press': 'overheadPress',
  'Lateral Raise': 'lateralRaise',
  'Face Pull': 'facePull',
  'Triceps Pushdown': 'pushdown',
  Deadlift: 'deadlift',
  'Barbell Row': 'row',
  'Pull-Up': 'pullUp',
  'Lat Pulldown': 'pulldown',
  'Preacher Curl': 'curl',
  Squat: 'squat',
  'Leg Press': 'legPress',
  'Leg Extension': 'legExtension',
  'Bulgarian Split Squat': 'splitSquat',
  'Romanian Deadlift': 'romanianDeadlift',
  'Leg Curl': 'legCurl',
  'Calf Raise': 'calfRaise',
}

// Ordered most-specific first: "Seated Leg Curl" must match legCurl before curl,
// and "Bulgarian Split Squat" must match splitSquat before squat.
const KEYWORDS: [RegExp, ArtKey][] = [
  [/face\s*pull/i, 'facePull'],
  [/pull[\s-]?down|lat\s*pull/i, 'pulldown'],
  [/pull[\s-]?up|chin[\s-]?up/i, 'pullUp'],
  [/romanian|\brdl\b|good\s*morning|hip\s*(hinge|thrust)|stiff[\s-]?leg/i, 'romanianDeadlift'],
  [/deadlift/i, 'deadlift'],
  [/\brow\b|rowing/i, 'row'],
  [/shrug|pull[\s-]?over/i, 'row'],
  [/bulgarian|split\s*squat|lunge|step[\s-]?up/i, 'splitSquat'],
  [/leg\s*press|hack\s*squat/i, 'legPress'],
  [/leg\s*(extension|ext)|quad\s*extension/i, 'legExtension'],
  [/(leg|hamstring|ham)\s*curl|nordic/i, 'legCurl'],
  [/calf|calves|toe\s*raise/i, 'calfRaise'],
  [/squat/i, 'squat'],
  [/lateral\s*raise|side\s*raise|lat\s*raise|rear\s*delt|reverse\s*(fly|flye)/i, 'lateralRaise'],
  [/overhead\s*press|shoulder\s*press|military|\bohp\b|arnold|push\s*press/i, 'overheadPress'],
  [/push[\s-]?down|skull\s*crusher|\bdip\b|kickback|tricep/i, 'pushdown'],
  [/incline|decline/i, 'inclinePress'],
  [/curl/i, 'curl'],
  [/bench|chest\s*press|\bfly\b|flye|\bpec\b|push[\s-]?up/i, 'benchPress'],
  [/plank|crunch|sit[\s-]?up|\babs?\b|core|russian\s*twist|leg\s*raise/i, 'core'],
  [/press/i, 'benchPress'],
  [/raise/i, 'lateralRaise'],
  [/pull/i, 'row'],
]

/** Last resort, so nothing ever renders without a picture. */
const BY_MUSCLE: Record<string, ArtKey> = {
  Chest: 'benchPress',
  Back: 'row',
  Shoulders: 'overheadPress',
  Biceps: 'curl',
  Triceps: 'pushdown',
  Quads: 'squat',
  Hamstrings: 'legCurl',
  Calves: 'calfRaise',
  Other: 'dumbbell',
}

/** Pick the diagram for any exercise — built-in, or custom by name/muscle group. */
export function resolveArt(name: string, muscleGroup?: string | null): ArtKey {
  const exact = BUILTIN[name.trim()]
  if (exact) return exact
  for (const [pattern, key] of KEYWORDS) {
    if (pattern.test(name)) return key
  }
  return (muscleGroup && BY_MUSCLE[muscleGroup]) || 'dumbbell'
}

interface ExerciseArtProps {
  name: string
  muscleGroup?: string | null
  className?: string
}

/**
 * The diagram for an exercise. Decorative — the exercise name is always shown
 * next to it, so it's hidden from screen readers rather than duplicating the label.
 */
export default function ExerciseArt({ name, muscleGroup, className }: ExerciseArtProps) {
  const diagram = ART[resolveArt(name, muscleGroup)]
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g stroke="currentColor">{diagram.body}</g>
      <g stroke="var(--color-brand-500, #3b82f6)">{diagram.gear}</g>
    </svg>
  )
}

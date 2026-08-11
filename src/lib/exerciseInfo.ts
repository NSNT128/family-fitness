// How-to cues + target muscles for the built-in exercises, so anyone can learn a
// movement from inside the app. Kept client-side (no photos): stock images are
// copyrighted and would bloat the offline app. Keyed by the exact exercise name.

export interface ExerciseInfo {
  muscles: string
  howTo: string
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  'Bench Press': {
    muscles: 'Chest, front delts, triceps',
    howTo:
      'Lie on the bench, grip just wider than shoulders. Lower the bar to mid-chest with elbows about 45°, then press back up to lockout. Keep your feet planted and shoulder blades pinched.',
  },
  'Incline DB Press': {
    muscles: 'Upper chest, front delts, triceps',
    howTo:
      'Set the bench to ~30°. Press two dumbbells from shoulder level up and slightly together, then lower under control until you feel a stretch across the upper chest.',
  },
  'Overhead Press': {
    muscles: 'Shoulders, triceps, upper chest',
    howTo:
      'Bar at collarbone height, grip just outside the shoulders. Brace your core and press overhead to lockout, moving your head slightly back then through. Lower under control.',
  },
  'Lateral Raise': {
    muscles: 'Side delts',
    howTo:
      'A dumbbell in each hand at your sides. With a slight elbow bend, raise them out to the sides to shoulder height — lead with the elbows, not the hands — then lower slowly.',
  },
  'Face Pull': {
    muscles: 'Rear delts, upper back',
    howTo:
      'Set a cable or band at head height. Pull the rope toward your face, splitting your hands apart and squeezing your shoulder blades. Keep your elbows high.',
  },
  'Triceps Pushdown': {
    muscles: 'Triceps',
    howTo:
      'At a high cable with a bar or rope, keep your elbows tucked at your sides and push down until the arms are straight, then return under control. Only the forearms move.',
  },
  Deadlift: {
    muscles: 'Whole posterior chain — back, glutes, hamstrings',
    howTo:
      'Stand mid-foot under the bar, hinge and grip just outside your knees. Flatten your back, brace, and drive through the floor to stand tall. Keep the bar close to your legs the whole way.',
  },
  'Barbell Row': {
    muscles: 'Upper back, lats, biceps',
    howTo:
      'Hinge at the hips to about 45° with a flat back. Pull the bar to your lower ribs, squeezing the shoulder blades, then lower under control. Avoid jerking with the lower back.',
  },
  'Pull-Up': {
    muscles: 'Lats, upper back, biceps',
    howTo:
      'Hang with an overhand grip. Pull your chest toward the bar by driving your elbows down, then lower all the way. Add weight with a belt, or use a band/machine to assist.',
  },
  'Lat Pulldown': {
    muscles: 'Lats, upper back, biceps',
    howTo:
      'Grip the bar wider than shoulders. Pull it to your upper chest by driving the elbows down and back, squeezing your lats, then return under control without shrugging.',
  },
  'Preacher Curl': {
    muscles: 'Biceps',
    howTo:
      'Rest the backs of your arms on the pad. Curl the bar or dumbbell up, then lower slowly until the arms are nearly straight. Keep it strict — no swinging.',
  },
  Squat: {
    muscles: 'Quads, glutes, core',
    howTo:
      'Bar on your upper back, feet about shoulder-width. Brace, then sit down and back with knees tracking over your toes until thighs are at least parallel. Drive up through mid-foot.',
  },
  'Leg Press': {
    muscles: 'Quads, glutes',
    howTo:
      'Feet shoulder-width on the platform. Lower until the knees reach about 90°, keeping your lower back on the pad, then press through your heels without harshly locking the knees.',
  },
  'Leg Extension': {
    muscles: 'Quads',
    howTo:
      'Sit with the pad on your lower shins. Straighten your legs to lift the pad, pause briefly at the top, then lower under control.',
  },
  'Bulgarian Split Squat': {
    muscles: 'Quads, glutes',
    howTo:
      'Rest your back foot on a bench behind you. Lower straight down until the front thigh is parallel, then drive up through the front heel. Keep your torso tall.',
  },
  'Romanian Deadlift': {
    muscles: 'Hamstrings, glutes, lower back',
    howTo:
      'Hold the bar at your thighs. Push your hips back and slide the bar down your legs with a flat back until you feel a hamstring stretch, then drive the hips forward to stand.',
  },
  'Leg Curl': {
    muscles: 'Hamstrings',
    howTo:
      'On the machine with the pad on your lower calves, curl your heels toward you, squeeze, then lower under control.',
  },
  'Calf Raise': {
    muscles: 'Calves',
    howTo:
      'Balls of your feet on an edge. Rise as high as you can onto your toes, pause, then lower your heels below the step for a full stretch.',
  },
}

export const exerciseInfoFor = (name: string): ExerciseInfo | null => EXERCISE_INFO[name] ?? null

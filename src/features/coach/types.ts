export type WorkoutDay = { day: string; focus: string; exercises: string[] };
export type Meal = { name: string; idea: string };

export type CoachPlan = {
  summary: string;
  calorieTarget: string;
  proteinTarget: string;
  workout: { split: string; days: WorkoutDay[] };
  nutrition: { approach: string; meals: Meal[]; tips: string[] };
  habits: string[];
  notes: string;
  createdAt: number;
};

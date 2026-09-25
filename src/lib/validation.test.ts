import { describe, expect, it } from "vitest";
import {
  logSchema,
  planSchema,
  profileSchema,
  scheduleSchema,
  signUpSchema,
  testResultsSchema,
} from "@/lib/validation";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("signUpSchema", () => {
  const valid = { email: "a@b.dev", password: "long-enough-pw", username: "crimper_1", display_name: "" };

  it("accepts a valid sign-up and normalizes empty display name", () => {
    const parsed = signUpSchema.parse(valid);
    expect(parsed.display_name).toBeNull();
  });

  it.each([
    [{ password: "short" }, "Use at least 10 characters"],
    [{ password: "x".repeat(73) }, "Use at most 72 characters"],
    [{ username: "no" }, "3–24 letters, numbers or underscores"],
    [{ username: "has space" }, "3–24 letters, numbers or underscores"],
    [{ email: "nope" }, "Enter a valid email"],
  ])("rejects %o", (patch, message) => {
    const result = signUpSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(message);
  });
});

describe("planSchema", () => {
  const item = {
    id: id(4),
    exercise_id: id(9),
    sets: "5",
    reps: "",
    duration_sec: "10",
    rest_sec: "180",
    load_kg: "",
    edge_mm: "20",
    grade: "",
    notes: "",
  };
  const day = { id: id(3), weekday: 1, kind: "training", title: "Hangs", notes: "", items: [item] };
  const plan = {
    title: "Plan",
    description: "",
    goal: "",
    visibility: "public",
    blocks: [{ id: id(1), name: "Base", focus: "", weeks: [{ id: id(2), days: [day] }] }],
  };

  it("converts numeric strings and blanks", () => {
    const parsed = planSchema.parse(plan);
    const parsedItem = parsed.blocks[0].weeks[0].days[0].items[0];
    expect(parsedItem.sets).toBe(5);
    expect(parsedItem.reps).toBeNull();
    expect(parsedItem.edge_mm).toBe(20);
    expect(parsedItem.test_type_id).toBeNull();
  });

  it("requires exactly one of exercise or test per item", () => {
    const both = structuredClone(plan);
    both.blocks[0].weeks[0].days[0].items[0] = { ...item, test_type_id: id(8) } as typeof item;
    expect(planSchema.safeParse(both).success).toBe(false);
  });

  it("rejects two sessions on the same weekday", () => {
    const dup = structuredClone(plan);
    dup.blocks[0].weeks[0].days.push({ ...day, id: id(5) });
    expect(planSchema.safeParse(dup).error?.issues[0].message).toBe("A week can only have one session per weekday");
  });

  it("rejects plans longer than 52 weeks", () => {
    const long = structuredClone(plan);
    long.blocks[0].weeks = Array.from({ length: 53 }, (_, i) => ({ id: id(100 + i), days: [] }));
    expect(planSchema.safeParse(long).success).toBe(false);
  });

  it("rejects out-of-range values", () => {
    const bad = structuredClone(plan);
    bad.blocks[0].weeks[0].days[0].items[0].edge_mm = "2";
    expect(planSchema.safeParse(bad).success).toBe(false);
  });
});

describe("scheduleSchema", () => {
  it("only accepts Mondays", () => {
    expect(scheduleSchema.safeParse({ plan_id: id(1), start_date: "2026-09-28" }).success).toBe(true);
    expect(scheduleSchema.safeParse({ plan_id: id(1), start_date: "2026-09-29" }).error?.issues[0].message).toBe(
      "Plans start on a Monday",
    );
  });
});

describe("logSchema", () => {
  it("validates RPE and exercises", () => {
    const base = {
      date: "2026-09-25",
      title: "Board",
      scheduled_session_id: null,
      duration_min: "90",
      rpe: "7",
      notes: "",
      visibility: "private",
      exercises: [],
    };
    expect(logSchema.parse(base)).toMatchObject({ duration_min: 90, rpe: 7, notes: null });
    expect(logSchema.safeParse({ ...base, rpe: "11" }).success).toBe(false);
    expect(logSchema.safeParse({ ...base, date: "2026-02-30" }).success).toBe(false);
  });
});

describe("testResultsSchema", () => {
  it("requires at least one result", () => {
    const base = {
      date: "2026-09-25",
      bodyweight_kg: "68",
      notes: "",
      visibility: "public",
      scheduled_session_id: null,
    };
    expect(testResultsSchema.safeParse({ ...base, results: [] }).success).toBe(false);
    expect(testResultsSchema.parse({ ...base, results: [{ test_type_id: id(1), value: 12.5 }] }).bodyweight_kg).toBe(
      68,
    );
  });
});

describe("profileSchema", () => {
  it("allows clearing bodyweight", () => {
    expect(profileSchema.parse({ username: "sam", display_name: "", bodyweight_kg: "" })).toEqual({
      username: "sam",
      display_name: null,
      bodyweight_kg: null,
    });
  });
});

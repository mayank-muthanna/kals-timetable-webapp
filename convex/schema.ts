import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
  classes: defineTable({
    name: v.string(),
  }),
  teachers: defineTable({
    name: v.string(),
  }),
  subjects: defineTable({
    name: v.string(),
    teacherId: v.id("teachers"),
  }),
  classSubjects: defineTable({
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    weeklyPeriods: v.number(),
  }),
  fixedPeriods: defineTable({
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    day: v.number(),
    period: v.number(),
  }),
  massAssignments: defineTable({
    subjectId: v.id("subjects"),
    classIds: v.array(v.id("classes")),
    day: v.number(),
    period: v.number(),
  }),
});

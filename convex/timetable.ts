import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getData = query({
  args: {},
  handler: async (ctx) => {
    const [
      classes,
      teachers,
      subjects,
      subjectTeacherAssignments,
      classSubjects,
      fixedPeriods,
      massAssignments,
    ] =
      await Promise.all([
        ctx.db.query("classes").collect(),
        ctx.db.query("teachers").collect(),
        ctx.db.query("subjects").collect(),
        ctx.db.query("subjectTeacherAssignments").collect(),
        ctx.db.query("classSubjects").collect(),
        ctx.db.query("fixedPeriods").collect(),
        ctx.db.query("massAssignments").collect(),
      ]);

    return {
      classes,
      teachers,
      subjects,
      subjectTeacherAssignments,
      classSubjects,
      fixedPeriods,
      massAssignments,
    };
  },
});

export const createClass = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("classes", { name: args.name });
  },
});

export const removeClass = mutation({
  args: {
    id: v.id("classes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createTeacher = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("teachers", { name: args.name });
  },
});

export const removeTeacher = mutation({
  args: {
    id: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createSubject = mutation({
  args: {
    name: v.string(),
    teacherId: v.optional(v.id("teachers")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("subjects", {
      name: args.name,
      teacherId: args.teacherId,
    });
  },
});

export const removeSubject = mutation({
  args: {
    id: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createSubjectTeacherAssignment = mutation({
  args: {
    subjectId: v.id("subjects"),
    teacherId: v.id("teachers"),
    classIds: v.array(v.id("classes")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("subjectTeacherAssignments", {
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      classIds: args.classIds,
    });
  },
});

export const removeSubjectTeacherAssignment = mutation({
  args: {
    id: v.id("subjectTeacherAssignments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createClassSubject = mutation({
  args: {
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    weeklyPeriods: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("classSubjects", {
      classId: args.classId,
      subjectId: args.subjectId,
      weeklyPeriods: args.weeklyPeriods,
    });
  },
});

export const removeClassSubject = mutation({
  args: {
    id: v.id("classSubjects"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateClassSubject = mutation({
  args: {
    id: v.id("classSubjects"),
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    weeklyPeriods: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      classId: args.classId,
      subjectId: args.subjectId,
      weeklyPeriods: args.weeklyPeriods,
    });
  },
});

export const createFixedPeriod = mutation({
  args: {
    classId: v.id("classes"),
    subjectIds: v.array(v.id("subjects")),
    day: v.number(),
    period: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("fixedPeriods", {
      classId: args.classId,
      subjectId: args.subjectIds[0],
      subjectIds: args.subjectIds,
      day: args.day,
      period: args.period,
    });
  },
});

export const removeFixedPeriod = mutation({
  args: {
    id: v.id("fixedPeriods"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateFixedPeriod = mutation({
  args: {
    id: v.id("fixedPeriods"),
    classId: v.id("classes"),
    subjectIds: v.array(v.id("subjects")),
    day: v.number(),
    period: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      classId: args.classId,
      subjectId: args.subjectIds[0],
      subjectIds: args.subjectIds,
      day: args.day,
      period: args.period,
    });
  },
});

export const createMassAssignment = mutation({
  args: {
    subjectIds: v.array(v.id("subjects")),
    classIds: v.array(v.id("classes")),
    day: v.number(),
    period: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("massAssignments", {
      subjectId: args.subjectIds[0],
      subjectIds: args.subjectIds,
      classIds: args.classIds,
      day: args.day,
      period: args.period,
    });
  },
});

export const removeMassAssignment = mutation({
  args: {
    id: v.id("massAssignments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateMassAssignment = mutation({
  args: {
    id: v.id("massAssignments"),
    subjectIds: v.array(v.id("subjects")),
    classIds: v.array(v.id("classes")),
    day: v.number(),
    period: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      subjectId: args.subjectIds[0],
      subjectIds: args.subjectIds,
      classIds: args.classIds,
      day: args.day,
      period: args.period,
    });
  },
});

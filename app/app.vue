<script setup lang="ts">
import { computed, ref } from "vue";
import { api } from "../convex/_generated/api";

type WarningItem = {
  id: string;
  message: string;
  action?: { type: "fixed" | "mass"; id?: string };
};

type ClassMeta = {
  _id: string;
  name: string;
  grade: number | null;
  sortKey: string;
};

const { data } = useConvexQuery(api.timetable.getData);

const createClass = useConvexMutation(api.timetable.createClass);
const removeClass = useConvexMutation(api.timetable.removeClass);
const createTeacher = useConvexMutation(api.timetable.createTeacher);
const removeTeacher = useConvexMutation(api.timetable.removeTeacher);
const createSubject = useConvexMutation(api.timetable.createSubject);
const removeSubject = useConvexMutation(api.timetable.removeSubject);
const createSubjectTeacherAssignment = useConvexMutation(
  api.timetable.createSubjectTeacherAssignment,
);
const removeSubjectTeacherAssignment = useConvexMutation(
  api.timetable.removeSubjectTeacherAssignment,
);
const createClassSubject = useConvexMutation(api.timetable.createClassSubject);
const removeClassSubject = useConvexMutation(api.timetable.removeClassSubject);
const createFixedPeriod = useConvexMutation(api.timetable.createFixedPeriod);
const removeFixedPeriod = useConvexMutation(api.timetable.removeFixedPeriod);
const createMassAssignment = useConvexMutation(api.timetable.createMassAssignment);
const removeMassAssignment = useConvexMutation(api.timetable.removeMassAssignment);

const newClassName = ref("");
const newTeacherName = ref("");
const newSubjectName = ref("");
const newSubjectTeacherId = ref("");
const newSubjectTeacherSubjectId = ref("");
const newSubjectTeacherTeacherId = ref("");
const newSubjectTeacherClassIds = ref<string[]>([]);
const newClassSubjectSubjectId = ref("");
const newClassSubjectWeeklyPeriods = ref(1);
const newClassSubjectClassIds = ref<string[]>([]);
const newFixedClassId = ref("");
const newFixedSubjectId = ref("");
const newFixedDay = ref(0);
const newFixedPeriod = ref(1);
const newMassSubjectId = ref("");
const newMassDay = ref(0);
const newMassPeriod = ref(1);
const newMassClassIds = ref<string[]>([]);
const isAddingFixed = ref(false);
const isAddingMass = ref(false);

const classSearch = ref("");
const teacherSearch = ref("");
const teacherPickerSearch = ref("");
const teacherCoverageTeacherSearch = ref("");
const subjectSearch = ref("");
const essentialSubjectSearch = ref("");
const teacherCoverageSubjectSearch = ref("");
const teacherCoverageClassSearch = ref("");
const classGroupSearch = ref("");
const allocationGradeFilter = ref("");
const allocationClassFilter = ref("");
const allocationSubjectFilter = ref("");
const allocationTeacherFilter = ref("");
const allocationGroupBy = ref<"grade" | "class" | "subject" | "teacher">("grade");
const fixedClassSearch = ref("");
const fixedSubjectSearch = ref("");
const massSubjectSearch = ref("");
const massClassSearch = ref("");
const lockGradeFilter = ref("");
const lockSubjectFilter = ref("");
const lockDayFilter = ref("all");
const timetableSearch = ref("");
const collapsedCoverageSubjectIds = ref<string[]>([]);

const dayOptions = [
  { label: "Monday", short: "Mon", index: 0, periods: 8 },
  { label: "Tuesday", short: "Tue", index: 1, periods: 8 },
  { label: "Wednesday", short: "Wed", index: 2, periods: 8 },
  { label: "Thursday", short: "Thu", index: 3, periods: 8 },
  { label: "Friday", short: "Fri", index: 4, periods: 8 },
  { label: "Saturday", short: "Sat", index: 5, periods: 5 },
];

const normalize = (value: string) => value.trim().toLowerCase();
const compare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

const parseClass = (name: string) => {
  const match = name.trim().match(/^(\d+)/);
  const grade = match ? Number(match[1]) : null;
  const rest = match ? name.trim().slice(match[0].length).trim() : name.trim();
  return {
    grade,
    sortKey:
      grade === null
        ? `z-${name.toLowerCase()}`
        : `${String(grade).padStart(2, "0")}-${rest.toLowerCase()}`,
  };
};

const teacherById = computed(
  () => new Map((data.value?.teachers ?? []).map((teacher) => [teacher._id, teacher])),
);

const sortedClasses = computed<ClassMeta[]>(() =>
  [...(data.value?.classes ?? [])]
    .map((klass) => {
      const meta = parseClass(klass.name);
      return {
        _id: klass._id,
        name: klass.name,
        grade: meta.grade,
        sortKey: meta.sortKey,
      };
    })
    .sort((a, b) => compare(a.sortKey, b.sortKey)),
);

const sortedTeachers = computed(() =>
  [...(data.value?.teachers ?? [])].sort((a, b) => compare(a.name, b.name)),
);

const subjectTeacherAssignmentsBySubject = computed(() => {
  const map = new Map<
    string,
    Array<{
      _id: string;
      subjectId: string;
      teacherId: string;
      classIds: string[];
    }>
  >();

  (data.value?.subjectTeacherAssignments ?? []).forEach((assignment) => {
    if (!map.has(assignment.subjectId)) {
      map.set(assignment.subjectId, []);
    }
    map.get(assignment.subjectId)?.push(assignment);
  });

  return map;
});

const subjectMeta = computed(() => {
  const map = new Map<
    string,
    {
      label: string;
      teacherName: string;
      classCount: number;
      weeklyPeriods: number;
      assignmentCount: number;
    }
  >();
  const classCount = new Map<string, Set<string>>();

  (data.value?.classSubjects ?? []).forEach((item) => {
    if (!classCount.has(item.subjectId)) classCount.set(item.subjectId, new Set());
    classCount.get(item.subjectId)?.add(item.classId);
  });

  (data.value?.subjects ?? []).forEach((subject) => {
    const teacherName = teacherById.value.get(subject.teacherId)?.name ?? "Unassigned";
    const assignmentCount =
      subjectTeacherAssignmentsBySubject.value.get(subject._id)?.length ?? 0;
    map.set(subject._id, {
      label:
        assignmentCount > 0
          ? `${subject.name} · ${assignmentCount} teacher group${
              assignmentCount === 1 ? "" : "s"
            }`
          : subject.name,
      teacherName,
      classCount: classCount.get(subject._id)?.size ?? 0,
      weeklyPeriods: 0,
      assignmentCount,
    });
  });

  (data.value?.classSubjects ?? []).forEach((item) => {
    const entry = map.get(item.subjectId);
    if (entry) entry.weeklyPeriods += item.weeklyPeriods;
  });

  return map;
});
const sortedSubjects = computed(() =>
  [...(data.value?.subjects ?? [])].sort((a, b) =>
    compare(subjectMeta.value.get(a._id)?.label ?? a.name, subjectMeta.value.get(b._id)?.label ?? b.name),
  ),
);

const groupedSubjects = computed(() => {
  const groups = new Map<string, { name: string; items: typeof sortedSubjects.value }>();
  sortedSubjects.value.forEach((subject) => {
    const key = normalize(subject.name);
    if (!groups.has(key)) groups.set(key, { name: subject.name, items: [] });
    groups.get(key)?.items.push(subject);
  });

  const term = normalize(subjectSearch.value);
  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: group.items.filter((subject) => {
        const meta = subjectMeta.value.get(subject._id);
        return (
          !term ||
          normalize(group.name).includes(term) ||
          normalize(meta?.teacherName ?? "").includes(term) ||
          normalize(meta?.label ?? "").includes(term)
        );
      }),
    }))
    .filter((group) => group.items.length > 0);
});

const teacherAssignmentsForSubject = (subjectId: string) =>
  subjectTeacherAssignmentsBySubject.value.get(subjectId) ?? [];

const groupedClasses = computed(() => {
  const groups = new Map<string, { label: string; classes: ClassMeta[] }>();
  sortedClasses.value.forEach((klass) => {
    const key = klass.grade === null ? "other" : `grade-${klass.grade}`;
    const label = klass.grade === null ? "Unsorted" : `Grade ${klass.grade}`;
    if (!groups.has(key)) groups.set(key, { label, classes: [] });
    groups.get(key)?.classes.push(klass);
  });
  return [...groups.values()];
});

const filterClassGroups = (search: string) => {
  const term = normalize(search);
  return groupedClasses.value
    .map((group) => ({
      ...group,
      classes: group.classes.filter(
        (klass) =>
          !term ||
          normalize(klass.name).includes(term) ||
          normalize(group.label).includes(term),
      ),
    }))
    .filter((group) => group.classes.length > 0);
};

const classList = computed(() =>
  sortedClasses.value.filter((klass) =>
    !normalize(classSearch.value) || normalize(klass.name).includes(normalize(classSearch.value)),
  ),
);

const teacherList = computed(() =>
  sortedTeachers.value.filter((teacher) =>
    !normalize(teacherSearch.value) || normalize(teacher.name).includes(normalize(teacherSearch.value)),
  ),
);

const teacherOptions = computed(() =>
  sortedTeachers.value.filter((teacher) =>
    !normalize(teacherPickerSearch.value) ||
    normalize(teacher.name).includes(normalize(teacherPickerSearch.value)),
  ),
);

const teacherCoverageOptions = computed(() =>
  sortedTeachers.value.filter((teacher) =>
    !normalize(teacherCoverageTeacherSearch.value) ||
    normalize(teacher.name).includes(normalize(teacherCoverageTeacherSearch.value)),
  ),
);

const filterSubjects = (search: string) =>
  sortedSubjects.value.filter((subject) => {
    const meta = subjectMeta.value.get(subject._id);
    const term = normalize(search);
    return (
      !term ||
      normalize(subject.name).includes(term) ||
      normalize(meta?.teacherName ?? "").includes(term) ||
      normalize(meta?.label ?? "").includes(term)
    );
  });

const className = (id: string) =>
  sortedClasses.value.find((klass) => klass._id === id)?.name ?? "Unknown";

const subjectLabel = (id: string) => subjectMeta.value.get(id)?.label ?? "Unknown subject";

const subjectTitle = (id: string) =>
  sortedSubjects.value.find((subject) => subject._id === id)?.name ?? "Unknown subject";

const coverageCollapsed = (subjectId: string) =>
  collapsedCoverageSubjectIds.value.includes(subjectId);

const toggleCoverageCollapse = (subjectId: string) => {
  collapsedCoverageSubjectIds.value = collapsedCoverageSubjectIds.value.includes(subjectId)
    ? collapsedCoverageSubjectIds.value.filter((id) => id !== subjectId)
    : [...collapsedCoverageSubjectIds.value, subjectId];
};

const classGradeLabel = (classId: string) => {
  const klass = sortedClasses.value.find((item) => item._id === classId);
  if (!klass) return "Unknown grade";
  return klass.grade === null ? "Unsorted" : `Grade ${klass.grade}`;
};

const teacherLabelForSubjectClass = (subjectId: string, classId: string) => {
  const matches = teacherAssignmentsForSubject(subjectId).filter((assignment) =>
    assignment.classIds.includes(classId),
  );

  if (matches.length > 0) {
    return matches
      .map((assignment) => teacherById.value.get(assignment.teacherId)?.name ?? "Unknown")
      .join(", ");
  }

  const fallbackTeacherId = sortedSubjects.value.find(
    (subject) => subject._id === subjectId,
  )?.teacherId;

  return fallbackTeacherId
    ? teacherById.value.get(fallbackTeacherId)?.name ?? "Unassigned"
    : "No teacher coverage";
};

const teacherLabelForMassAssignment = (subjectId: string, classIds: string[]) => {
  const labels = [
    ...new Set(classIds.map((classId) => teacherLabelForSubjectClass(subjectId, classId))),
  ];
  return labels.join(", ");
};

const toggleIdInList = (current: string[], id: string) =>
  current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];

const toggleGroupInList = (current: string[], ids: string[]) => {
  const allSelected = ids.every((id) => current.includes(id));
  return allSelected
    ? current.filter((id) => !ids.includes(id))
    : [...new Set([...current, ...ids])];
};

const toggleCoverageClass = (id: string) => {
  newSubjectTeacherClassIds.value = toggleIdInList(newSubjectTeacherClassIds.value, id);
};

const toggleCoverageGrade = (ids: string[]) => {
  newSubjectTeacherClassIds.value = toggleGroupInList(newSubjectTeacherClassIds.value, ids);
};

const toggleMassClass = (id: string) => {
  newMassClassIds.value = toggleIdInList(newMassClassIds.value, id);
};

const toggleMassGrade = (ids: string[]) => {
  newMassClassIds.value = toggleGroupInList(newMassClassIds.value, ids);
};

const toggleEssentialClass = (id: string) => {
  newClassSubjectClassIds.value = toggleIdInList(newClassSubjectClassIds.value, id);
};

const toggleEssentialGrade = (ids: string[]) => {
  newClassSubjectClassIds.value = toggleGroupInList(newClassSubjectClassIds.value, ids);
};

const addClass = async () => {
  if (!newClassName.value.trim()) return;
  await createClass.mutate({ name: newClassName.value.trim() });
  newClassName.value = "";
};

const addTeacher = async () => {
  if (!newTeacherName.value.trim()) return;
  await createTeacher.mutate({ name: newTeacherName.value.trim() });
  newTeacherName.value = "";
};

const addSubject = async () => {
  if (!newSubjectName.value.trim()) return;
  await createSubject.mutate({
    name: newSubjectName.value.trim(),
    teacherId: newSubjectTeacherId.value || undefined,
  });
  newSubjectName.value = "";
  newSubjectTeacherId.value = "";
};

const addSubjectTeacherCoverage = async () => {
  if (
    !newSubjectTeacherSubjectId.value ||
    !newSubjectTeacherTeacherId.value ||
    newSubjectTeacherClassIds.value.length === 0
  ) {
    return;
  }

  await createSubjectTeacherAssignment.mutate({
    subjectId: newSubjectTeacherSubjectId.value,
    teacherId: newSubjectTeacherTeacherId.value,
    classIds: newSubjectTeacherClassIds.value,
  });

  newSubjectTeacherSubjectId.value = "";
  newSubjectTeacherTeacherId.value = "";
  newSubjectTeacherClassIds.value = [];
};

const addClassSubject = async () => {
  if (!newClassSubjectSubjectId.value || newClassSubjectClassIds.value.length === 0) return;
  await Promise.all(
    newClassSubjectClassIds.value.map((classId) =>
      createClassSubject.mutate({
        classId,
        subjectId: newClassSubjectSubjectId.value,
        weeklyPeriods: Number(newClassSubjectWeeklyPeriods.value) || 1,
      }),
    ),
  );
  newClassSubjectClassIds.value = [];
  newClassSubjectWeeklyPeriods.value = 1;
};

const addFixed = async () => {
  if (!newFixedClassId.value || !newFixedSubjectId.value) return;
  isAddingFixed.value = true;
  try {
    await createFixedPeriod.mutate({
      classId: newFixedClassId.value,
      subjectId: newFixedSubjectId.value,
      day: Number(newFixedDay.value),
      period: Number(newFixedPeriod.value),
    });
  } finally {
    isAddingFixed.value = false;
  }
};

const addMass = async () => {
  if (!newMassSubjectId.value || newMassClassIds.value.length === 0) return;
  isAddingMass.value = true;
  try {
    await createMassAssignment.mutate({
      subjectId: newMassSubjectId.value,
      classIds: newMassClassIds.value,
      day: Number(newMassDay.value),
      period: Number(newMassPeriod.value),
    });
    newMassClassIds.value = [];
  } finally {
    isAddingMass.value = false;
  }
};

const filteredEssentialAllocations = computed(() => {
  const gradeTerm = normalize(allocationGradeFilter.value);
  const classTerm = normalize(allocationClassFilter.value);
  const subjectTerm = normalize(allocationSubjectFilter.value);
  const teacherTerm = normalize(allocationTeacherFilter.value);

  return (data.value?.classSubjects ?? [])
    .map((allocation) => ({
      ...allocation,
      className: className(allocation.classId),
      gradeLabel: classGradeLabel(allocation.classId),
      subjectName: subjectTitle(allocation.subjectId),
      teacherName: teacherLabelForSubjectClass(allocation.subjectId, allocation.classId),
    }))
    .filter((allocation) => {
      return (
        (!gradeTerm || normalize(allocation.gradeLabel).includes(gradeTerm)) &&
        (!classTerm || normalize(allocation.className).includes(classTerm)) &&
        (!subjectTerm || normalize(allocation.subjectName).includes(subjectTerm)) &&
        (!teacherTerm || normalize(allocation.teacherName).includes(teacherTerm))
      );
    });
});

const groupedEssentialAllocations = computed(() => {
  const groups = new Map<string, typeof filteredEssentialAllocations.value>();

  filteredEssentialAllocations.value.forEach((allocation) => {
    const key =
      allocationGroupBy.value === "grade"
        ? allocation.gradeLabel
        : allocationGroupBy.value === "class"
          ? allocation.className
          : allocationGroupBy.value === "subject"
            ? allocation.subjectName
            : allocation.teacherName;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)?.push(allocation);
  });

  return [...groups.entries()]
    .map(([label, items]) => ({
      label,
      items: [...items].sort((left, right) => {
        if (allocationGroupBy.value === "class") {
          return compare(left.subjectName, right.subjectName);
        }
        return compare(left.className, right.className);
      }),
    }))
    .sort((left, right) => compare(left.label, right.label));
});

const filteredFixedLocks = computed(() => {
  const gradeTerm = normalize(lockGradeFilter.value);
  const subjectTerm = normalize(lockSubjectFilter.value);
  const dayFilter = lockDayFilter.value;
  return (data.value?.fixedPeriods ?? []).filter((fixed) => {
    const gradeLabel = classGradeLabel(fixed.classId);
    const subjectName = subjectTitle(fixed.subjectId);
    const dayLabel = String(fixed.day);
    return (
      (!gradeTerm || normalize(gradeLabel).includes(gradeTerm)) &&
      (!subjectTerm || normalize(subjectName).includes(subjectTerm)) &&
      (dayFilter === "all" || dayLabel === dayFilter)
    );
  });
});

const filteredMassLocks = computed(() => {
  const gradeTerm = normalize(lockGradeFilter.value);
  const subjectTerm = normalize(lockSubjectFilter.value);
  const dayFilter = lockDayFilter.value;
  return (data.value?.massAssignments ?? []).filter((mass) => {
    const subjectName = subjectTitle(mass.subjectId);
    const gradeLabels = [...new Set(mass.classIds.map((id) => classGradeLabel(id)))].join(" ");
    const dayLabel = String(mass.day);
    return (
      (!gradeTerm || normalize(gradeLabels).includes(gradeTerm)) &&
      (!subjectTerm || normalize(subjectName).includes(subjectTerm)) &&
      (dayFilter === "all" || dayLabel === dayFilter)
    );
  });
});

const timetable = computed(() => {
  if (!data.value) return { classSchedules: [], warnings: [] as WarningItem[] };

  const subjectById = new Map(data.value.subjects.map((subject) => [subject._id, subject]));
  const teacherMap = new Map(data.value.teachers.map((teacher) => [teacher._id, teacher]));
  const assignmentBySubject = new Map(
    (data.value.subjectTeacherAssignments ?? []).reduce<
      Array<[string, Array<{ teacherId: string; classIds: string[] }>]>
    >((entries, assignment) => {
      const existing = entries.find(([subjectId]) => subjectId === assignment.subjectId);
      if (existing) {
        existing[1].push({
          teacherId: assignment.teacherId,
          classIds: assignment.classIds,
        });
      } else {
        entries.push([
          assignment.subjectId,
          [{ teacherId: assignment.teacherId, classIds: assignment.classIds }],
        ]);
      }
      return entries;
    }, []),
  );
  const teacherUsage: Record<number, Record<number, Set<string>>> = {};
  const remaining: Record<string, Record<string, number>> = {};
  const warnings: WarningItem[] = [];
  const teacherWarningKeys = new Set<string>();

  const initTeacherUsage = (day: number, period: number) => {
    if (!teacherUsage[day]) teacherUsage[day] = {};
    if (!teacherUsage[day][period]) teacherUsage[day][period] = new Set();
  };

  const classSchedules = [...sortedClasses.value].map((klass) => ({
    classId: klass._id,
    className: klass.name,
    grid: dayOptions.map((day) =>
      Array.from({ length: day.periods + 1 }, () => null as null | {
        subjectName: string;
        teacherName: string;
        locked: boolean;
      }),
    ),
  }));

  data.value.classSubjects.forEach((item) => {
    if (!remaining[item.classId]) remaining[item.classId] = {};
    remaining[item.classId][item.subjectId] = (remaining[item.classId][item.subjectId] || 0) + item.weeklyPeriods;
  });

  const resolveTeacherForClassSubject = (subjectId: string, classId: string) => {
    const subject = subjectById.get(subjectId);
    const matches =
      assignmentBySubject
        .get(subjectId)
        ?.filter((assignment) => assignment.classIds.includes(classId)) ?? [];

    if (matches.length > 1) {
      const key = `${subjectId}-${classId}-multiple`;
      if (!teacherWarningKeys.has(key)) {
        teacherWarningKeys.add(key);
        warnings.push({
          id: key,
          message: `Multiple teacher mappings found for ${subject?.name ?? "subject"} in ${className(classId)}.`,
        });
      }
    }

    if (matches[0]?.teacherId) {
      return matches[0].teacherId;
    }

    if (subject?.teacherId) {
      return subject.teacherId;
    }

    const key = `${subjectId}-${classId}-missing`;
    if (!teacherWarningKeys.has(key)) {
      teacherWarningKeys.add(key);
      warnings.push({
        id: key,
        message: `No teacher mapping set for ${subject?.name ?? "subject"} in ${className(classId)}.`,
      });
    }

    return undefined;
  };

  const place = (
    classId: string,
    day: number,
    period: number,
    subjectId: string,
    locked: boolean,
    action?: WarningItem["action"],
  ) => {
    const schedule = classSchedules.find((item) => item.classId === classId);
    const subject = subjectById.get(subjectId);
    if (!schedule || !subject || !schedule.grid[day] || period >= schedule.grid[day].length) return;
    const teacherId = resolveTeacherForClassSubject(subjectId, classId);
    const teacherName = teacherMap.get(teacherId)?.name ?? "Unassigned";

    if (schedule.grid[day][period]) {
      warnings.push({
        id: `${classId}-${day}-${period}-slot`,
        message: `Slot conflict for ${schedule.className} on day ${day + 1} period ${period}.`,
        action,
      });
      return;
    }

    initTeacherUsage(day, period);
    if (teacherId && teacherUsage[day][period].has(teacherId) && action?.type !== "mass") {
      warnings.push({
        id: `${teacherId}-${day}-${period}`,
        message: `Teacher conflict for ${teacherName} on day ${day + 1} period ${period}.`,
        action,
      });
      return;
    }

    schedule.grid[day][period] = { subjectName: subject.name, teacherName, locked };
    if (teacherId) {
      teacherUsage[day][period].add(teacherId);
    }
  };
  data.value.fixedPeriods.forEach((fixed) => {
    place(fixed.classId, fixed.day, fixed.period, fixed.subjectId, true, {
      type: "fixed",
      id: fixed._id,
    });
    if (remaining[fixed.classId]?.[fixed.subjectId]) remaining[fixed.classId][fixed.subjectId] -= 1;
  });

  data.value.massAssignments.forEach((mass) => {
    mass.classIds.forEach((classId) => {
      place(classId, mass.day, mass.period, mass.subjectId, true, {
        type: "mass",
        id: mass._id,
      });
      if (remaining[classId]?.[mass.subjectId]) remaining[classId][mass.subjectId] -= 1;
    });
  });

  classSchedules.forEach((schedule) => {
    const classRemaining = remaining[schedule.classId] ?? {};
    const subjectIds = Object.keys(classRemaining);
    dayOptions.forEach((day, dayIndex) => {
      const usedToday = new Set<string>();
      for (let period = 1; period <= day.periods; period += 1) {
        if (schedule.grid[dayIndex][period]) continue;
        const candidates = subjectIds.filter((subjectId) => {
          if ((classRemaining[subjectId] || 0) <= 0) return false;
          const teacherId = resolveTeacherForClassSubject(subjectId, schedule.classId);
          if (!teacherId) return true;
          initTeacherUsage(dayIndex, period);
          return !teacherUsage[dayIndex][period].has(teacherId);
        });
        const choice =
          candidates.find((subjectId) => !usedToday.has(subjectId)) ?? candidates[0];
        if (!choice) {
          warnings.push({
            id: `${schedule.classId}-${dayIndex}-${period}-unfilled`,
            message: `Unfilled slot for ${schedule.className} on day ${dayIndex + 1} period ${period}.`,
          });
          continue;
        }
        const subject = subjectById.get(choice);
        if (!subject) continue;
        schedule.grid[dayIndex][period] = {
          subjectName: subject.name,
          teacherName:
            teacherMap.get(resolveTeacherForClassSubject(choice, schedule.classId))?.name ??
            "Unassigned",
          locked: false,
        };
        classRemaining[choice] -= 1;
        usedToday.add(choice);
        const teacherId = resolveTeacherForClassSubject(choice, schedule.classId);
        if (teacherId) {
          teacherUsage[dayIndex][period].add(teacherId);
        }
      }
    });
  });

  Object.entries(remaining).forEach(([classId, subjectCounts]) => {
    Object.entries(subjectCounts).forEach(([subjectId, count]) => {
      if (count > 0) {
        warnings.push({
          id: `${classId}-${subjectId}-remaining`,
          message: `Remaining ${count} periods for ${subjectById.get(subjectId)?.name ?? "Unknown"} in ${className(classId)}.`,
        });
      }
    });
  });

  return { classSchedules, warnings };
});

const visibleSchedules = computed(() =>
  timetable.value.classSchedules.filter(
    (schedule) =>
      !normalize(timetableSearch.value) ||
      normalize(schedule.className).includes(normalize(timetableSearch.value)),
  ),
);

const resolveWarning = async (warning: WarningItem) => {
  if (!warning.action?.id) return;
  if (warning.action.type === "fixed") {
    await removeFixedPeriod.mutate({ id: warning.action.id });
  }
  if (warning.action.type === "mass") {
    await removeMassAssignment.mutate({ id: warning.action.id });
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#fff4ee] text-[#5a2d1a]">
    <header class="border-b border-[#f0cdbb] bg-[#fff0e7]">
      <div class="mx-auto max-w-7xl px-6 py-6">
        <p class="text-sm uppercase tracking-[0.22em] text-[#a26045]">Planner-first</p>
        <h1 class="mt-1 text-3xl font-semibold">KALS Timetable Generator</h1>
        <p class="mt-2 max-w-3xl text-[#8a4b32]">
          This layout is optimized for your actual flow: organize subjects and teacher coverage,
          lock non-essential subjects first, then allocate essential subjects by grade.
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <section class="grid gap-4 md:grid-cols-4">
        <div class="rounded-2xl border border-[#f0cdbb] bg-[#ffe7dc] p-4">
          <p class="text-sm text-[#8a4b32]">Classes</p>
          <p class="mt-1 text-2xl font-semibold">{{ data?.classes.length ?? 0 }}</p>
        </div>
        <div class="rounded-2xl border border-[#f0cdbb] bg-[#ffe7dc] p-4">
          <p class="text-sm text-[#8a4b32]">Teachers</p>
          <p class="mt-1 text-2xl font-semibold">{{ data?.teachers.length ?? 0 }}</p>
        </div>
        <div class="rounded-2xl border border-[#f0cdbb] bg-[#ffe7dc] p-4">
          <p class="text-sm text-[#8a4b32]">Subjects</p>
          <p class="mt-1 text-2xl font-semibold">{{ data?.subjects.length ?? 0 }}</p>
        </div>
        <div class="rounded-2xl border border-[#f0cdbb] bg-[#ffe7dc] p-4">
          <p class="text-sm text-[#8a4b32]">Warnings</p>
          <p class="mt-1 text-2xl font-semibold">{{ timetable.warnings.length }}</p>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div class="space-y-6">
          <div class="rounded-3xl border border-[#f0cdbb] bg-[#ffe7dc] p-5">
            <h2 class="text-xl font-semibold">Classes and teachers</h2>
            <div class="mt-4 grid gap-5 lg:grid-cols-2">
              <div>
                <div class="flex gap-2">
                  <input v-model="newClassName" placeholder="Add class" class="flex-1 rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
                  <button @click="addClass" class="rounded-xl bg-[#d17c5a] px-4 text-white">Add</button>
                </div>
                <input v-model="classSearch" placeholder="Filter classes" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
                <ul class="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  <li v-for="klass in classList" :key="klass._id" class="flex items-center justify-between rounded-xl border border-[#f0cdbb] bg-white px-4 py-3">
                    <span>{{ klass.name }}</span>
                    <button @click="removeClass.mutate({ id: klass._id })" class="text-sm text-[#b96547]">Delete</button>
                  </li>
                </ul>
              </div>
              <div>
                <div class="flex gap-2">
                  <input v-model="newTeacherName" placeholder="Add teacher" class="flex-1 rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
                  <button @click="addTeacher" class="rounded-xl bg-[#d17c5a] px-4 text-white">Add</button>
                </div>
                <input v-model="teacherSearch" placeholder="Filter teachers" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
                <ul class="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  <li v-for="teacher in teacherList" :key="teacher._id" class="flex items-center justify-between rounded-xl border border-[#f0cdbb] bg-white px-4 py-3">
                    <span>{{ teacher.name }}</span>
                    <button @click="removeTeacher.mutate({ id: teacher._id })" class="text-sm text-[#b96547]">Delete</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-[#f0cdbb] bg-[#ffe7dc] p-5">
            <h2 class="text-xl font-semibold">Subject catalogue</h2>
            <p class="mt-1 text-sm text-[#8a4b32]">
              Subjects are created once. Teacher coverage is assigned separately per class group so one subject can have many teachers.
            </p>
            <div class="mt-4 grid gap-3">
              <input v-model="newSubjectName" placeholder="Subject name" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
              <input v-model="teacherPickerSearch" placeholder="Optional fallback teacher search" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
              <select v-model="newSubjectTeacherId" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3">
                <option value="">Optional fallback teacher</option>
                <option v-for="teacher in teacherOptions" :key="teacher._id" :value="teacher._id">{{ teacher.name }}</option>
              </select>
              <button @click="addSubject" class="rounded-xl bg-[#d17c5a] px-4 py-3 text-white">Add subject</button>
            </div>

            <div class="mt-4 rounded-2xl border border-[#f0cdbb] bg-white p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold">Teacher coverage for a subject</h3>
                  <p class="mt-1 text-xs text-[#8a4b32]">
                    Quick flow: 1. Pick subject 2. Pick teacher 3. Pick classes 4. Save coverage.
                  </p>
                </div>
                <div class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-3 py-2 text-xs text-[#8a4b32]">
                  {{ newSubjectTeacherClassIds.length }} classes selected
                </div>
              </div>
              <p class="mt-3 text-xs text-[#8a4b32]">
                Example: ENG I -> BMK for Grades 2-3, KAA for Grade 4, CNM for Grades 9-12.
              </p>
              <input v-model="teacherCoverageSubjectSearch" placeholder="Filter subjects" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
              <select v-model="newSubjectTeacherSubjectId" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                <option value="">Select subject</option>
                <option v-for="subject in filterSubjects(teacherCoverageSubjectSearch)" :key="subject._id" :value="subject._id">{{ subjectTitle(subject._id) }}</option>
              </select>
              <p class="text-xs text-[#8a4b32]">Pick the base subject once. You do not need to create the subject again for each teacher.</p>
              <input v-model="teacherCoverageTeacherSearch" placeholder="Filter teachers" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
              <select v-model="newSubjectTeacherTeacherId" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                <option value="">Select teacher</option>
                <option v-for="teacher in teacherCoverageOptions" :key="teacher._id" :value="teacher._id">{{ teacher.name }}</option>
              </select>
              <p class="text-xs text-[#8a4b32]">Then choose the teacher who handles that subject for the classes below.</p>
              <input v-model="teacherCoverageClassSearch" placeholder="Filter classes or grade" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
              <div class="mt-3 max-h-56 space-y-3 overflow-y-auto">
                <div v-for="group in filterClassGroups(teacherCoverageClassSearch)" :key="`coverage-${group.label}`" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] p-3">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium">{{ group.label }}</p>
                    <button @click="toggleCoverageGrade(group.classes.map((klass) => klass._id))" class="text-xs text-[#b96547]">Toggle grade</button>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <button v-for="klass in group.classes" :key="klass._id" @click="toggleCoverageClass(klass._id)" class="rounded-full border px-3 py-1 text-sm" :class="newSubjectTeacherClassIds.includes(klass._id) ? 'border-[#d17c5a] bg-[#d17c5a] text-white' : 'border-[#f0cdbb] bg-white'">
                      {{ klass.name }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-dashed border-[#e5b6a1] bg-[#fff8f3] px-3 py-3 text-xs text-[#8a4b32]">
                Result:
                {{
                  newSubjectTeacherSubjectId && newSubjectTeacherTeacherId
                    ? `${subjectTitle(newSubjectTeacherSubjectId)} -> ${
                        teacherById.get(newSubjectTeacherTeacherId)?.name ?? "Teacher"
                      } for ${newSubjectTeacherClassIds.length} class${
                        newSubjectTeacherClassIds.length === 1 ? "" : "es"
                      }`
                    : "Choose a subject, a teacher, and one or more classes."
                }}
              </div>
              <button @click="addSubjectTeacherCoverage" class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white">Save teacher coverage</button>
            </div>

            <input v-model="subjectSearch" placeholder="Filter subject catalogue" class="mt-4 w-full rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <div class="mt-4 max-h-[32rem] space-y-3 overflow-y-auto">
              <div v-for="group in groupedSubjects" :key="group.name" class="rounded-2xl border border-[#f0cdbb] bg-white px-4 py-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold">{{ group.name }}</h3>
                  <span class="text-xs text-[#8a4b32]">{{ group.items.length }} subject{{ group.items.length === 1 ? '' : 's' }}</span>
                </div>
                <ul class="mt-3 space-y-2">
                  <li v-for="subject in group.items" :key="subject._id" class="flex items-center justify-between rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-3 py-3">
                    <div class="w-full">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="font-medium">{{ subjectTitle(subject._id) }}</p>
                          <p class="text-xs text-[#8a4b32]">{{ teacherAssignmentsForSubject(subject._id).length }} teacher groups · {{ subjectMeta.get(subject._id)?.classCount }} classes · {{ subjectMeta.get(subject._id)?.weeklyPeriods }} weekly periods</p>
                        </div>
                        <button @click="toggleCoverageCollapse(subject._id)" class="rounded-lg border border-[#f0cdbb] bg-white px-3 py-1 text-xs text-[#8a4b32]">
                          {{ coverageCollapsed(subject._id) ? "Expand" : "Collapse" }}
                        </button>
                      </div>
                      <div v-if="!coverageCollapsed(subject._id)" class="mt-2 space-y-1">
                        <p v-if="teacherAssignmentsForSubject(subject._id).length === 0" class="text-xs text-[#b07a63]">
                          No teacher coverage added yet
                        </p>
                        <div v-for="assignment in teacherAssignmentsForSubject(subject._id)" :key="assignment._id" class="flex items-center justify-between gap-3 rounded-lg border border-[#f0cdbb] bg-white px-3 py-2 text-xs">
                          <span>
                            {{ teacherById.get(assignment.teacherId)?.name ?? "Unknown" }} ->
                            {{ assignment.classIds.map((id) => className(id)).join(", ") }}
                          </span>
                          <button @click="removeSubjectTeacherAssignment.mutate({ id: assignment._id })" class="text-[#b96547]">Delete</button>
                        </div>
                      </div>
                      <p v-else class="mt-2 text-xs text-[#8a4b32]">
                        {{ teacherAssignmentsForSubject(subject._id).length }} teacher groups hidden
                      </p>
                    </div>
                    <button @click="removeSubject.mutate({ id: subject._id })" class="text-sm text-[#b96547]">Delete</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <div class="rounded-3xl border border-[#f0cdbb] bg-[#ffe7dc] p-5">
            <h2 class="text-xl font-semibold">Step 1: Lock non-essential subjects</h2>
            <p class="mt-1 text-sm text-[#8a4b32]">Use mass locks for school-wide periods and fixed locks for one class at one slot.</p>
            <div class="mt-5 grid gap-5 xl:grid-cols-2">
              <div class="rounded-2xl border border-[#f0cdbb] bg-white p-4">
                <h3 class="font-semibold">Mass lock</h3>
                <p class="mt-1 text-xs text-[#8a4b32]">Use this for assemblies, games, labs, swimming, or any subject that must happen at the same time across many classes.</p>
                <input v-model="massSubjectSearch" placeholder="Filter subjects" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                <select v-model="newMassSubjectId" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                  <option value="">Select subject</option>
                  <option v-for="subject in filterSubjects(massSubjectSearch)" :key="subject._id" :value="subject._id">{{ subjectLabel(subject._id) }}</option>
                </select>
                <div class="mt-3 grid grid-cols-2 gap-3">
                  <select v-model="newMassDay" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                    <option v-for="day in dayOptions" :key="day.index" :value="day.index">{{ day.label }}</option>
                  </select>
                  <input v-model="newMassPeriod" type="number" min="1" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                </div>
                <input v-model="massClassSearch" placeholder="Filter classes or grade" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                <div class="mt-3 max-h-56 space-y-3 overflow-y-auto">
                  <div v-for="group in filterClassGroups(massClassSearch)" :key="group.label" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] p-3">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium">{{ group.label }}</p>
                      <button @click="toggleMassGrade(group.classes.map((klass) => klass._id))" class="text-xs text-[#b96547]">Toggle grade</button>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <button v-for="klass in group.classes" :key="klass._id" @click="toggleMassClass(klass._id)" class="rounded-full border px-3 py-1 text-sm" :class="newMassClassIds.includes(klass._id) ? 'border-[#d17c5a] bg-[#d17c5a] text-white' : 'border-[#f0cdbb] bg-white'">
                        {{ klass.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <p class="mt-3 text-xs text-[#8a4b32]">{{ newMassClassIds.length }} classes selected for this lock.</p>
                <button @click="addMass" :disabled="isAddingMass" class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70">
                  {{ isAddingMass ? "Adding mass lock..." : "Add mass lock" }}
                </button>
              </div>

              <div class="rounded-2xl border border-[#f0cdbb] bg-white p-4">
                <h3 class="font-semibold">Fixed lock</h3>
                <input v-model="fixedClassSearch" placeholder="Filter classes" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                <select v-model="newFixedClassId" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                  <option value="">Select class</option>
                  <option v-for="klass in filterClassGroups(fixedClassSearch).flatMap((group) => group.classes)" :key="klass._id" :value="klass._id">{{ klass.name }}</option>
                </select>
                <input v-model="fixedSubjectSearch" placeholder="Filter subjects" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                <select v-model="newFixedSubjectId" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                  <option value="">Select subject</option>
                  <option v-for="subject in filterSubjects(fixedSubjectSearch)" :key="subject._id" :value="subject._id">{{ subjectLabel(subject._id) }}</option>
                </select>
                <div class="mt-3 grid grid-cols-2 gap-3">
                  <select v-model="newFixedDay" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                    <option v-for="day in dayOptions" :key="day.index" :value="day.index">{{ day.label }}</option>
                  </select>
                  <input v-model="newFixedPeriod" type="number" min="1" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                </div>
                <button @click="addFixed" :disabled="isAddingFixed" class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70">
                  {{ isAddingFixed ? "Adding fixed lock..." : "Add fixed lock" }}
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-[#f0cdbb] bg-[#ffe7dc] p-5">
            <h2 class="text-xl font-semibold">Step 2: Essential subject allocation</h2>
            <p class="mt-1 text-sm text-[#8a4b32]">Pick the subject, set weekly periods, then choose the classes. Teacher is resolved automatically from the teacher coverage you saved above.</p>
            <input v-model="essentialSubjectSearch" placeholder="Filter essential subjects" class="mt-4 w-full rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <select v-model="newClassSubjectSubjectId" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-white px-4 py-3">
              <option value="">Select subject</option>
              <option v-for="subject in filterSubjects(essentialSubjectSearch)" :key="subject._id" :value="subject._id">{{ subjectLabel(subject._id) }}</option>
            </select>
            <input v-model="newClassSubjectWeeklyPeriods" type="number" min="1" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <input v-model="classGroupSearch" placeholder="Filter classes or grade" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <div class="mt-3 max-h-72 space-y-3 overflow-y-auto">
              <div v-for="group in filterClassGroups(classGroupSearch)" :key="group.label" class="rounded-xl border border-[#f0cdbb] bg-white p-3">
                <div class="flex items-center justify-between">
                  <p class="font-medium">{{ group.label }}</p>
                  <button @click="toggleEssentialGrade(group.classes.map((klass) => klass._id))" class="text-xs text-[#b96547]">Toggle grade</button>
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button v-for="klass in group.classes" :key="klass._id" @click="toggleEssentialClass(klass._id)" class="rounded-full border px-3 py-1 text-sm" :class="newClassSubjectClassIds.includes(klass._id) ? 'border-[#d17c5a] bg-[#d17c5a] text-white' : 'border-[#f0cdbb] bg-[#fff8f3]'">
                    {{ klass.name }}
                  </button>
                </div>
              </div>
            </div>
            <div class="mt-3 rounded-xl border border-dashed border-[#e5b6a1] bg-white px-3 py-3 text-xs text-[#8a4b32]">
              {{ newClassSubjectClassIds.length }} classes selected. Add teacher coverage first if this subject has different teachers for different grades.
            </div>
            <button @click="addClassSubject" class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white">Add essential allocation</button>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div class="rounded-3xl border border-[#f0cdbb] bg-[#ffe7dc] p-5">
          <h2 class="text-xl font-semibold">Existing constraints</h2>
          <div class="mt-4 grid gap-3 md:grid-cols-3">
            <input v-model="lockGradeFilter" placeholder="Filter by grade" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <input v-model="lockSubjectFilter" placeholder="Filter by subject" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <select v-model="lockDayFilter" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3">
              <option value="all">All days</option>
              <option v-for="day in dayOptions" :key="`lock-filter-${day.index}`" :value="String(day.index)">
                {{ day.label }}
              </option>
            </select>
          </div>
          <div class="mt-4 grid gap-5 xl:grid-cols-2">
            <div>
              <h3 class="font-medium">Fixed locks</h3>
              <ul class="mt-3 max-h-72 space-y-2 overflow-y-auto">
                <li v-for="fixed in filteredFixedLocks" :key="fixed._id" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3">
                  <p class="font-medium">{{ className(fixed.classId) }}</p>
                  <p class="text-sm text-[#8a4b32]">{{ subjectTitle(fixed.subjectId) }}</p>
                  <p class="mt-1 text-xs text-[#8a4b32]">{{ teacherLabelForSubjectClass(fixed.subjectId, fixed.classId) }}</p>
                  <div class="mt-2 flex items-center justify-between text-xs text-[#8a4b32]">
                    <span>{{ dayOptions[fixed.day]?.short }} · Period {{ fixed.period }}</span>
                    <button @click="removeFixedPeriod.mutate({ id: fixed._id })" class="text-[#b96547]">Delete</button>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="font-medium">Mass locks</h3>
              <ul class="mt-3 max-h-72 space-y-2 overflow-y-auto">
                <li v-for="mass in filteredMassLocks" :key="mass._id" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3">
                  <p class="font-medium">{{ subjectTitle(mass.subjectId) }}</p>
                  <p class="text-sm text-[#8a4b32]">{{ dayOptions[mass.day]?.short }} · Period {{ mass.period }}</p>
                  <p class="mt-1 text-xs text-[#8a4b32]">{{ teacherLabelForMassAssignment(mass.subjectId, mass.classIds) }}</p>
                  <p class="mt-1 text-xs text-[#8a4b32]">{{ mass.classIds.map((id) => className(id)).join(', ') }}</p>
                  <button @click="removeMassAssignment.mutate({ id: mass._id })" class="mt-2 text-xs text-[#b96547]">Delete</button>
                </li>
              </ul>
            </div>
          </div>
          <div class="mt-5 flex items-center justify-between gap-3">
            <div>
              <h3 class="font-medium">Essential allocations</h3>
              <p class="mt-1 text-xs text-[#8a4b32]">
                Filter by grade, class, subject, or teacher, then switch the grouping to inspect the same data faster.
              </p>
            </div>
            <div class="rounded-xl border border-[#f0cdbb] bg-white px-3 py-2 text-xs text-[#8a4b32]">
              {{ filteredEssentialAllocations.length }} matching allocations
            </div>
          </div>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <input v-model="allocationGradeFilter" placeholder="Filter by grade" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <input v-model="allocationClassFilter" placeholder="Filter by class" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <input v-model="allocationSubjectFilter" placeholder="Filter by subject" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
            <input v-model="allocationTeacherFilter" placeholder="Filter by teacher" class="rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
          </div>
          <div class="mt-3 rounded-xl border border-[#f0cdbb] bg-white p-3">
            <label class="block text-xs text-[#8a4b32]">Group allocations by</label>
            <select v-model="allocationGroupBy" class="mt-2 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
              <option value="grade">Grade</option>
              <option value="class">Class</option>
              <option value="subject">Subject</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div class="mt-3 max-h-80 space-y-3 overflow-y-auto">
            <div v-for="group in groupedEssentialAllocations" :key="group.label" class="rounded-xl border border-[#f0cdbb] bg-white p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">{{ group.label }}</p>
                <span class="text-xs text-[#8a4b32]">{{ group.items.length }} allocation{{ group.items.length === 1 ? "" : "s" }}</span>
              </div>
              <ul class="mt-3 space-y-2">
                <li v-for="allocation in group.items" :key="allocation._id" class="flex items-center justify-between rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                  <div>
                    <p class="font-medium">{{ allocation.className }}</p>
                    <p class="text-sm text-[#8a4b32]">
                      {{ allocation.subjectName }} · {{ allocation.teacherName }} ·
                      {{ allocation.weeklyPeriods }}/week
                    </p>
                    <p class="text-xs text-[#8a4b32]">{{ allocation.gradeLabel }}</p>
                  </div>
                  <button @click="removeClassSubject.mutate({ id: allocation._id })" class="text-sm text-[#b96547]">Delete</button>
                </li>
              </ul>
            </div>
            <div v-if="groupedEssentialAllocations.length === 0" class="rounded-xl border border-dashed border-[#d9b3a0] bg-white px-4 py-8 text-center text-sm text-[#8a4b32]">
              No essential allocations match the current filters.
            </div>
          </div>
        </div>
        <div class="rounded-3xl border border-[#f0cdbb] bg-[#ffe7dc] p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">Generated timetable</h2>
              <p class="mt-1 text-sm text-[#8a4b32]">Filter to a class when the full-school view becomes noisy.</p>
            </div>
            <input v-model="timetableSearch" placeholder="Filter by class" class="w-full max-w-xs rounded-xl border border-[#f0cdbb] bg-white px-4 py-3" />
          </div>

          <div v-if="timetable.warnings.length" class="mt-4 rounded-2xl border border-[#f0cdbb] bg-white p-4">
            <div class="flex items-center justify-between">
              <h3 class="font-medium">Warnings</h3>
              <span class="text-xs text-[#8a4b32]">{{ timetable.warnings.length }}</span>
            </div>
            <ul class="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm">
              <li v-for="warning in timetable.warnings" :key="warning.id" class="flex items-center justify-between gap-3 rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-3 py-3">
                <span>{{ warning.message }}</span>
                <button v-if="warning.action?.id" @click="resolveWarning(warning)" class="text-xs text-[#b96547]">Resolve</button>
              </li>
            </ul>
          </div>

          <div class="mt-4 space-y-5">
            <div v-for="schedule in visibleSchedules" :key="schedule.classId" class="rounded-2xl border border-[#f0cdbb] bg-white p-4">
              <h3 class="font-semibold">Class {{ schedule.className }}</h3>
              <div class="mt-3 overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="text-left text-[#8a4b32]">
                      <th class="px-3 py-2">Day</th>
                      <th v-for="period in 8" :key="period" class="px-3 py-2">P{{ period }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="day in dayOptions" :key="day.index" class="border-t border-[#f0cdbb]">
                      <td class="px-3 py-3 font-medium text-[#8a4b32]">{{ day.short }}</td>
                      <td v-for="period in 8" :key="period" class="px-3 py-3 align-top">
                        <template v-if="period <= day.periods">
                          <div v-if="schedule.grid[day.index][period]" class="rounded-xl border px-3 py-2" :class="schedule.grid[day.index][period]?.locked ? 'border-[#d17c5a] bg-[#ffd9c7]' : 'border-[#f0cdbb] bg-[#fff8f3]'">
                            <p class="font-medium">{{ schedule.grid[day.index][period]?.subjectName }}</p>
                            <p class="text-xs text-[#8a4b32]">{{ schedule.grid[day.index][period]?.teacherName }}</p>
                          </div>
                          <div v-else class="italic text-[#b07a63]">Unfilled</div>
                        </template>
                        <div v-else class="italic text-[#d6a08a]">-</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="visibleSchedules.length === 0" class="rounded-2xl border border-dashed border-[#d9b3a0] bg-white px-4 py-8 text-center text-[#8a4b32]">
              No classes match the current filter.
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

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
const newFixedSubjectIds = ref<string[]>([]);
const newFixedDay = ref(0);
const newFixedPeriod = ref(1);
const newMassSubjectIds = ref<string[]>([]);
const newMassDay = ref(0);
const newMassPeriod = ref(1);
const newMassClassIds = ref<string[]>([]);
const isAddingFixed = ref(false);
const isAddingMass = ref(false);
const bulkClassInput = ref("");
const bulkTeacherInput = ref("");
const bulkSubjectInput = ref("");
const bulkCoverageInput = ref("");
const bulkAllocationInput = ref("");
const isBulkAddingClasses = ref(false);
const isBulkAddingTeachers = ref(false);
const isBulkAddingSubjects = ref(false);
const isBulkAddingCoverage = ref(false);
const isBulkAddingAllocations = ref(false);
const bulkClassStatus = ref("");
const bulkTeacherStatus = ref("");
const bulkSubjectStatus = ref("");
const bulkCoverageStatus = ref("");
const bulkAllocationStatus = ref("");

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
const teacherLookup = computed(() => {
  const map = new Map<string, (typeof sortedTeachers.value)[number]>();
  sortedTeachers.value.forEach((teacher) => {
    const key = normalize(teacher.name);
    if (!map.has(key)) map.set(key, teacher);
  });
  return map;
});

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
const classLookup = computed(() => {
  const map = new Map<string, ClassMeta>();
  sortedClasses.value.forEach((klass) => {
    const key = normalize(klass.name);
    if (!map.has(key)) map.set(key, klass);
  });
  return map;
});
const classIdsByGrade = computed(() => {
  const map = new Map<number, string[]>();
  sortedClasses.value.forEach((klass) => {
    if (klass.grade === null) return;
    if (!map.has(klass.grade)) map.set(klass.grade, []);
    map.get(klass.grade)?.push(klass._id);
  });
  return map;
});

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
const subjectLookup = computed(() => {
  const map = new Map<string, (typeof sortedSubjects.value)[number]>();
  sortedSubjects.value.forEach((subject) => {
    const key = normalize(subject.name);
    if (!map.has(key)) map.set(key, subject);
  });
  return map;
});

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
const filteredClassIds = (search: string) =>
  filterClassGroups(search).flatMap((group) => group.classes.map((klass) => klass._id));

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

const getLockSubjectIds = (entry: { subjectId?: string; subjectIds?: string[] }) =>
  entry.subjectIds?.length
    ? entry.subjectIds
    : entry.subjectId
      ? [entry.subjectId]
      : [];

const lockSubjectTitle = (entry: { subjectId?: string; subjectIds?: string[] }) =>
  getLockSubjectIds(entry)
    .map((subjectId) => subjectTitle(subjectId))
    .join(" / ");

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

const lockTeacherLabelForClass = (
  entry: { subjectId?: string; subjectIds?: string[] },
  classId: string,
) =>
  getLockSubjectIds(entry)
    .map((subjectId) => teacherLabelForSubjectClass(subjectId, classId))
    .join(" / ");

const lockTeacherLabelForMass = (
  entry: { subjectId?: string; subjectIds?: string[] },
  classIds: string[],
) =>
  getLockSubjectIds(entry)
    .map((subjectId) => teacherLabelForMassAssignment(subjectId, classIds))
    .join(" / ");

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
const toggleMassSubject = (id: string) => {
  newMassSubjectIds.value = toggleIdInList(newMassSubjectIds.value, id);
};
const toggleFixedSubject = (id: string) => {
  newFixedSubjectIds.value = toggleIdInList(newFixedSubjectIds.value, id);
};
const selectCoverageFiltered = () => {
  newSubjectTeacherClassIds.value = [
    ...new Set([...newSubjectTeacherClassIds.value, ...filteredClassIds(teacherCoverageClassSearch.value)]),
  ];
};
const clearCoverageSelection = () => {
  newSubjectTeacherClassIds.value = [];
};
const selectMassFiltered = () => {
  newMassClassIds.value = [
    ...new Set([...newMassClassIds.value, ...filteredClassIds(massClassSearch.value)]),
  ];
};
const clearMassSelection = () => {
  newMassClassIds.value = [];
};
const clearMassSubjects = () => {
  newMassSubjectIds.value = [];
};
const clearFixedSubjects = () => {
  newFixedSubjectIds.value = [];
};
const selectEssentialFiltered = () => {
  newClassSubjectClassIds.value = [
    ...new Set([...newClassSubjectClassIds.value, ...filteredClassIds(classGroupSearch.value)]),
  ];
};
const clearEssentialSelection = () => {
  newClassSubjectClassIds.value = [];
};
const splitBulkLines = (input: string) =>
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const summarizeBulkNames = (input: string, existingNames: string[]) => {
  const lines = splitBulkLines(input);
  const unique = new Set<string>();
  const existing = new Set(existingNames.map(normalize));
  let duplicates = 0;
  lines.forEach((line) => {
    const key = normalize(line);
    if (unique.has(key)) {
      duplicates += 1;
      return;
    }
    unique.add(key);
  });
  let alreadyExists = 0;
  unique.forEach((key) => {
    if (existing.has(key)) alreadyExists += 1;
  });
  return {
    lines: lines.length,
    unique: unique.size,
    ready: unique.size - alreadyExists,
    duplicates,
    alreadyExists,
  };
};

const resolveScopeText = (scopeText: string) => {
  const ids = new Set<string>();
  const invalidTokens: string[] = [];
  scopeText
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      const directClass = classLookup.value.get(normalize(token));
      if (directClass) {
        ids.add(directClass._id);
        return;
      }

      const cleaned = normalize(token).replace(/^grades?\s+/, "");
      if (/^\d+$/.test(cleaned)) {
        const matches = classIdsByGrade.value.get(Number(cleaned)) ?? [];
        if (matches.length > 0) {
          matches.forEach((id) => ids.add(id));
          return;
        }
      }

      const rangeMatch = cleaned.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        let matched = 0;
        for (let grade = Math.min(start, end); grade <= Math.max(start, end); grade += 1) {
          const gradeMatches = classIdsByGrade.value.get(grade) ?? [];
          matched += gradeMatches.length;
          gradeMatches.forEach((id) => ids.add(id));
        }
        if (matched > 0) return;
      }

      invalidTokens.push(token);
    });

  return { classIds: [...ids], invalidTokens };
};

const parseBulkCoverageLines = (input: string) => {
  const ready: Array<{ subjectId: string; teacherId: string; classIds: string[] }> = [];
  const errors: string[] = [];

  splitBulkLines(input).forEach((line, index) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 3) {
      errors.push(`Line ${index + 1}: use "Subject | Teacher | Classes or grades".`);
      return;
    }

    const subject = subjectLookup.value.get(normalize(parts[0]));
    const teacher = teacherLookup.value.get(normalize(parts[1]));
    const scope = resolveScopeText(parts.slice(2).join("|"));

    if (!subject) {
      errors.push(`Line ${index + 1}: subject "${parts[0]}" was not found.`);
      return;
    }
    if (!teacher) {
      errors.push(`Line ${index + 1}: teacher "${parts[1]}" was not found.`);
      return;
    }
    if (scope.classIds.length === 0) {
      errors.push(`Line ${index + 1}: no classes matched "${parts.slice(2).join("|")}".`);
      return;
    }
    if (scope.invalidTokens.length > 0) {
      errors.push(`Line ${index + 1}: unknown classes/grades ${scope.invalidTokens.join(", ")}.`);
      return;
    }

    ready.push({
      subjectId: subject._id,
      teacherId: teacher._id,
      classIds: scope.classIds,
    });
  });

  return { ready, errors };
};

const parseBulkAllocationLines = (input: string) => {
  const ready: Array<{ subjectId: string; weeklyPeriods: number; classIds: string[] }> = [];
  const errors: string[] = [];

  splitBulkLines(input).forEach((line, index) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 3) {
      errors.push(`Line ${index + 1}: use "Subject | Periods per week | Classes or grades".`);
      return;
    }

    const subject = subjectLookup.value.get(normalize(parts[0]));
    const weeklyPeriods = Number(parts[1]);
    const scope = resolveScopeText(parts.slice(2).join("|"));

    if (!subject) {
      errors.push(`Line ${index + 1}: subject "${parts[0]}" was not found.`);
      return;
    }
    if (!Number.isFinite(weeklyPeriods) || weeklyPeriods <= 0) {
      errors.push(`Line ${index + 1}: weekly periods "${parts[1]}" is not valid.`);
      return;
    }
    if (scope.classIds.length === 0) {
      errors.push(`Line ${index + 1}: no classes matched "${parts.slice(2).join("|")}".`);
      return;
    }
    if (scope.invalidTokens.length > 0) {
      errors.push(`Line ${index + 1}: unknown classes/grades ${scope.invalidTokens.join(", ")}.`);
      return;
    }

    ready.push({
      subjectId: subject._id,
      weeklyPeriods,
      classIds: scope.classIds,
    });
  });

  return { ready, errors };
};

const bulkClassSummary = computed(() =>
  summarizeBulkNames(
    bulkClassInput.value,
    (data.value?.classes ?? []).map((klass) => klass.name),
  ),
);
const bulkTeacherSummary = computed(() =>
  summarizeBulkNames(
    bulkTeacherInput.value,
    (data.value?.teachers ?? []).map((teacher) => teacher.name),
  ),
);
const bulkSubjectSummary = computed(() => {
  const lines = splitBulkLines(bulkSubjectInput.value);
  const existing = new Set((data.value?.subjects ?? []).map((subject) => normalize(subject.name)));
  const unique = new Set<string>();
  let duplicates = 0;
  let ready = 0;
  let errors = 0;

  lines.forEach((line) => {
    const parts = line.split("|").map((part) => part.trim());
    const subjectName = parts[0] ?? "";
    if (!subjectName) {
      errors += 1;
      return;
    }
    const key = normalize(subjectName);
    if (unique.has(key)) {
      duplicates += 1;
      return;
    }
    unique.add(key);
    if (parts[1] && !teacherLookup.value.get(normalize(parts[1]))) {
      errors += 1;
      return;
    }
    if (!existing.has(key)) ready += 1;
  });

  return { lines: lines.length, ready, duplicates, errors };
});
const bulkCoveragePreview = computed(() => parseBulkCoverageLines(bulkCoverageInput.value));
const bulkAllocationPreview = computed(() => parseBulkAllocationLines(bulkAllocationInput.value));

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

const addBulkClasses = async () => {
  const lines = splitBulkLines(bulkClassInput.value);
  if (lines.length === 0) return;

  isBulkAddingClasses.value = true;
  bulkClassStatus.value = "";
  try {
    const existing = new Set((data.value?.classes ?? []).map((klass) => normalize(klass.name)));
    const uniqueLines = [...new Map(lines.map((line) => [normalize(line), line])).values()];
    const ready = uniqueLines.filter((line) => !existing.has(normalize(line)));
    await Promise.all(ready.map((name) => createClass.mutate({ name })));
    bulkClassStatus.value = `Added ${ready.length} classes. Skipped ${uniqueLines.length - ready.length} existing entries.`;
    if (ready.length === uniqueLines.length) bulkClassInput.value = "";
  } finally {
    isBulkAddingClasses.value = false;
  }
};

const addBulkTeachers = async () => {
  const lines = splitBulkLines(bulkTeacherInput.value);
  if (lines.length === 0) return;

  isBulkAddingTeachers.value = true;
  bulkTeacherStatus.value = "";
  try {
    const existing = new Set((data.value?.teachers ?? []).map((teacher) => normalize(teacher.name)));
    const uniqueLines = [...new Map(lines.map((line) => [normalize(line), line])).values()];
    const ready = uniqueLines.filter((line) => !existing.has(normalize(line)));
    await Promise.all(ready.map((name) => createTeacher.mutate({ name })));
    bulkTeacherStatus.value = `Added ${ready.length} teachers. Skipped ${uniqueLines.length - ready.length} existing entries.`;
    if (ready.length === uniqueLines.length) bulkTeacherInput.value = "";
  } finally {
    isBulkAddingTeachers.value = false;
  }
};

const addBulkSubjects = async () => {
  const lines = splitBulkLines(bulkSubjectInput.value);
  if (lines.length === 0) return;

  isBulkAddingSubjects.value = true;
  bulkSubjectStatus.value = "";
  try {
    const existing = new Set((data.value?.subjects ?? []).map((subject) => normalize(subject.name)));
    const uniqueLines = [...new Map(lines.map((line) => [normalize(line.split("|")[0] ?? ""), line])).values()];
    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const line of uniqueLines) {
      const parts = line.split("|").map((part) => part.trim());
      const subjectName = parts[0] ?? "";
      if (!subjectName || existing.has(normalize(subjectName))) {
        skipped += 1;
        continue;
      }
      const teacherId = parts[1]
        ? teacherLookup.value.get(normalize(parts[1]))?._id
        : undefined;
      if (parts[1] && !teacherId) {
        errors += 1;
        continue;
      }

      await createSubject.mutate({ name: subjectName, teacherId });
      added += 1;
    }

    bulkSubjectStatus.value = `Added ${added} subjects. Skipped ${skipped} existing entries. ${errors > 0 ? `${errors} lines need a valid fallback teacher.` : ""}`.trim();
    if (errors === 0) bulkSubjectInput.value = "";
  } finally {
    isBulkAddingSubjects.value = false;
  }
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

const addBulkCoverage = async () => {
  const preview = parseBulkCoverageLines(bulkCoverageInput.value);
  if (preview.ready.length === 0) {
    bulkCoverageStatus.value =
      preview.errors[0] ?? "Nothing to import. Use Subject | Teacher | Classes or grades.";
    return;
  }

  isBulkAddingCoverage.value = true;
  bulkCoverageStatus.value = "";
  try {
    const existing = new Set(
      (data.value?.subjectTeacherAssignments ?? []).map(
        (assignment) =>
          `${assignment.subjectId}|${assignment.teacherId}|${[...assignment.classIds].sort().join(",")}`,
      ),
    );
    const ready = preview.ready.filter((entry) => {
      const key = `${entry.subjectId}|${entry.teacherId}|${[...entry.classIds].sort().join(",")}`;
      return !existing.has(key);
    });
    await Promise.all(
      ready.map((entry) =>
        createSubjectTeacherAssignment.mutate({
          subjectId: entry.subjectId,
          teacherId: entry.teacherId,
          classIds: entry.classIds,
        }),
      ),
    );
    bulkCoverageStatus.value = `Added ${ready.length} teacher coverage rows. Skipped ${preview.ready.length - ready.length} existing matches. ${preview.errors.length > 0 ? `${preview.errors.length} lines still need fixes.` : ""}`.trim();
    if (preview.errors.length === 0) bulkCoverageInput.value = "";
  } finally {
    isBulkAddingCoverage.value = false;
  }
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

const addBulkAllocations = async () => {
  const preview = parseBulkAllocationLines(bulkAllocationInput.value);
  if (preview.ready.length === 0) {
    bulkAllocationStatus.value =
      preview.errors[0] ?? "Nothing to import. Use Subject | Periods per week | Classes or grades.";
    return;
  }

  isBulkAddingAllocations.value = true;
  bulkAllocationStatus.value = "";
  try {
    const existing = new Set(
      (data.value?.classSubjects ?? []).map(
        (entry) => `${entry.classId}|${entry.subjectId}|${entry.weeklyPeriods}`,
      ),
    );
    const ready = preview.ready.flatMap((entry) =>
      entry.classIds
        .filter(
          (classId) =>
            !existing.has(`${classId}|${entry.subjectId}|${entry.weeklyPeriods}`),
        )
        .map((classId) => ({
          classId,
          subjectId: entry.subjectId,
          weeklyPeriods: entry.weeklyPeriods,
        })),
    );
    await Promise.all(ready.map((entry) => createClassSubject.mutate(entry)));
    bulkAllocationStatus.value = `Added ${ready.length} essential allocations. Skipped ${preview.ready.reduce((count, entry) => count + entry.classIds.length, 0) - ready.length} existing matches. ${preview.errors.length > 0 ? `${preview.errors.length} lines still need fixes.` : ""}`.trim();
    if (preview.errors.length === 0) bulkAllocationInput.value = "";
  } finally {
    isBulkAddingAllocations.value = false;
  }
};

const addFixed = async () => {
  if (!newFixedClassId.value || newFixedSubjectIds.value.length === 0) return;
  isAddingFixed.value = true;
  try {
    await createFixedPeriod.mutate({
      classId: newFixedClassId.value,
      subjectIds: newFixedSubjectIds.value,
      day: Number(newFixedDay.value),
      period: Number(newFixedPeriod.value),
    });
    newFixedSubjectIds.value = [];
  } finally {
    isAddingFixed.value = false;
  }
};

const addMass = async () => {
  if (newMassSubjectIds.value.length === 0 || newMassClassIds.value.length === 0) return;
  isAddingMass.value = true;
  try {
    await createMassAssignment.mutate({
      subjectIds: newMassSubjectIds.value,
      classIds: newMassClassIds.value,
      day: Number(newMassDay.value),
      period: Number(newMassPeriod.value),
    });
    newMassClassIds.value = [];
    newMassSubjectIds.value = [];
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
    const subjectName = lockSubjectTitle(fixed);
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
    const subjectName = lockSubjectTitle(mass);
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
    subjectIds: string[],
    locked: boolean,
    action?: WarningItem["action"],
  ) => {
    const schedule = classSchedules.find((item) => item.classId === classId);
    const subjects = subjectIds
      .map((subjectId) => subjectById.get(subjectId))
      .filter(Boolean);
    if (!schedule || subjects.length === 0 || !schedule.grid[day] || period >= schedule.grid[day].length) return;

    const teacherIds = subjectIds
      .map((subjectId) => resolveTeacherForClassSubject(subjectId, classId))
      .filter((teacherId): teacherId is string => Boolean(teacherId));
    const teacherNames = subjectIds.map((subjectId) =>
      teacherMap.get(resolveTeacherForClassSubject(subjectId, classId))?.name ?? "Unassigned",
    );

    if (schedule.grid[day][period]) {
      warnings.push({
        id: `${classId}-${day}-${period}-slot`,
        message: `Slot conflict for ${schedule.className} on day ${day + 1} period ${period}.`,
        action,
      });
      return;
    }

    initTeacherUsage(day, period);
    if (action?.type !== "mass") {
      const conflictingTeacherId = teacherIds.find((teacherId) =>
        teacherUsage[day][period].has(teacherId),
      );
      if (conflictingTeacherId) {
        warnings.push({
          id: `${conflictingTeacherId}-${day}-${period}`,
          message: `Teacher conflict for ${
            teacherMap.get(conflictingTeacherId)?.name ?? "teacher"
          } on day ${day + 1} period ${period}.`,
          action,
        });
        return;
      }
    }

    schedule.grid[day][period] = {
      subjectName: subjects.map((subject) => subject?.name ?? "Unknown").join(" / "),
      teacherName: teacherNames.join(" / "),
      locked,
    };
    teacherIds.forEach((teacherId) => {
      teacherUsage[day][period].add(teacherId);
    });
  };
  data.value.fixedPeriods.forEach((fixed) => {
    const subjectIds = getLockSubjectIds(fixed);
    place(fixed.classId, fixed.day, fixed.period, subjectIds, true, {
      type: "fixed",
      id: fixed._id,
    });
    subjectIds.forEach((subjectId) => {
      if (remaining[fixed.classId]?.[subjectId]) remaining[fixed.classId][subjectId] -= 1;
    });
  });

  data.value.massAssignments.forEach((mass) => {
    const subjectIds = getLockSubjectIds(mass);
    mass.classIds.forEach((classId) => {
      place(classId, mass.day, mass.period, subjectIds, true, {
        type: "mass",
        id: mass._id,
      });
      subjectIds.forEach((subjectId) => {
        if (remaining[classId]?.[subjectId]) remaining[classId][subjectId] -= 1;
      });
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

      <section class="rounded-3xl border border-[#f0cdbb] bg-[#fff0e7] p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm uppercase tracking-[0.16em] text-[#a26045]">Fast entry</p>
            <h2 class="mt-1 text-2xl font-semibold">Bulk setup for large schools</h2>
            <p class="mt-2 max-w-3xl text-sm text-[#8a4b32]">
              Use this first when you have a lot of setup to enter. Paste lists or subject mappings,
              save them in one go, then use the manual sections below only for cleanup.
            </p>
          </div>
          <div class="rounded-2xl border border-[#f0cdbb] bg-white px-4 py-3 text-sm text-[#8a4b32]">
            Supported shortcuts: exact class names like <span class="font-medium">1A</span>, grades like
            <span class="font-medium">7</span>, and ranges like <span class="font-medium">9-12</span>.
          </div>
        </div>

        <div class="mt-5 grid gap-5 xl:grid-cols-2">
          <div class="rounded-2xl border border-[#f0cdbb] bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">Bulk classes</h3>
              <span class="text-xs text-[#8a4b32]">{{ bulkClassSummary.ready }} ready</span>
            </div>
            <p class="mt-1 text-xs text-[#8a4b32]">One class per line. Example: 1A, 1B, 2A.</p>
            <textarea
              v-model="bulkClassInput"
              rows="7"
              placeholder="1A&#10;1B&#10;2A&#10;2B"
              class="mt-3 w-full rounded-2xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3"
            />
            <p class="mt-2 text-xs text-[#8a4b32]">
              {{ bulkClassSummary.lines }} lines · {{ bulkClassSummary.duplicates }} duplicate lines ·
              {{ bulkClassSummary.alreadyExists }} already exist
            </p>
            <button
              @click="addBulkClasses"
              :disabled="isBulkAddingClasses || bulkClassSummary.ready === 0"
              class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {{ isBulkAddingClasses ? "Adding classes..." : `Add ${bulkClassSummary.ready} classes` }}
            </button>
            <p v-if="bulkClassStatus" class="mt-2 text-xs text-[#8a4b32]">{{ bulkClassStatus }}</p>
          </div>

          <div class="rounded-2xl border border-[#f0cdbb] bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">Bulk teachers</h3>
              <span class="text-xs text-[#8a4b32]">{{ bulkTeacherSummary.ready }} ready</span>
            </div>
            <p class="mt-1 text-xs text-[#8a4b32]">One teacher code per line. Example: LDI, BMK, CNM.</p>
            <textarea
              v-model="bulkTeacherInput"
              rows="7"
              placeholder="LDI&#10;RU&#10;BMK&#10;CNM"
              class="mt-3 w-full rounded-2xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3"
            />
            <p class="mt-2 text-xs text-[#8a4b32]">
              {{ bulkTeacherSummary.lines }} lines · {{ bulkTeacherSummary.duplicates }} duplicate lines ·
              {{ bulkTeacherSummary.alreadyExists }} already exist
            </p>
            <button
              @click="addBulkTeachers"
              :disabled="isBulkAddingTeachers || bulkTeacherSummary.ready === 0"
              class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {{ isBulkAddingTeachers ? "Adding teachers..." : `Add ${bulkTeacherSummary.ready} teachers` }}
            </button>
            <p v-if="bulkTeacherStatus" class="mt-2 text-xs text-[#8a4b32]">{{ bulkTeacherStatus }}</p>
          </div>

          <div class="rounded-2xl border border-[#f0cdbb] bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">Bulk subjects</h3>
              <span class="text-xs text-[#8a4b32]">{{ bulkSubjectSummary.ready }} ready</span>
            </div>
            <p class="mt-1 text-xs text-[#8a4b32]">
              One subject per line. Optional format: <span class="font-medium">Subject | fallback teacher</span>.
            </p>
            <textarea
              v-model="bulkSubjectInput"
              rows="7"
              placeholder="Eng1&#10;Math&#10;Bio | KUS&#10;Comp | CHARAN"
              class="mt-3 w-full rounded-2xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3"
            />
            <p class="mt-2 text-xs text-[#8a4b32]">
              {{ bulkSubjectSummary.lines }} lines · {{ bulkSubjectSummary.duplicates }} duplicate lines ·
              {{ bulkSubjectSummary.errors }} lines need a valid fallback teacher
            </p>
            <button
              @click="addBulkSubjects"
              :disabled="isBulkAddingSubjects || bulkSubjectSummary.ready === 0"
              class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {{ isBulkAddingSubjects ? "Adding subjects..." : `Add ${bulkSubjectSummary.ready} subjects` }}
            </button>
            <p v-if="bulkSubjectStatus" class="mt-2 text-xs text-[#8a4b32]">{{ bulkSubjectStatus }}</p>
          </div>

          <div class="rounded-2xl border border-[#f0cdbb] bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">Bulk teacher coverage</h3>
              <span class="text-xs text-[#8a4b32]">{{ bulkCoveragePreview.ready.length }} ready lines</span>
            </div>
            <p class="mt-1 text-xs text-[#8a4b32]">
              Format: <span class="font-medium">Subject | Teacher | Classes or grades</span>.
            </p>
            <textarea
              v-model="bulkCoverageInput"
              rows="7"
              placeholder="Eng1 | LDI | 1&#10;Eng1 | RU | 1A, 1B&#10;Eng1 | BMK | 2, 3&#10;Eng1 | CNM | 9-12"
              class="mt-3 w-full rounded-2xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3"
            />
            <div class="mt-2 rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-3 py-3 text-xs text-[#8a4b32]">
              <p>{{ bulkCoveragePreview.ready.length }} ready · {{ bulkCoveragePreview.errors.length }} lines need fixes</p>
              <p v-if="bulkCoveragePreview.errors[0]" class="mt-1">{{ bulkCoveragePreview.errors[0] }}</p>
            </div>
            <button
              @click="addBulkCoverage"
              :disabled="isBulkAddingCoverage || bulkCoveragePreview.ready.length === 0"
              class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {{ isBulkAddingCoverage ? "Saving teacher coverage..." : `Add ${bulkCoveragePreview.ready.length} coverage lines` }}
            </button>
            <p v-if="bulkCoverageStatus" class="mt-2 text-xs text-[#8a4b32]">{{ bulkCoverageStatus }}</p>
          </div>

          <div class="rounded-2xl border border-[#f0cdbb] bg-white p-4 xl:col-span-2">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">Bulk essential allocations</h3>
              <span class="text-xs text-[#8a4b32]">{{ bulkAllocationPreview.ready.length }} ready lines</span>
            </div>
            <p class="mt-1 text-xs text-[#8a4b32]">
              Format: <span class="font-medium">Subject | Weekly periods | Classes or grades</span>.
              Example: <span class="font-medium">Math | 6 | 1-5</span> or <span class="font-medium">Bio | 3 | 9A, 9B, 9C</span>.
            </p>
            <textarea
              v-model="bulkAllocationInput"
              rows="6"
              placeholder="Eng1 | 6 | 1-12&#10;Math | 6 | 1-10&#10;Bio | 3 | 9A, 9B, 9C, 10A, 10B, 10C"
              class="mt-3 w-full rounded-2xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3"
            />
            <div class="mt-2 rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-3 py-3 text-xs text-[#8a4b32]">
              <p>{{ bulkAllocationPreview.ready.length }} ready · {{ bulkAllocationPreview.errors.length }} lines need fixes</p>
              <p v-if="bulkAllocationPreview.errors[0]" class="mt-1">{{ bulkAllocationPreview.errors[0] }}</p>
            </div>
            <button
              @click="addBulkAllocations"
              :disabled="isBulkAddingAllocations || bulkAllocationPreview.ready.length === 0"
              class="mt-3 w-full rounded-xl bg-[#d17c5a] px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {{ isBulkAddingAllocations ? "Adding essential allocations..." : `Add ${bulkAllocationPreview.ready.length} allocation lines` }}
            </button>
            <p v-if="bulkAllocationStatus" class="mt-2 text-xs text-[#8a4b32]">{{ bulkAllocationStatus }}</p>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div class="space-y-6">
          <div class="rounded-3xl border border-[#f0cdbb] bg-[#ffe7dc] p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold">Manual classes and teachers</h2>
                <p class="mt-1 text-sm text-[#8a4b32]">
                  Use this area for small corrections after the bulk setup above.
                </p>
              </div>
              <div class="rounded-xl border border-[#f0cdbb] bg-white px-3 py-2 text-xs text-[#8a4b32]">
                Best for one-off edits
              </div>
            </div>
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
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold">Manual subject editor</h2>
                <p class="mt-1 text-sm text-[#8a4b32]">
                  Create or adjust individual subjects and teacher mappings here.
                </p>
              </div>
              <div class="rounded-xl border border-[#f0cdbb] bg-white px-3 py-2 text-xs text-[#8a4b32]">
                Best for cleanup
              </div>
            </div>
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
              <div class="mt-3 flex flex-wrap gap-2 text-xs">
                <button @click="selectCoverageFiltered" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2 text-[#8a4b32]">
                  Select filtered classes
                </button>
                <button @click="clearCoverageSelection" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2 text-[#8a4b32]">
                  Clear selection
                </button>
              </div>
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
                <div class="mt-3 flex items-center justify-between gap-3 text-xs text-[#8a4b32]">
                  <span>{{ newMassSubjectIds.length }} subjects selected</span>
                  <button @click="clearMassSubjects" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2">
                    Clear subjects
                  </button>
                </div>
                <div class="mt-3 max-h-40 overflow-y-auto rounded-xl border border-[#f0cdbb] bg-[#fff8f3] p-3">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="subject in filterSubjects(massSubjectSearch)"
                      :key="subject._id"
                      @click="toggleMassSubject(subject._id)"
                      class="rounded-full border px-3 py-1 text-sm"
                      :class="newMassSubjectIds.includes(subject._id) ? 'border-[#d17c5a] bg-[#d17c5a] text-white' : 'border-[#f0cdbb] bg-white'"
                    >
                      {{ subjectTitle(subject._id) }}
                    </button>
                  </div>
                </div>
                <p class="mt-2 text-xs text-[#8a4b32]">Click to add or remove subjects. No Ctrl or Cmd key needed.</p>
                <div class="mt-3 grid grid-cols-2 gap-3">
                  <select v-model="newMassDay" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3">
                    <option v-for="day in dayOptions" :key="day.index" :value="day.index">{{ day.label }}</option>
                  </select>
                  <input v-model="newMassPeriod" type="number" min="1" class="rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                </div>
                <input v-model="massClassSearch" placeholder="Filter classes or grade" class="mt-3 w-full rounded-xl border border-[#f0cdbb] bg-[#fff8f3] px-4 py-3" />
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  <button @click="selectMassFiltered" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2 text-[#8a4b32]">
                    Select filtered classes
                  </button>
                  <button @click="clearMassSelection" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2 text-[#8a4b32]">
                    Clear classes
                  </button>
                </div>
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
                <div class="mt-3 flex items-center justify-between gap-3 text-xs text-[#8a4b32]">
                  <span>{{ newFixedSubjectIds.length }} subjects selected</span>
                  <button @click="clearFixedSubjects" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2">
                    Clear subjects
                  </button>
                </div>
                <div class="mt-3 max-h-40 overflow-y-auto rounded-xl border border-[#f0cdbb] bg-[#fff8f3] p-3">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="subject in filterSubjects(fixedSubjectSearch)"
                      :key="subject._id"
                      @click="toggleFixedSubject(subject._id)"
                      class="rounded-full border px-3 py-1 text-sm"
                      :class="newFixedSubjectIds.includes(subject._id) ? 'border-[#d17c5a] bg-[#d17c5a] text-white' : 'border-[#f0cdbb] bg-white'"
                    >
                      {{ subjectTitle(subject._id) }}
                    </button>
                  </div>
                </div>
                <p class="mt-2 text-xs text-[#8a4b32]">Click to add or remove subjects. No Ctrl or Cmd key needed.</p>
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
            <div class="mt-3 flex flex-wrap gap-2 text-xs">
              <button @click="selectEssentialFiltered" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2 text-[#8a4b32]">
                Select filtered classes
              </button>
              <button @click="clearEssentialSelection" class="rounded-full border border-[#f0cdbb] bg-white px-3 py-2 text-[#8a4b32]">
                Clear selection
              </button>
            </div>
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
                  <p class="text-sm text-[#8a4b32]">{{ lockSubjectTitle(fixed) }}</p>
                  <p class="mt-1 text-xs text-[#8a4b32]">{{ lockTeacherLabelForClass(fixed, fixed.classId) }}</p>
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
                  <p class="font-medium">{{ lockSubjectTitle(mass) }}</p>
                  <p class="text-sm text-[#8a4b32]">{{ dayOptions[mass.day]?.short }} · Period {{ mass.period }}</p>
                  <p class="mt-1 text-xs text-[#8a4b32]">{{ lockTeacherLabelForMass(mass, mass.classIds) }}</p>
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

<script setup lang="ts">
import { computed, ref } from "vue";
import { api } from "../convex/_generated/api";

const { data } = useConvexQuery(api.timetable.getData);

const createClass = useConvexMutation(api.timetable.createClass);
const removeClass = useConvexMutation(api.timetable.removeClass);
const createTeacher = useConvexMutation(api.timetable.createTeacher);
const removeTeacher = useConvexMutation(api.timetable.removeTeacher);
const createSubject = useConvexMutation(api.timetable.createSubject);
const removeSubject = useConvexMutation(api.timetable.removeSubject);
const createClassSubject = useConvexMutation(api.timetable.createClassSubject);
const removeClassSubject = useConvexMutation(api.timetable.removeClassSubject);
const updateClassSubject = useConvexMutation(api.timetable.updateClassSubject);
const createFixedPeriod = useConvexMutation(api.timetable.createFixedPeriod);
const removeFixedPeriod = useConvexMutation(api.timetable.removeFixedPeriod);
const updateFixedPeriod = useConvexMutation(api.timetable.updateFixedPeriod);
const createMassAssignment = useConvexMutation(api.timetable.createMassAssignment);
const removeMassAssignment = useConvexMutation(api.timetable.removeMassAssignment);
const updateMassAssignment = useConvexMutation(api.timetable.updateMassAssignment);

const newClassName = ref("");
const newTeacherName = ref("");
const newSubjectName = ref("");
const newSubjectTeacherId = ref("");
const newClassSubjectClassIds = ref<string[]>([]);
const newClassSubjectSubjectId = ref("");
const newClassSubjectWeeklyPeriods = ref(1);
const newFixedClassId = ref("");
const newFixedSubjectId = ref("");
const newFixedDay = ref(0);
const newFixedPeriod = ref(1);
const newMassSubjectId = ref("");
const newMassDay = ref(0);
const newMassPeriod = ref(1);
const newMassClassIds = ref<string[]>([]);

const editingClassSubjectId = ref<string | null>(null);
const editClassSubjectClassId = ref("");
const editClassSubjectSubjectId = ref("");
const editClassSubjectWeeklyPeriods = ref(1);
const editingFixedId = ref<string | null>(null);
const editFixedClassId = ref("");
const editFixedSubjectId = ref("");
const editFixedDay = ref(0);
const editFixedPeriod = ref(1);
const editingMassId = ref<string | null>(null);
const editMassSubjectId = ref("");
const editMassDay = ref(0);
const editMassPeriod = ref(1);
const editMassClassIds = ref<string[]>([]);

const dayOptions = [
  { label: "Monday", short: "Mon", index: 0, periods: 8 },
  { label: "Tuesday", short: "Tue", index: 1, periods: 8 },
  { label: "Wednesday", short: "Wed", index: 2, periods: 8 },
  { label: "Thursday", short: "Thu", index: 3, periods: 8 },
  { label: "Friday", short: "Fri", index: 4, periods: 8 },
  { label: "Saturday", short: "Sat", index: 5, periods: 5 },
];

const resetMassSelection = () => {
  newMassClassIds.value = [];
};

const resetClassSubjectSelection = () => {
  newClassSubjectClassIds.value = [];
};

const toggleClassSubjectClass = (classId: string) => {
  if (newClassSubjectClassIds.value.includes(classId)) {
    newClassSubjectClassIds.value = newClassSubjectClassIds.value.filter(
      (id) => id !== classId,
    );
  } else {
    newClassSubjectClassIds.value = [...newClassSubjectClassIds.value, classId];
  }
};

const selectAllClassSubjects = () => {
  newClassSubjectClassIds.value = data.value?.classes.map((klass) => klass._id) ?? [];
};

const clearClassSubjects = () => {
  newClassSubjectClassIds.value = [];
};

const selectAllMassClasses = () => {
  newMassClassIds.value = data.value?.classes.map((klass) => klass._id) ?? [];
};

const clearMassClasses = () => {
  newMassClassIds.value = [];
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
  if (!newSubjectName.value.trim() || !newSubjectTeacherId.value) return;
  await createSubject.mutate({
    name: newSubjectName.value.trim(),
    teacherId: newSubjectTeacherId.value,
  });
  newSubjectName.value = "";
  newSubjectTeacherId.value = "";
};

const addClassSubject = async () => {
  if (newClassSubjectClassIds.value.length === 0 || !newClassSubjectSubjectId.value) {
    return;
  }
  const weeklyPeriods = Number(newClassSubjectWeeklyPeriods.value) || 1;
  await Promise.all(
    newClassSubjectClassIds.value.map((classId) =>
      createClassSubject.mutate({
        classId,
        subjectId: newClassSubjectSubjectId.value,
        weeklyPeriods,
      }),
    ),
  );
  newClassSubjectWeeklyPeriods.value = 1;
  resetClassSubjectSelection();
};

const addFixedPeriod = async () => {
  if (!newFixedClassId.value || !newFixedSubjectId.value) return;
  await createFixedPeriod.mutate({
    classId: newFixedClassId.value,
    subjectId: newFixedSubjectId.value,
    day: Number(newFixedDay.value),
    period: Number(newFixedPeriod.value),
  });
  newFixedDay.value = 0;
  newFixedPeriod.value = 1;
};

const addMassAssignment = async () => {
  if (!newMassSubjectId.value || newMassClassIds.value.length === 0) return;
  await createMassAssignment.mutate({
    subjectId: newMassSubjectId.value,
    classIds: newMassClassIds.value,
    day: Number(newMassDay.value),
    period: Number(newMassPeriod.value),
  });
  newMassDay.value = 0;
  newMassPeriod.value = 1;
  resetMassSelection();
};

const startEditClassSubject = (allocation: {
  _id: string;
  classId: string;
  subjectId: string;
  weeklyPeriods: number;
}) => {
  editingClassSubjectId.value = allocation._id;
  editClassSubjectClassId.value = allocation.classId;
  editClassSubjectSubjectId.value = allocation.subjectId;
  editClassSubjectWeeklyPeriods.value = allocation.weeklyPeriods;
};

const cancelEditClassSubject = () => {
  editingClassSubjectId.value = null;
};

const saveClassSubjectEdit = async () => {
  if (!editingClassSubjectId.value) return;
  await updateClassSubject.mutate({
    id: editingClassSubjectId.value,
    classId: editClassSubjectClassId.value,
    subjectId: editClassSubjectSubjectId.value,
    weeklyPeriods: Number(editClassSubjectWeeklyPeriods.value) || 1,
  });
  editingClassSubjectId.value = null;
};

const startEditFixed = (fixed: {
  _id: string;
  classId: string;
  subjectId: string;
  day: number;
  period: number;
}) => {
  editingFixedId.value = fixed._id;
  editFixedClassId.value = fixed.classId;
  editFixedSubjectId.value = fixed.subjectId;
  editFixedDay.value = fixed.day;
  editFixedPeriod.value = fixed.period;
};

const cancelEditFixed = () => {
  editingFixedId.value = null;
};

const saveFixedEdit = async () => {
  if (!editingFixedId.value) return;
  await updateFixedPeriod.mutate({
    id: editingFixedId.value,
    classId: editFixedClassId.value,
    subjectId: editFixedSubjectId.value,
    day: Number(editFixedDay.value),
    period: Number(editFixedPeriod.value),
  });
  editingFixedId.value = null;
};

const startEditMass = (mass: {
  _id: string;
  subjectId: string;
  classIds: string[];
  day: number;
  period: number;
}) => {
  editingMassId.value = mass._id;
  editMassSubjectId.value = mass.subjectId;
  editMassClassIds.value = [...mass.classIds];
  editMassDay.value = mass.day;
  editMassPeriod.value = mass.period;
};

const cancelEditMass = () => {
  editingMassId.value = null;
};

const saveMassEdit = async () => {
  if (!editingMassId.value) return;
  await updateMassAssignment.mutate({
    id: editingMassId.value,
    subjectId: editMassSubjectId.value,
    classIds: editMassClassIds.value,
    day: Number(editMassDay.value),
    period: Number(editMassPeriod.value),
  });
  editingMassId.value = null;
};

const toggleEditMassClass = (classId: string) => {
  if (editMassClassIds.value.includes(classId)) {
    editMassClassIds.value = editMassClassIds.value.filter((id) => id !== classId);
  } else {
    editMassClassIds.value = [...editMassClassIds.value, classId];
  }
};

const timetable = computed(() => {
  if (!data.value) {
    return { classSchedules: [], warnings: [] as WarningItem[] };
  }

  const { classes, subjects, teachers, classSubjects, fixedPeriods, massAssignments } =
    data.value;
  const subjectById = new Map(subjects.map((subject) => [subject._id, subject]));
  const teacherById = new Map(teachers.map((teacher) => [teacher._id, teacher]));

  const teacherUsage: Record<number, Record<number, Set<string>>> = {};
  const remaining: Record<string, Record<string, number>> = {};
  const warnings: WarningItem[] = [];

  const initTeacherUsage = (day: number, period: number) => {
    if (!teacherUsage[day]) teacherUsage[day] = {};
    if (!teacherUsage[day][period]) teacherUsage[day][period] = new Set();
  };

  const classSchedules = classes.map((klass) => {
    const grid = dayOptions.map((day) => {
      return Array.from({ length: day.periods + 1 }, () => null as null | {
        subjectId: string;
        subjectName: string;
        teacherName: string;
        locked: boolean;
        source: string;
      });
    });
    return { classId: klass._id, className: klass.name, grid };
  });

  for (const classSubject of classSubjects) {
    if (!remaining[classSubject.classId]) remaining[classSubject.classId] = {};
    remaining[classSubject.classId][classSubject.subjectId] =
      (remaining[classSubject.classId][classSubject.subjectId] || 0) +
      classSubject.weeklyPeriods;
  }

  const placeEntry = ({
    classId,
    day,
    period,
    subjectId,
    locked,
    source,
    assignmentId,
  }: {
    classId: string;
    day: number;
    period: number;
    subjectId: string;
    locked: boolean;
    source: string;
    assignmentId?: string;
  }) => {
    const schedule = classSchedules.find((item) => item.classId === classId);
    const subject = subjectById.get(subjectId);
    if (!schedule || !subject) return;

    const teacher = teacherById.get(subject.teacherId);
    const teacherName = teacher?.name ?? "Unassigned";

    if (!schedule.grid[day] || period >= schedule.grid[day].length) {
      warnings.push({
        id: `${classId}-${day}-${period}-invalid`,
        message: `Invalid slot for class ${schedule.className} on day ${
          day + 1
        } period ${period}.`,
      });
      return;
    }

    if (schedule.grid[day][period]) {
      warnings.push({
        id: `${classId}-${day}-${period}-slot`,
        message: `Slot conflict for class ${schedule.className} on day ${
          day + 1
        } period ${period}.`,
        action:
          source === "fixed"
            ? {
                type: "fixed",
                id: assignmentId,
              }
            : source === "mass"
              ? {
                  type: "mass",
                  id: assignmentId,
                }
              : undefined,
      });
      return;
    }

    initTeacherUsage(day, period);
    if (teacher && teacherUsage[day][period].has(teacher._id) && source !== "mass") {
      warnings.push({
        id: `${teacher._id}-${day}-${period}-teacher`,
        message: `Teacher conflict: ${teacherName} already scheduled on day ${
          day + 1
        } period ${period}.`,
        action:
          source === "fixed"
            ? {
                type: "fixed",
                id: assignmentId,
              }
            : source === "mass"
              ? {
                  type: "mass",
                  id: assignmentId,
                }
              : undefined,
      });
      return;
    }

    schedule.grid[day][period] = {
      subjectId,
      subjectName: subject.name,
      teacherName,
      locked,
      source,
    };

    if (teacher) {
      teacherUsage[day][period].add(teacher._id);
    }
  };

  for (const fixed of fixedPeriods) {
    placeEntry({
      classId: fixed.classId,
      day: fixed.day,
      period: fixed.period,
      subjectId: fixed.subjectId,
      locked: true,
      source: "fixed",
      assignmentId: fixed._id,
    });

    if (!remaining[fixed.classId]?.[fixed.subjectId]) {
      warnings.push({
        id: `fixed-${fixed._id}-allocation`,
        message: `Fixed period for class ${
          classes.find((item) => item._id === fixed.classId)?.name ?? "Unknown"
        } uses subject without remaining allocation.`,
        action: {
          type: "fixed",
          id: fixed._id,
        },
      });
    } else {
      remaining[fixed.classId][fixed.subjectId] -= 1;
    }
  }

  for (const mass of massAssignments) {
    for (const classId of mass.classIds) {
      placeEntry({
        classId,
        day: mass.day,
        period: mass.period,
        subjectId: mass.subjectId,
        locked: true,
        source: "mass",
        assignmentId: mass._id,
      });
      if (remaining[classId]?.[mass.subjectId]) {
        remaining[classId][mass.subjectId] -= 1;
      }
    }
  }

  for (const schedule of classSchedules) {
    const classRemaining = remaining[schedule.classId] ?? {};
    const subjectIds = Object.keys(classRemaining);

    dayOptions.forEach((day, dayIndex) => {
      const subjectsInDay = new Set<string>();
      schedule.grid[dayIndex].forEach((entry) => {
        if (entry?.subjectId) {
          subjectsInDay.add(entry.subjectId);
        }
      });

      for (let period = 1; period <= day.periods; period += 1) {
        if (schedule.grid[dayIndex][period]) continue;

        const available = subjectIds.filter((subjectId) => {
          const count = classRemaining[subjectId] || 0;
          if (count <= 0) return false;
          const subject = subjectById.get(subjectId);
          if (!subject) return false;
          initTeacherUsage(dayIndex, period);
          const teacherId = subject.teacherId;
          if (teacherUsage[dayIndex][period].has(teacherId)) return false;
          return true;
        });

        const nonRepeat = available.filter((subjectId) => !subjectsInDay.has(subjectId));
        const candidates = nonRepeat.length > 0 ? nonRepeat : available;

        if (candidates.length === 0) {
          warnings.push({
            id: `${schedule.classId}-${dayIndex}-${period}-unfilled`,
            message: `Unfilled slot for class ${schedule.className} on day ${
              dayIndex + 1
            } period ${period}.`,
          });
          continue;
        }

        candidates.sort(
          (a, b) => (classRemaining[b] || 0) - (classRemaining[a] || 0),
        );
        const chosen = candidates[0];
        const subject = subjectById.get(chosen);
        if (!subject) continue;

        schedule.grid[dayIndex][period] = {
          subjectId: chosen,
          subjectName: subject.name,
          teacherName: teacherById.get(subject.teacherId)?.name ?? "Unassigned",
          locked: false,
          source: "auto",
        };
        classRemaining[chosen] -= 1;
        subjectsInDay.add(chosen);
        initTeacherUsage(dayIndex, period);
        teacherUsage[dayIndex][period].add(subject.teacherId);
      }
    });
  }

  for (const schedule of classSchedules) {
    const classRemaining = remaining[schedule.classId] ?? {};
    Object.entries(classRemaining).forEach(([subjectId, count]) => {
      if (count > 0) {
        const subject = subjectById.get(subjectId);
        warnings.push({
          id: `${schedule.classId}-${subjectId}-remaining`,
          message: `Remaining ${count} periods for ${
            subject?.name ?? "Unknown subject"
          } in class ${schedule.className}.`,
        });
      }
    });
  }

  return { classSchedules, warnings };
});

const toggleMassClass = (classId: string) => {
  if (newMassClassIds.value.includes(classId)) {
    newMassClassIds.value = newMassClassIds.value.filter((id) => id !== classId);
  } else {
    newMassClassIds.value = [...newMassClassIds.value, classId];
  }
};

type WarningItem = {
  id: string;
  message: string;
  action?: {
    type: "fixed" | "mass";
    id?: string;
  };
};

const resolveWarning = async (warning: WarningItem) => {
  if (!warning.action?.id) return;
  if (warning.action.type === "fixed") {
    await removeFixedPeriod.mutate({ id: warning.action.id });
  } else if (warning.action.type === "mass") {
    await removeMassAssignment.mutate({ id: warning.action.id });
  }
};

const editWarning = (warning: WarningItem) => {
  if (!warning.action?.id || !data.value) return;
  if (warning.action.type === "fixed") {
    const fixed = data.value.fixedPeriods.find((item) => item._id === warning.action?.id);
    if (fixed) startEditFixed(fixed);
  }
  if (warning.action.type === "mass") {
    const mass = data.value.massAssignments.find((item) => item._id === warning.action?.id);
    if (mass) startEditMass(mass);
  }
};

const hasActionableWarnings = computed(() =>
  timetable.value.warnings.some((warning) => warning.action?.id),
);

const canAddClassSubject = computed(
  () =>
    newClassSubjectClassIds.value.length > 0 &&
    Boolean(newClassSubjectSubjectId.value),
);
const canAddFixed = computed(
  () => Boolean(newFixedClassId.value) && Boolean(newFixedSubjectId.value),
);
const canAddMass = computed(
  () => Boolean(newMassSubjectId.value) && newMassClassIds.value.length > 0,
);
</script>

<template>
  <div class="min-h-screen bg-[#FFF4EE] relative overflow-hidden">
    <div
      class="absolute inset-0 pointer-events-none opacity-30"
      style="
        background-image: radial-gradient(#e6b8a2 1px, transparent 1px);
        background-size: 20px 20px;
      "
    ></div>

    <header class="relative z-10 px-6 py-5 border-b border-[#f0cdbb]">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-[#5a2d1a]">Peach Timetables</h1>
        <span class="text-sm text-[#8a4b32]">Live • Dynamic</span>
      </div>
    </header>

    <main class="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-10">
      <section>
        <h2 class="text-3xl font-bold text-[#5a2d1a]">
          Build your timetable generator
        </h2>
        <p class="text-[#8a4b32] mt-1">
          Create classes, teachers, subjects, and constraints. The timetable is
          generated with teacher conflict prevention and repeat minimization.
        </p>
      </section>

      <section class="grid lg:grid-cols-2 gap-6">
        <div class="bg-[#FFE7DC] border border-[#f0cdbb] rounded-2xl p-6 space-y-4">
          <h3 class="text-xl font-semibold text-[#5a2d1a]">Classes</h3>
          <div class="flex gap-3">
            <input
              v-model="newClassName"
              placeholder="Add class (e.g., 1A)"
              class="flex-1 rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] placeholder-[#b07a63] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            />
            <button
              @click="addClass"
              class="px-5 rounded-xl bg-[#d17c5a] text-white font-medium hover:bg-[#b96547] transition"
            >
              Add
            </button>
          </div>
          <ul class="space-y-2 text-[#5a2d1a]">
            <li
              v-for="klass in data?.classes"
              :key="klass._id"
              class="flex items-center justify-between bg-[#FFF4EE] rounded-xl px-4 py-2 border border-[#f0cdbb]"
            >
              <span>{{ klass.name }}</span>
              <button
                @click="removeClass.mutate({ id: klass._id })"
                class="text-[#b96547] hover:text-[#8a4b32] text-sm"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>

        <div class="bg-[#FFE7DC] border border-[#f0cdbb] rounded-2xl p-6 space-y-4">
          <h3 class="text-xl font-semibold text-[#5a2d1a]">Teachers</h3>
          <div class="flex gap-3">
            <input
              v-model="newTeacherName"
              placeholder="Add teacher"
              class="flex-1 rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] placeholder-[#b07a63] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            />
            <button
              @click="addTeacher"
              class="px-5 rounded-xl bg-[#d17c5a] text-white font-medium hover:bg-[#b96547] transition"
            >
              Add
            </button>
          </div>
          <ul class="space-y-2 text-[#5a2d1a]">
            <li
              v-for="teacher in data?.teachers"
              :key="teacher._id"
              class="flex items-center justify-between bg-[#FFF4EE] rounded-xl px-4 py-2 border border-[#f0cdbb]"
            >
              <span>{{ teacher.name }}</span>
              <button
                @click="removeTeacher.mutate({ id: teacher._id })"
                class="text-[#b96547] hover:text-[#8a4b32] text-sm"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      </section>

      <section class="grid lg:grid-cols-2 gap-6">
        <div class="bg-[#FFE7DC] border border-[#f0cdbb] rounded-2xl p-6 space-y-4">
          <h3 class="text-xl font-semibold text-[#5a2d1a]">Subjects</h3>
          <div class="grid gap-3">
            <input
              v-model="newSubjectName"
              placeholder="Subject name"
              class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] placeholder-[#b07a63] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            />
            <select
              v-model="newSubjectTeacherId"
              class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            >
              <option value="">Select teacher</option>
              <option v-for="teacher in data?.teachers" :key="teacher._id" :value="teacher._id">
                {{ teacher.name }}
              </option>
            </select>
            <button
              @click="addSubject"
              class="px-5 py-3 rounded-xl bg-[#d17c5a] text-white font-medium hover:bg-[#b96547] transition"
            >
              Add subject
            </button>
          </div>
          <ul class="space-y-2 text-[#5a2d1a]">
            <li
              v-for="subject in data?.subjects"
              :key="subject._id"
              class="flex items-center justify-between bg-[#FFF4EE] rounded-xl px-4 py-2 border border-[#f0cdbb]"
            >
              <span>
                {{ subject.name }} ·
                {{
                  data?.teachers.find((teacher) => teacher._id === subject.teacherId)?.name
                }}
              </span>
              <button
                @click="removeSubject.mutate({ id: subject._id })"
                class="text-[#b96547] hover:text-[#8a4b32] text-sm"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>

        <div class="bg-[#FFE7DC] border border-[#f0cdbb] rounded-2xl p-6 space-y-4">
          <h3 class="text-xl font-semibold text-[#5a2d1a]">
            Class subject scope
          </h3>
          <div class="grid gap-3">
            <div class="bg-[#FFF4EE] border border-[#f0cdbb] rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm text-[#8a4b32]">Select classes</p>
                <div class="flex gap-2 text-xs">
                  <button
                    type="button"
                    @click="selectAllClassSubjects"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    @click="clearClassSubjects"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="klass in data?.classes"
                  :key="klass._id"
                  type="button"
                  @click="toggleClassSubjectClass(klass._id)"
                  class="px-3 py-1 rounded-full border text-sm"
                  :class="
                    newClassSubjectClassIds.includes(klass._id)
                      ? 'bg-[#d17c5a] text-white border-[#d17c5a]'
                      : 'bg-[#FFF4EE] text-[#5a2d1a] border-[#f0cdbb]'
                  "
                >
                  {{ klass.name }}
                </button>
              </div>
              <p class="text-xs text-[#b07a63]">
                {{ newClassSubjectClassIds.length }} classes selected
              </p>
            </div>
            <select
              v-model="newClassSubjectSubjectId"
              class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            >
              <option value="">Select subject</option>
              <option v-for="subject in data?.subjects" :key="subject._id" :value="subject._id">
                {{ subject.name }}
              </option>
            </select>
            <input
              v-model="newClassSubjectWeeklyPeriods"
              type="number"
              min="1"
              class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
              placeholder="Weekly periods"
            />
            <button
              @click="addClassSubject"
              :disabled="!canAddClassSubject"
              class="px-5 py-3 rounded-xl bg-[#d17c5a] text-white font-medium hover:bg-[#b96547] transition"
              :class="!canAddClassSubject ? 'opacity-60 cursor-not-allowed' : ''"
            >
              Add allocations
            </button>
          </div>
          <ul class="space-y-2 text-[#5a2d1a]">
            <li
              v-for="allocation in data?.classSubjects"
              :key="allocation._id"
              class="flex items-center justify-between bg-[#FFF4EE] rounded-xl px-4 py-2 border border-[#f0cdbb]"
            >
              <div v-if="editingClassSubjectId === allocation._id" class="w-full space-y-2">
                <div class="grid gap-2 md:grid-cols-3">
                  <select
                    v-model="editClassSubjectClassId"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  >
                    <option v-for="klass in data?.classes" :key="klass._id" :value="klass._id">
                      {{ klass.name }}
                    </option>
                  </select>
                  <select
                    v-model="editClassSubjectSubjectId"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  >
                    <option
                      v-for="subject in data?.subjects"
                      :key="subject._id"
                      :value="subject._id"
                    >
                      {{ subject.name }}
                    </option>
                  </select>
                  <input
                    v-model="editClassSubjectWeeklyPeriods"
                    type="number"
                    min="1"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  />
                </div>
                <div class="flex gap-2 text-sm">
                  <button
                    type="button"
                    @click="saveClassSubjectEdit"
                    class="text-white bg-[#d17c5a] px-3 py-1 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    @click="cancelEditClassSubject"
                    class="text-[#b96547]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <template v-else>
                <span>
                  {{
                    data?.classes.find((klass) => klass._id === allocation.classId)?.name
                  }}
                  ·
                  {{
                    data?.subjects.find((subject) => subject._id === allocation.subjectId)?.name
                  }}
                  · {{ allocation.weeklyPeriods }} / week
                </span>
                <div class="flex gap-3 text-sm">
                  <button
                    type="button"
                    @click="startEditClassSubject(allocation)"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Edit
                  </button>
                  <button
                    @click="removeClassSubject.mutate({ id: allocation._id })"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Delete
                  </button>
                </div>
              </template>
            </li>
          </ul>
        </div>
      </section>

      <section class="grid lg:grid-cols-2 gap-6">
        <div class="bg-[#FFE7DC] border border-[#f0cdbb] rounded-2xl p-6 space-y-4">
          <h3 class="text-xl font-semibold text-[#5a2d1a]">Fixed periods</h3>
          <div class="grid gap-3">
            <select
              v-model="newFixedClassId"
              class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            >
              <option value="">Select class</option>
              <option v-for="klass in data?.classes" :key="klass._id" :value="klass._id">
                {{ klass.name }}
              </option>
            </select>
            <select
              v-model="newFixedSubjectId"
              class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            >
              <option value="">Select subject</option>
              <option v-for="subject in data?.subjects" :key="subject._id" :value="subject._id">
                {{ subject.name }}
              </option>
            </select>
            <div class="grid grid-cols-2 gap-3">
              <select
                v-model="newFixedDay"
                class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
              >
                <option v-for="day in dayOptions" :key="day.index" :value="day.index">
                  {{ day.label }}
                </option>
              </select>
              <input
                v-model="newFixedPeriod"
                type="number"
                min="1"
                class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
                placeholder="Period #"
              />
            </div>
            <button
              @click="addFixedPeriod"
              :disabled="!canAddFixed"
              class="px-5 py-3 rounded-xl bg-[#d17c5a] text-white font-medium hover:bg-[#b96547] transition"
              :class="!canAddFixed ? 'opacity-60 cursor-not-allowed' : ''"
            >
              Lock period
            </button>
          </div>
          <ul class="space-y-2 text-[#5a2d1a]">
            <li
              v-for="fixed in data?.fixedPeriods"
              :key="fixed._id"
              class="flex items-center justify-between bg-[#FFF4EE] rounded-xl px-4 py-2 border border-[#f0cdbb]"
            >
              <div v-if="editingFixedId === fixed._id" class="w-full space-y-2">
                <div class="grid gap-2 md:grid-cols-4">
                  <select
                    v-model="editFixedClassId"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  >
                    <option v-for="klass in data?.classes" :key="klass._id" :value="klass._id">
                      {{ klass.name }}
                    </option>
                  </select>
                  <select
                    v-model="editFixedSubjectId"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  >
                    <option
                      v-for="subject in data?.subjects"
                      :key="subject._id"
                      :value="subject._id"
                    >
                      {{ subject.name }}
                    </option>
                  </select>
                  <select
                    v-model="editFixedDay"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  >
                    <option v-for="day in dayOptions" :key="day.index" :value="day.index">
                      {{ day.label }}
                    </option>
                  </select>
                  <input
                    v-model="editFixedPeriod"
                    type="number"
                    min="1"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  />
                </div>
                <div class="flex gap-2 text-sm">
                  <button
                    type="button"
                    @click="saveFixedEdit"
                    class="text-white bg-[#d17c5a] px-3 py-1 rounded-lg"
                  >
                    Save
                  </button>
                  <button type="button" @click="cancelEditFixed" class="text-[#b96547]">
                    Cancel
                  </button>
                </div>
              </div>
              <template v-else>
                <span>
                  {{
                    data?.classes.find((klass) => klass._id === fixed.classId)?.name
                  }}
                  ·
                  {{
                    data?.subjects.find((subject) => subject._id === fixed.subjectId)?.name
                  }}
                  · {{ dayOptions[fixed.day]?.short }} · Period {{ fixed.period }}
                </span>
                <div class="flex gap-3 text-sm">
                  <button
                    type="button"
                    @click="startEditFixed(fixed)"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Edit
                  </button>
                  <button
                    @click="removeFixedPeriod.mutate({ id: fixed._id })"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Delete
                  </button>
                </div>
              </template>
            </li>
          </ul>
        </div>

        <div class="bg-[#FFE7DC] border border-[#f0cdbb] rounded-2xl p-6 space-y-4">
          <h3 class="text-xl font-semibold text-[#5a2d1a]">Mass subjects</h3>
          <div class="grid gap-3">
            <select
              v-model="newMassSubjectId"
              class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
            >
              <option value="">Select subject</option>
              <option v-for="subject in data?.subjects" :key="subject._id" :value="subject._id">
                {{ subject.name }}
              </option>
            </select>
            <div class="grid grid-cols-2 gap-3">
              <select
                v-model="newMassDay"
                class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
              >
                <option v-for="day in dayOptions" :key="day.index" :value="day.index">
                  {{ day.label }}
                </option>
              </select>
              <input
                v-model="newMassPeriod"
                type="number"
                min="1"
                class="rounded-xl border border-[#f0cdbb] px-4 py-3 bg-[#FFF4EE] text-[#5a2d1a] focus:outline-none focus:ring-2 focus:ring-[#d17c5a]"
                placeholder="Period #"
              />
            </div>
            <div class="bg-[#FFF4EE] border border-[#f0cdbb] rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm text-[#8a4b32]">Select classes</p>
                <div class="flex gap-2 text-xs">
                  <button
                    type="button"
                    @click="selectAllMassClasses"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    @click="clearMassClasses"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="klass in data?.classes"
                  :key="klass._id"
                  @click="toggleMassClass(klass._id)"
                  class="px-3 py-1 rounded-full border text-sm"
                  :class="
                    newMassClassIds.includes(klass._id)
                      ? 'bg-[#d17c5a] text-white border-[#d17c5a]'
                      : 'bg-[#FFF4EE] text-[#5a2d1a] border-[#f0cdbb]'
                  "
                >
                  {{ klass.name }}
                </button>
              </div>
              <p class="text-xs text-[#b07a63]">
                {{ newMassClassIds.length }} classes selected
              </p>
            </div>
            <button
              @click="addMassAssignment"
              :disabled="!canAddMass"
              class="px-5 py-3 rounded-xl bg-[#d17c5a] text-white font-medium hover:bg-[#b96547] transition"
              :class="!canAddMass ? 'opacity-60 cursor-not-allowed' : ''"
            >
              Add mass subject
            </button>
          </div>
          <ul class="space-y-2 text-[#5a2d1a]">
            <li
              v-for="mass in data?.massAssignments"
              :key="mass._id"
              class="flex items-center justify-between bg-[#FFF4EE] rounded-xl px-4 py-2 border border-[#f0cdbb]"
            >
              <div v-if="editingMassId === mass._id" class="w-full space-y-2">
                <div class="grid gap-2 md:grid-cols-4">
                  <select
                    v-model="editMassSubjectId"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  >
                    <option
                      v-for="subject in data?.subjects"
                      :key="subject._id"
                      :value="subject._id"
                    >
                      {{ subject.name }}
                    </option>
                  </select>
                  <select
                    v-model="editMassDay"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  >
                    <option v-for="day in dayOptions" :key="day.index" :value="day.index">
                      {{ day.label }}
                    </option>
                  </select>
                  <input
                    v-model="editMassPeriod"
                    type="number"
                    min="1"
                    class="rounded-xl border border-[#f0cdbb] px-3 py-2 bg-white text-[#5a2d1a]"
                  />
                  <div class="flex items-center text-xs text-[#8a4b32]">
                    {{ editMassClassIds.length }} classes
                  </div>
                </div>
                <div class="bg-white border border-[#f0cdbb] rounded-xl p-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="klass in data?.classes"
                      :key="klass._id"
                      type="button"
                      @click="toggleEditMassClass(klass._id)"
                      class="px-2 py-1 rounded-full border text-xs"
                      :class="
                        editMassClassIds.includes(klass._id)
                          ? 'bg-[#d17c5a] text-white border-[#d17c5a]'
                          : 'bg-[#FFF4EE] text-[#5a2d1a] border-[#f0cdbb]'
                      "
                    >
                      {{ klass.name }}
                    </button>
                  </div>
                </div>
                <div class="flex gap-2 text-sm">
                  <button
                    type="button"
                    @click="saveMassEdit"
                    class="text-white bg-[#d17c5a] px-3 py-1 rounded-lg"
                  >
                    Save
                  </button>
                  <button type="button" @click="cancelEditMass" class="text-[#b96547]">
                    Cancel
                  </button>
                </div>
              </div>
              <template v-else>
                <span>
                  {{
                    data?.subjects.find((subject) => subject._id === mass.subjectId)?.name
                  }}
                  · {{ dayOptions[mass.day]?.short }} · Period {{ mass.period }} ·
                  {{
                    mass.classIds
                      .map((id) => data?.classes.find((klass) => klass._id === id)?.name)
                      .filter(Boolean)
                      .join(", ")
                  }}
                </span>
                <div class="flex gap-3 text-sm">
                  <button
                    type="button"
                    @click="startEditMass(mass)"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Edit
                  </button>
                  <button
                    @click="removeMassAssignment.mutate({ id: mass._id })"
                    class="text-[#b96547] hover:text-[#8a4b32]"
                  >
                    Delete
                  </button>
                </div>
              </template>
            </li>
          </ul>
        </div>
      </section>

      <section class="bg-[#FFE7DC] border border-[#f0cdbb] rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-[#5a2d1a]">Generated timetable</h3>
          <span class="text-sm text-[#8a4b32]">
            Updated automatically with each change
          </span>
        </div>
        <div v-if="timetable.warnings.length" class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-[#8a4b32]">Warnings</p>
            <span class="text-xs text-[#b07a63]">
              {{ timetable.warnings.length }} issues detected
            </span>
          </div>
          <div
            v-if="hasActionableWarnings"
            class="text-xs text-[#8a4b32] bg-[#FFF4EE] border border-[#f0cdbb] rounded-xl p-3"
          >
            Tip: Use the resolve buttons to remove conflicting fixed/mass entries,
            or edit them to adjust the day/period.
          </div>
          <ul class="text-sm text-[#8a4b32] space-y-2">
            <li
              v-for="warning in timetable.warnings"
              :key="warning.id"
              class="flex items-center justify-between gap-3 bg-[#FFF4EE] border border-[#f0cdbb] rounded-xl px-3 py-2"
            >
              <span>{{ warning.message }}</span>
              <div v-if="warning.action?.id" class="flex gap-2 text-xs">
                <button
                  type="button"
                  @click="editWarning(warning)"
                  class="text-[#b96547] hover:text-[#8a4b32]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  @click="resolveWarning(warning)"
                  class="text-[#b96547] hover:text-[#8a4b32]"
                >
                  Resolve
                </button>
              </div>
            </li>
          </ul>
        </div>
        <div class="space-y-8">
          <div
            v-for="schedule in timetable.classSchedules"
            :key="schedule.classId"
            class="bg-[#FFF4EE] border border-[#f0cdbb] rounded-2xl p-5 shadow-sm"
          >
            <h4 class="text-lg font-semibold text-[#5a2d1a] mb-4">
              Class {{ schedule.className }}
            </h4>
            <div class="overflow-x-auto">
              <table class="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th class="text-left text-[#8a4b32] py-2 px-3">Period</th>
                    <th
                      v-for="day in dayOptions"
                      :key="day.index"
                      class="text-left text-[#8a4b32] py-2 px-3"
                    >
                      {{ day.short }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="period in 8" :key="period" class="border-t border-[#f0cdbb]">
                    <td class="py-3 px-3 text-[#8a4b32] font-medium">#{{ period }}</td>
                    <td
                      v-for="day in dayOptions"
                      :key="day.index"
                      class="py-3 px-3"
                    >
                      <div v-if="period <= day.periods">
                        <div
                          v-if="schedule.grid[day.index][period]"
                          class="rounded-xl px-3 py-2 border text-[#5a2d1a]"
                          :class="
                            schedule.grid[day.index][period]?.locked
                              ? 'bg-[#FFD9C7] border-[#d17c5a]'
                              : 'bg-white border-[#f0cdbb]'
                          "
                        >
                          <p class="font-semibold">
                            {{ schedule.grid[day.index][period]?.subjectName }}
                          </p>
                          <p class="text-xs text-[#8a4b32]">
                            {{ schedule.grid[day.index][period]?.teacherName }}
                            <span v-if="schedule.grid[day.index][period]?.locked">
                              · Locked
                            </span>
                          </p>
                        </div>
                        <div v-else class="text-[#b07a63] italic">Unfilled</div>
                      </div>
                      <div v-else class="text-[#d6a08a] italic">—</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="relative z-10 text-center text-sm text-[#8a4b32] py-6">
      Built with Nuxt + Convex
    </footer>
  </div>
</template>

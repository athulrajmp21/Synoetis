import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Award,
  Clock,
  Check,
  Sparkles,
  Calculator,
  CalendarDays,
  MapPin,
  TrendingUp,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { academicService, settingsService } from "@/services/api";
import {
  SemesterItem,
  CourseItem,
  AssessmentItem,
  ClassScheduleItem,
  CreateClassScheduleInput,
  GpaSimulationResult,
} from "@/types/models";
import { AcademicProfileBanner } from "@/components/academic/AcademicProfileBanner";
import { AcademicSetupModal } from "@/components/academic/AcademicSetupModal";

export const AcademicPage: React.FC = () => {
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string>("");
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State: "courses" | "timetable" | "gpa_simulator"
  const [activeTab, setActiveTab] = useState<"courses" | "timetable" | "gpa_simulator">("courses");

  // Timetable Add Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedCourseId, setSchedCourseId] = useState("");
  const [schedDay, setSchedDay] = useState(1);
  const [schedStartTime, setSchedStartTime] = useState("09:00");
  const [schedEndTime, setSchedEndTime] = useState("10:30");
  const [schedRoom, setSchedRoom] = useState("");
  const [schedBuilding, setSchedBuilding] = useState("");
  const [schedType, setSchedType] = useState("lecture");

  // GPA Simulator State
  const [completedCredits, setCompletedCredits] = useState<number>(30);
  const [cumulativeGpa, setCumulativeGpa] = useState<number>(3.65);
  const [simulatedGrades, setSimulatedGrades] = useState<Record<string, string>>({});
  const [simulationResult, setSimulationResult] = useState<GpaSimulationResult | null>(null);

  // Academic Profile State
  const [degree, setDegree] = useState("");
  const [targetGpa, setTargetGpa] = useState("");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Add Course Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseInstructor, setCourseInstructor] = useState("");
  const [targetGrade, setTargetGrade] = useState("A");

  // Add Assessment Modal
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentCourseId, setAssessmentCourseId] = useState("");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("assignment");
  const [assessmentDueDate, setAssessmentDueDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sems, degSetting, gpaSetting] = await Promise.all([
        academicService.getSemesters(),
        settingsService.getSetting("academic_degree"),
        settingsService.getSetting("academic_target_gpa"),
      ]);

      setSemesters(sems);
      if (degSetting) setDegree(degSetting);
      if (gpaSetting) setTargetGpa(gpaSetting);

      if (sems.length > 0) {
        const active = sems.find((s) => s.status === "active") || sems[0];
        setActiveSemesterId(active.id);
        await loadSemesterContent(active.id);
      }
    } catch (e) {
      console.error("Failed to load academic data:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSemesterContent = async (semId: string) => {
    try {
      const [coursesData, assessmentsData, schedulesData] = await Promise.all([
        academicService.getCourses(semId),
        academicService.getAssessments(),
        academicService.getClassSchedules(semId),
      ]);
      setCourses(coursesData);
      setAssessments(assessmentsData);
      setSchedules(schedulesData);

      // Initialize default simulated grades if not already present
      const initialSim: Record<string, string> = {};
      coursesData.forEach((c) => {
        initialSim[c.id] = c.target_grade || "A";
      });
      setSimulatedGrades(initialSim);
    } catch (e) {
      console.error("Failed to load courses:", e);
    }
  };

  const handleSelectSemester = (semId: string) => {
    setActiveSemesterId(semId);
    loadSemesterContent(semId);
  };

  const handleMakeActiveSemester = async (sem: SemesterItem) => {
    try {
      const gpa = targetGpa ? parseFloat(targetGpa) : undefined;
      await academicService.setActiveSemester(sem.number, gpa, degree || undefined);
      const updatedSems = await academicService.getSemesters();
      setSemesters(updatedSems);
    } catch (e) {
      console.error("Failed to update active semester:", e);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseCode.trim() || !activeSemesterId) return;

    try {
      const newCourse = await academicService.createCourse({
        semester_id: activeSemesterId,
        code: courseCode.trim(),
        title: courseTitle.trim(),
        credits: courseCredits,
        instructor: courseInstructor.trim() || undefined,
        target_grade: targetGrade,
      });

      setCourses((prev) => [...prev, newCourse]);
      setCourseCode("");
      setCourseTitle("");
      setCourseInstructor("");
      setIsCourseModalOpen(false);
    } catch (e) {
      console.error("Failed to create course:", e);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    await academicService.deleteCourse(id);
  };

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentTitle.trim() || !assessmentCourseId) return;

    try {
      const created = await academicService.createAssessment({
        course_id: assessmentCourseId,
        title: assessmentTitle.trim(),
        assessment_type: assessmentType,
        due_date: assessmentDueDate || undefined,
      });

      setAssessments((prev) => [...prev, created]);
      setAssessmentTitle("");
      setAssessmentDueDate("");
      setIsAssessmentModalOpen(false);
    } catch (e) {
      console.error("Failed to create assessment:", e);
    }
  };

  const handleToggleAssessment = async (id: string) => {
    const nextStatus = await academicService.toggleAssessmentStatus(id);
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedCourseId) return;

    try {
      const created = await academicService.createClassSchedule({
        course_id: schedCourseId,
        day_of_week: schedDay,
        start_time: schedStartTime,
        end_time: schedEndTime,
        room: schedRoom.trim() || undefined,
        building: schedBuilding.trim() || undefined,
        class_type: schedType,
      });

      setSchedules((prev) => [...prev, created]);
      setIsScheduleModalOpen(false);
      setSchedRoom("");
      setSchedBuilding("");
    } catch (err) {
      console.error("Failed to create class schedule:", err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await academicService.deleteClassSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete schedule slot:", err);
    }
  };

  // Run GPA simulation
  useEffect(() => {
    if (courses.length === 0) return;

    const simulatedCourses = courses.map((c) => ({
      course_id: c.id,
      credits: c.credits,
      simulated_grade: simulatedGrades[c.id] || "A",
    }));

    academicService
      .simulateGpa({
        current_completed_credits: completedCredits,
        current_cumulative_gpa: cumulativeGpa,
        simulated_courses: simulatedCourses,
      })
      .then((res) => setSimulationResult(res))
      .catch((err) => console.error("Simulation error:", err));
  }, [courses, simulatedGrades, completedCredits, cumulativeGpa]);

  const currentActiveSem = semesters.find((s) => s.status === "active");
  const selectedSemester = semesters.find((s) => s.id === activeSemesterId);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Academic OS
            <GraduationCap className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Degree roadmap, course syllabus tracking, credits, and examination calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {courses.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAssessmentCourseId(courses[0].id);
                setIsAssessmentModalOpen(true);
              }}
              className="text-xs border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900"
            >
              <Calendar className="w-3.5 h-3.5 mr-1 text-stone-400" />
              Add Exam / Assignment
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsCourseModalOpen(true)}
            className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Academic Profile Banner */}
      <AcademicProfileBanner
        currentSemester={currentActiveSem ? currentActiveSem.name : undefined}
        degree={degree}
        onOpenSetup={() => setIsSetupModalOpen(true)}
      />

      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/50 dark:bg-stone-900/50 w-fit">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === "courses"
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curriculum & Courses</span>
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === "timetable"
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Weekly Timetable</span>
          {schedules.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 font-mono">
              {schedules.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("gpa_simulator")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === "gpa_simulator"
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>GPA Simulator</span>
        </button>
      </div>

      {/* TAB 1: CURRICULUM & COURSES */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          {/* 8-Semester Horizontal Selector */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-stone-200/80 dark:border-stone-800/80">
            <div className="flex items-center gap-1.5">
              {semesters.map((sem) => {
                const isViewing = activeSemesterId === sem.id;
                const isCurrentActive = sem.status === "active";
                return (
                  <button
                    key={sem.id}
                    onClick={() => handleSelectSemester(sem.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isViewing
                        ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs font-semibold"
                        : "bg-[#F3EFEA] dark:bg-[#191816] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                    }`}
                  >
                    <span>{sem.name}</span>
                    {isCurrentActive && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isViewing ? "bg-emerald-400" : "bg-emerald-500"
                        }`}
                        title="Current Active Semester"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedSemester && selectedSemester.status !== "active" && (
              <button
                onClick={() => handleMakeActiveSemester(selectedSemester)}
                className="text-[11px] font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 underline underline-offset-4 shrink-0 transition"
              >
                Mark as Active Semester
              </button>
            )}
          </div>

          {/* Semester Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Enrolled Courses
              </span>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {courses.length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Semester Credits
              </span>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {totalCredits}{" "}
                <span className="text-xs font-normal text-stone-400">credits</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Upcoming Deadlines
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {assessments.filter((a) => a.status === "pending").length}
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {selectedSemester ? `${selectedSemester.name} Courses` : "Courses"}
              </h3>
            </div>

            {courses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
                <BookOpen className="w-8 h-8 mx-auto text-stone-400 dark:text-stone-600 mb-2" />
                <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  No courses added for {selectedSemester?.name || "this semester"} yet
                </h4>
                <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto mb-4">
                  Add your university subjects (e.g. Data Structures, Operating Systems, Math) to start tracking.
                </p>
                <Button
                  onClick={() => setIsCourseModalOpen(true)}
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold">
                          {c.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                            Target: {c.target_grade || "A"}
                          </span>
                          <button
                            onClick={() => handleDeleteCourse(c.id)}
                            className="text-stone-400 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                            title="Delete course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
                        {c.title}
                      </h4>
                      {c.instructor && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          Instructor: {c.instructor}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span>{c.credits} Credits</span>
                      <span className="capitalize">{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessments & Deadlines Section */}
          {courses.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Upcoming Assessments & Exams
                </h3>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 overflow-hidden">
                {assessments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400 dark:text-stone-500">
                    No assessments scheduled. Click &quot;Add Exam / Assignment&quot; to track deadlines!
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
                    {assessments.map((a) => {
                      const isDone = a.status === "submitted";
                      return (
                        <div
                          key={a.id}
                          className="p-3.5 flex items-center justify-between hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleAssessment(a.id)}
                              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <span
                                className={`font-medium ${
                                  isDone
                                    ? "line-through text-stone-400 dark:text-stone-500"
                                    : "text-stone-900 dark:text-stone-100"
                                }`}
                              >
                                {a.title}
                              </span>
                              <span className="text-[11px] text-stone-400 dark:text-stone-500 ml-2">
                                ({a.course_title})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium capitalize">
                              {a.assessment_type}
                            </span>
                            {a.due_date && (
                              <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {a.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY TIMETABLE */}
      {activeTab === "timetable" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                Weekly Class Timetable & Lecture Schedule
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Organized Monday–Friday schedule grid with classrooms, labs, and time blocks.
              </p>
            </div>

            {courses.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setSchedCourseId(courses[0].id);
                  setIsScheduleModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Class Time Slot
              </Button>
            )}
          </div>

          {/* 5-Day Weekly Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { day: 1, name: "Monday" },
              { day: 2, name: "Tuesday" },
              { day: 3, name: "Wednesday" },
              { day: 4, name: "Thursday" },
              { day: 5, name: "Friday" },
            ].map(({ day, name }) => {
              const daySlots = schedules
                .filter((s) => s.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div
                  key={day}
                  className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#121110] overflow-hidden flex flex-col"
                >
                  {/* Day Header */}
                  <div className="p-3 border-b border-stone-200/80 dark:border-stone-800/80 bg-[#FAF8F5] dark:bg-[#191816] flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {daySlots.length} {daySlots.length === 1 ? "class" : "classes"}
                    </span>
                  </div>

                  {/* Day Slots */}
                  <div className="p-2 space-y-2 flex-1 min-h-[220px]">
                    {daySlots.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-4 text-center text-[11px] text-stone-400 dark:text-stone-600">
                        No classes scheduled
                      </div>
                    ) : (
                      daySlots.map((slot) => {
                        const typeColors =
                          slot.class_type === "lab"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                            : slot.class_type === "tutorial"
                            ? "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30"
                            : "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30";

                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-[#FAF8F5]/80 dark:bg-[#0C0B0A]/80 hover:border-amber-500/40 transition group relative"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded border ${typeColors}`}
                              >
                                {slot.class_type}
                              </span>
                              <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>

                            <div className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                              {slot.course_code}
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                              {slot.course_title}
                            </div>

                            {(slot.room || slot.building) && (
                              <div className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500 mt-2">
                                <MapPin className="w-3 h-3 text-stone-400" />
                                <span>
                                  {slot.room}
                                  {slot.room && slot.building && " • "}
                                  {slot.building}
                                </span>
                              </div>
                            )}

                            {/* Delete on hover */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(slot.id)}
                              className="absolute top-2 right-2 p-1 rounded text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Delete time slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GPA SCENARIO SIMULATOR */}
      {activeTab === "gpa_simulator" && (
        <div className="space-y-6">
          <div className="pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-500" />
              Interactive GPA Scenario Simulator & Degree Forecaster
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Simulate potential final grades for each enrolled course and project your semester GPA and cumulative CGPA in real-time.
            </p>
          </div>

          {/* Results KPI Banner */}
          {simulationResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-[#121110] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Projected Semester GPA
                </span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
                  {simulationResult.semester_gpa.toFixed(2)}
                </div>
                <span className="text-[10px] text-stone-400">
                  Across {simulationResult.semester_credits} credits
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#121110] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Projected Cumulative CGPA
                </span>
                <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono mt-1">
                  {simulationResult.projected_cumulative_gpa.toFixed(2)}
                </div>
                <span className="text-[10px] text-stone-400">
                  Total {simulationResult.cumulative_credits} completed
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#121110] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  CGPA Impact / Delta
                </span>
                <div
                  className={`text-2xl font-bold font-mono mt-1 flex items-center gap-1 ${
                    simulationResult.gpa_change >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>
                    {simulationResult.gpa_change >= 0 ? "+" : ""}
                    {simulationResult.gpa_change.toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400">Relative to prior CGPA</span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#121110] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Target GPA Gap
                </span>
                <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono mt-1">
                  {targetGpa ? (
                    <span
                      className={
                        simulationResult.projected_cumulative_gpa >= parseFloat(targetGpa)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {(simulationResult.projected_cumulative_gpa - parseFloat(targetGpa)).toFixed(2)}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </div>
                <span className="text-[10px] text-stone-400">
                  Target: {targetGpa || "Not configured"}
                </span>
              </div>
            </div>
          )}

          {/* Baseline Configuration Form */}
          <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-[#121110]/70 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Completed Credits (Prior):
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={completedCredits}
                onChange={(e) => setCompletedCredits(parseFloat(e.target.value) || 0)}
                className="w-20 text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-900 dark:text-stone-100 font-mono text-center"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Prior Cumulative CGPA:
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={4.0}
                value={cumulativeGpa}
                onChange={(e) => setCumulativeGpa(parseFloat(e.target.value) || 0)}
                className="w-20 text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-900 dark:text-stone-100 font-mono text-center"
              />
            </div>
          </div>

          {/* Courses Simulation Matrix */}
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#121110] overflow-hidden">
            <div className="p-3.5 border-b border-stone-200/80 dark:border-stone-800/80 font-bold text-xs text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>Current Semester Courses</span>
              <span className="text-[11px] font-normal text-stone-400">
                Select simulated grade to see instant projected GPA
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No courses enrolled in the current semester. Add courses in the Curriculum tab first!
              </div>
            ) : (
              <div className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
                {courses.map((course) => {
                  const currentSim = simulatedGrades[course.id] || "A";

                  return (
                    <div
                      key={course.id}
                      className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-stone-50 dark:hover:bg-stone-900/30 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                          {course.code}
                        </span>
                        <div className="truncate">
                          <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {course.title}
                          </div>
                          <div className="text-[11px] text-stone-400">{course.credits} Credits</div>
                        </div>
                      </div>

                      {/* Grade Selector */}
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-[11px] text-stone-500">Simulated Grade:</label>
                        <select
                          value={currentSim}
                          onChange={(e) =>
                            setSimulatedGrades((prev) => ({
                              ...prev,
                              [course.id]: e.target.value,
                            }))
                          }
                          className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
                        >
                          <option value="A">A (4.00)</option>
                          <option value="A-">A- (3.70)</option>
                          <option value="B+">B+ (3.30)</option>
                          <option value="B">B (3.00)</option>
                          <option value="B-">B- (2.70)</option>
                          <option value="C+">C+ (2.30)</option>
                          <option value="C">C (2.00)</option>
                          <option value="F">F (0.00)</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Class Time Slot Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-[#FAF8F5] dark:bg-[#121110] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800/80 mb-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                Add Class Schedule Slot
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Course *
                </label>
                <select
                  value={schedCourseId}
                  onChange={(e) => setSchedCourseId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Day of Week *
                  </label>
                  <select
                    value={schedDay}
                    onChange={(e) => setSchedDay(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Class Type
                  </label>
                  <select
                    value={schedType}
                    onChange={(e) => setSchedType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="seminar">Seminar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    placeholder="LH-102"
                    value={schedRoom}
                    onChange={(e) => setSchedRoom(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Building / Block
                  </label>
                  <input
                    type="text"
                    placeholder="Turing Block"
                    value={schedBuilding}
                    onChange={(e) => setSchedBuilding(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  Add Time Slot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academic Setup Modal */}
      <AcademicSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSaved={loadData}
        initialSemester={currentActiveSem ? currentActiveSem.number : 1}
        initialDegree={degree}
        initialGpa={targetGpa}
      />

      {/* Add Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
              Add Course to {selectedSemester?.name || "Semester"}
            </h3>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="CS201"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Data Structures & Algorithms"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(parseInt(e.target.value) || 3)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Target Grade
                  </label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  >
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Instructor (Optional)
                </label>
                <input
                  type="text"
                  value={courseInstructor}
                  onChange={(e) => setCourseInstructor(e.target.value)}
                  placeholder="Prof. Smith"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="text-xs border-stone-200 dark:border-stone-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  Save Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assessment Modal */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
              Add Exam / Assignment
            </h3>
            <form onSubmit={handleAddAssessment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Course *
                </label>
                <select
                  value={assessmentCourseId}
                  onChange={(e) => setAssessmentCourseId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination / Assignment 2"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Type
                  </label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="midterm">Midterm Exam</option>
                    <option value="final">Final Exam</option>
                    <option value="quiz">Quiz</option>
                    <option value="lab">Lab Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={assessmentDueDate}
                    onChange={(e) => setAssessmentDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssessmentModalOpen(false)}
                  className="text-xs border-stone-200 dark:border-stone-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  Save Assessment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

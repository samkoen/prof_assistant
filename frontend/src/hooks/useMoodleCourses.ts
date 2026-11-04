import { useCallback, useEffect, useState } from "react";
import { api, type CourseOffering } from "../api/client";
import {
  fetchMoodleCourses,
  importMoodleCourse,
  importMoodleStudents,
  moodleError,
  type MoodleCourseItem,
  type MoodleStudentImportResult,
} from "../api/moodle";
import { he } from "../i18n/he";

export interface MoodleCourseState {
  courses: MoodleCourseItem[];
  offerings: CourseOffering[];
  loading: boolean;
  busy: boolean;
  error: string;
  setError: (value: string) => void;
  notice: string;
  setNotice: (value: string) => void;
  report: MoodleStudentImportResult | null;
  reportOfferingId: number | null;
  reload: () => Promise<void>;
  createCourse: (courseId: number) => Promise<void>;
  linkCourse: (courseId: number, offeringId: number) => Promise<void>;
  importStudents: (offeringId: number) => Promise<void>;
}

export function useMoodleCourses(enabled: boolean): MoodleCourseState {
  const data = useMoodleCourseData(enabled);
  return { ...data, ...useMoodleCourseActions(data) };
}

function useMoodleCourseData(enabled: boolean) {
  const [courses, setCourses] = useState<MoodleCourseItem[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState<MoodleStudentImportResult | null>(null);
  const [reportOfferingId, setReportOfferingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [courseRows, offeringRows] = await Promise.all([
        fetchMoodleCourses(),
        api<CourseOffering[]>("/api/courses/mine"),
      ]);
      setCourses(courseRows);
      setOfferings(offeringRows);
    } catch (err) {
      setError(moodleError(err));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    courses, offerings, loading, busy, setBusy, error, setError, notice, setNotice,
    report, setReport, reportOfferingId, setReportOfferingId, reload,
  };
}

function useMoodleCourseActions(data: ReturnType<typeof useMoodleCourseData>) {
  const createCourse = (courseId: number) => runImport(data, () => importMoodleCourse(courseId), he.moodleLinked);
  const linkCourse = (courseId: number, offeringId: number) =>
    runImport(data, () => importMoodleCourse(courseId, offeringId), he.moodleLinked);
  const importStudents = (offeringId: number) => runStudentImport(data, offeringId);
  return { createCourse, linkCourse, importStudents };
}

async function runImport(
  data: ReturnType<typeof useMoodleCourseData>,
  action: () => Promise<unknown>,
  notice: string,
) {
  data.setBusy(true);
  data.setError("");
  data.setNotice("");
  try {
    await action();
    data.setNotice(notice);
    await data.reload();
  } catch (err) {
    data.setError(moodleError(err));
  } finally {
    data.setBusy(false);
  }
}

async function runStudentImport(data: ReturnType<typeof useMoodleCourseData>, offeringId: number) {
  data.setBusy(true);
  data.setError("");
  data.setNotice("");
  try {
    const result = await importMoodleStudents(offeringId);
    data.setReport(result);
    data.setReportOfferingId(offeringId);
    data.setNotice(he.moodleEnrolled(result.enrolled));
  } catch (err) {
    data.setError(moodleError(err));
  } finally {
    data.setBusy(false);
  }
}

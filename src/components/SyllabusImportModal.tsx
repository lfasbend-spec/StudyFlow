import React, { useState } from 'react';
import { Course, AcademicItem, StudyCheckpoint } from '../types';
import { Sparkles, Upload, FileText, CheckCircle2, Circle, AlertCircle, X, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

interface SyllabusImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (course: Course, items: AcademicItem[]) => void;
}

interface ExtractedCourse {
  code: string;
  name: string;
  instructor?: string;
  targetGrade?: string;
  description?: string;
}

interface ExtractedItem {
  title: string;
  type: 'assignment' | 'exam' | 'quiz' | 'project' | 'reading';
  dueDate: string;
  time?: string;
  location?: string;
  weight?: string;
  notes?: string;
  studyCheckpoints?: { title: string; targetDate: string; notes?: string }[];
  selected?: boolean;
}

export const SyllabusImportModal: React.FC<SyllabusImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'samples'>('paste');
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);

  // Loading & Progress
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionStep, setExtractionStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review Stage
  const [reviewStage, setReviewStage] = useState<boolean>(false);
  const [extractedCourse, setExtractedCourse] = useState<ExtractedCourse | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [courseColor, setCourseColor] = useState<string>('pink');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 without prefix data:...;base64,
      const base64Data = result.split(',')[1];
      setFileBase64(base64Data);
      setFileMimeType(file.type || 'text/plain');
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = (sampleId: string) => {
    if (sampleId === 'cs201') {
      setSyllabusText(`CS 201: Data Structures and Algorithms - Fall Semester
Instructor: Dr. Evelyn Vance (Office Hours: Mon/Wed 2-4 PM)
Schedule of Deadlines & Exams:
1. Programming Assignment 1: Array-Based Lists & Big-O Analysis - Due November 10, 2026 at 11:59 PM (Weight: 6%)
2. Midterm Exam 1: Stacks, Queues, Binary Search Trees - November 18, 2026 from 10:00 AM - 11:30 AM (Room 304 Turing Hall, Weight: 20%)
3. Programming Assignment 2: Balanced Trees (AVL & Red-Black) - Due November 25, 2026 at 11:59 PM (Weight: 8%)
4. Homework 3: Hash Tables & Collision Resolution - Due December 2, 2026 at 11:59 PM (Weight: 8%)
5. Midterm Exam 2: Graphs, BFS/DFS, Dijkstra's Algorithm - December 8, 2026 from 10:00 AM - 11:30 AM (Room 304 Turing Hall, Weight: 20%)
6. Programming Assignment 4: Minimum Spanning Trees & Dynamic Programming - Due December 14, 2026 at 11:59 PM (Weight: 8%)
7. Final Examination (Comprehensive with focus on P vs NP & Advanced Graphs) - December 19, 2026 from 2:00 PM - 5:00 PM (Main Auditorium, Weight: 25%)`);
      setActiveTab('paste');
    } else if (sampleId === 'chem220') {
      setSyllabusText(`CHEM 220: Organic Chemistry I
Instructor: Prof. Marcus Chen
- Problem Set 1 (Stereochemistry): Due November 9, 2026 at 5:00 PM (Weight: 5%)
- Lab Report 1: Distillation & Chromatography: Due November 12, 2026 at 11:59 PM (Weight: 7%)
- Midterm Exam: Substitution & Elimination Reactions (SN1, SN2, E1, E2): November 20, 2026 at 9:00 AM (Chemistry Bldg Room 101, Weight: 25%)
- Problem Set 2 (Alkenes & Alkynes): Due December 1, 2026 at 5:00 PM (Weight: 5%)
- Lab Practical Exam: Organic Compound Unknowns: December 7, 2026 at 1:00 PM (Weight: 15%)
- Final Exam: Cumulative Reaction Mechanisms: December 16, 2026 at 8:30 AM (Weight: 35%)`);
      setActiveTab('paste');
    } else if (sampleId === 'bio110') {
      setSyllabusText(`BIO 110: Molecular & Cellular Biology
Instructor: Dr. Aris Thorne
- Quiz 1 (DNA Replication & Repair): November 11, 2026 at 11:59 PM (Weight: 5%)
- Research Paper Draft: CRISPR Gene Editing: Due November 23, 2026 at 11:59 PM (Weight: 10%)
- Exam 2 (Cell Signaling & Gene Expression): November 30, 2026 at 11:00 AM (Science Hall 202, Weight: 25%)
- Final Research Paper Submission: Due December 9, 2026 at 11:59 PM (Weight: 15%)
- Final Exam (Cellular Respiration, Photosynthesis & Genetics): December 18, 2026 at 10:00 AM (Weight: 30%)`);
      setActiveTab('paste');
    }
  };

  const handleStartExtraction = async () => {
    if (!syllabusText.trim() && !fileBase64) {
      setErrorMessage('Please paste your syllabus text or choose a document first.');
      return;
    }

    setErrorMessage(null);
    setIsExtracting(true);
    setExtractionStep('Scanning syllabus text with Gemini AI...');

    try {
      const stepTimer1 = setTimeout(() => {
        setExtractionStep('Extracting course schedule, assignments, and test dates...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setExtractionStep('Synthesizing progressive multi-phase study checkpoints for exams...');
      }, 2500);

      const res = await fetch('/api/extract-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: syllabusText || undefined,
          fileData: fileBase64 || undefined,
          mimeType: fileMimeType || undefined,
          currentDateContext: new Date().toISOString().split('T')[0],
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with code ${res.status}`);
      }

      const data = await res.json();

      if (!data.course || !data.items) {
        throw new Error('Could not parse valid course items from the provided syllabus.');
      }

      setExtractedCourse(data.course);
      // Mark all extracted items as selected by default
      setExtractedItems(
        data.items.map((item: any) => ({
          ...item,
          selected: true,
        }))
      );
      setReviewStage(true);
    } catch (err: any) {
      console.error('Failed to extract syllabus:', err);
      setErrorMessage(
        err.message || 'Unable to extract syllabus. Check your internet connection or API key.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleItemSelection = (index: number) => {
    setExtractedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleConfirmImport = () => {
    if (!extractedCourse) return;

    const newCourseId = `course-${Date.now()}`;
    const courseToSave: Course = {
      id: newCourseId,
      code: extractedCourse.code || 'COURSE',
      name: extractedCourse.name || 'Enrolled Course',
      color: courseColor,
      instructor: extractedCourse.instructor,
      targetGrade: extractedCourse.targetGrade || 'A',
      description: extractedCourse.description,
    };

    const selectedItems = extractedItems.filter((i) => i.selected);
    const itemsToSave: AcademicItem[] = selectedItems.map((item, idx) => {
      const itemId = `item-${Date.now()}-${idx}`;
      return {
        id: itemId,
        courseId: newCourseId,
        title: item.title,
        type: item.type,
        dueDate: item.dueDate,
        time: item.time,
        location: item.location,
        weight: item.weight,
        completed: false,
        notes: item.notes,
        createdAt: new Date().toISOString(),
        studyCheckpoints: item.studyCheckpoints
          ? item.studyCheckpoints.map((chk, chkIdx) => ({
              id: `chk-${itemId}-${chkIdx}`,
              title: chk.title,
              targetDate: chk.targetDate,
              completed: false,
              notes: chk.notes,
            }))
          : undefined,
      };
    });

    onImportComplete(courseToSave, itemsToSave);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-pink-100/80 dark:border-pink-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/80 text-pink-600 dark:text-pink-300 flex items-center justify-center border border-pink-100 dark:border-pink-900/40 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-pink-50">
                {reviewStage ? 'Review Extracted Course & Deadlines' : 'Import Course Syllabus with AI'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-pink-300/80">
                {reviewStage
                  ? 'Verify detected assignments and auto-generated study milestones'
                  : 'Automatically parses assignments, test dates, and generates study milestones'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-pink-600 dark:hover:text-pink-300 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!reviewStage ? (
            <>
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-pink-50/70 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 rounded-xl mb-5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                    activeTab === 'paste'
                      ? 'bg-white dark:bg-[#23121d] text-pink-700 dark:text-pink-200 shadow-sm border border-pink-100 dark:border-pink-900/50 font-semibold'
                      : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Paste Syllabus Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-[#23121d] text-pink-700 dark:text-pink-200 shadow-sm border border-pink-100 dark:border-pink-900/50 font-semibold'
                      : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Upload File / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('samples')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                    activeTab === 'samples'
                      ? 'bg-white dark:bg-[#23121d] text-pink-700 dark:text-pink-200 shadow-sm border border-pink-100 dark:border-pink-900/50 font-semibold'
                      : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sample Syllabi
                </button>
              </div>

              {/* Tab 1: Paste Text */}
              {activeTab === 'paste' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-pink-200 mb-1.5">
                    Paste your course syllabus, schedule table, or assignment list:
                  </label>
                  <textarea
                    rows={9}
                    placeholder="e.g. CS 101: Intro to Computing&#10;Midterm Exam 1: October 24 (25% of grade)&#10;Homework 1 due October 30 at 11:59 PM&#10;Final Project due December 12..."
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-mono text-slate-800 dark:text-pink-100"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-pink-300/80 mt-1">
                    Tip: You can paste the schedule section, assignment table, or the entire course outline. Gemini automatically extracts dates, titles, and calculates study prep phases.
                  </p>
                </div>
              )}

              {/* Tab 2: Upload File */}
              {activeTab === 'upload' && (
                <div>
                  <div className="border-2 border-dashed border-pink-200 dark:border-pink-900/60 rounded-2xl p-8 text-center bg-pink-50/30 dark:bg-pink-950/20 hover:border-pink-400 transition-colors">
                    <Upload className="w-10 h-10 text-pink-400 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-pink-100 mb-1">
                      Drop syllabus file or click to browse
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-pink-300/80 mb-4">
                      Supports PDF, TXT, DOCX, or syllabus schedule screenshots (PNG/JPG)
                    </p>
                    <input
                      type="file"
                      id="syllabusFileInput"
                      accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="syllabusFileInput"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl transition-colors shadow-sm shadow-pink-200/50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{selectedFile ? 'Change File' : 'Choose Document'}</span>
                    </label>

                    {selectedFile && (
                      <div className="mt-4 p-2.5 bg-white dark:bg-[#23121d] rounded-xl border border-pink-100 dark:border-pink-900/60 inline-flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-pink-200">
                        <FileText className="w-4 h-4 text-pink-500" />
                        <span>{selectedFile.name}</span>
                        <span className="text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Sample Syllabi */}
              {activeTab === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-pink-300/80 mb-3">
                    Select a realistic university course syllabus to see how the AI automatically organizes deadlines and study checkpoints:
                  </p>

                  <button
                    type="button"
                    onClick={() => handleLoadSample('cs201')}
                    className="w-full text-left p-3.5 rounded-xl border border-pink-100 dark:border-pink-900/50 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 transition-all flex items-start justify-between"
                  >
                    <div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-pink-50 block">
                        CS 201: Data Structures & Algorithms
                      </span>
                      <span className="text-xs text-slate-500 dark:text-pink-300/80 block mt-0.5">
                        Dr. Evelyn Vance · 4 Programming Projects, 2 Midterms, 1 Comprehensive Final
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-pink-600 dark:text-pink-300 shrink-0">
                      Load Sample &rarr;
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSample('chem220')}
                    className="w-full text-left p-3.5 rounded-xl border border-pink-100 dark:border-pink-900/50 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 transition-all flex items-start justify-between"
                  >
                    <div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-pink-50 block">
                        CHEM 220: Organic Chemistry I
                      </span>
                      <span className="text-xs text-slate-500 dark:text-pink-300/80 block mt-0.5">
                        Prof. Marcus Chen · Problem Sets, Stereochemistry Lab, Substitution Midterm & Final
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-pink-600 dark:text-pink-300 shrink-0">
                      Load Sample &rarr;
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSample('bio110')}
                    className="w-full text-left p-3.5 rounded-xl border border-pink-100 dark:border-pink-900/50 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 transition-all flex items-start justify-between"
                  >
                    <div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-pink-50 block">
                        BIO 110: Principles of Molecular Biology
                      </span>
                      <span className="text-xs text-slate-500 dark:text-pink-300/80 block mt-0.5">
                        Dr. Aris Thorne · CRISPR Paper Draft, DNA Quizzes, Midterm & Cumulative Final
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-pink-600 dark:text-pink-300 shrink-0">
                      Load Sample &rarr;
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Review Stage */
            <div className="space-y-5">
              {/* Course Card Preview */}
              <div className="p-4 rounded-xl bg-pink-50/40 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-pink-50">
                        {extractedCourse?.code}: {extractedCourse?.name}
                      </span>
                    </div>
                    {extractedCourse?.instructor && (
                      <span className="text-xs text-slate-500 dark:text-pink-300/80 block mt-0.5">
                        Instructor: {extractedCourse.instructor}
                      </span>
                    )}
                  </div>

                  {/* Course Color Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-pink-300/80 font-medium">Color:</span>
                    <div className="flex items-center gap-1.5">
                      {['pink', 'rose', 'fuchsia', 'emerald', 'sky', 'amber'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCourseColor(color)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${
                            color === 'pink'
                              ? 'bg-pink-400'
                              : color === 'rose'
                              ? 'bg-rose-400'
                              : color === 'fuchsia'
                              ? 'bg-fuchsia-400'
                              : color === 'emerald'
                              ? 'bg-emerald-500'
                              : color === 'sky'
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          } ${courseColor === color ? 'scale-125 border-pink-300 dark:border-pink-500 shadow-sm' : 'border-transparent opacity-70'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Extracted Tasks Table / List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-pink-300 uppercase tracking-wider">
                    Extracted Deliverables & Study Checkpoints ({extractedItems.filter((i) => i.selected).length}/{extractedItems.length} selected)
                  </h4>
                  <button
                    onClick={() => {
                      const allSelected = extractedItems.every((i) => i.selected);
                      setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
                    }}
                    className="text-xs text-pink-600 dark:text-pink-300 hover:underline"
                  >
                    {extractedItems.every((i) => i.selected) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {extractedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        item.selected
                          ? 'border-pink-100 dark:border-pink-900/50 bg-[#FFFDFE] dark:bg-[#1f101a]'
                          : 'border-pink-100/60 dark:border-pink-900/30 bg-pink-50/20 dark:bg-pink-950/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleItemSelection(idx)}
                          className="mt-0.5 text-slate-300 hover:text-pink-500 shrink-0"
                        >
                          {item.selected ? (
                            <CheckCircle2 className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 dark:text-pink-100">
                              {item.title}
                            </span>
                            <span aria-hidden="true" className="text-pink-200">·</span>
                            <span className="uppercase text-[10px] font-bold text-pink-600 dark:text-pink-300">
                              {item.type}
                            </span>
                            <span aria-hidden="true" className="text-pink-200">·</span>
                            <span className="font-mono text-slate-600 dark:text-pink-300/80">
                              Due: {formatDate(item.dueDate, { shortMonth: true })}
                            </span>
                            {item.weight && (
                              <>
                                <span aria-hidden="true" className="text-pink-200">·</span>
                                <span className="text-slate-500 dark:text-pink-400/80 font-medium">{item.weight}</span>
                              </>
                            )}
                          </div>

                          {/* Render auto-generated study milestones for exams */}
                          {item.studyCheckpoints && item.studyCheckpoints.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-pink-100/80 dark:border-pink-900/40 space-y-1 bg-pink-50/40 dark:bg-pink-950/20 p-2 rounded-lg">
                              <span className="text-[11px] font-semibold text-pink-900 dark:text-pink-200 block">
                                Generated Study Roadmap:
                              </span>
                              {item.studyCheckpoints.map((chk, cIdx) => (
                                <div key={cIdx} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-pink-300/80">
                                  <span>• {chk.title}</span>
                                  <span className="font-mono text-slate-500 dark:text-pink-400/80">
                                    Target: {formatDate(chk.targetDate, { shortMonth: true })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-pink-100 dark:border-pink-900/40 bg-[#FFF9FB] dark:bg-[#1a0e17]/80 flex items-center justify-between">
          {!reviewStage ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isExtracting || (!syllabusText.trim() && !fileBase64)}
                onClick={handleStartExtraction}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm shadow-pink-200/50 transition-all"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{extractionStep}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Schedule & Milestones</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setReviewStage(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-pink-300 hover:text-slate-900"
              >
                &larr; Back to Input
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={extractedItems.filter((i) => i.selected).length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 rounded-xl shadow-sm shadow-pink-200/50 transition-all"
              >
                <span>Import {extractedItems.filter((i) => i.selected).length} Tasks to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

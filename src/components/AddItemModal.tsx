import React, { useState, useEffect } from 'react';
import { AcademicItem, Course, ItemType, StudyCheckpoint } from '../types';
import { X, Plus, Trash2, Sparkles, Loader2, Calendar } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: AcademicItem) => void;
  courses: Course[];
  initialItem?: AcademicItem | null;
  defaultDate?: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  courses,
  initialItem,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState<ItemType>('assignment');
  const [dueDate, setDueDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [weight, setWeight] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [notes, setNotes] = useState('');
  const [checkpoints, setCheckpoints] = useState<StudyCheckpoint[]>([]);
  const [isGeneratingCheckpoints, setIsGeneratingCheckpoints] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setCourseId(initialItem.courseId);
      setType(initialItem.type);
      setDueDate(initialItem.dueDate);
      setTime(initialItem.time || '');
      setLocation(initialItem.location || '');
      setWeight(initialItem.weight || '');
      setScore(initialItem.score !== undefined ? String(initialItem.score) : '');
      setMaxScore(initialItem.maxScore !== undefined ? String(initialItem.maxScore) : '');
      setNotes(initialItem.notes || '');
      setCheckpoints(initialItem.studyCheckpoints || []);
    } else {
      setTitle('');
      setCourseId(courses[0]?.id || '');
      setType('assignment');
      setDueDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime('11:59 PM');
      setLocation('');
      setWeight('');
      setScore('');
      setMaxScore('');
      setNotes('');
      setCheckpoints([]);
    }
  }, [initialItem, defaultDate, courses, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: ItemType) => {
    setType(newType);
    if ((newType === 'exam' || newType === 'project') && checkpoints.length === 0 && dueDate) {
      generateDefaultCheckpoints(dueDate);
    }
  };

  const generateDefaultCheckpoints = (targetDueDate: string) => {
    const examDate = new Date(targetDueDate);
    const d1 = new Date(examDate);
    d1.setDate(d1.getDate() - 7);
    const d2 = new Date(examDate);
    d2.setDate(d2.getDate() - 3);
    const d3 = new Date(examDate);
    d3.setDate(d3.getDate() - 1);

    setCheckpoints([
      {
        id: `chk-manual-1-${Date.now()}`,
        title: 'Phase 1: Concept & Lecture Notes Synthesis',
        targetDate: d1.toISOString().split('T')[0],
        completed: false,
        notes: 'Review key terms, readings, and lecture slides.',
      },
      {
        id: `chk-manual-2-${Date.now()}`,
        title: 'Phase 2: Practice Problem Sets & Flashcards',
        targetDate: d2.toISOString().split('T')[0],
        completed: false,
        notes: 'Active recall and solving past exams.',
      },
      {
        id: `chk-manual-3-${Date.now()}`,
        title: 'Phase 3: Timed Mock Exam & Formula Sheet',
        targetDate: d3.toISOString().split('T')[0],
        completed: false,
        notes: 'Simulate real test conditions.',
      },
    ]);
  };

  const handleAIGenerateCheckpoints = async () => {
    if (!title.trim() || !dueDate) {
      alert('Please enter a title and exam date first.');
      return;
    }

    setIsGeneratingCheckpoints(true);
    try {
      const selectedCourse = courses.find((c) => c.id === courseId);
      const res = await fetch('/api/generate-checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          courseName: selectedCourse?.name,
          examDate: dueDate,
          topics: notes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate');
      }

      const data = await res.json();
      if (data.checkpoints && Array.isArray(data.checkpoints)) {
        setCheckpoints(
          data.checkpoints.map((c: any, idx: number) => ({
            id: `chk-ai-${Date.now()}-${idx}`,
            title: c.title,
            targetDate: c.targetDate,
            completed: false,
            notes: c.notes,
          }))
        );
      }
    } catch (err) {
      console.warn('Fallback to local checkpoint generation:', err);
      generateDefaultCheckpoints(dueDate);
    } finally {
      setIsGeneratingCheckpoints(false);
    }
  };

  const handleAddCheckpointRow = () => {
    const d = new Date(dueDate || new Date());
    d.setDate(d.getDate() - 2);
    setCheckpoints((prev) => [
      ...prev,
      {
        id: `chk-${Date.now()}`,
        title: 'Study Checkpoint',
        targetDate: d.toISOString().split('T')[0],
        completed: false,
      },
    ]);
  };

  const handleUpdateCheckpoint = (index: number, field: keyof StudyCheckpoint, value: any) => {
    setCheckpoints((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCheckpoint = (index: number) => {
    setCheckpoints((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !courseId) return;

    const numScore = score.trim() !== '' ? parseFloat(score) : undefined;
    const numMax = maxScore.trim() !== '' ? parseFloat(maxScore) : undefined;

    const savedItem: AcademicItem = {
      id: initialItem ? initialItem.id : `item-${Date.now()}`,
      courseId,
      title: title.trim(),
      type,
      dueDate,
      time: time.trim() || undefined,
      location: location.trim() || undefined,
      weight: weight.trim() || undefined,
      notes: notes.trim() || undefined,
      score: numScore !== undefined && !isNaN(numScore) ? numScore : undefined,
      maxScore: numMax !== undefined && !isNaN(numMax) ? numMax : undefined,
      gradedDate: numScore !== undefined ? (initialItem?.gradedDate || new Date().toISOString().split('T')[0]) : undefined,
      completed: initialItem ? initialItem.completed : (numScore !== undefined ? true : false),
      createdAt: initialItem ? initialItem.createdAt : new Date().toISOString(),
      studyCheckpoints: checkpoints.length > 0 ? checkpoints : undefined,
    };

    onSaveItem(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-pink-100/80 dark:border-pink-900/40 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-pink-50">
            {initialItem ? 'Edit Task or Exam' : 'Add New Task or Exam'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-pink-600 dark:hover:text-pink-300 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
              Title / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm Exam 1, Problem Set 3, Essay Draft"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
            />
          </div>

          {/* Course & Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Course *
              </label>
              <select
                required
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Deliverable Type *
              </label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as ItemType)}
                className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
              >
                <option value="assignment">Assignment / Problem Set</option>
                <option value="exam">Exam (Midterm / Final)</option>
                <option value="quiz">Quiz</option>
                <option value="project">Project / Paper</option>
                <option value="reading">Reading / Chapter Prep</option>
              </select>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Due Date / Exam Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (type === 'exam' && checkpoints.length === 0) {
                    generateDefaultCheckpoints(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Time (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 11:59 PM or 10:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
              />
            </div>
          </div>

          {/* Location & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Weight / Grade Value
              </label>
              <input
                type="text"
                placeholder="e.g. 20% of final grade"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Location or Submission Portal
              </label>
              <input
                type="text"
                placeholder="e.g. Canvas, Room 304, Gradescope"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
              />
            </div>
          </div>

          {/* Optional Grade Recorded */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-pink-50/40 dark:bg-pink-950/30 p-3 rounded-xl border border-pink-100 dark:border-pink-900/40">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Score Earned (Optional)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 95 (leave empty if pending)"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1a0e17] border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                Max Score (Default 100)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                placeholder="100"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1a0e17] border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
              Notes / Chapters / Covered Topics
            </label>
            <textarea
              rows={2}
              placeholder="Key concepts, formula sheet rules, or submission directions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
            />
          </div>

          {/* Exam / Major Study Checkpoints Section */}
          <div className="pt-3 border-t border-pink-100/80 dark:border-pink-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 dark:text-pink-200 block">
                Studying Checkpoints & Milestones
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAIGenerateCheckpoints}
                  disabled={isGeneratingCheckpoints}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline disabled:opacity-50"
                >
                  {isGeneratingCheckpoints ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Generate with AI</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddCheckpointRow}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-pink-300 hover:text-slate-900"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>

            {checkpoints.length === 0 ? (
              <p className="text-[11px] text-slate-400 dark:text-pink-900/60 italic py-1">
                No studying checkpoints configured yet. Click "Generate with AI" or "Add Step" to set milestone deadlines.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {checkpoints.map((chk, idx) => (
                  <div
                    key={chk.id || idx}
                    className="flex items-center gap-2 bg-pink-50/40 dark:bg-pink-950/20 p-2 rounded-xl border border-pink-100 dark:border-pink-900/40"
                  >
                    <input
                      type="text"
                      placeholder="Checkpoint goal e.g. Phase 1: Review Chapters 1-4"
                      value={chk.title}
                      onChange={(e) => handleUpdateCheckpoint(idx, 'title', e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-[#1f101a] border border-pink-100 dark:border-pink-900/60 rounded-lg text-slate-900 dark:text-pink-50"
                    />
                    <input
                      type="date"
                      value={chk.targetDate}
                      onChange={(e) => handleUpdateCheckpoint(idx, 'targetDate', e.target.value)}
                      className="w-32 px-2.5 py-1 text-xs bg-white dark:bg-[#1f101a] border border-pink-100 dark:border-pink-900/60 rounded-lg font-mono text-slate-900 dark:text-pink-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCheckpoint(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-pink-100 dark:border-pink-900/40 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-sm shadow-pink-200/50 transition-all"
            >
              {initialItem ? 'Update Item' : 'Add to Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

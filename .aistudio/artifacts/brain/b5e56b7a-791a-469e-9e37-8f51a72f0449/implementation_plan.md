# SyllabusSync & StudyFlow — Academic Deadline & Exam Prep Workspace

An intelligent academic organizational workspace that automatically parses syllabi and schedules into structured assignments, quizzes, and exam dates, generating multi-stage study checkpoints with countdowns to keep students on track for top course grades.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following design and workflow decisions were confirmed in Phase 1 and guide this plan:

- **Confirmed Decision 1: Automatic Ingestion via AI Parser**: Students can paste syllabus text, upload document/schedule files (or use sample demo syllabi), and the backend Gemini API (`gemini-3.8-flash`) will extract courses, assignments, due dates, test dates, exam weights, and suggested study topics into structured records.
- **Confirmed Decision 2: Multi-Stage Study Milestones**: For every exam, the system creates structured preparation checkpoints:
  1. *Phase 1 — Concept Review & Readings* (e.g., 7–10 days out)
  2. *Phase 2 — Practice Sets, Problem Sets & Flashcards* (e.g., 3–5 days out)
  3. *Phase 3 — Timed Mock Exam & Formula Sheet Memorization* (e.g., 1–2 days out)
  4. *Exam Day Ready Checkpoint*
  Students can check off each checkpoint, track completion percentage, and see dynamic urgency countdowns.
- **Confirmed Decision 3: Modern Academic Workspace**: Dual view modes (Chronological Due Date Timeline + Interactive Monthly Calendar View), course color tags, search and filter by course/type, priority sorting, and persistent local storage with export/import options.
- **Recommended Choice — Initial Sample State**: Pre-populated with realistic university courses (e.g., *CS 201: Data Structures*, *CHEM 220: Organic Chemistry*, *ECON 101: Macroeconomics*) so the app is immediately alive and testable upon launch, alongside a one-click "Clear All" and "Import Syllabus" workflow.

---

### 1. Overview & Core Concept

- **What It Does**: 
  - Ingests syllabi text or files via a dedicated AI extraction modal.
  - Automatically breaks exams into 3-to-4 progressive study checkpoints calculated relative to the test date.
  - Organizes assignments, problem sets, essays, quizzes, midterms, and finals into an interactive timeline and visual calendar.
  - Provides instant completion toggling, progress bars per course, and deadline countdown badges.
  - Enables manual quick-add for individual tasks or tests with customizable study checkpoints.
- **Target Audience / Persona**: College, high school, and graduate students juggling multiple demanding classes who need a clear, proactive roadmap rather than just a passive deadline list.
- **Key Value**: Eliminates the manual busywork of transcribing course schedules while preventing last-minute cramming through structured, spaced study milestones.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Dashboard Overview**: View today's agenda, upcoming 7-day deadlines, high-priority exams with active study checkpoints, and overall course completion rates.
  2. **AI Syllabus Importer**: Click "Import Syllabus" $\rightarrow$ Paste course outline or upload file $\rightarrow$ Gemini extracts course name, instructor, assignments, and exam dates $\rightarrow$ Preview & edit detected items $\rightarrow$ Confirm and merge into the student's task board.
  3. **Timeline & To-Do List View**: Filter by course or task type (Assignment, Exam, Reading, Project). Toggle completion. Expand exam cards to inspect and check off preparation checkpoints with countdowns (e.g., "5 days left until Phase 2: Practice Problems").
  4. **Calendar View**: High-level month grid showing deadline dots, exam badges, and milestone dates with day-inspection popover.
  5. **Quick Add & Customizer**: Floating or header "Add Item" button to manually add assignments or exams with custom checkpoint dates and grade weights.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Soft light pink and white academic aesthetic — delicate, clean, marshmallow/milk-pink canvas with crisp white card containers, pastel rose gradients, and subtle pink border accents.
  - *Color Palette & Mood*:
    - Canvas: Milk-pink (`#FFF7F9`) in light mode; deep romantic plum/mauve (`#1A0E17`) in dark mode.
    - Card Containers: Crisp clean white (`#FFFFFF`) in light mode with subtle pastel hairline borders (`border-pink-100`); velvety dark plum (`#23121d`) in dark mode.
    - Primary CTA & Accent: Soft rose gradient (`from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500`) with gentle blush drop shadows.
    - Status Indicators: Amber for urgent deadlines, Soft Rose for exam alerts, Emerald for completed items, Delicate Pink for study prep checkpoints.
    - Interactive Elements: Pastel pink focus rings (`focus:ring-pink-300`), blush chips (`bg-pink-50/80 text-pink-700 border border-pink-100`), and pastel scrollbars (`#FBCFE8` thumb).
  - *Typography*: 
    - Display/Headings: Clean academic typography with soft rose badges and high contrast text.
    - Body Text: Slate-800 on light mode, Soft Pink (`#FDF2F8`) on dark mode for WCAG AA compliance.
    - Timestamps & Countdowns: `font-mono tabular-nums` for precise alignment without layout shifts.
  - *Grade Tracker & GPA Progress*:
    - Interactive SVG progress chart with dual view modes (Cumulative 4.0 GPA trajectory with soft blush gradient area fill vs. individual course percentage lines).
    - Course gradebook breakdown with letter grade conversions, target grade indicators, weighted averages, and direct grade logging modal.

- **Interactive Feedback & Motion**:
  - Smooth check-off animations with pastel confetti celebrations upon milestone completion and top grades ($\ge 90\%$).
  - Accordion expand/collapse on exam cards to reveal granular study milestones.
  - Loading skeleton state and parsing progress indicator during AI syllabus processing.
  - Toast confirmation notifications when items are imported, created, or completed.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Gemini API Extraction (`gemini-3.8-flash`)**:
  - *Chosen Approach*: Dedicated `/api/extract-syllabus` Express endpoint using `@google/genai` with structured JSON schema (`responseSchema`).
  - *Why*: Fast, highly accurate extraction of dates, titles, and exam weighting without client-side API key exposure. Structured JSON guarantees valid data formats directly matching frontend interfaces.
  - *Alternatives Considered*: Client-side regex parsing (too brittle for varied syllabus formats) or manual entry only (tedious for 4–5 classes).
- **Decision 2: Automatic Study Checkpoint Generation**:
  - *Chosen Approach*: When an exam date is added, the app automatically generates 3 progressive study milestones dated relative to the exam (e.g., T-7 days Concept Review, T-3 days Practice Problems, T-1 day Mock Exam). Users can check each off individually or adjust dates.
  - *Why*: Direct fulfillment of the user's requirement to track studying checkpoints before test dates, turning passive deadlines into active study habits.
- **Decision 3: Local Persistence with Seed Data**:
  - *Chosen Approach*: `localStorage` with reactive state synchronization and seed data on initial load.
  - *Why*: Immediate instant load, zero authentication hurdles for quick preview, and complete data safety across page refreshes.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Frontend (React 19 + Vite)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand · View Switcher · Search · Import CTA)               │
│                                                                             │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ Course Sidebar        │  │ Main Workspace Stage                       │  │
│  │ - Course Filters      │  │ - Mode: Timeline (Today / Week / Future)    │  │
│  │ - Overall Progress    │  │ - Mode: Monthly Calendar Grid              │  │
│  │ - Quick Add Button    │  │ - Mode: Course Manager                     │  │
│  └───────────────────────┘  └────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│                         Interactive Modals / Drawers                        │
│                         - Syllabus AI Upload & Review                       │
│                         - Task / Exam Create & Edit Form                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                               State & Storage                               │
│                         - useLocalStorage for Courses & Tasks               │
│                         - Filter & Search State in App Context              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ POST /api/extract-syllabus
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Backend (Express / Node.js)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Express Server (`server.ts`)                                               │
│  - Endpoint: POST `/api/extract-syllabus`                                   │
│  - Invokes: `ai.models.generateContent` with `gemini-3.8-flash`             │
│  - User-Agent header: `'aistudio-build'`                                    │
│  - Output: Structured JSON (Courses, Assignments, Exams + Milestones)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Data Model Entities

```typescript
export type ItemType = 'assignment' | 'exam' | 'reading' | 'quiz' | 'project';

export interface StudyCheckpoint {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface AcademicItem {
  id: string;
  courseId: string;
  title: string;
  type: ItemType;
  dueDate: string; // YYYY-MM-DD or ISO
  time?: string;   // e.g. "14:00"
  location?: string;
  weight?: string; // e.g. "20% of grade"
  completed: boolean;
  notes?: string;
  studyCheckpoints?: StudyCheckpoint[]; // For exams and major projects
}

export interface Course {
  id: string;
  code: string;       // e.g. "CS 201"
  name: string;       // e.g. "Data Structures & Algorithms"
  color: string;      // Tailwind color token or hex
  instructor?: string;
  targetGrade?: string; // e.g. "A"
}
```

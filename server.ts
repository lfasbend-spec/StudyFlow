import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI client (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Built-in high quality sample syllabi for quick 1-click testing
const SAMPLE_SYLLABI = [
  {
    id: 'cs201',
    courseName: 'CS 201: Data Structures & Algorithms',
    instructor: 'Dr. Evelyn Vance',
    text: `CS 201: Data Structures and Algorithms - Fall Semester
Instructor: Dr. Evelyn Vance (Office Hours: Mon/Wed 2-4 PM)
Course Description: Fundamental concepts of data structures including linked lists, trees, graphs, sorting, and algorithmic efficiency.

Grading Breakdown:
- Homework & Programming Assignments: 30%
- Midterm Exam 1: 20%
- Midterm Exam 2: 20%
- Final Comprehensive Exam: 25%
- Class Participation: 5%

Key Schedule & Deadlines:
1. Programming Assignment 1: Array-Based Lists & Big-O Analysis - Due November 10, 2026 at 11:59 PM (Weight: 6%)
2. Midterm Exam 1: Stacks, Queues, Binary Search Trees - November 18, 2026 from 10:00 AM - 11:30 AM (Room 304 Turing Hall, Weight: 20%)
3. Programming Assignment 2: Balanced Trees (AVL & Red-Black) - Due November 25, 2026 at 11:59 PM (Weight: 8%)
4. Homework 3: Hash Tables & Collision Resolution - Due December 2, 2026 at 11:59 PM (Weight: 8%)
5. Midterm Exam 2: Graphs, BFS/DFS, Dijkstra's Algorithm - December 8, 2026 from 10:00 AM - 11:30 AM (Room 304 Turing Hall, Weight: 20%)
6. Programming Assignment 4: Minimum Spanning Trees & Dynamic Programming - Due December 14, 2026 at 11:59 PM (Weight: 8%)
7. Final Examination (Comprehensive with focus on P vs NP & Advanced Graphs) - December 19, 2026 from 2:00 PM - 5:00 PM (Main Auditorium, Weight: 25%)`
  },
  {
    id: 'chem220',
    courseName: 'CHEM 220: Organic Chemistry I',
    instructor: 'Prof. Marcus Chen',
    text: `CHEM 220: Organic Chemistry I - Fall Semester
Instructor: Prof. Marcus Chen | Laboratory Coordinator: Dr. Sarah Lin

Schedule of Exams & Assignments:
- Problem Set 1 (Stereochemistry & Chirality): Due November 9, 2026 at 5:00 PM (Weight: 5%)
- Lab Report 1: Distillation & Gas Chromatography: Due November 12, 2026 at 11:59 PM (Weight: 7%)
- Midterm Exam: Substitution & Elimination Reactions (SN1, SN2, E1, E2): November 20, 2026 at 9:00 AM (Chemistry Bldg Room 101, Weight: 25%)
- Problem Set 2 (Alkenes, Alkynes & Addition Reactions): Due December 1, 2026 at 5:00 PM (Weight: 5%)
- Lab Practical Exam: Unknown Organic Compound Identification: December 7, 2026 at 1:00 PM (Lab 4B, Weight: 15%)
- Final Exam: Cumulative Organic Reaction Mechanisms: December 16, 2026 at 8:30 AM (Grand Hall, Weight: 35%)`
  },
  {
    id: 'bio110',
    courseName: 'BIO 110: Principles of Molecular Biology',
    instructor: 'Dr. Aris Thorne',
    text: `BIO 110: Molecular & Cellular Biology
Schedule & Due Dates:
- Quiz 1 (DNA Replication & Repair): November 11, 2026 at 11:59 PM (Weight: 5%)
- Research Paper Draft: CRISPR Gene Editing Advances: Due November 23, 2026 at 11:59 PM (Weight: 10%)
- Exam 2 (Cell Signaling & Gene Expression): November 30, 2026 at 11:00 AM (Science Hall 202, Weight: 25%)
- Final Research Paper Submission: Due December 9, 2026 at 11:59 PM (Weight: 15%)
- Final Exam (Cellular Respiration, Photosynthesis & Genetics): December 18, 2026 at 10:00 AM (Weight: 30%)`
  }
];

app.get('/api/sample-syllabi', (_req: Request, res: Response) => {
  res.json({ samples: SAMPLE_SYLLABI });
});

// Endpoint to extract assignments, exams, and study checkpoints from syllabus
app.post('/api/extract-syllabus', async (req: Request, res: Response) => {
  try {
    const { text, fileData, mimeType, currentDateContext } = req.body;

    if (!text && !fileData) {
      return res.status(400).json({ error: 'Please provide syllabus text or an uploaded document.' });
    }

    const todayDate = currentDateContext || new Date().toISOString().split('T')[0];

    const systemInstruction = `You are an elite academic assistant that extracts course schedules, assignments, tests, and exam checkpoints for students.
Your goal is to parse university or high school syllabi into structured courses, assignments, quizzes, and exams.
CRITICAL RULES FOR EXTRACTION:
1. Identify the Course Code (e.g., "CS 201", "CHEM 220") and Course Title (e.g., "Data Structures"). If absent, infer an accurate name.
2. Extract all scheduled assignments, problem sets, essays, quizzes, midterms, practicals, and final exams.
3. Standardize all dates to YYYY-MM-DD format. Assume the current academic semester around ${todayDate}. If only "Nov 18" is mentioned, resolve the year properly (e.g., 2026).
4. For every EXAM, QUIZ, or MAJOR PROJECT: You MUST automatically generate 3 to 4 sequential, high-impact study checkpoints scheduled BEFORE the exam date:
   - Checkpoint 1: Initial Concept & Lecture Notes Review (typically 7-10 days before exam, or proportionally spaced)
   - Checkpoint 2: Practice Problems, Flashcards, or Chapter Drills (typically 3-5 days before exam)
   - Checkpoint 3: Timed Mock Exam, Weak Area Remediation & Formula Sheet (typically 1-2 days before exam)
   - Checkpoint 4 (Optional for major finals): Rest, Logistics & Final 30-min Quick Review
   Ensure checkpoint target dates are in YYYY-MM-DD format and fall before the exam date.
5. Provide helpful study tips, covered topics, or chapter references in the 'notes' field for each item.
6. Extract the grade weight (e.g., "20% of final grade") if specified in the syllabus.`;

    const contents: any[] = [];

    if (fileData && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: fileData,
        },
      });
      contents.push({
        text: `Extract the full course information, all assignments, test dates, exam weights, and multi-stage study checkpoints from this syllabus document. Today's date is ${todayDate}. Text note: ${text || ''}`,
      });
    } else {
      contents.push({
        text: `Extract the course information, all assignments, test dates, exam weights, and multi-stage study checkpoints from this syllabus text:\n\n${text}\n\nReference today's date: ${todayDate}`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            course: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING, description: 'Course code e.g. CS 201' },
                name: { type: Type.STRING, description: 'Course title e.g. Data Structures & Algorithms' },
                instructor: { type: Type.STRING, description: 'Instructor name' },
                targetGrade: { type: Type.STRING, description: 'Goal grade, e.g. A' },
                description: { type: Type.STRING, description: 'Brief course summary' },
              },
              required: ['code', 'name'],
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Title of the assignment or exam' },
                  type: {
                    type: Type.STRING,
                    description: 'One of: assignment, exam, quiz, project, reading',
                  },
                  dueDate: { type: Type.STRING, description: 'Due date or test date in YYYY-MM-DD format' },
                  time: { type: Type.STRING, description: 'Time if specified, e.g. 10:00 AM or 23:59' },
                  location: { type: Type.STRING, description: 'Classroom, lab or submission portal' },
                  weight: { type: Type.STRING, description: 'Weighting, e.g. 20% of course grade' },
                  notes: { type: Type.STRING, description: 'Topics covered, instructions, or chapters' },
                  studyCheckpoints: {
                    type: Type.ARRAY,
                    description: 'Sequential preparation milestones for exams and projects',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: 'e.g. Phase 1: Review Chapters 1-4' },
                        targetDate: { type: Type.STRING, description: 'Milestone target date in YYYY-MM-DD format' },
                        notes: { type: Type.STRING, description: 'Study recommendation or focus areas' },
                      },
                      required: ['title', 'targetDate'],
                    },
                  },
                },
                required: ['title', 'type', 'dueDate'],
              },
            },
          },
          required: ['course', 'items'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsedData = JSON.parse(rawText);

    res.json(parsedData);
  } catch (err: any) {
    console.error('Error in /api/extract-syllabus:', err);
    res.status(500).json({
      error: err?.message || 'Failed to extract syllabus data with Gemini.',
    });
  }
});

// Automatic Checkpoint Generator for manually added exams
app.post('/api/generate-checkpoints', async (req: Request, res: Response) => {
  try {
    const { title, courseName, examDate, topics } = req.body;

    if (!title || !examDate) {
      return res.status(400).json({ error: 'Title and examDate are required.' });
    }

    const systemInstruction = `You generate structured 3-stage or 4-stage study checkpoints for a student's upcoming exam or major project.
Each checkpoint must have a title, target date (YYYY-MM-DD prior to the exam date ${examDate}), and practical study tactics.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate 3 to 4 chronological study milestones for:
Exam Title: ${title}
Course: ${courseName || 'College Course'}
Exam Date: ${examDate}
Topics/Notes: ${topics || 'Comprehensive topics'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            checkpoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  targetDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
                  notes: { type: Type.STRING },
                },
                required: ['title', 'targetDate'],
              },
            },
          },
          required: ['checkpoints'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"checkpoints": []}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error generating checkpoints:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate study checkpoints' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`StudyFlow server running at http://localhost:${port}`);
  });
}

startServer();

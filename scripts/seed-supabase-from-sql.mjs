/**
 * Purpose: Seed the configured Supabase project from the local SQL seed file through Supabase REST.
 * Used by: Local migration/setup sessions after `.env.local` has Supabase keys.
 * Main dependencies: dotenv, @supabase/supabase-js, SUPABASE_SERVICE_ROLE_KEY, and `supabase/seed_complete.sql`.
 * Public/main functions: Script entry point.
 * Important side effects: Deletes and upserts rows in configured Supabase tables.
 */
import fs from 'node:fs';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const sql = fs.readFileSync('supabase/seed_complete.sql', 'utf8');

const splitTopLevel = (text, separator = ',') => {
  const result = [];
  let current = '';
  let quote = false;
  let depth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quote) {
      current += char;
      if (char === "'" && next === "'") {
        current += next;
        index += 1;
        continue;
      }
      if (char === "'") quote = false;
      continue;
    }

    if (char === "'") {
      quote = true;
      current += char;
      continue;
    }

    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (char === separator && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) result.push(current.trim());
  return result;
};

const parseSqlValue = (rawValue) => {
  const value = rawValue.trim();
  if (/^null$/i.test(value)) return null;
  if (/^true$/i.test(value)) return true;
  if (/^false$/i.test(value)) return false;
  if (/^'.*'::jsonb$/i.test(value)) {
    return JSON.parse(value.replace(/::jsonb$/i, '').slice(1, -1).replace(/''/g, "'"));
  }
  if (/^'.*'$/.test(value)) return value.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
};

const parseInsertBatches = () => {
  const insertPattern = /INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)ON CONFLICT[\s\S]*?;/gi;
  const batches = [];

  for (const match of sql.matchAll(insertPattern)) {
    const table = match[1];
    const columns = match[2].split(',').map((column) => column.trim());
    const tuples = splitTopLevel(match[3].trim())
      .map((tuple) => tuple.replace(/^\(/, '').replace(/\),?$/, '').trim());

    const rows = tuples.map((tuple) => {
      const values = splitTopLevel(tuple).map(parseSqlValue);
      return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
    });

    batches.push({ table, rows });
  }

  return batches;
};

const deleteOrder = [
  'vi_feedback',
  'vi_assessment_submissions',
  'vi_assessment_questions',
  'vi_assessments',
  'vi_attendance_records',
  'vi_attendance_sessions',
  'vi_certificates',
  'vi_payments',
  'vi_enrollments',
  'vi_invoices',
  'vi_batches',
  'vi_programs',
  'vi_trainers',
  'vi_users_profile',
  'vi_organizations',
];

const assessments = [
  {
    id: 'assess_pre_ai',
    batch_id: 'batch_ai_foundation_july',
    program_id: 'prog_ai_foundation',
    assessment_type: 'pre_assessment',
    title: 'AI Readiness Baseline',
    description: 'Initial readiness check for applied AI participants.',
    passing_score: 70,
    status: 'published',
    created_date: '2026-06-20T08:00:00.000Z',
  },
  {
    id: 'assess_post_ai',
    batch_id: 'batch_ai_foundation_july',
    program_id: 'prog_ai_foundation',
    assessment_type: 'post_assessment',
    title: 'AI Application Capstone Review',
    description: 'Final evaluation for AI workflow design and governance.',
    passing_score: 70,
    status: 'published',
    created_date: '2026-07-22T08:00:00.000Z',
  },
  {
    id: 'assess_pre_data',
    batch_id: 'batch_data_bootcamp_aug',
    program_id: 'prog_data_bootcamp',
    assessment_type: 'pre_assessment',
    title: 'Analytics Foundations Check',
    description: 'Entry-level analytics and reporting diagnostic.',
    passing_score: 70,
    status: 'published',
    created_date: '2026-07-25T08:00:00.000Z',
  },
  {
    id: 'assess_post_data',
    batch_id: 'batch_data_bootcamp_aug',
    program_id: 'prog_data_bootcamp',
    assessment_type: 'post_assessment',
    title: 'Analytics Delivery Review',
    description: 'Final review for dashboarding, reporting, and analysis workflow readiness.',
    passing_score: 70,
    status: 'published',
    created_date: '2026-08-25T08:00:00.000Z',
  },
  {
    id: 'assess_quiz_1',
    batch_id: 'batch_data_bootcamp_aug',
    program_id: 'prog_data_bootcamp',
    assessment_type: 'quiz',
    title: 'Quiz 1: Data Types',
    description: 'Quick check on data types and basic terminology.',
    passing_score: 50,
    status: 'published',
    created_date: '2026-08-10T08:00:00.000Z',
  },
  {
    id: 'assess_quiz_2',
    batch_id: 'batch_data_bootcamp_aug',
    program_id: 'prog_data_bootcamp',
    assessment_type: 'quiz',
    title: 'Quiz 2: Visualization Rules',
    description: 'Testing knowledge on chart selection and best practices.',
    passing_score: 50,
    status: 'published',
    created_date: '2026-08-15T08:00:00.000Z',
  },
  {
    id: 'assess_quiz_3',
    batch_id: 'batch_data_bootcamp_aug',
    program_id: 'prog_data_bootcamp',
    assessment_type: 'quiz',
    title: 'Quiz 3: Data Cleaning',
    description: 'Questions about handling missing or dirty data.',
    passing_score: 50,
    status: 'published',
    created_date: '2026-08-20T08:00:00.000Z',
  },
];

const assessmentQuestions = [
  {
    id: 'q1_pre_ai',
    assessment_id: 'assess_pre_ai',
    question_text: 'What is the primary benefit of the topics covered in this program?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Theoretical knowledge only' },
      { id: 'opt2', text: 'Practical application and real-world workflow improvement' },
      { id: 'opt3', text: 'Certification without learning' },
      { id: 'opt4', text: 'Social networking only' },
    ],
    correct_answer: 'opt2',
    points: 20,
  },
  {
    id: 'q2_pre_ai',
    assessment_id: 'assess_pre_ai',
    question_text: 'Which of the following best describes the core learning objective?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Random fact memorization' },
      { id: 'opt2', text: 'Structured skill development and mastery' },
      { id: 'opt3', text: 'Entertainment value only' },
      { id: 'opt4', text: 'Corporate espionage techniques' },
    ],
    correct_answer: 'opt2',
    points: 20,
  },
  {
    id: 'q3_pre_ai',
    assessment_id: 'assess_pre_ai',
    question_text: 'How would you apply what you learned to your role?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Ignore it completely' },
      { id: 'opt2', text: 'Integrate into workflows and share with team' },
      { id: 'opt3', text: 'Keep it secret' },
      { id: 'opt4', text: 'Use only on Mondays' },
    ],
    correct_answer: 'opt2',
    points: 20,
  },
  {
    id: 'q4_pre_ai',
    assessment_id: 'assess_pre_ai',
    question_text: 'What is the expected outcome of successful completion?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Nothing - just attendance' },
      { id: 'opt2', text: 'Competency development and readiness to execute' },
      { id: 'opt3', text: 'Certificate printing only' },
      { id: 'opt4', text: 'Free refreshments only' },
    ],
    correct_answer: 'opt2',
    points: 20,
  },
  {
    id: 'q5_pre_ai',
    assessment_id: 'assess_pre_ai',
    question_text: 'How would you measure success after this program?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'By the certificate on the wall' },
      { id: 'opt2', text: 'By tangible improvements in work processes' },
      { id: 'opt3', text: 'By attendance only' },
      { id: 'opt4', text: 'Success is not measurable' },
    ],
    correct_answer: 'opt2',
    points: 20,
  },
  {
    id: 'q1_post_ai',
    assessment_id: 'assess_post_ai',
    question_text: 'What is the most critical factor for successful AI adoption in a business team?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Buying the most expensive AI tools' },
      { id: 'opt2', text: 'Clear use cases and alignment with business goals' },
      { id: 'opt3', text: 'Replacing human workers immediately' },
      { id: 'opt4', text: 'Ignoring data privacy completely' },
    ],
    correct_answer: 'opt2',
    points: 100,
  },
  {
    id: 'q1_pre_data',
    assessment_id: 'assess_pre_data',
    question_text: 'What is the most common tool used for initial data analysis in a business setting?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Spreadsheets (e.g., Excel)' },
      { id: 'opt2', text: 'Advanced Machine Learning Models' },
      { id: 'opt3', text: 'Blockchain' },
      { id: 'opt4', text: 'C++ Compilers' },
    ],
    correct_answer: 'opt1',
    points: 100,
  },
  {
    id: 'q1_post_data',
    assessment_id: 'assess_post_data',
    question_text: 'What is the primary key to building a successful data dashboard?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Using as many colors as possible' },
      { id: 'opt2', text: 'Focusing on actionable insights and clear metrics' },
      { id: 'opt3', text: 'Adding 3D charts everywhere' },
      { id: 'opt4', text: 'Making it as complex as possible' },
    ],
    correct_answer: 'opt2',
    points: 50,
  },
  {
    id: 'q2_post_data',
    assessment_id: 'assess_post_data',
    question_text: 'How should you treat data anomalies during reporting?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Investigate to understand the root cause' },
      { id: 'opt2', text: 'Delete them immediately' },
      { id: 'opt3', text: 'Pretend they do not exist' },
      { id: 'opt4', text: 'Change the numbers manually' },
    ],
    correct_answer: 'opt1',
    points: 50,
  },
  {
    id: 'q1_quiz_1',
    assessment_id: 'assess_quiz_1',
    question_text: "Which data type is best for storing a person's age?",
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'String' },
      { id: 'opt2', text: 'Integer' },
      { id: 'opt3', text: 'Boolean' },
      { id: 'opt4', text: 'Date' },
    ],
    correct_answer: 'opt2',
    points: 100,
  },
  {
    id: 'q1_quiz_2',
    assessment_id: 'assess_quiz_2',
    question_text: 'Which chart is best for showing trends over time?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Pie Chart' },
      { id: 'opt2', text: 'Bar Chart' },
      { id: 'opt3', text: 'Line Chart' },
      { id: 'opt4', text: 'Scatter Plot' },
    ],
    correct_answer: 'opt3',
    points: 100,
  },
  {
    id: 'q1_quiz_3',
    assessment_id: 'assess_quiz_3',
    question_text: 'What should you usually do with duplicate data rows?',
    question_type: 'multiple_choice',
    options: [
      { id: 'opt1', text: 'Keep them to increase data volume' },
      { id: 'opt2', text: 'Remove them to ensure accuracy' },
      { id: 'opt3', text: 'Color them red' },
      { id: 'opt4', text: 'Multiply them by 2' },
    ],
    correct_answer: 'opt2',
    points: 100,
  },
];

for (const table of deleteOrder) {
  const { error } = await supabase.from(table).delete().not('id', 'is', null);
  if (error) throw new Error(`delete ${table}: ${error.message}`);
}

const seeded = [];
for (const batch of parseInsertBatches()) {
  const { error } = await supabase.from(batch.table).upsert(batch.rows, { onConflict: 'id' });
  if (error) throw new Error(`upsert ${batch.table}: ${error.message}`);
  seeded.push({ table: batch.table, rows: batch.rows.length });
}

if (assessments.length) {
  const { error } = await supabase.from('vi_assessments').upsert(assessments, { onConflict: 'id' });
  if (error) throw new Error(`upsert assessments: ${error.message}`);
  seeded.push({ table: 'vi_assessments', rows: assessments.length });
}

if (assessmentQuestions.length) {
  const { error } = await supabase.from('vi_assessment_questions').upsert(assessmentQuestions, { onConflict: 'id' });
  if (error) throw new Error(`upsert assessment_questions: ${error.message}`);
  seeded.push({ table: 'vi_assessment_questions', rows: assessmentQuestions.length });
}

console.log(JSON.stringify({ ok: true, seeded }, null, 2));

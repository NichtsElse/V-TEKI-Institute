/**
 * Purpose: Provide the application data/auth adapter with Supabase-backed data access, seed sync, and lightweight localStorage caching.
 * Used by: Auth pages, auth context, public pages, admin pages, and participant pages importing `appClient`.
 * Main dependencies: Supabase Auth, Supabase database client, browser localStorage, in-memory cache storage, and seed bootstrap data.
 * Public/main functions: `appClient.auth.*` and `appClient.entities.*` CRUD helpers.
 * Important side effects: Reads/writes Supabase auth/session state, localStorage cache state, cached entity data, and initial Supabase seed records.
 */
import { getRoleHomePath } from '@/domain/auth/roleConfig';
import { isCertificateEligible } from '@/domain/certificates/eligibility';
import { supabase, isSupabaseConfigured, isSupabaseStrictMode } from '@/lib/supabase';

const memoryStorage = new Map();
const isBrowser = typeof window !== 'undefined';

const storage = {
  getItem(key) {
    return isBrowser ? window.localStorage.getItem(key) : memoryStorage.get(key) ?? null;
  },
  setItem(key, value) {
    if (isBrowser) {
      window.localStorage.setItem(key, value);
      return;
    }
    memoryStorage.set(key, value);
  },
  removeItem(key) {
    if (isBrowser) {
      window.localStorage.removeItem(key);
      return;
    }
    memoryStorage.delete(key);
  },
};

const STORAGE_KEYS = {
  db: 'vteki.local.db',
  session: 'vteki.local.session',
  pendingUser: 'vteki.local.pending-user',
  seedVersion: 'vteki.local.seed-version',
};

const SEED_VERSION = '2026-06-08-coe-v13';
const CACHE_PREFIX = 'vteki.supabase.cache';

const nowIso = () => new Date().toISOString();
const createId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const DEMO_TRAINER_EMAIL = 'trainer@vteki.local';
const DEMO_TRAINER_NAME = 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE';
const getCacheKey = (name) => `${CACHE_PREFIX}.${name}`;
const getCacheItem = (name) => {
  const raw = storage.getItem(getCacheKey(name));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const setCacheItem = (name, value) => {
  storage.setItem(getCacheKey(name), JSON.stringify(value));
};

const defaultDatabase = {
  Program: [
    {
      id: 'prog_ai_foundation',
      name: 'Applied AI for Business Teams',
      code: 'AIBT-101',
      description: 'A practical program for teams that want to use AI responsibly across operations, analysis, and service delivery.',
      learning_objectives: 'Understand core AI use cases for business teams.\nDesign lightweight automation workflows.\nEvaluate AI tools with governance and measurable impact.',
      program_type: 'workshop',
      delivery_mode: 'hybrid',
      duration_hours: 24,
      price: 3500000,
      capacity: 40,
      status: 'published',
      thumbnail_url: '',
      category: 'Artificial Intelligence',
      level: 'beginner',
      passing_score: 70,
      min_attendance_pct: 80,
      created_date: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'prog_data_bootcamp',
      name: 'Data Analytics Bootcamp',
      code: 'DAB-201',
      description: 'An immersive bootcamp covering dashboards, SQL thinking, reporting, and decision-ready analytics for modern teams.',
      learning_objectives: 'Build data literacy across business functions.\nUse spreadsheets and SQL for operational analysis.\nCreate dashboards that support weekly decision making.',
      program_type: 'bootcamp',
      delivery_mode: 'hybrid',
      duration_hours: 40,
      price: 5200000,
      capacity: 35,
      status: 'published',
      thumbnail_url: '',
      category: 'Data Analytics',
      level: 'intermediate',
      passing_score: 70,
      min_attendance_pct: 80,
      created_date: '2026-02-03T08:00:00.000Z',
    },
    {
      id: 'prog_exec_transform',
      name: 'Executive Digital Transformation Strategy',
      code: 'EDTS-301',
      description: 'A leadership program focused on digital operating models, transformation roadmaps, and capability planning.',
      learning_objectives: 'Align digital initiatives with business strategy.\nPrioritize transformation investments.\nBuild an execution roadmap across people, process, and technology.',
      program_type: 'executive_program',
      delivery_mode: 'offline',
      duration_hours: 18,
      price: 9800000,
      capacity: 25,
      status: 'published',
      thumbnail_url: '',
      category: 'Leadership',
      level: 'executive',
      passing_score: 70,
      min_attendance_pct: 80,
      created_date: '2026-03-15T08:00:00.000Z',
    },
    {
      id: 'prog_cyber_awareness',
      name: 'Cybersecurity Awareness for Professionals',
      code: 'CSAP-110',
      description: 'A fast-track program on safe digital practices, incident awareness, and secure collaboration habits for modern organizations.',
      learning_objectives: 'Recognize common security risks.\nApply safer day-to-day digital work habits.\nSupport internal security and compliance efforts.',
      program_type: 'webinar',
      delivery_mode: 'online',
      duration_hours: 8,
      price: 950000,
      capacity: 100,
      status: 'published',
      thumbnail_url: '',
      category: 'Cybersecurity',
      level: 'beginner',
      passing_score: 70,
      min_attendance_pct: 80,
      created_date: '2026-04-10T08:00:00.000Z',
    },
  ],
  Trainer: [
    {
      id: 'trainer_nadia',
      full_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      email: 'trainer@vteki.local',
      title: 'Trainer & Program Lead',
      expertise: 'Enterprise AI Advisory, Strategy & Transformation',
      experience_years: 16,
      bio: 'Dr. Idha Kristiana leads V-TEKI training delivery, program coordination, and strategic transformation across AI and digital capability tracks.',
      profile_picture_url: '',
      linkedin_url: 'https://www.linkedin.com/in/idha-kristiana-demo',
      status: 'active',
      created_date: '2026-01-12T08:00:00.000Z',
    },
    {
      id: 'trainer_rafael',
      full_name: 'Rafael Mahendra',
      email: 'rafael.mahendra@vteki.local',
      title: 'Data Analytics Lead',
      expertise: 'SQL Analytics, BI Dashboards, Reporting Operations',
      experience_years: 11,
      bio: 'Rafael has led analytics enablement programs for cross-functional teams in education, services, and enterprise operations.',
      profile_picture_url: '',
      linkedin_url: 'https://www.linkedin.com/in/rafael-mahendra-demo',
      status: 'inactive',
      created_date: '2026-01-20T08:00:00.000Z',
    },
    {
      id: 'trainer_salma',
      full_name: 'Salma Wijaya',
      email: 'salma.wijaya@vteki.local',
      title: 'Digital Transformation Advisor',
      expertise: 'Transformation Roadmaps, Change Enablement, Capability Building',
      experience_years: 12,
      bio: 'Salma works with leadership teams to shape transformation roadmaps, governance models, and internal capability plans.',
      profile_picture_url: '',
      linkedin_url: 'https://www.linkedin.com/in/salma-wijaya-demo',
      status: 'inactive',
      created_date: '2026-02-08T08:00:00.000Z',
    },
  ],
  Batch: [
    {
      id: 'batch_ai_foundation_july',
      name: 'Applied AI for Business Teams - July 2026',
      program_id: 'prog_ai_foundation',
      trainer_id: 'trainer_nadia',
      trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      program_name: 'Applied AI for Business Teams',
      start_date: '2026-07-08',
      end_date: '2026-07-24',
      status: 'open',
      capacity: 40,
      enrolled_count: 18,
      meeting_link: 'https://meet.example.com/aibt-july',
      venue: 'Hybrid Learning Studio, Jakarta',
      sessions: [
        { title: 'AI Use Cases for Business', date: '2026-07-08', start_time: '09:00', end_time: '12:00' },
        { title: 'Workflow Automation Lab', date: '2026-07-15', start_time: '09:00', end_time: '12:00' },
        { title: 'Governance and Adoption Workshop', date: '2026-07-24', start_time: '09:00', end_time: '12:00' },
      ],
      created_date: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'batch_data_bootcamp_aug',
      name: 'Data Analytics Bootcamp - August 2026',
      program_id: 'prog_data_bootcamp',
      trainer_id: 'trainer_nadia',
      trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      program_name: 'Data Analytics Bootcamp',
      start_date: '2026-08-03',
      end_date: '2026-08-28',
      status: 'open',
      capacity: 35,
      enrolled_count: 14,
      venue: 'V-TEKI Institute, Bandung',
      sessions: [
        { title: 'Analytics Foundations', date: '2026-08-03', start_time: '13:00', end_time: '16:00' },
        { title: 'Dashboard Design Sprint', date: '2026-08-10', start_time: '13:00', end_time: '16:00' },
        { title: 'Operational Reporting Review', date: '2026-08-28', start_time: '13:00', end_time: '16:00' },
      ],
      created_date: '2026-04-02T08:00:00.000Z',
    },
    {
      id: 'batch_exec_sep',
      name: 'Executive Digital Transformation Strategy - September 2026',
      program_id: 'prog_exec_transform',
      trainer_id: 'trainer_nadia',
      trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      program_name: 'Executive Digital Transformation Strategy',
      start_date: '2026-09-10',
      end_date: '2026-09-12',
      status: 'open',
      capacity: 25,
      enrolled_count: 9,
      venue: 'Executive Forum Hall, Jakarta',
      sessions: [
        { title: 'Transformation Priorities', date: '2026-09-10', start_time: '08:30', end_time: '12:00' },
        { title: 'Operating Model Clinic', date: '2026-09-11', start_time: '08:30', end_time: '12:00' },
        { title: 'Roadmap Review', date: '2026-09-12', start_time: '08:30', end_time: '11:30' },
      ],
      created_date: '2026-04-18T08:00:00.000Z',
    },
  ],
  Certificate: [
    {
      id: 'cert_demo_001',
      registration_id: 'reg_demo_001',
      certificate_number: 'VTK-2026-AIBT-000001',
      participant_email: 'participant@vteki.local',
      participant_name: 'Aulia Ramadhan',
      program_name: 'Applied AI for Business Teams',
      program_code: 'AIBT-101',
      batch_name: 'Applied AI for Business Teams - July 2026',
      trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      completion_date: '2026-07-24',
      verification_status: 'valid',
      score: 88,
      created_date: '2026-06-01T08:00:00.000Z',
    },
    {
      id: 'cert_demo_002',
      registration_id: 'reg_demo_002',
      certificate_number: 'VTK-2026-DAB-000002',
      participant_email: 'dina.kusuma@example.com',
      participant_name: 'Dina Kusuma',
      program_name: 'Data Analytics Bootcamp',
      program_code: 'DAB-201',
      batch_name: 'Data Analytics Bootcamp - August 2026',
      trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      completion_date: '2026-08-28',
      verification_status: 'valid',
      score: 91,
      created_date: '2026-08-28T08:00:00.000Z',
    },
    {
      id: 'cert_demo_003',
      registration_id: 'reg_demo_003',
      certificate_number: 'VTK-2026-EDTS-000003',
      participant_email: 'bima.satria@example.com',
      participant_name: 'Bima Satria',
      program_name: 'Executive Digital Transformation Strategy',
      program_code: 'EDTS-301',
      batch_name: 'Executive Digital Transformation Strategy - September 2026',
      trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      completion_date: '2026-09-12',
      verification_status: 'valid',
      score: 95,
      created_date: '2026-09-12T08:00:00.000Z',
    },
  ],
  Registration: [
    {
      id: 'reg_demo_001',
      batch_id: 'batch_ai_foundation_july',
      full_name: 'Aulia Ramadhan',
      email: 'participant@vteki.local',
      phone: '081234567890',
      registration_type: 'individual',
      program_name: 'Applied AI for Business Teams',
      batch_name: 'Applied AI for Business Teams - July 2026',
      program_id: 'prog_ai_foundation',
      status: 'confirmed',
      enrollment_status: 'confirmed',
      completion_status: 'completed',
      attendance_percentage: 92,
      feedback_submitted: true,
      feedback_status: 'submitted',
      post_assessment_score: 88,
      certificate_id: 'cert_demo_001',
      payment_status: 'paid',
      pre_assessment_status: 'completed',
      post_assessment_status: 'completed',
      created_date: '2026-07-01T08:00:00.000Z',
    },
    {
      id: 'reg_demo_002',
      batch_id: 'batch_data_bootcamp_aug',
      full_name: 'Dina Kusuma',
      email: 'dina.kusuma@example.com',
      phone: '081298765432',
      registration_type: 'corporate',
      organization_name: 'PT Solusi Transformasi Nusantara',
      program_name: 'Data Analytics Bootcamp',
      batch_name: 'Data Analytics Bootcamp - August 2026',
      program_id: 'prog_data_bootcamp',
      status: 'confirmed',
      enrollment_status: 'confirmed',
      completion_status: 'in_progress',
      attendance_percentage: 67,
      feedback_submitted: false,
      feedback_status: 'pending',
      post_assessment_score: 0,
      payment_status: 'paid',
      pre_assessment_status: 'completed',
      post_assessment_status: 'pending',
      created_date: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'reg_demo_003',
      batch_id: 'batch_exec_sep',
      full_name: 'Bima Satria',
      email: 'bima.satria@example.com',
      phone: '081311223344',
      registration_type: 'corporate',
      organization_name: 'PT Solusi Transformasi Nusantara',
      program_name: 'Executive Digital Transformation Strategy',
      batch_name: 'Executive Digital Transformation Strategy - September 2026',
      program_id: 'prog_exec_transform',
      status: 'registered',
      enrollment_status: 'registered',
      completion_status: 'not_started',
      attendance_percentage: 0,
      feedback_submitted: false,
      feedback_status: 'pending',
      post_assessment_score: 0,
      payment_status: 'pending',
      pre_assessment_status: 'pending',
      post_assessment_status: 'pending',
      created_date: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'reg_demo_004',
      batch_id: 'batch_data_bootcamp_aug',
      full_name: 'Demo Participant',
      email: 'participant@vteki.local',
      phone: '081234567890',
      registration_type: 'individual',
      program_name: 'Data Analytics Bootcamp',
      batch_name: 'Data Analytics Bootcamp - August 2026',
      program_id: 'prog_data_bootcamp',
      status: 'confirmed',
      enrollment_status: 'confirmed',
      completion_status: 'in_progress',
      attendance_percentage: 72,
      feedback_submitted: false,
      feedback_status: 'pending',
      post_assessment_score: 0,
      payment_status: 'paid',
      pre_assessment_status: 'completed',
      post_assessment_status: 'pending',
      created_date: '2026-08-05T08:00:00.000Z',
    },
    {
      id: 'reg_demo_005',
      batch_id: 'batch_ai_foundation_july',
      full_name: 'Meylani Putri',
      email: 'meylani.putri@example.com',
      phone: '081355667788',
      registration_type: 'corporate',
      organization_name: 'PT Solusi Transformasi Nusantara',
      program_name: 'Applied AI for Business Teams',
      batch_name: 'Applied AI for Business Teams - July 2026',
      program_id: 'prog_ai_foundation',
      status: 'confirmed',
      enrollment_status: 'confirmed',
      completion_status: 'completed',
      attendance_percentage: 86,
      feedback_submitted: true,
      feedback_status: 'submitted',
      post_assessment_score: 84,
      payment_status: 'paid',
      pre_assessment_status: 'completed',
      post_assessment_status: 'completed',
      created_date: '2026-07-04T08:00:00.000Z',
    },
    {
      id: 'reg_demo_006',
      batch_id: 'batch_exec_sep',
      full_name: 'Farhan Maulana',
      email: 'farhan.maulana@example.com',
      phone: '081344556677',
      registration_type: 'individual',
      program_name: 'Executive Digital Transformation Strategy',
      batch_name: 'Executive Digital Transformation Strategy - September 2026',
      program_id: 'prog_exec_transform',
      status: 'waiting_payment',
      enrollment_status: 'waiting_payment',
      completion_status: 'not_started',
      attendance_percentage: 0,
      feedback_submitted: false,
      feedback_status: 'pending',
      post_assessment_score: 0,
      payment_status: 'pending',
      pre_assessment_status: 'pending',
      post_assessment_status: 'pending',
      created_date: '2026-09-03T08:00:00.000Z',
    },
  ],
  CorporateRegistration: [],
  Payment: [
    {
      id: 'pay_demo_001',
      invoice_number: 'INV-2026-0001',
      registration_id: 'reg_demo_001',
      amount: 3500000,
      invoice_status: 'paid',
      status: 'paid',
      payment_method: 'bank_transfer',
      payment_reference: 'VA-88010001',
      payment_date: '2026-07-02',
      verified_date: '2026-07-02',
      program_name: 'Applied AI for Business Teams',
      participant_name: 'Aulia Ramadhan',
      created_date: '2026-07-02T08:00:00.000Z',
    },
    {
      id: 'pay_demo_002',
      invoice_number: 'INV-2026-0002',
      registration_id: 'reg_demo_002',
      amount: 5200000,
      invoice_status: 'paid',
      status: 'paid',
      payment_method: 'bank_transfer',
      payment_reference: 'VA-88010002',
      payment_date: '2026-08-02',
      verified_date: '2026-08-02',
      program_name: 'Data Analytics Bootcamp',
      organization_name: 'PT Solusi Transformasi Nusantara',
      participant_name: 'Dina Kusuma',
      created_date: '2026-08-02T08:00:00.000Z',
    },
    {
      id: 'pay_demo_003',
      invoice_number: 'INV-2026-0003',
      registration_id: 'reg_demo_003',
      amount: 9800000,
      invoice_status: 'issued',
      status: 'pending',
      payment_method: 'bank_transfer',
      payment_reference: 'VA-88010003',
      program_name: 'Executive Digital Transformation Strategy',
      organization_name: 'PT Solusi Transformasi Nusantara',
      participant_name: 'Bima Satria',
      created_date: '2026-09-02T08:00:00.000Z',
    },
    {
      id: 'pay_demo_004',
      invoice_number: 'INV-2026-0004',
      registration_id: 'reg_demo_005',
      amount: 3500000,
      invoice_status: 'paid',
      status: 'paid',
      payment_method: 'bank_transfer',
      payment_reference: 'VA-88010004',
      payment_date: '2026-07-05',
      verified_date: '2026-07-05',
      program_name: 'Applied AI for Business Teams',
      organization_name: 'PT Solusi Transformasi Nusantara',
      participant_name: 'Meylani Putri',
      created_date: '2026-07-05T08:00:00.000Z',
    },
  ],
  AttendanceSession: [
    {
      id: 'att_session_ai_1',
      batch_id: 'batch_ai_foundation_july',
      session_title: 'AI Use Cases for Business',
      session_date: '2026-07-08',
      start_time: '09:00',
      end_time: '12:00',
      created_date: '2026-07-08T08:00:00.000Z',
    },
    {
      id: 'att_session_ai_2',
      batch_id: 'batch_ai_foundation_july',
      session_title: 'Workflow Automation Lab',
      session_date: '2026-07-15',
      start_time: '09:00',
      end_time: '12:00',
      created_date: '2026-07-15T08:00:00.000Z',
    },
    {
      id: 'att_session_ai_3',
      batch_id: 'batch_ai_foundation_july',
      session_title: 'Governance and Adoption Workshop',
      session_date: '2026-07-24',
      start_time: '09:00',
      end_time: '12:00',
      created_date: '2026-07-24T08:00:00.000Z',
    },
    {
      id: 'att_session_data_1',
      batch_id: 'batch_data_bootcamp_aug',
      session_title: 'Analytics Foundations',
      session_date: '2026-08-03',
      start_time: '13:00',
      end_time: '16:00',
      created_date: '2026-08-03T12:30:00.000Z',
    },
    {
      id: 'att_session_data_2',
      batch_id: 'batch_data_bootcamp_aug',
      session_title: 'Dashboard Design Sprint',
      session_date: '2026-08-10',
      start_time: '13:00',
      end_time: '16:00',
      created_date: '2026-08-10T12:30:00.000Z',
    },
    {
      id: 'att_session_data_3',
      batch_id: 'batch_data_bootcamp_aug',
      session_title: 'Operational Reporting Review',
      session_date: '2026-08-28',
      start_time: '13:00',
      end_time: '16:00',
      created_date: '2026-08-28T12:30:00.000Z',
    },
  ],
  AttendanceRecord: [
    {
      id: 'att_record_001',
      attendance_session_id: 'att_session_ai_1',
      registration_id: 'reg_demo_001',
      batch_id: 'batch_ai_foundation_july',
      participant_name: 'Aulia Ramadhan',
      participant_email: 'participant@vteki.local',
      session_title: 'AI Use Cases for Business',
      session_date: '2026-07-08',
      status: 'present',
      join_time: '09:01',
      leave_time: '11:58',
      created_date: '2026-07-08T12:05:00.000Z',
    },
    {
      id: 'att_record_002',
      attendance_session_id: 'att_session_ai_2',
      registration_id: 'reg_demo_001',
      batch_id: 'batch_ai_foundation_july',
      participant_name: 'Aulia Ramadhan',
      participant_email: 'participant@vteki.local',
      session_title: 'Workflow Automation Lab',
      session_date: '2026-07-15',
      status: 'late',
      join_time: '09:12',
      leave_time: '12:00',
      created_date: '2026-07-15T12:05:00.000Z',
    },
    {
      id: 'att_record_003',
      attendance_session_id: 'att_session_ai_3',
      registration_id: 'reg_demo_001',
      batch_id: 'batch_ai_foundation_july',
      participant_name: 'Aulia Ramadhan',
      participant_email: 'participant@vteki.local',
      session_title: 'Governance and Adoption Workshop',
      session_date: '2026-07-24',
      status: 'present',
      join_time: '09:00',
      leave_time: '11:47',
      created_date: '2026-07-24T12:05:00.000Z',
    },
    {
      id: 'att_record_004',
      attendance_session_id: 'att_session_ai_1',
      registration_id: 'reg_demo_005',
      batch_id: 'batch_ai_foundation_july',
      participant_name: 'Meylani Putri',
      participant_email: 'meylani.putri@example.com',
      session_title: 'AI Use Cases for Business',
      session_date: '2026-07-08',
      status: 'present',
      join_time: '09:03',
      leave_time: '12:00',
      created_date: '2026-07-08T12:10:00.000Z',
    },
    {
      id: 'att_record_005',
      attendance_session_id: 'att_session_ai_2',
      registration_id: 'reg_demo_005',
      batch_id: 'batch_ai_foundation_july',
      participant_name: 'Meylani Putri',
      participant_email: 'meylani.putri@example.com',
      session_title: 'Workflow Automation Lab',
      session_date: '2026-07-15',
      status: 'excused',
      join_time: '-',
      leave_time: '-',
      created_date: '2026-07-15T12:10:00.000Z',
    },
    {
      id: 'att_record_006',
      attendance_session_id: 'att_session_ai_3',
      registration_id: 'reg_demo_005',
      batch_id: 'batch_ai_foundation_july',
      participant_name: 'Meylani Putri',
      participant_email: 'meylani.putri@example.com',
      session_title: 'Governance and Adoption Workshop',
      session_date: '2026-07-24',
      status: 'present',
      join_time: '09:00',
      leave_time: '11:50',
      created_date: '2026-07-24T12:10:00.000Z',
    },
    {
      id: 'att_record_007',
      attendance_session_id: 'att_session_data_1',
      registration_id: 'reg_demo_004',
      batch_id: 'batch_data_bootcamp_aug',
      participant_name: 'Demo Participant',
      participant_email: 'participant@vteki.local',
      session_title: 'Analytics Foundations',
      session_date: '2026-08-03',
      status: 'present',
      join_time: '13:02',
      leave_time: '15:50',
      created_date: '2026-08-03T16:10:00.000Z',
    },
    {
      id: 'att_record_008',
      attendance_session_id: 'att_session_data_2',
      registration_id: 'reg_demo_004',
      batch_id: 'batch_data_bootcamp_aug',
      participant_name: 'Demo Participant',
      participant_email: 'participant@vteki.local',
      session_title: 'Dashboard Design Sprint',
      session_date: '2026-08-10',
      status: 'absent',
      join_time: '-',
      leave_time: '-',
      created_date: '2026-08-10T16:10:00.000Z',
    },
    {
      id: 'att_record_009',
      attendance_session_id: 'att_session_data_3',
      registration_id: 'reg_demo_004',
      batch_id: 'batch_data_bootcamp_aug',
      participant_name: 'Demo Participant',
      participant_email: 'participant@vteki.local',
      session_title: 'Operational Reporting Review',
      session_date: '2026-08-28',
      status: 'present',
      join_time: '13:00',
      leave_time: '15:48',
      created_date: '2026-08-28T16:10:00.000Z',
    },
  ],
  Attendance: [],
  Assessment: [
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
  ],
  AssessmentQuestion: [
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
      question_text: 'Which data type is best for storing a person\'s age?',
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
  ],
  AssessmentResult: [
    {
      id: 'ares_demo_001',
      assessment_id: 'assess_pre_ai',
      registration_id: 'reg_demo_001',
      participant_email: 'participant@vteki.local',
      title: 'AI Readiness Baseline',
      score: 32,
      total_points: 50,
      percentage: 64,
      passed: false,
      status: 'reviewed',
      submission_date: '2026-07-08T10:00:00.000Z',
      answers: [
        { answer: 'Process automation', is_correct: true, points_earned: 10 },
        { answer: 'Manual approval', is_correct: false, points_earned: 4 },
      ],
    },
    {
      id: 'ares_demo_002',
      assessment_id: 'assess_post_ai',
      registration_id: 'reg_demo_001',
      participant_email: 'participant@vteki.local',
      title: 'AI Application Capstone Review',
      score: 44,
      total_points: 50,
      percentage: 88,
      passed: true,
      status: 'reviewed',
      submission_date: '2026-07-24T14:30:00.000Z',
      answers: [
        { answer: 'Governance checklist', is_correct: true, points_earned: 20 },
        { answer: 'ROI measurement plan', is_correct: true, points_earned: 24 },
      ],
    },
    {
      id: 'ares_demo_003',
      assessment_id: 'assess_pre_data',
      registration_id: 'reg_demo_004',
      participant_email: 'participant@vteki.local',
      title: 'Analytics Foundations Check',
      score: 36,
      total_points: 50,
      percentage: 72,
      passed: true,
      status: 'reviewed',
      submission_date: '2026-08-03T15:40:00.000Z',
      answers: [
        { answer: 'Pivot analysis', is_correct: true, points_earned: 18 },
        { answer: 'Trend interpretation', is_correct: true, points_earned: 18 },
      ],
    },
  ],
  Feedback: [
    {
      id: 'feedback_demo_001',
      registration_id: 'reg_demo_001',
      batch_id: 'batch_ai_foundation_july',
      batch_name: 'Applied AI for Business Teams - July 2026',
      participant_name: 'Aulia Ramadhan',
      participant_email: 'participant@vteki.local',
      program_name: 'Applied AI for Business Teams',
        trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      trainer_rating: 5,
      material_rating: 4,
      program_rating: 5,
      satisfaction_score: 5,
      comments: 'Very practical program. The automation workshop and governance session were especially useful.',
      created_date: '2026-07-24T16:30:00.000Z',
    },
    {
      id: 'feedback_demo_002',
      registration_id: 'reg_demo_005',
      batch_id: 'batch_ai_foundation_july',
      batch_name: 'Applied AI for Business Teams - July 2026',
      participant_name: 'Meylani Putri',
      participant_email: 'meylani.putri@example.com',
      program_name: 'Applied AI for Business Teams',
        trainer_name: 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
      trainer_rating: 4,
      material_rating: 5,
      program_rating: 4,
      satisfaction_score: 4,
      comments: 'Good balance between business examples and practical exercises for team adoption.',
      created_date: '2026-07-25T10:00:00.000Z',
    },
  ],
  User: [
    {
      id: 'user_admin_demo',
      email: 'admin@vteki.local',
      full_name: 'Demo Admin',
      role: 'academy_admin',
      phone: '021-555-0001',
      status: 'active',
      password: 'admin123',
      created_date: '2026-01-01T08:00:00.000Z',
    },
    {
      id: 'user_superadmin_demo',
      email: 'superadmin@vteki.local',
      full_name: 'Super Admin',
      role: 'super_admin',
      phone: '021-555-0002',
      status: 'active',
      password: 'superadmin123',
      created_date: '2026-01-01T07:00:00.000Z',
    },
    {
      id: 'user_participant_demo',
      email: 'participant@vteki.local',
      full_name: 'Demo Participant',
      role: 'participant',
      phone: '081234567890',
      status: 'active',
      password: 'participant123',
      created_date: '2026-01-02T08:00:00.000Z',
    },
    {
      id: 'user_participant_aulia',
      email: 'aulia.ramadhan@example.com',
      full_name: 'Aulia Ramadhan',
      role: 'participant',
      phone: '081234567891',
      status: 'active',
      password: 'welcome123',
      created_date: '2026-07-01T08:00:00.000Z',
    },
    {
      id: 'user_trainer_demo',
      email: 'trainer@vteki.local',
      full_name: 'Idha Kristiana',
      role: 'trainer',
      phone: '081300000001',
      status: 'active',
      password: 'trainer123',
      created_date: '2026-01-03T08:00:00.000Z',
    },
    {
      id: 'user_trainer_rafael',
      email: 'rafael.mahendra@vteki.local',
      full_name: 'Rafael Mahendra',
      role: 'trainer',
      phone: '081300000002',
      status: 'active',
      password: 'welcome123',
      created_date: '2026-01-20T08:00:00.000Z',
    },
    {
      id: 'user_corporate_demo',
      email: 'corporate@vteki.local',
      full_name: 'Rizky Ananta',
      role: 'corporate_pic',
      phone: '021-555-0100',
      status: 'active',
      organization_name: 'PT Solusi Transformasi Nusantara',
      password: 'corporate123',
      created_date: '2026-01-04T08:00:00.000Z',
    },
  ],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeSeededDatabase = (db) => {
  const merged = { ...db };

  Object.entries(defaultDatabase).forEach(([entityName, defaultItems]) => {
    const existingItems = Array.isArray(merged[entityName]) ? merged[entityName] : [];
    const defaultItemsById = new Map();
    defaultItems.forEach((item) => {
      if (item?.id) {
        defaultItemsById.set(item.id, item);
      }
    });
    const mergedExistingItems = existingItems.map((item) => {
      const defaultItem = item?.id ? defaultItemsById.get(item.id) : null;
      return defaultItem ? { ...clone(defaultItem), ...item } : item;
    });
    const existingIds = new Set(mergedExistingItems.map((item) => item?.id).filter(Boolean));
    const missingSeedItems = defaultItems.filter((item) => item?.id && !existingIds.has(item.id));

    merged[entityName] = [...mergedExistingItems, ...clone(missingSeedItems)];
  });

  return merged;
};

const SUPABASE_SEED_KEY = 'vteki.supabase.seed-version';
const SUPABASE_SEED_ORDER = [
  'Organization',
  'User',
  'Trainer',
  'Program',
  'Batch',
  'Invoice',
  'Registration',
  'Payment',
  'AttendanceSession',
  'AttendanceRecord',
  'Assessment',
  'AssessmentQuestion',
  'AssessmentResult',
  'Feedback',
  'Certificate',
];

const syncSupabaseSeed = async () => {
  if (!isSupabaseConfigured()) return;
  if (!isBrowser) return;

  const currentSeedVersion = storage.getItem(SUPABASE_SEED_KEY);
  if (currentSeedVersion === SEED_VERSION) return;

  for (const entityName of SUPABASE_SEED_ORDER) {
    const tableName = tableMap[entityName] || entityName.toLowerCase();
    const seedRows = clone(defaultDatabase[entityName] || []);
    if (!seedRows.length) continue;

    const { count, error: countError } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.warn(`[V-TEKI] Skipping seed check for ${tableName}:`, countError.message);
      continue;
    }

    if ((count ?? 0) > 0) continue;

    const { error: insertError } = await supabase.from(tableName).insert(seedRows);
    if (insertError) {
      console.warn(`[V-TEKI] Seed insert failed for ${tableName}:`, insertError.message);
    }
  }

  storage.setItem(SUPABASE_SEED_KEY, SEED_VERSION);
};

const loadDatabase = () => {
  if (isSupabaseConfigured() && isSupabaseStrictMode()) {
    return clone(defaultDatabase);
  }
  const currentSeedVersion = storage.getItem(STORAGE_KEYS.seedVersion);
  const raw = storage.getItem(STORAGE_KEYS.db);
  if (!raw || currentSeedVersion !== SEED_VERSION) {
    const seeded = clone(defaultDatabase);
    storage.setItem(STORAGE_KEYS.db, JSON.stringify(seeded));
    storage.setItem(STORAGE_KEYS.seedVersion, SEED_VERSION);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw);
    const merged = mergeSeededDatabase(parsed);

    if (JSON.stringify(parsed) !== JSON.stringify(merged)) {
      saveDatabase(merged);
    }

    if (currentSeedVersion !== SEED_VERSION) {
      storage.setItem(STORAGE_KEYS.seedVersion, SEED_VERSION);
    }

    return merged;
  } catch {
    const seeded = clone(defaultDatabase);
    storage.setItem(STORAGE_KEYS.db, JSON.stringify(seeded));
    storage.setItem(STORAGE_KEYS.seedVersion, SEED_VERSION);
    return seeded;
  }
};

const saveDatabase = (db) => {
  storage.setItem(STORAGE_KEYS.db, JSON.stringify(db));
};

let supabaseSeedPromise = null;
const ensureSupabaseSeeded = () => {
  if (!supabaseSeedPromise) {
    supabaseSeedPromise = syncSupabaseSeed().finally(() => {
      supabaseSeedPromise = null;
    });
  }
  return supabaseSeedPromise;
};

const getCollection = (entityName) => {
  const db = loadDatabase();
  if (!db[entityName]) {
    db[entityName] = [];
    saveDatabase(db);
  }
  return db[entityName];
};

const setCollection = (entityName, items) => {
  const db = loadDatabase();
  db[entityName] = items;
  saveDatabase(db);
};

const normalizeValue = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return value;
};

const matchesFilter = (item, filters = {}) =>
  Object.entries(filters).every(([key, value]) => normalizeValue(item?.[key]) === normalizeValue(value));

const sortItems = (items, orderBy) => {
  if (!orderBy) {
    return items;
  }
  const isDesc = orderBy.startsWith('-');
  const key = isDesc ? orderBy.slice(1) : orderBy;
  return [...items].sort((left, right) => {
    const a = left?.[key] ?? '';
    const b = right?.[key] ?? '';
    if (a === b) return 0;
    if (a > b) return isDesc ? -1 : 1;
    return isDesc ? 1 : -1;
  });
};

const tableMap = {
  Program: 'programs',
  Batch: 'batches',
  Registration: 'enrollments',
  User: 'users_profile',
  Payment: 'payments',
  Invoice: 'invoices',
  Assessment: 'assessments',
  AssessmentQuestion: 'assessment_questions',
  AssessmentResult: 'assessment_submissions',
  AttendanceSession: 'attendance_sessions',
  AttendanceRecord: 'attendance_records',
  Attendance: 'attendance_records',
  Feedback: 'feedback',
  Certificate: 'certificates',
  Trainer: 'trainers',
  Organization: 'organizations',
  CorporateRegistration: 'enrollments',
};

const createEntityApi = (entityName) => {
  const tableName = tableMap[entityName] || entityName.toLowerCase();
  const cacheName = `entity.${tableName}`;

  const cacheRead = (orderBy) => sortItems(clone(getCacheItem(cacheName) || []), orderBy);
  const cacheWrite = (value) => setCacheItem(cacheName, value);

  const localRead = (orderBy) => sortItems(clone(getCollection(entityName)), orderBy);
  const localWrite = (value) => setCollection(entityName, value);

  return {
    async list(orderBy) {
      if (isSupabaseConfigured()) {
        await ensureSupabaseSeeded();
        let query = supabase.from(tableName).select('*');
        if (orderBy) {
          const isDesc = orderBy.startsWith('-');
          query = query.order(isDesc ? orderBy.slice(1) : orderBy, { ascending: !isDesc });
        }
        const { data, error } = await query;
        if (error) {
          const cached = getCacheItem(cacheName) || [];
          if (cached.length) return cacheRead(orderBy);
          throw error;
        }
        const next = data || [];
        cacheWrite(next);
        if (next.length) return sortItems(clone(next), orderBy);
        const cached = getCacheItem(cacheName) || [];
        return cached.length ? cacheRead(orderBy) : next;
      }
      return localRead(orderBy);
    },
    async filter(filters) {
      if (isSupabaseConfigured()) {
        await ensureSupabaseSeeded();
        const { data, error } = await supabase.from(tableName).select('*').match(filters);
        if (error) {
          const cached = getCacheItem(cacheName) || [];
          const filteredCached = cached.filter((item) => matchesFilter(item, filters));
          if (filteredCached.length) return clone(filteredCached);
          throw error;
        }
        const next = data || [];
        cacheWrite(next);
        if (next.length) return next;
        const cached = getCacheItem(cacheName) || [];
        const filteredCached = cached.filter((item) => matchesFilter(item, filters));
        return filteredCached.length ? clone(filteredCached) : next;
      }
      const localData = getCollection(entityName);
      return clone(localData.filter((item) => matchesFilter(item, filters)));
    },
    async get(id) {
      if (isSupabaseConfigured()) {
        await ensureSupabaseSeeded();
        const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
        if (error) {
          if (error.code === 'PGRST116') {
            const cached = getCacheItem(cacheName) || [];
            return clone(cached.find((item) => item.id === id) ?? null);
          }
          throw error;
        }
        if (data) {
          const cached = getCacheItem(cacheName) || [];
          const next = cached.filter((item) => item.id !== id).concat([data]);
          cacheWrite(next);
        }
        return data;
      }
      const localData = getCollection(entityName);
      return clone(localData.find((item) => item.id === id) ?? null);
    },
    async create(data) {
      if (isSupabaseConfigured()) {
        await ensureSupabaseSeeded();
        const recordToInsert = {
          id: data.id || createId(entityName.toLowerCase()),
          created_date: data.created_date || nowIso(),
          ...data,
        };
        const { data: insertedRows, error } = await supabase.from(tableName).insert(recordToInsert).select();
        if (error) {
          console.error('[V-TEKI] Supabase create failed', {
            entityName,
            tableName,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            recordToInsert,
          });
          throw error;
        }
        const record = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows;
        if (!record) {
          throw new Error(`Supabase create returned no rows for ${entityName}`);
        }
        const cached = getCacheItem(cacheName) || [];
        cacheWrite([...cached.filter((item) => item.id !== record.id), record]);
        return record;
      }
      const localData = getCollection(entityName);
      const record = { id: createId(entityName.toLowerCase()), created_date: nowIso(), ...data };
      localWrite([...localData, record]);
      return clone(record);
    },
    async update(id, data) {
      if (isSupabaseConfigured()) {
        await ensureSupabaseSeeded();
        const { data: updatedRows, error } = await supabase.from(tableName).update(data).eq('id', id).select();
        if (error) {
          console.error('[V-TEKI] Supabase update failed', {
            entityName,
            tableName,
            id,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            data,
          });
          throw error;
        }
        const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
        if (!updated) {
          throw new Error(`Supabase update returned no rows for ${entityName}`);
        }
        const cached = getCacheItem(cacheName) || [];
        cacheWrite(cached.map((item) => (item.id === id ? updated : item)));
        return updated;
      }
      const localData = getCollection(entityName);
      const index = localData.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`${entityName} with id "${id}" not found`);
      }
      const updated = { ...localData[index], ...data, updated_date: nowIso() };
      localData[index] = updated;
      localWrite(localData);
      return clone(updated);
    },
    async delete(id) {
      if (isSupabaseConfigured()) {
        await ensureSupabaseSeeded();
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
          console.error('[V-TEKI] Supabase delete failed', {
            entityName,
            tableName,
            id,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }
        const cached = getCacheItem(cacheName) || [];
        cacheWrite(cached.filter((item) => item.id !== id));
        return { success: true };
      }
      const localData = getCollection(entityName);
      localWrite(localData.filter((item) => item.id !== id));
      return { success: true };
    },
  };
};

const getSession = () => {
  const raw = storage.getItem(STORAGE_KEYS.session);
  return raw ? JSON.parse(raw) : null;
};

const setSession = (user) => {
  const token = `local-token-${user.id}`;
  storage.setItem(STORAGE_KEYS.session, JSON.stringify({ token, user }));
  return token;
};

const clearSession = () => {
  storage.removeItem(STORAGE_KEYS.session);
};

const savePendingUser = (user) => {
  storage.setItem(STORAGE_KEYS.pendingUser, JSON.stringify(user));
};

const getPendingUser = () => {
  const raw = storage.getItem(STORAGE_KEYS.pendingUser);
  return raw ? JSON.parse(raw) : null;
};

const clearPendingUser = () => {
  storage.removeItem(STORAGE_KEYS.pendingUser);
};

const findLocalUserByCredentials = (email, password) => {
  const users = getCollection('User');
  return users.find(
    (entry) => entry.email?.toLowerCase() === email.toLowerCase() && entry.password === password,
  ) ?? null;
};

const shouldUseLocalFallback = () => !isSupabaseConfigured();

const shouldUseSupabaseAuth = () => isSupabaseConfigured();

const createSupabaseAuthSession = async (email, password, pendingUser = {}) => {
  const signInResult = await supabase.auth.signInWithPassword({ email, password });
  if (!signInResult.error && signInResult.data?.user) {
    const profile = await ensureSupabaseUserProfile(signInResult.data.user, pendingUser);
    return toAppUser(signInResult.data.user, profile);
  }

  const authErrorMessage = signInResult.error?.message || '';
  const shouldPromptRegistration =
    /invalid login credentials|email not confirmed|user not found/i.test(authErrorMessage);

  if (shouldPromptRegistration) {
    throw new Error(authErrorMessage || 'Unable to sign in with Supabase Auth.');
  }

  throw signInResult.error;
};

const getDemoTrainerUser = () => getCollection('User').find((entry) => entry.email?.toLowerCase() === DEMO_TRAINER_EMAIL) || null;

const fetchUserProfile = async (userId, email) => {
  const { data: profile, error } = await supabase.from('users_profile').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (profile || !email) return profile;

  const { data: emailProfile, error: emailError } = await supabase
    .from('users_profile')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (emailError) throw emailError;
  return emailProfile;
};

const toAppUser = (authUser, profile) => ({
  id: profile?.id || authUser?.id,
  email: profile?.email || authUser?.email,
  full_name:
    (authUser?.email?.toLowerCase() === DEMO_TRAINER_EMAIL ? DEMO_TRAINER_NAME : null) ||
    profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split('@')[0] ||
    'User',
  role: profile?.role || authUser?.user_metadata?.role || 'participant',
  phone: profile?.phone || authUser?.phone || '',
  organization_id: profile?.organization_id || null,
  organization_name: profile?.organization_name || '',
  status: profile?.status || 'active',
  created_date: profile?.created_date || authUser?.created_at || nowIso(),
});

const ensureSupabaseUserProfile = async (authUser, overrides = {}) => {
  if (!authUser?.id) return null;

  const existingProfile = await fetchUserProfile(authUser.id, authUser.email);
  if (existingProfile) {
    if (authUser.email?.toLowerCase() === DEMO_TRAINER_EMAIL && existingProfile.full_name !== DEMO_TRAINER_NAME) {
      const normalizedTrainerProfile = {
        ...existingProfile,
        full_name: DEMO_TRAINER_NAME,
        email: DEMO_TRAINER_EMAIL,
      };
      const { data, error } = await supabase
        .from('users_profile')
        .upsert(normalizedTrainerProfile, { onConflict: 'id' })
        .select()
        .single();
      if (!error && data) return data;
    }
    return existingProfile;
  }

  const profile = {
    id: authUser.id,
    email: authUser.email?.toLowerCase() === DEMO_TRAINER_EMAIL ? DEMO_TRAINER_EMAIL : authUser.email,
    full_name:
      authUser.email?.toLowerCase() === DEMO_TRAINER_EMAIL
        ? DEMO_TRAINER_NAME
        : overrides.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    role: overrides.role || authUser.user_metadata?.role || 'participant',
    phone: overrides.phone || authUser.phone || null,
    organization_id: overrides.organization_id || null,
    organization_name: overrides.organization_name || null,
    status: 'active',
    created_date: nowIso(),
  };

  const { data, error } = await supabase
    .from('users_profile')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const getSupabaseCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) {
    throw Object.assign(new Error('Authentication required'), { status: 401 });
  }

  const profile = await ensureSupabaseUserProfile(data.user);
  return toAppUser(data.user, profile);
};

const auth = {
  async me() {
    const localSession = getSession();

    if (localSession?.user && shouldUseLocalFallback()) {
      return clone(localSession.user);
    }

    if (isSupabaseConfigured()) {
      return getSupabaseCurrentUser();
    }

    throw Object.assign(new Error('Authentication required'), { status: 401 });
  },
  async loginViaEmailPassword(email, password) {
      if (shouldUseSupabaseAuth()) {
        return createSupabaseAuthSession(email, password);
      }

      if (email?.toLowerCase() === DEMO_TRAINER_EMAIL) {
        const demoTrainer = getDemoTrainerUser();
        if (demoTrainer && demoTrainer.password === password) {
          setSession(demoTrainer);
          return clone(demoTrainer);
        }
      }

      if (!shouldUseLocalFallback()) {
        throw Object.assign(new Error('Supabase authentication required'), { status: 401 });
      }

    const user = findLocalUserByCredentials(email, password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    setSession(user);
    return clone(user);
  },
  async sendEmailOtp(email) {
    if (email?.toLowerCase() === DEMO_TRAINER_EMAIL) {
      const user = getDemoTrainerUser();
      if (user) {
        savePendingUser(user);
        return { success: true };
      }
    }

    if (shouldUseSupabaseAuth()) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      return { success: true };
    }

    if (!shouldUseLocalFallback()) {
      throw Object.assign(new Error('Supabase authentication required'), { status: 401 });
    }

    const user = getCollection('User').find((entry) => entry.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Email not registered');
    }
    savePendingUser(user);
    return { success: true };
  },
  loginWithProvider(_provider, redirectTo = '/') {
    if (isSupabaseConfigured()) {
      return supabase.auth.signInWithOAuth({
        provider: _provider,
        options: {
          redirectTo: isBrowser ? `${window.location.origin}${redirectTo}` : undefined,
        },
      });
    }

    if (!shouldUseLocalFallback()) {
      return;
    }

    const [demoUser] = getCollection('User');
    if (demoUser) {
      setSession(demoUser);
    }
    if (isBrowser) {
      window.location.href = redirectTo;
    }
  },
  async register({ email, password }) {
    if (email?.toLowerCase() === DEMO_TRAINER_EMAIL) {
      const user = getDemoTrainerUser();
      if (user) {
        savePendingUser(user);
        return { success: true };
      }
    }

    if (shouldUseSupabaseAuth()) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      });
      if (error) throw error;
      return { success: true };
    }

    if (!shouldUseLocalFallback()) {
      throw Object.assign(new Error('Supabase authentication required'), { status: 401 });
    }

    const users = getCollection('User');
    if (users.some((entry) => entry.email?.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered');
    }
      const pendingUser = {
        id: createId('user'),
        email,
        password,
        full_name: email.split('@')[0],
        role: 'participant',
        created_date: nowIso(),
      };
      savePendingUser(pendingUser);
    return { success: true };
  },
  async verifyOtp({ email, otpCode, type = 'email' }) {
    if (!otpCode || otpCode.length < 6) {
      throw new Error('Invalid verification code');
    }

    if (email?.toLowerCase() === DEMO_TRAINER_EMAIL) {
      const demoTrainer = getDemoTrainerUser();
      if (demoTrainer) {
        clearPendingUser();
        const accessToken = setSession(demoTrainer);
        return { access_token: accessToken, user: clone(demoTrainer) };
      }
    }

    if (shouldUseSupabaseAuth()) {
      const pendingUser = getPendingUser() || {};
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: type === 'signup' ? 'email' : type,
      });
      if (error) throw error;
      if (!data?.user) {
        throw Object.assign(new Error('Unable to verify Supabase OTP'), { status: 401 });
      }
      if (pendingUser.password) {
        const passwordResult = await supabase.auth.updateUser({ password: pendingUser.password });
        if (passwordResult.error) throw passwordResult.error;
      }
      const profile = await ensureSupabaseUserProfile(data.user, pendingUser);
      clearPendingUser();
      return {
        access_token: data.session?.access_token,
        user: toAppUser(data.user, profile),
      };
    }

    if (!shouldUseLocalFallback()) {
      throw Object.assign(new Error('Supabase authentication required'), { status: 401 });
    }

    const pendingUser = getPendingUser();
    if (!pendingUser || pendingUser.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Registration session not found');
    }
    const users = getCollection('User');
    users.push(pendingUser);
    setCollection('User', users);
    clearPendingUser();
    const accessToken = setSession(pendingUser);
    return { access_token: accessToken };
  },
  setToken() {
    return true;
  },
  async resendOtp(email, type = 'email') {
    if (email?.toLowerCase() === DEMO_TRAINER_EMAIL) {
      const user = getDemoTrainerUser();
      if (user) return { success: true };
    }

    if (email && shouldUseSupabaseAuth()) {
      const emailOtpType = type === 'email_change' ? 'email_change' : 'signup';
      const { error } = await supabase.auth.resend({
        type: emailOtpType,
        email,
      });
      if (error) throw error;
      return { success: true };
    }
    if (!shouldUseLocalFallback()) {
      return { success: true };
    }
    return { success: true };
  },
  async resetPasswordRequest(email) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: isBrowser ? `${window.location.origin}/forgot-password` : undefined,
        },
      );
      if (error) throw error;
      return { success: true };
    }
    return { success: true };
  },
  async resetPassword({ resetToken, newPassword }) {
    if (!resetToken) {
      throw new Error('Invalid reset token');
    }
    const session = getSession();
    if (session?.user) {
      if (!shouldUseLocalFallback()) {
        throw Object.assign(new Error('Supabase authentication required'), { status: 401 });
      }
      const users = getCollection('User');
      const index = users.findIndex((entry) => entry.id === session.user.id);
      if (index >= 0) {
        users[index] = { ...users[index], password: newPassword, updated_date: nowIso() };
        setCollection('User', users);
      }
    }
    return { success: true };
  },
  async logout(redirectTo) {
    clearSession();
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    if (redirectTo && isBrowser) {
      window.location.href = redirectTo;
    }
  },
  redirectToLogin(redirectTo = '/login') {
    if (isBrowser) {
      window.location.href = redirectTo;
    }
  },
};

const users = {
  async inviteUser(email, role = 'user') {
    const existingUsers = getCollection('User');
    const existingUser = existingUsers.find((entry) => entry.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('User already exists');
    }

    const invitedUser = {
      id: createId('user'),
      email,
      full_name: email.split('@')[0],
      role,
      password: 'welcome123',
      status: 'invited',
      created_date: nowIso(),
    };

    existingUsers.push(invitedUser);
    setCollection('User', existingUsers);
    return clone(invitedUser);
  },

  async adminUpdateRole(targetEmail, newRole, newStatus) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_email: targetEmail,
        new_role: newRole,
        new_status: newStatus || null,
      });
      if (error) throw error;
      return data;
    }
    // Fallback: local storage update by email
    const localUsers = getCollection('User');
    const index = localUsers.findIndex((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (index === -1) throw new Error(`User with email ${targetEmail} not found`);
    localUsers[index] = { ...localUsers[index], role: newRole, status: newStatus || localUsers[index].status, updated_date: nowIso() };
    setCollection('User', localUsers);
    return clone(localUsers[index]);
  },
};


const entities = new Proxy(
  {},
  {
    get(_target, entityName) {
      return createEntityApi(entityName);
    },
  },
);

export const appClient = { auth, entities, users, getRoleHomePath, isCertificateEligible };

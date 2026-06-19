/**
 * Purpose: Map local application entity names to Supabase table names and metadata.
 * Used by: App data adapter, schema/entity validation scripts, and validator tests.
 * Main dependencies: None.
 * Public/main functions: `getSupabaseTableName`, `getEntityMapping`, `getLocalEntityName`, and `getAllEntitiesSortedByPriority`.
 * Important side effects: None.
 */

const ENTITY_MAPPING = {
  // Priority 1: Core identity entities
  User: {
    supabaseTable: 'users_profile',
    priority: 1,
    description: 'User profiles (extends Supabase auth.users)',
  },
  Trainer: {
    supabaseTable: 'trainers',
    priority: 1,
    description: 'Trainer profiles',
  },
  Organization: {
    supabaseTable: 'organizations',
    priority: 1,
    description: 'Corporate organizations',
  },

  // Priority 2: Learning catalog entities
  Program: {
    supabaseTable: 'programs',
    priority: 2,
    description: 'Training programs',
  },
  Batch: {
    supabaseTable: 'batches',
    priority: 2,
    description: 'Program batches / cohorts',
  },

  // Priority 3: Enrollment and payment entities
  Registration: {
    supabaseTable: 'enrollments',
    priority: 3,
    description: 'Enrollment (Registration) records',
    aliases: ['Enrollment'],
  },
  Invoice: {
    supabaseTable: 'invoices',
    priority: 3,
    description: 'Invoices for billing',
  },
  Payment: {
    supabaseTable: 'payments',
    priority: 3,
    description: 'Payment records',
  },

  // Priority 4: Learning activity entities
  Assessment: {
    supabaseTable: 'assessments',
    priority: 4,
    description: 'Assessment definitions',
  },
  AssessmentQuestion: {
    supabaseTable: 'assessment_questions',
    priority: 4,
    description: 'Assessment question definitions',
  },
  AssessmentResult: {
    supabaseTable: 'assessment_submissions',
    priority: 4,
    description: 'Assessment submission results',
    aliases: ['AssessmentSubmission'],
  },
  AttendanceSession: {
    supabaseTable: 'attendance_sessions',
    priority: 4,
    description: 'Attendance session definitions',
  },
  AttendanceRecord: {
    supabaseTable: 'attendance_records',
    priority: 4,
    description: 'Individual attendance records',
  },

  // Priority 5: Feedback and completion entities
  Feedback: {
    supabaseTable: 'feedback',
    priority: 5,
    description: 'Program feedback and ratings',
  },
  Certificate: {
    supabaseTable: 'certificates',
    priority: 5,
    description: 'Completion certificates',
  },

  // Aliases and variations
  Attendance: {
    supabaseTable: 'attendance_records',
    priority: 4,
    description: 'Attendance records (alias)',
  },
  CorporateRegistration: {
    supabaseTable: 'enrollments',
    priority: 3,
    description: 'Corporate registrations (alias for enrollments)',
  },
};

/**
 * Reverse mapping: Supabase table name -> local entity name
 */
const TABLE_TO_ENTITY = {};
Object.entries(ENTITY_MAPPING).forEach(([entityName, config]) => {
  TABLE_TO_ENTITY[config.supabaseTable] = entityName;
});

/**
 * Get Supabase table name for a local entity name
 * Handles aliases and case variations
 */
function getSupabaseTableName(entityName) {
  if (!entityName) return null;

  // Direct match
  if (ENTITY_MAPPING[entityName]) {
    return ENTITY_MAPPING[entityName].supabaseTable;
  }

  // Try case-insensitive match
  const normalized = entityName.toLowerCase();
  for (const [name, config] of Object.entries(ENTITY_MAPPING)) {
    if (name.toLowerCase() === normalized) {
      return config.supabaseTable;
    }

    // Check aliases
    if (config.aliases) {
      for (const alias of config.aliases) {
        if (alias.toLowerCase() === normalized) {
          return config.supabaseTable;
        }
      }
    }
  }

  return null;
}

/**
 * Get mapping info for an entity
 */
function getEntityMapping(entityName) {
  if (!entityName) return null;

  // Direct match
  if (ENTITY_MAPPING[entityName]) {
    return {
      localName: entityName,
      ...ENTITY_MAPPING[entityName],
    };
  }

  // Try case-insensitive match
  const normalized = entityName.toLowerCase();
  for (const [name, config] of Object.entries(ENTITY_MAPPING)) {
    if (name.toLowerCase() === normalized) {
      return {
        localName: name,
        ...config,
      };
    }

    // Check aliases
    if (config.aliases) {
      for (const alias of config.aliases) {
        if (alias.toLowerCase() === normalized) {
          return {
            localName: name,
            ...config,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Get local entity name for a Supabase table
 */
function getLocalEntityName(supabaseTableName) {
  if (!supabaseTableName) return null;

  const normalized = supabaseTableName.toLowerCase();
  for (const [entityName, config] of Object.entries(ENTITY_MAPPING)) {
    if (config.supabaseTable.toLowerCase() === normalized) {
      return entityName;
    }
  }

  return null;
}

/**
 * Get all entities sorted by priority
 */
function getAllEntitiesSortedByPriority() {
  return Object.entries(ENTITY_MAPPING)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([name, config]) => ({
      localName: name,
      ...config,
    }));
}

export {
  ENTITY_MAPPING,
  TABLE_TO_ENTITY,
  getSupabaseTableName,
  getEntityMapping,
  getLocalEntityName,
  getAllEntitiesSortedByPriority,
};

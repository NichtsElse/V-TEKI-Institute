/**
 * Purpose: Verify local entity to Supabase table mapping behavior.
 * Used by: Vitest baseline and migration validation.
 * Main dependencies: Vitest and `src/validators/entityMapping.js`.
 * Public/main functions: Entity mapping test suites.
 * Important side effects: None.
 */

import { describe, expect, it } from 'vitest';
import {
  ENTITY_MAPPING,
  getSupabaseTableName,
  getEntityMapping,
  getLocalEntityName,
  getAllEntitiesSortedByPriority,
} from '../entityMapping.js';

describe('Entity Mapping Module', () => {
  describe('ENTITY_MAPPING constant', () => {
    it('should define all 14 core entities', () => {
      const entityNames = Object.keys(ENTITY_MAPPING);
      expect(entityNames.length).toBeGreaterThanOrEqual(14);
    });

    it('should include User entity mapping to vi_users_profile', () => {
      expect(ENTITY_MAPPING.User.supabaseTable).toBe('vi_users_profile');
      expect(ENTITY_MAPPING.User.priority).toBe(1);
    });

    it('should include Trainer entity mapping to vi_trainers', () => {
      expect(ENTITY_MAPPING.Trainer.supabaseTable).toBe('vi_trainers');
      expect(ENTITY_MAPPING.Trainer.priority).toBe(1);
    });

    it('should include Organization entity mapping to vi_organizations', () => {
      expect(ENTITY_MAPPING.Organization.supabaseTable).toBe('vi_organizations');
      expect(ENTITY_MAPPING.Organization.priority).toBe(1);
    });

    it('should include Program entity mapping to vi_programs', () => {
      expect(ENTITY_MAPPING.Program.supabaseTable).toBe('vi_programs');
      expect(ENTITY_MAPPING.Program.priority).toBe(2);
    });

    it('should include Batch entity mapping to vi_batches', () => {
      expect(ENTITY_MAPPING.Batch.supabaseTable).toBe('vi_batches');
      expect(ENTITY_MAPPING.Batch.priority).toBe(2);
    });

    it('should include Registration entity mapping to vi_enrollments', () => {
      expect(ENTITY_MAPPING.Registration.supabaseTable).toBe('vi_enrollments');
      expect(ENTITY_MAPPING.Registration.priority).toBe(3);
    });

    it('should include Payment entity mapping to vi_payments', () => {
      expect(ENTITY_MAPPING.Payment.supabaseTable).toBe('vi_payments');
      expect(ENTITY_MAPPING.Payment.priority).toBe(3);
    });

    it('should include Invoice entity mapping to vi_invoices', () => {
      expect(ENTITY_MAPPING.Invoice.supabaseTable).toBe('vi_invoices');
      expect(ENTITY_MAPPING.Invoice.priority).toBe(3);
    });

    it('should include Assessment entity mapping to vi_assessments', () => {
      expect(ENTITY_MAPPING.Assessment.supabaseTable).toBe('vi_assessments');
      expect(ENTITY_MAPPING.Assessment.priority).toBe(4);
    });

    it('should include AssessmentQuestion entity mapping to vi_assessment_questions', () => {
      expect(ENTITY_MAPPING.AssessmentQuestion.supabaseTable).toBe('vi_assessment_questions');
      expect(ENTITY_MAPPING.AssessmentQuestion.priority).toBe(4);
    });

    it('should include AssessmentResult entity mapping to vi_assessment_submissions', () => {
      expect(ENTITY_MAPPING.AssessmentResult.supabaseTable).toBe('vi_assessment_submissions');
      expect(ENTITY_MAPPING.AssessmentResult.priority).toBe(4);
    });

    it('should include AttendanceSession entity mapping to vi_attendance_sessions', () => {
      expect(ENTITY_MAPPING.AttendanceSession.supabaseTable).toBe('vi_attendance_sessions');
      expect(ENTITY_MAPPING.AttendanceSession.priority).toBe(4);
    });

    it('should include AttendanceRecord entity mapping to vi_attendance_records', () => {
      expect(ENTITY_MAPPING.AttendanceRecord.supabaseTable).toBe('vi_attendance_records');
      expect(ENTITY_MAPPING.AttendanceRecord.priority).toBe(4);
    });

    it('should include Feedback entity mapping to vi_feedback', () => {
      expect(ENTITY_MAPPING.Feedback.supabaseTable).toBe('vi_feedback');
      expect(ENTITY_MAPPING.Feedback.priority).toBe(5);
    });

    it('should include Certificate entity mapping to vi_certificates', () => {
      expect(ENTITY_MAPPING.Certificate.supabaseTable).toBe('vi_certificates');
      expect(ENTITY_MAPPING.Certificate.priority).toBe(5);
    });

    it('should include priority metadata for all entities', () => {
      for (const [entityName, config] of Object.entries(ENTITY_MAPPING)) {
        expect(config.priority).toBeDefined();
        expect(config.priority).toBeGreaterThanOrEqual(1);
        expect(config.priority).toBeLessThanOrEqual(5);
      }
    });

    it('should include description for all entities', () => {
      for (const [entityName, config] of Object.entries(ENTITY_MAPPING)) {
        expect(config.description).toBeDefined();
        expect(typeof config.description).toBe('string');
      }
    });
  });

  describe('getSupabaseTableName', () => {
    it('should return correct table name for User', () => {
      expect(getSupabaseTableName('User')).toBe('vi_users_profile');
    });

    it('should return correct table name for Program', () => {
      expect(getSupabaseTableName('Program')).toBe('vi_programs');
    });

    it('should return correct table name for Registration', () => {
      expect(getSupabaseTableName('Registration')).toBe('vi_enrollments');
    });

    it('should return correct table name for AssessmentResult', () => {
      expect(getSupabaseTableName('AssessmentResult')).toBe('vi_assessment_submissions');
    });

    it('should return correct table name for AssessmentQuestion', () => {
      expect(getSupabaseTableName('AssessmentQuestion')).toBe('vi_assessment_questions');
    });

    it('should handle case-insensitive lookups', () => {
      expect(getSupabaseTableName('user')).toBe('vi_users_profile');
      expect(getSupabaseTableName('USER')).toBe('vi_users_profile');
      expect(getSupabaseTableName('program')).toBe('vi_programs');
    });

    it('should return null for unknown entity', () => {
      expect(getSupabaseTableName('UnknownEntity')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(getSupabaseTableName(null)).toBeNull();
    });

    it('should handle aliases like Enrollment', () => {
      expect(getSupabaseTableName('Enrollment')).toBe('vi_enrollments');
    });

    it('should handle CorporateRegistration alias', () => {
      expect(getSupabaseTableName('CorporateRegistration')).toBe('vi_enrollments');
    });
  });

  describe('getEntityMapping', () => {
    it('should return full mapping object for Program', () => {
      const mapping = getEntityMapping('Program');
      expect(mapping).toBeDefined();
      expect(mapping.localName).toBe('Program');
      expect(mapping.supabaseTable).toBe('vi_programs');
      expect(mapping.priority).toBe(2);
    });

    it('should handle case-insensitive lookups', () => {
      const mapping1 = getEntityMapping('program');
      const mapping2 = getEntityMapping('PROGRAM');
      expect(mapping1.localName).toBe('Program');
      expect(mapping2.localName).toBe('Program');
    });

    it('should return null for unknown entity', () => {
      expect(getEntityMapping('UnknownEntity')).toBeNull();
    });

    it('should resolve aliases to original entity', () => {
      const mapping = getEntityMapping('Enrollment');
      expect(mapping.localName).toBe('Registration');
    });
  });

  describe('getLocalEntityName', () => {
    it('should return local name for supabase table', () => {
      expect(getLocalEntityName('vi_users_profile')).toBe('User');
      expect(getLocalEntityName('vi_programs')).toBe('Program');
      expect(getLocalEntityName('vi_enrollments')).toBe('Registration');
    });

    it('should handle case-insensitive lookups', () => {
      expect(getLocalEntityName('vi_users_profile')).toBe('User');
      expect(getLocalEntityName('vi_USERS_PROFILE')).toBe('User');
      expect(getLocalEntityName('vi_Programs')).toBe('Program');
    });

    it('should return null for unknown table', () => {
      expect(getLocalEntityName('unknown_table')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(getLocalEntityName(null)).toBeNull();
    });
  });

  describe('getAllEntitiesSortedByPriority', () => {
    it('should return all entities sorted by priority', () => {
      const entities = getAllEntitiesSortedByPriority();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBeGreaterThanOrEqual(14);
    });

    it('should have entities sorted in ascending priority order', () => {
      const entities = getAllEntitiesSortedByPriority();
      for (let i = 0; i < entities.length - 1; i++) {
        expect(entities[i].priority).toBeLessThanOrEqual(entities[i + 1].priority);
      }
    });

    it('should have priority 1 entities first', () => {
      const entities = getAllEntitiesSortedByPriority();
      const priority1Entities = entities.filter((e) => e.priority === 1);
      expect(priority1Entities.length).toBeGreaterThan(0);
      expect(entities.slice(0, priority1Entities.length)).toEqual(priority1Entities);
    });

    it('should include localName in each entity', () => {
      const entities = getAllEntitiesSortedByPriority();
      for (const entity of entities) {
        expect(entity.localName).toBeDefined();
        expect(typeof entity.localName).toBe('string');
      }
    });

    it('should include supabaseTable in each entity', () => {
      const entities = getAllEntitiesSortedByPriority();
      for (const entity of entities) {
        expect(entity.supabaseTable).toBeDefined();
        expect(typeof entity.supabaseTable).toBe('string');
      }
    });
  });
});

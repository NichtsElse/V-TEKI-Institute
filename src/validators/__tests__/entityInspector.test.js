/**
 * Purpose: Verify entity inspection and field type inference behavior.
 * Used by: Vitest baseline and migration validation.
 * Main dependencies: Vitest, `entityInspector`, `entityMapping`, and `src/api/appClient.js`.
 * Public/main functions: Entity inspector test suites.
 * Important side effects: Reads appClient seed data from disk.
 */

import { describe, expect, it } from 'vitest';
import {
  buildEntityRegistry,
  inferTypeFromValue,
  inferFieldType,
  isForeignKeyField,
} from '../entityInspector.js';

describe('Entity Inspector Module', () => {
  describe('inferTypeFromValue', () => {
    it('should infer string type', () => {
      const result = inferTypeFromValue('hello world');
      expect(result).toBe('string');
    });

    it('should infer number type for integers', () => {
      const result = inferTypeFromValue(123);
      expect(result).toBe('number');
    });

    it('should infer number type for decimals', () => {
      const result = inferTypeFromValue(123.45);
      expect(result).toBe('number');
    });

    it('should infer boolean type', () => {
      expect(inferTypeFromValue(true)).toBe('boolean');
      expect(inferTypeFromValue(false)).toBe('boolean');
    });

    it('should infer UUID from UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = inferTypeFromValue(uuid);
      expect(result).toBe('uuid');
    });

    it('should infer email from email string', () => {
      const result = inferTypeFromValue('user@example.com');
      expect(result).toBe('email');
    });

    it('should infer date from ISO date string', () => {
      const result = inferTypeFromValue('2026-07-08');
      expect(result).toBe('date');
    });

    it('should infer timestamp from ISO timestamp string', () => {
      const result = inferTypeFromValue('2026-07-08T09:00:00.000Z');
      expect(result).toBe('timestamp');
    });

    it('should infer array type', () => {
      const result = inferTypeFromValue([1, 2, 3]);
      expect(result).toBe('array');
    });

    it('should infer object type', () => {
      const result = inferTypeFromValue({ key: 'value' });
      expect(result).toBe('object');
    });

    it('should return unknown for null', () => {
      const result = inferTypeFromValue(null);
      expect(result).toBe('unknown');
    });

    it('should return unknown for undefined', () => {
      const result = inferTypeFromValue(undefined);
      expect(result).toBe('unknown');
    });
  });

  describe('inferFieldType', () => {
    it('should return object with baseType and inferredAs', () => {
      const result = inferFieldType('test');
      expect(result).toHaveProperty('baseType');
      expect(result).toHaveProperty('inferredAs');
      expect(result.baseType).toBe('string');
      expect(result.inferredAs).toBe('string');
    });

    it('should infer UUID field type', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = inferFieldType(uuid);
      expect(result.inferredAs).toBe('uuid');
    });

    it('should infer email field type', () => {
      const result = inferFieldType('user@example.com');
      expect(result.inferredAs).toBe('email');
    });
  });

  describe('isForeignKeyField', () => {
    it('should identify fields ending with _id as FK', () => {
      expect(isForeignKeyField('batch_id')).toBe(true);
      expect(isForeignKeyField('program_id')).toBe(true);
      expect(isForeignKeyField('trainer_id')).toBe(true);
    });

    it('should identify known FK fields', () => {
      expect(isForeignKeyField('batch_id')).toBe(true);
      expect(isForeignKeyField('registration_id')).toBe(true);
      expect(isForeignKeyField('assessment_id')).toBe(true);
      expect(isForeignKeyField('attendance_session_id')).toBe(true);
    });

    it('should not identify non-FK fields', () => {
      expect(isForeignKeyField('name')).toBe(false);
      expect(isForeignKeyField('description')).toBe(false);
      expect(isForeignKeyField('status')).toBe(false);
    });

    it('should be case-insensitive for _id suffix', () => {
      expect(isForeignKeyField('BatchId')).toBe(true);
      expect(isForeignKeyField('PROGRAM_ID')).toBe(true);
    });
  });

  describe('buildEntityRegistry', () => {
    it('should build entity registry from appClient.js', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry).toBeDefined();
      expect(typeof registry).toBe('object');
    });

    it('should include Program entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Program).toBeDefined();
      expect(registry.Program.supabaseTable).toBe('programs');
    });

    it('should include Trainer entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Trainer).toBeDefined();
      expect(registry.Trainer.supabaseTable).toBe('trainers');
    });

    it('should include Batch entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Batch).toBeDefined();
      expect(registry.Batch.supabaseTable).toBe('batches');
    });

    it('should include Registration entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Registration).toBeDefined();
      expect(registry.Registration.supabaseTable).toBe('enrollments');
    });

    it('should include Payment entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Payment).toBeDefined();
      expect(registry.Payment.supabaseTable).toBe('payments');
    });

    it('should include Certificate entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Certificate).toBeDefined();
      expect(registry.Certificate.supabaseTable).toBe('certificates');
    });

    it('should include Assessment entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Assessment).toBeDefined();
      expect(registry.Assessment.supabaseTable).toBe('assessments');
    });

    it('should include AttendanceSession entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.AttendanceSession).toBeDefined();
      expect(registry.AttendanceSession.supabaseTable).toBe('attendance_sessions');
    });

    it('should include AttendanceRecord entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.AttendanceRecord).toBeDefined();
      expect(registry.AttendanceRecord.supabaseTable).toBe('attendance_records');
    });

    it('should include Feedback entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Feedback).toBeDefined();
      expect(registry.Feedback.supabaseTable).toBe('feedback');
    });

    it('should include AssessmentResult entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.AssessmentResult).toBeDefined();
      expect(registry.AssessmentResult.supabaseTable).toBe('assessment_submissions');
    });

    it('should parse Program entity fields', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      const programFields = registry.Program.fields;
      expect(programFields).toBeDefined();
      expect(Object.keys(programFields).length).toBeGreaterThan(0);
    });

    it('should identify id field in Program', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      const programFields = registry.Program.fields;
      expect(programFields.id).toBeDefined();
      expect(programFields.id.type).toBe('string');
    });

    it('should identify batch_id as foreign key in Registration', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      const registrationFields = registry.Registration.fields;
      expect(registrationFields.batch_id).toBeDefined();
      expect(registrationFields.batch_id.isFK).toBe(true);
    });

    it('should count records in Program entity', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.Program.recordCount).toBeGreaterThan(0);
    });

    it('should include user record count', () => {
      const registry = buildEntityRegistry('src/api/appClient.js');
      expect(registry.User).toBeDefined();
      expect(registry.User.recordCount).toBeGreaterThan(0);
    });
  });
});

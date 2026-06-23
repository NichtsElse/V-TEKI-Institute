/**
 * Purpose: Verify Supabase schema parsing helpers against the active fixed schema.
 * Used by: Vitest baseline and migration validation.
 * Main dependencies: Vitest, `schemaReader`, and `supabase/schema_fixed.sql`.
 * Public/main functions: Schema reader test suites.
 * Important side effects: Reads schema fixture files from disk.
 */

import { describe, expect, it } from 'vitest';
import {
  readAndParseSchema,
  parseTableDefinition,
  parseColumnDefinition,
  parseEnumValuesFromConstraint,
} from '../schemaReader.js';

const schemaPath = 'supabase/schema_fixed.sql';

describe('Schema Reader Module', () => {
  describe('parseEnumValuesFromConstraint', () => {
    it('should extract enum values from CHECK constraint with IN clause', () => {
      const constraint = "CHECK (status IN ('active', 'inactive'))";
      const result = parseEnumValuesFromConstraint(constraint);
      expect(result).toEqual(['active', 'inactive']);
    });

    it('should handle multiple enum values', () => {
      const constraint = "CHECK (role IN ('admin', 'user', 'guest', 'moderator'))";
      const result = parseEnumValuesFromConstraint(constraint);
      expect(result).toEqual(['admin', 'user', 'guest', 'moderator']);
    });

    it('should return empty array if no IN clause found', () => {
      const constraint = 'CHECK (age > 18)';
      const result = parseEnumValuesFromConstraint(constraint);
      expect(result).toEqual([]);
    });

    it('should handle double quotes in constraint', () => {
      const constraint = 'CHECK (status IN ("active", "inactive"))';
      const result = parseEnumValuesFromConstraint(constraint);
      expect(result).toEqual(['active', 'inactive']);
    });

    it('should handle mixed quotes', () => {
      const constraint = "CHECK (status IN ('active', \"inactive\"))";
      const result = parseEnumValuesFromConstraint(constraint);
      expect(result).toEqual(['active', 'inactive']);
    });
  });

  describe('parseColumnDefinition', () => {
    it('should parse simple column definition', () => {
      const line = 'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),';
      const result = parseColumnDefinition(line);
      expect(result).not.toBeNull();
      expect(result.name).toBe('id');
      expect(result.type).toBe('UUID');
    });

    it('should detect NOT NULL constraint', () => {
      const line = 'name VARCHAR(255) NOT NULL,';
      const result = parseColumnDefinition(line);
      expect(result.nullable).toBe(false);
    });

    it('should detect nullable columns by default', () => {
      const line = 'description TEXT,';
      const result = parseColumnDefinition(line);
      expect(result.nullable).toBe(true);
    });

    it('should parse CHECK constraint for enums', () => {
      const line = "status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),";
      const result = parseColumnDefinition(line);
      expect(result.constraint).toContain('CHECK');
      expect(result.enums).toContain('draft');
      expect(result.enums).toContain('published');
      expect(result.enums).toContain('archived');
    });

    it('should detect foreign key references', () => {
      const line = 'program_id UUID NOT NULL REFERENCES vi_programs(id) ON DELETE CASCADE,';
      const result = parseColumnDefinition(line);
      expect(result.isFK).toBe(true);
      expect(result.references).toBe('vi_programs.id');
    });

    it('should return null for table constraints', () => {
      const line = "PRIMARY KEY (id),";
      const result = parseColumnDefinition(line);
      expect(result).toBeNull();
    });

    it('should return null for comments', () => {
      const line = '-- This is a comment';
      const result = parseColumnDefinition(line);
      expect(result).toBeNull();
    });

    it('should extract DEFAULT value', () => {
      const line = "status VARCHAR(50) DEFAULT 'active',";
      const result = parseColumnDefinition(line);
      expect(result.default).toBe("'active'");
    });
  });

  describe('readAndParseSchema', () => {
    it('should read and parse supabase/schema_fixed.sql', () => {
      const schema = readAndParseSchema(schemaPath);
      expect(schema).toBeDefined();
      expect(schema.tables).toBeDefined();
      expect(typeof schema.tables).toBe('object');
    });

    it('should parse vi_organizations table', () => {
      const schema = readAndParseSchema(schemaPath);
      expect(schema.tables.vi_organizations).toBeDefined();
      expect(schema.tables.vi_organizations.columns).toBeDefined();
      expect(schema.tables.vi_organizations.columns.id).toBeDefined();
      expect(schema.tables.vi_organizations.columns.name).toBeDefined();
    });

    it('should parse vi_programs table with correct columns', () => {
      const schema = readAndParseSchema(schemaPath);
      const programsTable = schema.tables.vi_programs;
      expect(programsTable).toBeDefined();
      expect(programsTable.columns.id).toBeDefined();
      expect(programsTable.columns.name).toBeDefined();
      expect(programsTable.columns.code).toBeDefined();
    });

    it('should leave vi_programs.status enum empty when schema has no CHECK enum', () => {
      const schema = readAndParseSchema(schemaPath);
      const statusColumn = schema.tables.vi_programs.columns.status;
      expect(statusColumn.enums).toEqual([]);
    });

    it('should mark id columns as NOT NULL', () => {
      const schema = readAndParseSchema(schemaPath);
      const orgId = schema.tables.vi_organizations.columns.id;
      expect(orgId.nullable).toBe(false);
    });

    it('should mark name columns in vi_organizations as NOT NULL', () => {
      const schema = readAndParseSchema(schemaPath);
      const orgName = schema.tables.vi_organizations.columns.name;
      expect(orgName.nullable).toBe(false);
    });

    it('should parse foreign key references in vi_batches table', () => {
      const schema = readAndParseSchema(schemaPath);
      const programIdColumn = schema.tables.vi_batches.columns.program_id;
      expect(programIdColumn.isFK).toBe(true);
      expect(programIdColumn.references).toBe('vi_programs.id');
    });

    it('should parse vi_users_profile table', () => {
      const schema = readAndParseSchema(schemaPath);
      const usersTable = schema.tables.vi_users_profile;
      expect(usersTable).toBeDefined();
      expect(usersTable.columns.role).toBeDefined();
      expect(usersTable.columns.role.enums).toContain('super_admin');
      expect(usersTable.columns.role.enums).toContain('academy_admin');
      expect(usersTable.columns.role.enums).toContain('trainer');
      expect(usersTable.columns.role.enums).toContain('participant');
    });

    it('should parse vi_enrollments table with all expected columns', () => {
      const schema = readAndParseSchema(schemaPath);
      const enrollmentsTable = schema.tables.vi_enrollments;
      expect(enrollmentsTable).toBeDefined();
      expect(enrollmentsTable.columns.id).toBeDefined();
      expect(enrollmentsTable.columns.batch_id).toBeDefined();
      expect(enrollmentsTable.columns.payment_status).toBeDefined();
      expect(enrollmentsTable.columns.completion_status).toBeDefined();
    });

    it('should leave payment_status enum empty when schema has no CHECK enum', () => {
      const schema = readAndParseSchema(schemaPath);
      const paymentStatusColumn = schema.tables.vi_enrollments.columns.payment_status;
      expect(paymentStatusColumn.enums).toEqual([]);
    });

    it('should parse vi_certificates table', () => {
      const schema = readAndParseSchema(schemaPath);
      const certificatesTable = schema.tables.vi_certificates;
      expect(certificatesTable).toBeDefined();
      expect(certificatesTable.columns.registration_id).toBeDefined();
      expect(certificatesTable.columns.certificate_number).toBeDefined();
    });

    it('should throw error if schema file not found', () => {
      expect(() => {
        readAndParseSchema('nonexistent/schema.sql');
      }).toThrow();
    });
  });
});

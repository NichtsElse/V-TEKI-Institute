/**
 * Entity Inspector Module
 * Reads entity mapping metadata and Supabase schema references to build EntityRegistry.
 * Infers field types from schema-adjacent sample data and identifies relationships.
 */

const fs = require('fs');
const path = require('path');
const { getSupabaseTableName, getEntityMapping } = require('./entityMapping');

/**
 * Infer field type from value
 * Returns: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown'
 */
function inferTypeFromValue(value) {
  if (value === null || value === undefined) {
    return 'unknown';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (typeof value === 'string') {
    // Check for UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'uuid';
    }

    // Check for email format
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'email';
    }

    // Check for ISO date format
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      if (value.includes('T')) {
        return 'timestamp';
      }
      return 'date';
    }

    return 'string';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  if (typeof value === 'object') {
    return 'object';
  }

  return 'unknown';
}

/**
 * Infer complete type signature from a field value
 * Returns: { baseType, inferredAs, format }
 */
function inferFieldType(value) {
  const baseType = inferTypeFromValue(value);

  return {
    baseType,
    inferredAs: baseType,
    format: null, // Could be extended with more format info
  };
}

/**
 * Determine if a field is likely a foreign key
 * Heuristics: field name ends with '_id' or 'Id', or is explicitly named as a reference
 */
function isForeignKeyField(fieldName, fieldValue) {
  // Common FK naming patterns
  if (/_id$/i.test(fieldName)) {
    return true;
  }

  // Known FK fields
  const knownFKFields = [
    'batch_id',
    'program_id',
    'registration_id',
    'assessment_id',
    'trainer_id',
    'organization_id',
    'invoice_id',
    'attendance_session_id',
    'certificate_id',
    'participant_id',
  ];

  return knownFKFields.includes(fieldName.toLowerCase());
}

/**
 * Extract entity definitions from the current application entity mappings.
 */
function readAndInspectEntities(filePath = 'src/api/appClient.js') {
  try {
    const resolvedPath = path.resolve(filePath);
    const content = fs.readFileSync(resolvedPath, 'utf-8');

    // Parse the object
    // This is a simplified approach - we parse by looking for entity arrays
    const entityRegistry = {};

    // Find all entity definitions: EntityName: [...]
    const entityPattern = /(\w+)\s*:\s*\[([\s\S]*?)\n\s*\],?(?:\n|$)/g;
    let match;

    while ((match = entityPattern.exec(content)) !== null) {
      const entityName = match[1];
      const entityContent = match[2];

      // Get the mapping
      const tableName = getSupabaseTableName(entityName);
      if (!tableName) {
        // Skip if not in mapping (like internal fields)
        continue;
      }

      // Parse the records in this entity
      // Extract first record to infer schema (simplified approach)
      const recordMatch = entityContent.match(/\{([\s\S]*?)\}/);
      if (!recordMatch) {
        entityRegistry[entityName] = {
          supabaseTable: tableName,
          fields: {},
          recordCount: 0,
        };
        continue;
      }

      // Count records
      const recordCount = (entityContent.match(/\{[\s\S]*?\}/g) || []).length;

      // Parse first record to get field structure
      const fields = {};
      const fieldPattern = /(\w+)\s*:\s*(.+?)(?=,\s*\w+\s*:|,?\s*\})/gs;
      let fieldMatch;

      while ((fieldMatch = fieldPattern.exec(recordMatch[1])) !== null) {
        const fieldName = fieldMatch[1];
        const fieldValueStr = fieldMatch[2].trim();

        // Try to infer type from the string representation
        let inferredValue = null;
        try {
          // Simple heuristic parsing
          if (fieldValueStr.startsWith('[')) {
            inferredValue = [];
          } else if (fieldValueStr.startsWith('{')) {
            inferredValue = {};
          } else if (fieldValueStr.match(/^['"`]/)) {
            // String
            inferredValue = 'sample_string';
          } else if (fieldValueStr === 'true' || fieldValueStr === 'false') {
            inferredValue = true;
          } else if (/^\d+$/.test(fieldValueStr)) {
            inferredValue = 123;
          } else if (/^\d+\.\d+$/.test(fieldValueStr)) {
            inferredValue = 123.45;
          } else {
            inferredValue = fieldValueStr;
          }
        } catch (e) {
          inferredValue = fieldValueStr;
        }

        const fieldType = inferFieldType(inferredValue);
        const isFK = isForeignKeyField(fieldName, inferredValue);

        fields[fieldName] = {
          type: fieldType.baseType,
          inferred: fieldType.inferredAs,
          isFK,
        };
      }

      entityRegistry[entityName] = {
        supabaseTable: tableName,
        fields,
        recordCount,
      };
    }

    return entityRegistry;
  } catch (error) {
    console.error(`Error reading entities from ${filePath}:`, error.message);
    throw new Error(`Failed to inspect entities: ${error.message}`);
  }
}

/**
 * Build EntityRegistry from the current entity mapping table.
 */
function buildEntityRegistry(appClientPath = 'src/api/appClient.js') {
  try {
    // Read the appClient file so the function signature stays compatible.
    path.resolve(appClientPath);
    const entityRegistry = {};
    const mappings = getEntityMapping();
    Object.entries(mappings).forEach(([entityName, mapping]) => {
      if (!mapping?.supabaseTable) return;
      entityRegistry[entityName] = {
        supabaseTable: mapping.supabaseTable,
        fields: {},
        recordCount: 0,
        sampleRecord: null,
      };
    });

    return entityRegistry;
  } catch (error) {
    console.error(`Error building entity registry from ${appClientPath}:`, error.message);
    throw new Error(`Failed to build entity registry: ${error.message}`);
  }
}

/**
 * Get entity registry (cached or fresh)
 */
let cachedEntityRegistry = null;

function getEntityRegistry(appClientPath = 'src/api/appClient.js', forceRefresh = false) {
  if (cachedEntityRegistry && !forceRefresh) {
    return cachedEntityRegistry;
  }

  cachedEntityRegistry = buildEntityRegistry(appClientPath);
  return cachedEntityRegistry;
}

module.exports = {
  readAndInspectEntities,
  buildEntityRegistry,
  getEntityRegistry,
  inferTypeFromValue,
  inferFieldType,
  isForeignKeyField,
};

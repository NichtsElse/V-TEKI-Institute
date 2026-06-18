/**
 * Schema Reader Module
 * Reads and parses the active Supabase schema to extract table definitions,
 * columns, types, constraints, and enum values.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse SQL CHECK constraint to extract enum values
 * e.g., "CHECK (status IN ('active', 'inactive'))" -> ['active', 'inactive']
 */
function parseEnumValuesFromConstraint(constraint) {
  const match = constraint.match(/IN\s*\(\s*(.+?)\s*\)/i);
  if (!match) return [];

  const valueString = match[1];
  const values = valueString
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v)
    .map((v) => {
      // Remove quotes
      return v.replace(/^['"]|['"]$/g, '');
    });

  return values;
}

/**
 * Extract column properties from a CREATE TABLE statement line
 * Returns: { name, type, nullable, isFK, references, constraint }
 */
function parseColumnDefinition(line, tableName) {
  const trimmed = line.trim();

  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
    return null;
  }

  // Skip table-level constraints
  if (
    trimmed.startsWith('PRIMARY KEY') ||
    trimmed.startsWith('FOREIGN KEY') ||
    trimmed.startsWith('UNIQUE') ||
    trimmed.startsWith('CHECK')
  ) {
    return null;
  }

  // Match column definition pattern
  const columnMatch = trimmed.match(/^(\w+)\s+(.+?)(?:\s+(NOT\s+NULL|DEFAULT|REFERENCES|CHECK).*)?$/i);
  if (!columnMatch) return null;

  const columnName = columnMatch[1];
  const typeAndConstraints = trimmed.substring(columnMatch[1].length).trim();

  const result = {
    name: columnName,
    type: '',
    nullable: true,
    isFK: false,
    references: null,
    constraint: null,
    enums: [],
  };

  // Extract type
  const typeMatch = typeAndConstraints.match(/^(\w+(?:\([^)]*\))?)/i);
  if (typeMatch) {
    result.type = typeMatch[1];
  }

  // Check for NOT NULL
  if (/\bNOT\s+NULL\b/i.test(typeAndConstraints)) {
    result.nullable = false;
  }

  // Check for DEFAULT
  if (/\bDEFAULT\b/i.test(typeAndConstraints)) {
    result.default = typeAndConstraints.match(/DEFAULT\s+(\S+)/i)?.[1];
  }

  // Check for CHECK constraint (for enums)
  const checkMatch = typeAndConstraints.match(/CHECK\s*\((.+?)\)/i);
  if (checkMatch) {
    result.constraint = `CHECK (${checkMatch[1]})`;
    result.enums = parseEnumValuesFromConstraint(checkMatch[0]);
  }

  // Check for REFERENCES (Foreign Key)
  const refMatch = typeAndConstraints.match(/REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
  if (refMatch) {
    result.isFK = true;
    result.references = `${refMatch[1]}.${refMatch[2]}`;
  }

  return result;
}

/**
 * Parse CREATE TABLE statement and extract table structure
 */
function parseTableDefinition(tableBlock) {
  // Extract table name
  const tableNameMatch = tableBlock.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\(/i);
  if (!tableNameMatch) return null;

  const tableName = tableNameMatch[1];
  const columns = {};
  const constraints = [];

  // Find content between parentheses
  const contentMatch = tableBlock.match(/\(([\s\S]*)\);/);
  if (!contentMatch) return null;

  const tableContent = contentMatch[1];
  const lines = tableContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
      continue;
    }

    // Handle line that ends with comma or doesn't
    const cleanLine = trimmed.replace(/,\s*$/, '');

    // Try to parse as column definition
    const column = parseColumnDefinition(cleanLine, tableName);
    if (column) {
      columns[column.name] = {
        type: column.type,
        nullable: column.nullable,
        references: column.references,
        constraint: column.constraint,
        enums: column.enums,
        default: column.default,
      };
    }
  }

  return {
    name: tableName,
    columns,
    constraints,
  };
}

/**
 * Read and parse the active Supabase schema into a SchemaRegistry
 * @returns {Object} SchemaRegistry with structure: { tables: { tableName: { columns: {...} } } }
 */
function readAndParseSchema(filePath = 'supabase/schema_fixed.sql') {
  try {
    // Read the schema file
    const resolvedPath = path.resolve(filePath);
    const schemaContent = fs.readFileSync(resolvedPath, 'utf-8');

    const schemaRegistry = {
      tables: {},
    };

    // Split by CREATE TABLE statements
    const tableBlocks = schemaContent.split(/(?=CREATE\s+TABLE)/i);

    for (const block of tableBlocks) {
      if (!block.trim()) continue;

      const tableDefinition = parseTableDefinition(block);
      if (tableDefinition) {
        schemaRegistry.tables[tableDefinition.name] = {
          columns: tableDefinition.columns,
          constraints: tableDefinition.constraints,
        };
      }
    }

    return schemaRegistry;
  } catch (error) {
    console.error(`Error reading schema from ${filePath}:`, error.message);
    throw new Error(`Failed to read Supabase schema: ${error.message}`);
  }
}

/**
 * Get schema registry (cached or fresh)
 */
let cachedSchema = null;

function getSchemaRegistry(filePath = 'supabase/schema_fixed.sql', forceRefresh = false) {
  if (cachedSchema && !forceRefresh) {
    return cachedSchema;
  }

  cachedSchema = readAndParseSchema(filePath);
  return cachedSchema;
}

module.exports = {
  readAndParseSchema,
  getSchemaRegistry,
  parseTableDefinition,
  parseColumnDefinition,
  parseEnumValuesFromConstraint,
};

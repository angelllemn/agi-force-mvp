import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

describe('Contract Tests', () => {
  describe('OpenAPI Specification', () => {
    it('should have valid OpenAPI specification', async () => {
      const openApiPath = path.join(process.cwd(), 'openapi/openapi.yaml');
      
      // Parse and validate OpenAPI spec
      const api = await SwaggerParser.validate(openApiPath);
      expect(api).toBeDefined();
      expect(api.info.title).toBe('PulseDesk Bridge API');
    });

    it('should validate OpenAPI examples against schemas', async () => {
      const openApiPath = path.join(process.cwd(), 'openapi/openapi.yaml');
      const yamlContent = readFileSync(openApiPath, 'utf8');
      const apiSpec = YAML.parse(yamlContent);

      // Validate SlackDispatchRequest example
      const slackRequestSchema = apiSpec.components.schemas.SlackDispatchRequest;
      const slackRequestExample = apiSpec.paths['/bridge/slack/dispatch'].post.requestBody.content['application/json'].examples.ejemplo.value;
      
      const validateRequest = ajv.compile(slackRequestSchema);
      const isValidRequest = validateRequest(slackRequestExample);
      
      if (!isValidRequest) {
        console.error('SlackDispatchRequest validation errors:', validateRequest.errors);
      }
      expect(isValidRequest).toBe(true);
    });
  });

  describe('JSON Schemas', () => {
    it('should have valid diagnostics.echo schema', () => {
      const schemaPath = path.join(process.cwd(), 'schemas/capabilities/diagnostics.echo.schema.json');
      const schemaContent = JSON.parse(readFileSync(schemaPath, 'utf8'));
      
      // Validate schema structure
      expect(schemaContent.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(schemaContent.type).toBe('object');
      expect(schemaContent.required).toContain('text');
      
      // Create a simpler validation without the meta-schema validation
      const simpleSchema = {
        type: schemaContent.type,
        required: schemaContent.required,
        properties: schemaContent.properties,
        additionalProperties: schemaContent.additionalProperties
      };
      
      // Validate example against schema
      const validate = ajv.compile(simpleSchema);
      const example = schemaContent.examples[0];
      const isValid = validate(example);
      
      if (!isValid) {
        console.error('Schema validation errors:', validate.errors);
      }
      expect(isValid).toBe(true);
    });
  });
});
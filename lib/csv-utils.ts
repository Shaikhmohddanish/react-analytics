/**
 * Utility functions for handling CSV file operations
 */

import Papa from 'papaparse';
import type { ParseResult, ParseError, ParseMeta } from 'papaparse';

/**
 * Check if a CSV file has valid format
 * @param file The CSV file to check
 * @returns Promise with validation result
 */
export async function validateCSV(file: File): Promise<{
  valid: boolean;
  message: string;
  data?: any[];
  meta?: ParseMeta;
}> {
  return new Promise((resolve) => {
    // First read as text to handle encoding issues
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target || !e.target.result) {
          throw new Error("Failed to read file");
        }
        
        // Get the content and handle BOM if present
        let csvContent = e.target.result.toString();
        if (csvContent.charCodeAt(0) === 0xFEFF) {
          csvContent = csvContent.slice(1);
        }
        
        // Try to parse the content
        Papa.parse<Record<string, any>>(csvContent, {
          header: true,
          skipEmptyLines: true,
          delimitersToGuess: [',', '\t', ';', '|'],
          preview: 10, // Just check first 10 rows
          complete: (results: ParseResult<Record<string, any>>) => {
            if (results.data.length === 0) {
              resolve({
                valid: false,
                message: "No data rows found in file"
              });
            } else if (results.errors.length > 0) {
              resolve({
                valid: false,
                message: `CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`,
                data: results.data,
                meta: results.meta
              });
            } else {
              resolve({
                valid: true,
                message: `Valid CSV with ${results.data.length} rows`,
                data: results.data,
                meta: results.meta
              });
            }
          },
          error: (error: Error) => {
            resolve({
              valid: false,
              message: `Error parsing CSV: ${error.message}`
            });
          }
        });
      } catch (error) {
        resolve({
          valid: false,
          message: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        valid: false,
        message: "Error reading file"
      });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Fix common CSV formatting issues
 * @param csvContent The CSV content to fix
 * @returns Fixed CSV content
 */
export function fixCSVFormat(csvContent: string): string {
  let fixed = csvContent;
  
  // Remove BOM if present
  if (fixed.charCodeAt(0) === 0xFEFF) {
    fixed = fixed.slice(1);
  }
  
  // Normalize line endings
  if (!fixed.includes('\r\n') && fixed.includes('\n')) {
    fixed = fixed.replace(/\n/g, '\r\n');
  }
  
  // Fix fields with unquoted commas (harder to detect, might need more work)
  // ...
  
  return fixed;
}

/**
 * Process CSV content to normalize fields
 * @param content The CSV content to process
 * @returns Processed CSV content
 */
export function processCSVContent(content: string): string {
  // Apply various fixes
  let processed = fixCSVFormat(content);
  
  // Add more processing as needed
  
  return processed;
}

/**
 * Server-side CSV file reading function for Next.js API routes
 */
export async function readCSVFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const content = new TextDecoder().decode(buffer);
  return processCSVContent(content);
}

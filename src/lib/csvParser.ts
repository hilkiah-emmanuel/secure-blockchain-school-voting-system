export interface ParsedStudent {
  name: string;
}

export const parseCSV = (csvText: string): ParsedStudent[] => {
  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) {
    return [];
  }

  // Check if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('name') || firstLine.includes('student');
  
  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  const students: ParsedStudent[] = [];
  
  for (const line of dataLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Handle both comma-separated and single-column formats
    const parts = trimmedLine.split(',');
    const name = parts[0]?.trim().replace(/^["']|["']$/g, '');
    
    if (name && name.length > 0) {
      students.push({ name });
    }
  }
  
  return students;
};

export const generateSampleCSV = (): string => {
  return `name
John Smith
Jane Doe
Michael Johnson
Emily Davis
Robert Wilson`;
};

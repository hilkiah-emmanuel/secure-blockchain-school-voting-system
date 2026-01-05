export interface Student {
  id: string;
  name: string;
  hasVoted: boolean;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  students: Student[];
  votingOpen: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  photo?: string;
  photoUrl?: string;
  profile?: string;
  manifesto?: string;
  motto?: string;
}

export interface Position {
  id: string;
  title: string;
  candidates: Candidate[];
  type: 'single' | 'multi';
}

export interface Election {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed';
  positions: Position[];
}

export interface Vote {
  positionId: string;
  candidateId: string;
  timestamp: number;
  hash?: string;
}

export const mockClasses: Class[] = [
  {
    id: '1',
    name: 'Form 4A - Dar es Salaam',
    grade: 'Form 4',
    students: [
      { id: '1', name: 'Amina Hassan', hasVoted: true },
      { id: '2', name: 'Baraka Mwangi', hasVoted: false },
      { id: '3', name: 'Chausiku Juma', hasVoted: true },
      { id: '4', name: 'Daudi Kimathi', hasVoted: false },
      { id: '5', name: 'Ester Mwamburi', hasVoted: false },
      { id: '6', name: 'Fatuma Ali', hasVoted: true },
      { id: '7', name: 'Godfrey Mwanga', hasVoted: false },
      { id: '8', name: 'Halima Said', hasVoted: false },
    ],
    votingOpen: true,
  },
  {
    id: '2',
    name: 'Form 3B - Arusha',
    grade: 'Form 3',
    students: [
      { id: '9', name: 'Ibrahim Mwalimu', hasVoted: true },
      { id: '10', name: 'Jamila Kipanga', hasVoted: true },
      { id: '11', name: 'Kassim Mwinyi', hasVoted: true },
      { id: '12', name: 'Lulu Mwenda', hasVoted: true },
      { id: '13', name: 'Mariam Hassan', hasVoted: true },
      { id: '14', name: 'Neema Mwanga', hasVoted: true },
    ],
    votingOpen: false,
  },
  {
    id: '3',
    name: 'Form 5C - Dodoma',
    grade: 'Form 5',
    students: [
      { id: '15', name: 'Omar Mwinyi', hasVoted: false },
      { id: '16', name: 'Pendo Mwamburi', hasVoted: false },
      { id: '17', name: 'Rajab Hassan', hasVoted: false },
      { id: '18', name: 'Rehema Juma', hasVoted: false },
    ],
    votingOpen: true,
  },
];

export const mockPositions: Position[] = [
  {
    id: '1',
    title: 'Class Prefect (Mkuu wa Darasa)',
    type: 'single',
    candidates: [
      { id: '1', name: 'Amina Hassan' },
      { id: '2', name: 'Baraka Mwangi' },
      { id: '3', name: 'Chausiku Juma' },
    ],
  },
  {
    id: '2',
    title: 'Assistant Prefect (Msaidizi wa Mkuu)',
    type: 'single',
    candidates: [
      { id: '4', name: 'Daudi Kimathi' },
      { id: '5', name: 'Ester Mwamburi' },
    ],
  },
  {
    id: '3',
    title: 'Secretary (Katibu)',
    type: 'single',
    candidates: [
      { id: '6', name: 'Fatuma Ali' },
      { id: '7', name: 'Godfrey Mwanga' },
      { id: '8', name: 'Halima Said' },
    ],
  },
  {
    id: '4',
    title: 'Treasurer (Mweka Hazina)',
    type: 'single',
    candidates: [
      { id: '9', name: 'Ibrahim Mwalimu' },
      { id: '10', name: 'Jamila Kipanga' },
    ],
  },
];

export const mockElections: Election[] = [
  {
    id: '1',
    name: '2024 Student Leadership Elections - Tanzania',
    description: 'Annual student leadership elections for Form 4 students across Tanzania. Choose your class representatives who will serve for the 2024-2025 academic year.',
    startDate: '2024-10-01',
    endDate: '2024-10-15',
    status: 'active',
    positions: mockPositions,
  },
];

export const mockResults = {
  '1': { '1': 12, '2': 8, '3': 15 },
  '2': { '4': 18, '5': 17 },
  '3': { '6': 10, '7': 14, '8': 11 },
  '4': { '9': 20, '10': 15 },
};

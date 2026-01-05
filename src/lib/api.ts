const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// API request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string, twoFactorCode?: string) => {
    return request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, twoFactorCode }),
    });
  },

  register: async (email: string, password: string, name: string) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  setup2FA: async () => {
    return request<{ secret: string; qrCode: string; manualEntryKey: string }>('/auth/setup-2fa', {
      method: 'POST',
    });
  },

  enable2FA: async (code: string) => {
    return request('/auth/enable-2fa', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
  me: async () => {
    return request<{ user: any }>('/auth/me');
  },
};

// Classes API
export const classesAPI = {
  getAll: async () => {
    return request<{ classes: any[] }>('/classes');
  },

  getById: async (id: string) => {
    return request<{ class: any }>(`/classes/${id}`);
  },

  create: async (name: string, grade: string) => {
    return request('/classes', {
      method: 'POST',
      body: JSON.stringify({ name, grade }),
    });
  },

  update: async (id: string, name: string, grade: string) => {
    return request(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, grade }),
    });
  },

  delete: async (id: string) => {
    return request(`/classes/${id}`, {
      method: 'DELETE',
    });
  },

  toggleVoting: async (id: string) => {
    return request<{ votingOpen: boolean }>(`/classes/${id}/toggle-voting`, {
      method: 'POST',
    });
  },
};

// Students API
export const studentsAPI = {
  getByClass: async (classId: string) => {
    return request<{ students: any[] }>(`/students/class/${classId}`);
  },

  add: async (classId: string, name: string, pin?: string) => {
    return request('/students', {
      method: 'POST',
      body: JSON.stringify({ classId, name, pin }),
    });
  },

  bulkAdd: async (classId: string, students: Array<{ name: string }>) => {
    return request('/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ classId, students }),
    });
  },

  update: async (id: string, name: string, pin?: string) => {
    return request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, pin }),
    });
  },

  delete: async (id: string) => {
    return request(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  verifyPin: async (id: string, pin: string) => {
    return request<{ verified: boolean }>(`/students/${id}/verify-pin`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  resetVotes: async (classId: string) => {
    return request(`/students/class/${classId}/reset-votes`, {
      method: 'POST',
    });
  },
};

// Teachers API
export const teachersAPI = {
  getAll: async () => {
    return request<{ teachers: any[] }>('/teachers');
  },

  getById: async (id: string) => {
    return request(`/teachers/${id}`);
  },

  create: async (name: string, email: string, password: string) => {
    return request('/teachers', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  update: async (id: string, name: string, email: string, password?: string) => {
    return request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, password }),
    });
  },

  delete: async (id: string) => {
    return request(`/teachers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Elections API
export const electionsAPI = {
  getAll: async () => {
    return request<{ elections: any[] }>('/elections');
  },

  getById: async (id: string) => {
    return request(`/elections/${id}`);
  },

  create: async (data: any) => {
    return request('/elections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return request(`/elections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return request(`/elections/${id}`, {
      method: 'DELETE',
    });
  },
  // Positions / Candidates helpers
  addPosition: async (electionId: string, data: { title: string; type?: string }) => {
    return request(`/elections/${electionId}/positions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePosition: async (positionId: string, data: { title?: string; type?: string }) => {
    return request(`/elections/positions/${positionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePosition: async (positionId: string) => {
    return request(`/elections/positions/${positionId}`, {
      method: 'DELETE',
    });
  },

  addCandidate: async (positionId: string, data: { name: string; photoUrl?: string; profile?: string; manifesto?: string; motto?: string }) => {
    return request(`/elections/positions/${positionId}/candidates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCandidate: async (candidateId: string, data: { name?: string; photoUrl?: string; profile?: string; manifesto?: string; motto?: string }) => {
    return request(`/elections/candidates/${candidateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCandidate: async (candidateId: string) => {
    return request(`/elections/candidates/${candidateId}`, {
      method: 'DELETE',
    });
  },
};

// Votes API
export const votesAPI = {
  submit: async (data: {
    classId: string;
    studentId: string;
    positionId: string;
    candidateId: string;
    rankedOrder?: number;
  }) => {
    return request<{
      success: boolean;
      voteId: string;
      transactionHash: string;
      blockNumber: number;
    }>('/votes/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getQueue: async () => {
    return request<{ queue: any[] }>('/votes/queue');
  },

  retryQueue: async () => {
    return request('/votes/retry-queue', {
      method: 'POST',
    });
  },
};

// Results API
export const resultsAPI = {
  getByClass: async (classId: string) => {
    return request<{ results: any }>(`/results/class/${classId}`);
  },

  exportCSV: async (classId: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/results/class/${classId}/export/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election-results-${classId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportJSON: async (classId: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/results/class/${classId}/export/json`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election-results-${classId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// WebSocket connection
export function createWebSocketConnection(classId: string, onMessage: (data: any) => void) {
  const ws = new WebSocket(`${WS_URL}/ws`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({
      type: 'subscribe',
      payload: { classId }
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };

  return {
    send: (data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    },
    close: () => {
      ws.close();
    },
  };
}



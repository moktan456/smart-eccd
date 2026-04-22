// SMART ECCD – Frontend Constants

export const BLOOM_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

export const BLOOM_COLORS = {
  REMEMBER:   '#E74C3C',
  UNDERSTAND: '#E67E22',
  APPLY:      '#F1C40F',
  ANALYZE:    '#27AE60',
  EVALUATE:   '#2980B9',
  CREATE:     '#8E44AD',
};

export const BLOOM_LABELS = {
  REMEMBER:   'Remember',
  UNDERSTAND: 'Understand',
  APPLY:      'Apply',
  ANALYZE:    'Analyze',
  EVALUATE:   'Evaluate',
  CREATE:     'Create',
};

export const BLOOM_VERBS = {
  REMEMBER:   'Recall, Identify, Name',
  UNDERSTAND: 'Explain, Describe, Sort',
  APPLY:      'Use, Demonstrate, Solve',
  ANALYZE:    'Compare, Group, Examine',
  EVALUATE:   'Justify, Choose, Assess',
  CREATE:     'Design, Build, Produce',
};

export const ROLES = {
  SUPER_ADMIN:    'SUPER_ADMIN',
  CENTER_MANAGER: 'CENTER_MANAGER',
  TEACHER:        'TEACHER',
  PARENT:         'PARENT',
};

export const ROLE_LABELS = {
  SUPER_ADMIN:    'Super Admin',
  CENTER_MANAGER: 'Center Manager',
  TEACHER:        'Teacher',
  PARENT:         'Parent',
};

export const ACTIVITY_TYPES = ['Individual', 'Group', 'Outdoor', 'Creative'];

export const ATTENDANCE_STATUS = {
  PRESENT: { label: 'Present', color: 'bg-green-100 text-green-800' },
  ABSENT:  { label: 'Absent',  color: 'bg-red-100 text-red-800' },
  LATE:    { label: 'Late',    color: 'bg-yellow-100 text-yellow-800' },
  EXCUSED: { label: 'Excused', color: 'bg-blue-100 text-blue-800' },
};

export const API_BASE = '/api';

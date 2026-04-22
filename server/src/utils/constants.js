// SMART ECCD – Server Constants

const BLOOM_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

const BLOOM_COLORS = {
  REMEMBER:   '#E74C3C',
  UNDERSTAND: '#E67E22',
  APPLY:      '#F1C40F',
  ANALYZE:    '#27AE60',
  EVALUATE:   '#2980B9',
  CREATE:     '#8E44AD',
};

const BLOOM_WEIGHTS = {
  REMEMBER:   1,
  UNDERSTAND: 2,
  APPLY:      3,
  ANALYZE:    4,
  EVALUATE:   5,
  CREATE:     6,
};

const ROLES = {
  SUPER_ADMIN:    'SUPER_ADMIN',
  CENTER_MANAGER: 'CENTER_MANAGER',
  TEACHER:        'TEACHER',
  PARENT:         'PARENT',
};

const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
};

const FLAG_THRESHOLD = 0.20; // 20% below class average triggers a flag

module.exports = {
  BLOOM_LEVELS,
  BLOOM_COLORS,
  BLOOM_WEIGHTS,
  ROLES,
  PAGINATION_DEFAULTS,
  FLAG_THRESHOLD,
};

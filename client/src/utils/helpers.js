// SMART ECCD – Frontend Helpers

import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') =>
  date ? format(typeof date === 'string' ? parseISO(date) : date, fmt) : '—';

export const formatRelative = (date) =>
  date ? formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true }) : '—';

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const calculateAge = (dateOfBirth) => {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  const ageDiff = Date.now() - dob.getTime();
  return Math.abs(new Date(ageDiff).getUTCFullYear() - 1970);
};

export const classNames = (...classes) => classes.filter(Boolean).join(' ');

export const truncate = (str, n = 50) => (str?.length > n ? `${str.slice(0, n)}…` : str);

export const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '');

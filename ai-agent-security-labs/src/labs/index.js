import lab1 from './lab1.js';
import lab2 from './lab2.js';
import lab3 from './lab3.js';
import lab4 from './lab4.js';
import lab5 from './lab5.js';
import lab6 from './lab6.js';

export const labs = [lab1, lab2, lab3, lab4, lab5, lab6];

export function getLab(labId) {
  return labs.find((l) => l.id === labId) || null;
}

export default labs;

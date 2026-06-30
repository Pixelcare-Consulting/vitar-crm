import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { multiply, pow, add } from 'mathjs';

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const prependZero = (num) => String(num).padStart(2, '0');

export const countDecimals = (value) => {
  if (Math.floor(value) === value) return 0;

  const str = value.toString();

  //* Scientific notation like 1e-9
  if (str.includes('e-')) return parseInt(str.split('e-')[1], 10);

  //* decimal notation
  if (str.includes('.')) return str.split('.')[1].length;

  return 0;
};

export function titleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export async function getFileFromBlobUrl(url) {
  const res = await axios.get(url, { responseType: 'blob' });
  const blob = res.data;

  return new File([blob], uuidv4(), { type: blob.type });
}

export function toKebabCase(text, toLowerCase = false) {
  let result = text;

  if (!text) return '';

  if (toLowerCase) result = result.toLowerCase();

  return result
    .replace(/[^a-zA-Z0-9-]+/g, '-') //* Replace any character that is not a-z, A-Z, 0-9, or dash with dash
    .replace(/-+/g, '-'); //* Collapse multiple dashes
}

export function safeParseFloat(value) {
  const num = parseFloat(value);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

export function getArrayType(arr) {
  if (!Array.isArray(arr)) return 'not-array';
  if (arr.length === 0) return 'empty-array';

  const first = arr[0];

  if (Array.isArray(first)) {
    return 'array-of-arrays';
  }

  if (typeof first === 'string') {
    return 'array-of-strings';
  }

  if (typeof first === 'number') {
    return 'array-of-numbers';
  }

  if (typeof first === 'boolean') {
    return 'array-of-booleans';
  }

  if (first !== null && typeof first === 'object') {
    return 'array-of-objects';
  }

  return 'unknown-array-type';
}

//* x - number, n - number, coefficients - number[]
export function seriesSum(x, n, m, coefficients) {
  return coefficients.reduce((sum, coefficient, i) => {
    const exponent = add(n, multiply(m, i));
    const power = pow(x, exponent);
    return add(sum, multiply(coefficient, power));
  }, 0);
}

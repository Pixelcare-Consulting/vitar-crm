import * as math from 'mathjs';

export const formatToDicimalString = (value, dicimalPlaces = 4) => {
  try {
    if (typeof value === 'string') return '';
    if (value === undefined || value === null) return '';
    if (isNaN(value)) return '';
    // if (isNaN(value)) return '';
    // return value.toFixed(dicimalPlaces);
    return math.format(value, { notation: 'fixed', precision: dicimalPlaces });
  } catch (err) {
    console.error(err);
    console.trace();
    console.error('Error formatting decimal value:', value);
    return '';
  }
};

export function formatScientific(value, precision = 4) {
  try {
    if (typeof value === 'string') return '';
    if (value === undefined || value === null) return '';
    if (isNaN(value)) return '';

    if (math.isComplex(value)) return '';

    let formatted = math.format(math.bignumber(value), { notation: 'exponential', precision });
    formatted = formatted.replace('e', 'E'); //* Convert 'e' to 'E'

    //* Ensure exponent always has at least two digits (E-02, E+03, etc.)
    formatted = formatted.replace(/E([+-]?)(\d)$/, (match, sign, exp) => `E${sign}${exp.padStart(2, '0')}`); // prettier-ignore

    return formatted;
  } catch (err) {
    console.error(err);
    console.trace();
    console.error('Error formatting scientific value:', value);
    return '';
  }
}

export const getArrayActualValues = (values) => {
  let actualValues;

  if (values) {
    if (Array.isArray(values) && values.length > 0) actualValues = values.filter(Boolean);
    if (actualValues.length < 1) actualValues = [0];
    return actualValues;
  }

  return (actualValues = [0]);
};

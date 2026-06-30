import { safeParseFloat } from '../common';

//* get the closest/nearest row to the lookup value, whether its higher or lower
export function getClosestRow(value, rows, key) {
  return rows.reduce((closest, current) => {
    const currentValue = safeParseFloat(current[key]);
    const closestValue = safeParseFloat(closest[key]);

    const currentDiff = Math.abs(currentValue - value);
    const closestDiff = Math.abs(closestValue - value);

    return currentDiff < closestDiff ? current : closest;
  }, {});
}

//* simulate excel vlookup function (approximate match)
//* return the row with the largest value less than or equal to lookup value
export function getApproximateMatchRow(value, rows, key) {
  return [...rows]
    .sort((a, b) => safeParseFloat(a[key]) - safeParseFloat(b[key]))
    .reduce((match, row) => {
      return safeParseFloat(row[key]) <= value ? row : match;
    }, {});
}

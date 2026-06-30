import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { Button, Col, Row, Table } from 'react-bootstrap';
import { useFormContext, useWatch } from 'react-hook-form';
import { useCallback, useMemo, useState } from 'react';
import { safeParseFloat } from '@/utils/common';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { ceil, max, subtract } from 'mathjs';

function THRResultForm({ data, job }) {
  const form = useFormContext();

  const IS_REFERENCE = true;
  const FIX_SETTINGS_ON = IS_REFERENCE ? 'Reference' : 'Original';

  const cData = useWatch({ control: form.control, name: 'data' });

  const [showDetailedResult, setShowDetailedResult] = useState(false);

  const rangeOfCalibrationFormValue = useWatch({ name: 'rangeOfCalibration' });
  const refReadingSummaries = useWatch({ name: 'refReadingSummaries' });
  const testBefAdjReadingSummaries = useWatch({ name: 'testBefAdjReadingSummaries' });
  const corrections = useWatch({ name: 'corrections' });
  const expandedUncertainties = useWatch({ name: 'expandedUncertainties' });
  const resultExpandedUncertainties = useWatch({ name: 'resultExpandedUncertainties' });
  const resultEsts = useWatch({ name: 'resultEsts' });
  const coverageFactors = useWatch({ name: 'coverageFactors' });
  const refDecimalFormValue = useWatch({ name: 'refDecimal' });

  const rangeOfCalibration = useMemo(() => {
    return safeParseFloat(rangeOfCalibrationFormValue);
  }, [rangeOfCalibrationFormValue]);

  const refDecimal = useMemo(() => {
    return typeof refDecimalFormValue === 'object'
      ? refDecimalFormValue?.value
      : refDecimalFormValue ?? 1;
  }, [JSON.stringify(refDecimalFormValue)]);

  const maximumExpandedUncertainty = useMemo(() => {
    if (
      expandedUncertainties?.length === 0 ||
      expandedUncertainties === null ||
      expandedUncertainties === undefined
    ) {
      return 0;
    }

    const values = expandedUncertainties.filter((v) => isNaN(v) === false && v !== null && v !== undefined); // prettier-ignore

    return max(values.length > 0 ? values : [0]);
  }, [expandedUncertainties]);

  const resultInfoEst = useMemo(() => {
    if (resultEsts?.length === 0 || resultEsts === null || resultEsts === undefined) return 0;

    const values = resultEsts.filter((v) => isNaN(v) === false && v !== null && v !== undefined);
    const x = max(values.length > 0 ? values : [0]);
    const result = ceil(x, 1);

    //* set temporary value
    form.setValue(`resultInfoEst`, result);

    return result;
  }, [JSON.stringify(resultEsts)]);

  const resultInfoK = useMemo(() => {
    if (coverageFactors?.length === 0 || coverageFactors === null || coverageFactors === undefined)
      return 0;

    const values = coverageFactors.filter(
      (v) => isNaN(v) === false && v !== null && v !== undefined
    );
    const result = max(values.length > 0 ? values : [0]);

    //* set temporary value
    form.setValue(`resultInfoK`, result);

    return result;
  }, [JSON.stringify(coverageFactors)]);

  const resultCorrections = useMemo(() => {
    return Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => {
      const original = corrections?.[pointIndex];

      const ref = refReadingSummaries?.[pointIndex]?.mean;
      const test = testBefAdjReadingSummaries?.[pointIndex]?.mean;

      const refFormatted = formatToDicimalString(ref, refDecimal);
      const testFormatted = formatToDicimalString(test, refDecimal);

      const x = safeParseFloat(refFormatted);
      const y = safeParseFloat(testFormatted);

      let result;

      if (FIX_SETTINGS_ON === 'Original') {
        if (!isNaN(original) && typeof original === 'number') result = original;
        else result = 0;
      } else if (FIX_SETTINGS_ON === 'Reference') {
        if (!isNaN(x) && !isNaN(y) && typeof x === 'number' && typeof y === 'number') {
          result = subtract(x, y);
        } else result = 0;
      } else {
        if (!isNaN(x) && !isNaN(y) && typeof x === 'number' && typeof y === 'number') {
          result = subtract(y, x);
        } else result = 0;
      }

      //* set temporary value
      form.setValue(`resultCorrections.${pointIndex}`, result);

      return result;
    });
  }, [
    FIX_SETTINGS_ON,
    refDecimal,
    rangeOfCalibration,
    JSON.stringify(corrections),
    JSON.stringify(refReadingSummaries),
    JSON.stringify(testBefAdjReadingSummaries),
  ]);

  return (
    <div className='d-flex flex-column row-gap-3'>
      <div className='d-flex justify-content-center align-items-center gap-3 mt-3'>
        <Button
          variant='outline-primary'
          className='text-decoration-none border-primary'
          onClick={() => setShowDetailedResult((prev) => !prev)}
        >
          {showDetailedResult ? (
            <>
              <EyeSlash size={18} className='me-2' /> Hide{' '}
            </>
          ) : (
            <>
              <Eye size={18} className='me-2' /> Show{' '}
            </>
          )}
          Detailed Result
        </Button>
      </div>

      <div className='flex align-items-center gap-2'>
        <div className='d-flex align-items-center gap-4'>
          <div className='fs-5'>
            <span className='pe-2'>Range of Calibration:</span>
            <span className='fw-bold'>From -30 °C to 150 °C at {rangeOfCalibration} points.</span>
          </div>
        </div>
      </div>

      <div>
        <ResultTable
          cData={cData}
          rangeOfCalibration={rangeOfCalibration}
          refDecimal={refDecimal}
          refReadingSummaries={refReadingSummaries}
          testBefAdjReadingSummaries={testBefAdjReadingSummaries}
          resultCorrections={resultCorrections}
        />

        <div className='flex align-items-center gap-2'>
          <div className='d-flex flex-column justify-content-center'>
            <div className='fs-5'>
              <span className='pe-2'>
                The maximum Expanded Uncertainty at point{' '}
                <span className='fw-bold'>{rangeOfCalibration}</span>:{' '}
              </span>
              <span className='fw-bold'>
                {formatToDicimalString(maximumExpandedUncertainty, 4)}{' '}
                <span className='ms-2'>°C</span>
              </span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>Estimated To:</span>
              <span className='fw-bold'>
                <span className='me-2'>±</span>
                {formatToDicimalString(resultInfoEst, refDecimal)}

                <span className='ms-2'>°C</span>
              </span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>K:</span>
              <span className='fw-bold'>{resultInfoK}</span>
            </div>
          </div>
        </div>

        <Row>
          <Col xs={12}>
            <div
              style={{
                transition: 'all 0.5s ease-in-out',
                height: showDetailedResult ? 'fit-content' : '0px',
                overflow: 'hidden',
              }}
            >
              <hr
                className='my-4 border border-primary border-3'
                style={{
                  width: showDetailedResult ? '100%' : '0',
                  transition: 'all 0.5s ease-in-out',
                }}
              />

              <DetailedResultTable
                cData={cData}
                rangeOfCalibration={rangeOfCalibration}
                refDecimal={refDecimal}
                refReadingSummaries={refReadingSummaries}
                testBefAdjReadingSummaries={testBefAdjReadingSummaries}
                resultCorrections={resultCorrections}
                resultExpandedUncertainties={resultExpandedUncertainties}
                resultEsts={resultEsts}
              />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

const ResultTable = ({
  cData,
  rangeOfCalibration,
  refDecimal,
  refReadingSummaries,
  testBefAdjReadingSummaries,
  resultCorrections,
}) => {
  return (
    <Table className='text-center align-middle'>
      <thead>
        <tr>
          <th>Reference</th>
          <th>Test</th>
          <th>Correction</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => {
          const pointData = cData?.[pointIndex];

          if (!pointData) return null;

          return (
            <tr key={`${pointIndex}-summary-result`}>
              <td>{formatToDicimalString(refReadingSummaries?.[pointIndex]?.mean, refDecimal)}</td>
              <td>
                {formatToDicimalString(testBefAdjReadingSummaries?.[pointIndex]?.mean, refDecimal)}
              </td>
              <td>{formatToDicimalString(resultCorrections?.[pointIndex], refDecimal)}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

const DetailedResultTable = ({
  cData,
  rangeOfCalibration,
  refDecimal,
  refReadingSummaries,
  testBefAdjReadingSummaries,
  resultCorrections,
  resultExpandedUncertainties,
  resultEsts,
}) => {
  return (
    <Table className='text-center align-middle'>
      <thead>
        <tr>
          <th>Calibration Point</th>
          <th>Reference</th>
          <th>Test</th>
          <th>Correction</th>
          <th>Uncertainty</th>
          <th>Est.</th>
          {/* <th>Last Correction</th> */}
          {/* <th>Drift</th> */}
          <th>Reference Instrument Used</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => {
          const pointData = cData?.[pointIndex];

          if (!pointData) return null;

          const { refTher, refInd, refWire, testInd, testWire, bath } = pointData;

          const refInstUsed = [refTher?.label, refInd?.label, testInd?.label, refWire?.label, testWire?.label, bath?.label].filter(Boolean).join(', '); //prettier-ignore

          return (
            <tr key={`${pointIndex}-summary-detailed-result`}>
              <td>{pointIndex + 1}</td>
              <td>{formatToDicimalString(refReadingSummaries?.[pointIndex]?.mean, refDecimal)}</td>
              <td>
                {formatToDicimalString(testBefAdjReadingSummaries?.[pointIndex]?.mean, refDecimal)}
              </td>
              <td>{formatToDicimalString(resultCorrections?.[pointIndex], refDecimal)}</td>
              <td>{formatToDicimalString(resultExpandedUncertainties?.[pointIndex], 4)}</td>
              <td>{formatToDicimalString(resultEsts?.[pointIndex], refDecimal)}</td>
              {/* <td></td> */}
              {/* <td></td> */}
              <td>{refInstUsed}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default THRResultForm;

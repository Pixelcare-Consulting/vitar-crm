import { useCallback, useEffect, useMemo, useState } from 'react';
import { safeParseFloat, seriesSum } from '@/utils/common';
import { Button, Card, Col, Nav, Row, Tab, Table } from 'react-bootstrap';
import { Database, Eye, EyeSlash } from 'react-bootstrap-icons';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  CMC_LOOKUP_MAP,
  COMMON_REF_THER,
  MAXIMUM_REF_TEST_LENGTH,
  REF_TYPE_COEFFICIENTS_RANGE,
  RTD_COEFFICIENTS_RANGE,
} from '@/schema/calibrations/temperature-humidity/thermocouple';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/firebase';
import { getApproximateMatchRow, getClosestRow } from '@/utils/calibrations/lookup';
import { formatScientific, formatToDicimalString } from '@/utils/calibrations/data-formatter';
import {
  add,
  bignumber,
  ceil,
  divide,
  exp,
  floor,
  hypot,
  isBigNumber,
  max,
  mean,
  min,
  multiply,
  number,
  pow,
  sqrt,
  square,
  std,
  subtract,
  sum,
} from 'mathjs';

const THRDataCalculation = ({ job, data }) => {
  const form = useFormContext();

  const rangeOfCalibrationFormValue = useWatch({ name: 'rangeOfCalibration' });

  const cData = useWatch({ control: form.control, name: 'data' });

  const [showCalculationTables, setShowCalculationTables] = useState(false);
  const [showUncertaintyBudget, setShowUncertaintyBudget] = useState(false);

  const refTestDatas = useMemo(() => {
    if (!cData || cData.length < 1) return [];
    return cData.map((c) => c?.refTestData).filter(Boolean);
  }, [JSON.stringify(cData)]);

  const currentRefTherData = useMemo(() => {
    if (!cData || cData.length < 1) return [];
    return cData.map((c) => c?.refTher).filter(Boolean);
  }, [JSON.stringify(cData)]);

  const currentRefIndData = useMemo(() => {
    if (!cData || cData.length < 1) return [];

    //*split the label (idCode) in separate peice by dash(-)
    return cData
      .map((c) => c?.refInd)
      .filter(Boolean)
      .map((ref) => ({ ...ref, idCodeParts: ref?.label?.split('-') }));
  }, [JSON.stringify(cData)]);

  const currentTestIndData = useMemo(() => {
    if (!cData || cData.length < 1) return [];
    return cData.map((c) => c?.testInd).filter(Boolean);
  }, [JSON.stringify(cData)]);

  const getClosestTempRefByReference = async (calibrationRefId, refId, refTestData) => {
    //* get the highest ref value in ref test data per point
    const highestRefValue = refTestData.map((rt) => rt[0]).sort((a, b) => b - a)[0] ?? 0;

    let closestTempRef = null;
    let tempRefsDocs = [];

    if (!calibrationRefId || !refId) return null;

    try {
      const q = query(collection(db, 'jobCalibrationReferences', calibrationRefId, 'data', refId, 'temperatureRefs')); // prettier-ignore
      const snapshot = await getDocs(q);

      tempRefsDocs = snapshot.docs.map((doc) => {
        const docData = doc.data();

        return {
          id: doc.id,
          reference: safeParseFloat(docData.reference),
          test: safeParseFloat(docData.test),
          correction: safeParseFloat(docData.correction),
          uncer: safeParseFloat(docData.uncer),
          drift: safeParseFloat(docData.drift),
        };
      });

      closestTempRef = getClosestRow(highestRefValue, tempRefsDocs, 'test');
    } catch (error) {
      console.error('Failed to fetch temperature refs:', error);
    }

    return { closestTempRef, tempRefsDocs };
  };

  const rangeOfCalibration = useMemo(() => {
    return safeParseFloat(rangeOfCalibrationFormValue);
  }, [rangeOfCalibrationFormValue]);

  //* set closest temp ref for ref.ther per point
  useEffect(() => {
    if (currentRefTherData.length < 1) return;

    if (currentRefTherData.length > 0) {
      Promise.all(
        currentRefTherData.map((ref, i) =>
          getClosestTempRefByReference('CR000008', ref.value, refTestDatas?.[i], i)
        )
      ).then((closestTempRefsData) => {
        if (closestTempRefsData.length > 0) {
          //* stored the closest temp ref and the temp refs docs for each point of ref.ther.
          form.setValue('refTherClosestTempRefsData', closestTempRefsData.map((ref) => ref?.closestTempRef).filter((Boolean))); //prettier-ignore
          form.setValue('refTherTempRefsDocsData', closestTempRefsData.map((ref) => ref?.tempRefsDocs).filter((Boolean))); //prettier-ignore
        }
      });
    }
  }, [JSON.stringify(currentRefTherData)]);

  //* set closest temp ref for ref.ind per point
  useEffect(() => {
    if (currentRefIndData.length < 1) return;

    if (currentRefIndData.length > 0) {
      Promise.all(
        currentRefIndData.map((ref, i) =>
          getClosestTempRefByReference('CR000016', ref.value, refTestDatas?.[i], i)
        )
      ).then((closestTempRefsData) => {
        if (closestTempRefsData.length > 0) {
          //* stored the closest temp ref and the temp refs docs for each point of ref.ind.
          form.setValue('refIndClosestTempRefsData', closestTempRefsData.map((ref) => ref?.closestTempRef).filter((Boolean))); //prettier-ignore
          form.setValue('refIndTempRefsDocsData', closestTempRefsData.map((ref) => ref?.tempRefsDocs).filter((Boolean))); //prettier-ignore
        }
      });
    }
  }, [JSON.stringify(currentRefIndData)]);

  //* set closest temp ref for test ind. per point
  useEffect(() => {
    if (currentTestIndData.length < 1) return;

    if (currentTestIndData.length > 0) {
      Promise.all(
        currentTestIndData.map((ref, i) =>
          getClosestTempRefByReference('CR000016', ref.value, refTestDatas?.[i], i)
        )
      ).then((closestTempRefsData) => {
        if (closestTempRefsData.length > 0) {
          //* stored the closest temp ref and the temp refs docs for each point of test ind.
          form.setValue('testIndClosestTempRefsData', closestTempRefsData.map((ref) => ref?.closestTempRef).filter((Boolean))); //prettier-ignore
          form.setValue('testIndTempRefsDocsData', closestTempRefsData.map((ref) => ref?.tempRefsDocs).filter((Boolean))); //prettier-ignore
        }
      });
    }
  }, [JSON.stringify(currentTestIndData)]);

  return (
    <Tab.Container defaultActiveKey='0'>
      <Row>
        <Col className='px-0' md={12}>
          <Nav variant='pills' className='d-flex justify-content-center gap-3'>
            {rangeOfCalibration &&
              rangeOfCalibration > 0 &&
              Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => (
                <Nav.Item key={`${pointIndex}-nav-item`} className='d-flex align-items-center'>
                  <Nav.Link eventKey={`${pointIndex}`}>
                    <Database size={18} />A{pointIndex + 1}
                  </Nav.Link>
                </Nav.Item>
              ))}
          </Nav>

          <div className='d-flex justify-content-center align-items-center gap-3 mt-3'>
            <Button
              variant='outline-primary'
              className='text-decoration-none border-primary'
              onClick={() => setShowCalculationTables((prev) => !prev)}
            >
              {showCalculationTables ? (
                <>
                  <EyeSlash size={18} className='me-2' /> Hide{' '}
                </>
              ) : (
                <>
                  <Eye size={18} className='me-2' /> Show{' '}
                </>
              )}
              Calculation Summary Table
            </Button>

            <Button
              variant='outline-primary'
              className='text-decoration-none border-primary'
              onClick={() => setShowUncertaintyBudget((prev) => !prev)}
            >
              {showUncertaintyBudget ? (
                <>
                  <EyeSlash size={18} className='me-2' /> Hide{' '}
                </>
              ) : (
                <>
                  <Eye size={18} className='me-2' /> Show{' '}
                </>
              )}
              Uncertainty Budget Table
            </Button>
          </div>
        </Col>

        <Col md={12} className='ps-0'>
          <RefTable
            job={job}
            rangeOfCalibration={rangeOfCalibration}
            showCalculationTables={showCalculationTables}
            showUncertaintyBudget={showUncertaintyBudget}
          />
        </Col>
      </Row>
    </Tab.Container>
  );
};

const RefTable = ({ job, rangeOfCalibration, showCalculationTables, showUncertaintyBudget }) => {
  const form = useFormContext();

  const cData = useWatch({ control: form.control, name: 'data' });
  const cocInstrumentsFormValue = useWatch({ name: 'cocInstruments' });
  const special = useWatch({ name: 'special' }) || [];
  const refType = useWatch({ name: 'refType' });

  const cocInstrumentsLength = useMemo(() => {
    if (!cocInstrumentsFormValue || !Array.isArray(cocInstrumentsFormValue)) return 0;
    return cocInstrumentsFormValue?.length;
  }, [JSON.stringify(cocInstrumentsFormValue)]);

  if (!rangeOfCalibration || !cData || cData.length < 1) return null;

  const getResolvedValue = (v1, v2, v3, v4, v5) => {
    const values = [v1, v2, v3, v4, v5];

    if (values.some((v) => v === undefined || v === null)) return 0;

    const x1 = subtract(v5, v3);
    const x2 = subtract(v4, v2);
    const x3 = divide(x1, x2);

    const y = subtract(v1, v2);
    const z = multiply(x3, y);

    return add(z, v3);
  };

  const getMeterTempRefsCalcData = (tempRefsDocsData) => {
    if (!tempRefsDocsData?.length) {
      return [];
    }

    const sorted = [...tempRefsDocsData].sort((a, b) => a.reference - b.reference);

    return sorted.map((row, i, arr) => ({
      col1: row?.test ?? 0,
      col2: row?.correction ?? 0,
      col3: arr?.[i + 1]?.test ?? 0,
      col4: arr?.[i + 1]?.correction ?? 0,
      col5: arr?.[i + 1]?.uncer ?? 0,
      col6: arr?.[i + 1]?.drift ?? 0,
    }));
  };

  const getTherTempRefsCalcData1 = (tempRefsDocsData) => {
    if (!tempRefsDocsData?.length) {
      return [];
    }

    const sorted = [...tempRefsDocsData].sort((a, b) => a.reference - b.reference);

    return sorted.map((row, i, arr) => ({
      col1: row?.test ?? 0,
      col2: row?.reference ?? 0,
      col3: arr?.[i + 1]?.test ?? 0,
      col4: arr?.[i + 1]?.reference ?? 0,
      col5: arr?.[i + 1]?.uncer ?? 0,
      col6: arr?.[i + 1]?.drift ?? 0,
    }));
  };

  const getTherTempRefsCalcData2 = (refTherTempRefsCalcData, therCorr) => {
    return Array.from({ length: MAXIMUM_REF_TEST_LENGTH }).map((_, rowIndex) => {
      const approximateMatchRow = getApproximateMatchRow(therCorr, refTherTempRefsCalcData, 'col1'); //prettier-ignore

      const v1 = therCorr;
      const v2 = approximateMatchRow?.col1 ?? 0;
      const v3 = approximateMatchRow?.col2 ?? 0;
      const v4 = approximateMatchRow?.col3 ?? 0;
      const v5 = approximateMatchRow?.col4 ?? 0;
      const r6 = getResolvedValue(v1, v2, v3, v4, v5);

      const values = [v1, v2, v3, v4, v5, r6];

      return Array.from({ length: MAXIMUM_REF_TEST_LENGTH }, (_, i) => i + 1).reduce((acc, i) => {
        acc[`col${i}`] = values[rowIndex];
        return acc;
      }, {});
    });
  };

  const getCalcSummaryData = (calcData, key, pointIndex) => {
    if (!calcData || calcData?.length < 1) return { min: 0, max: 0, mean: 0, std: 0 };

    const values = calcData.map((calc) => calc?.[key] ?? 0);

    const w = min(...values);
    const x = max(...values);
    const y = mean(values);
    const z = std(values);

    return { min: w, max: x, mean: y, std: z };
  };

  const getRefTypeCoeffCalc = (refType, refTypeCoeffRanges) => {
    const allowedTypes = ['J', 'K', 'N', 'R', 'S', 'B', 'E', 'T'];
    const MAX_ROWS_LEGTH = 19;

    const col1Values = Array.from({ length: MAX_ROWS_LEGTH }, (_, i) => i + 3); //* contains values from 3 to 21

    if (
      !refType ||
      !allowedTypes.includes(refType) ||
      !refTypeCoeffRanges ||
      refTypeCoeffRanges.length < 1
    ) {
      return [];
    }

    const matchRefTypeCoefficientsRanges = refTypeCoeffRanges.find((rtcr) => rtcr.type === refType);

    if (!matchRefTypeCoefficientsRanges) return [];

    const { ranges } = matchRefTypeCoefficientsRanges;

    return col1Values.map((value, rowIndex) => {
      const propertyKeys = Object.keys(ranges?.[0]);
      const propertyKey = propertyKeys[rowIndex];

      return {
        col1: value,
        col2: number(bignumber(ranges?.[0]?.[propertyKey] ?? 0)),
        col3: number(bignumber(ranges?.[1]?.[propertyKey] ?? 0)),
        col4: number(bignumber(ranges?.[2]?.[propertyKey] ?? 0)),
      };
    });
  };

  const getRtdCoeffValue = (setting, rtdCoeffRange) => {
    const ranges = rtdCoeffRange?.ranges;

    if (!ranges || ranges.length < 1) return 0;
    if (!setting) return ranges?.[0]?.c1 ? number(bignumber(ranges?.[0]?.c1)) : 0;

    const range1 = ranges?.[0];
    const range2 = ranges?.[1];
    const propertyKeys = Object.keys(ranges?.[0]).filter((pKey) => pKey && pKey.startsWith('c') && pKey !== 'c0'); // prettier-ignore

    const range1Col1Values = propertyKeys.map((pKey) => number(bignumber(ranges?.[0]?.[pKey] ?? 0))); // prettier-ignore
    const range2Col1Values = propertyKeys.map((pKey) => number(bignumber(ranges?.[1]?.[pKey] ?? 0))); // prettier-ignore

    //* if setting is in range of range1
    if (setting >= number(range1?.low) && setting <= number(range1?.high)) {
      return seriesSum(setting, 0, 1, range1Col1Values);
    }
    //* if setting is in range of range2
    else if (setting >= number(range2?.low) && setting <= number(range2?.high)) {
      return seriesSum(setting, 0, 1, range2Col1Values);
    }

    return 0;
  };

  const getRefTypeCoeffRanges2Value = (setting, refTypeCoeffRangesCalc) => {
    if (!refTypeCoeffRangesCalc?.length) return 0;

    //* if settings is 0
    if (!setting) return refTypeCoeffRangesCalc?.[3]?.col2 ?? 0;

    const col2Row1 = refTypeCoeffRangesCalc?.[0]?.col2;
    const col2Row2 = refTypeCoeffRangesCalc?.[1]?.col2;
    const col3Row1 = refTypeCoeffRangesCalc?.[0]?.col3;
    const col3Row2 = refTypeCoeffRangesCalc?.[1]?.col3;
    const col4Row1 = refTypeCoeffRangesCalc?.[0]?.col4;
    const col4Row2 = refTypeCoeffRangesCalc?.[1]?.col4;

    const col2Range = refTypeCoeffRangesCalc?.filter((rtcrc) => rtcrc?.col1 >= 6 && rtcrc?.col1 <= 19)?.map((rtcrc) => rtcrc?.col2 ?? 0) ?? [] //prettier-ignore
    const col3Range = refTypeCoeffRangesCalc?.filter((rtcrc) => rtcrc?.col1 >= 6 && rtcrc?.col1 <= 19)?.map((rtcrc) => rtcrc?.col3 ?? 0) ?? [] //prettier-ignore
    const col4Range = refTypeCoeffRangesCalc?.filter((rtcrc) => rtcrc?.col1 >= 6 && rtcrc?.col1 <= 19)?.map((rtcrc) => rtcrc?.col4 ?? 0) ?? [] //prettier-ignore

    //* if setting is in range of col2
    if (setting >= col2Row1 && setting <= col2Row2) {
      return seriesSum(setting, 0, 1, col2Range);
    }
    //* if setting is in range of col3
    else if (setting >= col3Row1 && setting <= col3Row2) {
      const lastTwoCol3Values = refTypeCoeffRangesCalc?.map((rtcrc) => rtcrc?.col3 ?? 0).slice(-2);

      const x = seriesSum(setting, 0, 1, col3Range);
      const y = subtract(setting, 126.9686);
      const z = exp(multiply(lastTwoCol3Values[1], pow(y, 2)));

      return add(x, multiply(2, ...lastTwoCol3Values, y, z));
    }
    //* if setting is in range of col4
    else if (setting >= col4Row1 && setting <= col4Row2) {
      return seriesSum(setting, 0, 1, col4Range);
    }

    return 0;
  };

  const getRefTherSpecialCalc = (setting, special) => {
    const getCol1 = (a, b, c, col2) => {
      if (col2 === undefined || col2 === null) return 0;

      const x = divide(col2, 100);

      if (col2 < 0) {
        const y = multiply(a, x);
        const z = multiply(b, pow(x, 2));
        const q = subtract(x, 1);
        const w = multiply(c, pow(x, 3), q);

        return add(1, y, z, w);
      }

      const y = multiply(a, x);
      const z = multiply(b, pow(x, 2));
      const w = multiply(c, pow(x, 3));

      return add(1, y, z, w);
    };

    const arrLength = MAXIMUM_REF_TEST_LENGTH + 1;

    //* return empty array if setting is undefined or null, arr length is even, or special is not defined, or ranges is not defined or ranges length is less than 2
    if (
      setting === undefined ||
      setting === null ||
      arrLength % 2 === 0 ||
      !special ||
      !special?.ranges ||
      special?.ranges?.length < 2
    ) {
      return [];
    }

    let result = [];
    const middleIndex = floor(arrLength / 2);
    const [range1, range2] = special.ranges;

    //* initialize array and populate the col1 & col2
    result = Array.from({ length: arrLength }).map((_, rowIndex, arr) => {
      let col1 = 0,
        col2 = 0,
        col3 = 0,
        col4 = 0;

      const offset = subtract(rowIndex, middleIndex);

      //* populate col2
      col2 = add(setting, offset);

      //* populate col1
      if (col2 < 0) {
        const a = number(bignumber(range1?.a ?? 0));
        const b = number(bignumber(range1?.b ?? 0));
        const c = number(bignumber(range1?.c ?? 0));

        col1 = getCol1(a, b, c, col2);
      } else {
        const a = number(bignumber(range2?.a ?? 0));
        const b = number(bignumber(range2?.b ?? 0));
        const c = number(bignumber(range2?.c ?? 0));

        col1 = getCol1(a, b, c, col2);
      }

      return { col1, col2, col3, col4 };
    });

    //* populate col3
    result = result.map((row, rowIndex, arr) => {
      return {
        ...row,
        col3: arr?.[rowIndex + 1]?.col1 ?? 0,
        col4: arr?.[rowIndex + 1]?.col2 ?? 0,
      };
    });

    return result;
  };

  const getTherCorrSpecialR0ResolveValue = (therCorr, range1R0, range2R0) => {
    if (therCorr === undefined || therCorr === null) return 0;

    if (therCorr < 100) return divide(therCorr, range1R0);
    else return divide(therCorr, range2R0);
  };

  return (
    <Tab.Content className='w-100 h-100'>
      {Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => {
        const pointData = cData?.[pointIndex];

        if (!pointData) return null;

        const {
          setting,
          bath,
          immer,
          resolution,
          refTher,
          refTherUom,
          refInd,
          refIndUom,
          refWire,
          testInd,
          testWire,
          refTestData,
        } = pointData;

        const refTestRefs = refTestData && Array.isArray(refTestData) ? refTestData.map((ref) => ref[0] ?? 0) : []; //prettier-ignore
        const refTestTestBeforeAdj = refTestData && Array.isArray(refTestData) ? refTestData.map((ref) => ref[1] ?? 0) : []; //prettier-ignore
        const avgRefTestRefs  = refTestRefs?.length < 1 ? mean([0]) : mean(refTestRefs); //prettier-ignore
        const avgRefTestTestBeforeAdj =   refTestTestBeforeAdj?.length < 1 ? mean([0]) : mean(refTestTestBeforeAdj); //prettier-ignore

        const closestTherRef = form.getValues('refTherClosestTempRefsData')?.[pointIndex] || 0; //prettier-ignore
        const closestIndRef = form.getValues('refIndClosestTempRefsData')?.[pointIndex] || 0; //prettier-ignore
        const closestTestIndRef = form.getValues('testIndClosestTempRefsData')?.[pointIndex] || 0; //prettier-ignore

        const isRefTypePt1000 = refType?.label?.includes('Pt 1000');
        const isRefTherCommonExist = COMMON_REF_THER.find((crf) => crf.label === refTher?.label); //prettier-ignore
        const isRefTherCommonYes = isRefTherCommonExist?.value === 'yes'; //prettier-ignore
        const isRefTherUomDegreesCelsius = refTherUom?.value === '°C';

        const refIndTempRefsDocs = form.getValues('refIndTempRefsDocsData')?.[pointIndex] || []; //prettier-ignore
        const refIndTempRefsCalc1 = getMeterTempRefsCalcData(refIndTempRefsDocs); //prettier-ignore
        const refIndTempRefsCalc1ApproxMatch = getApproximateMatchRow(avgRefTestRefs, refIndTempRefsCalc1, 'col1'); //prettier-ignore
        const refIndCorrValue = getResolvedValue(avgRefTestRefs ?? 0, refIndTempRefsCalc1ApproxMatch?.col1, refIndTempRefsCalc1ApproxMatch?.col2, refIndTempRefsCalc1ApproxMatch?.col3, refIndTempRefsCalc1ApproxMatch?.col4); //prettier-ignore
        const refIndUncerValue = refIndTempRefsCalc1ApproxMatch?.col5;
        const refIndDriftValue = refIndTempRefsCalc1ApproxMatch?.col6;

        const testIndTempRefsDocs = form.getValues('testIndTempRefsDocsData')?.[pointIndex] || []; //prettier-ignore
        const testIndTempRefsCalc1 = getMeterTempRefsCalcData(testIndTempRefsDocs); //prettier-ignore
        const testIndTempRefsCalc1ApproxMatch = getApproximateMatchRow(avgRefTestTestBeforeAdj, testIndTempRefsCalc1, 'col1'); //prettier-ignore
        const testIndCorrValue = getResolvedValue(avgRefTestTestBeforeAdj ?? 0, testIndTempRefsCalc1ApproxMatch?.col1, testIndTempRefsCalc1ApproxMatch?.col2, testIndTempRefsCalc1ApproxMatch?.col3, testIndTempRefsCalc1ApproxMatch?.col4); //prettier-ignore
        const testIndUncerValue = testIndTempRefsCalc1ApproxMatch?.col5;
        const testIndDriftValue = testIndTempRefsCalc1ApproxMatch?.col6;

        const refTherCorrRefTherCommon = Array.from({ length: MAXIMUM_REF_TEST_LENGTH }).map((_, rowIndex) => sum(refTestRefs?.[rowIndex] ?? 0, refIndCorrValue ?? 0)); //prettier-ignore
        const avgRefTherCorr = refTherCorrRefTherCommon.length < 1 ? mean([0]) : mean(refTherCorrRefTherCommon?.filter(v => v !== undefined && v !== null)); //prettier-ignore

        const refTherTempRefsDocs = form.getValues('refTherTempRefsDocsData')?.[pointIndex] || []; //prettier-ignore
        const refTherTempRefsCalc1 = getTherTempRefsCalcData1(refTherTempRefsDocs); //prettier-ignore
        const refTherTempRefsCalc1ApproxMatch = getApproximateMatchRow(refTher?.label === 'ST-S3' || refTher?.label === 'ST-S4' ? avgRefTherCorr :  avgRefTestRefs, refTherTempRefsCalc1, 'col1'); //prettier-ignore
        const refTherCorrValue = getResolvedValue(avgRefTestRefs ?? 0, refTherTempRefsCalc1ApproxMatch?.col1, refTherTempRefsCalc1ApproxMatch?.col2, refTherTempRefsCalc1ApproxMatch?.col3, refTherTempRefsCalc1ApproxMatch?.col4); //prettier-ignore
        const refTherUncerValue = refTherTempRefsCalc1ApproxMatch?.col5;
        const refTherDriftValue = refTherTempRefsCalc1ApproxMatch?.col6;
        const refTherSpecial = special?.data?.find((sp) => sp?.idCode === refTher?.label);
        const refTherSpecialCalc = getRefTherSpecialCalc(setting, refTherSpecial);

        const mainCalcData = Array.from({ length: MAXIMUM_REF_TEST_LENGTH }).map((_, rowIndex) => {
          const refReading = refTestRefs?.[rowIndex];
          const meterCorr1 = refIndCorrValue;
          const meterCorr2 = testIndCorrValue;
          const meterCorr3 = '';
          const therCorr = isRefTherCommonExist ? sum(refTestRefs?.[rowIndex] ?? 0, refIndCorrValue ?? 0) : refTherCorrValue; //prettier-ignore
          const testBefAdjReading = refTestTestBeforeAdj?.[rowIndex]; //prettier-ignore
          const refTherTempRefsCalc2 = getTherTempRefsCalcData2(refTherTempRefsCalc1, therCorr); //prettier-ignore
          const testAftAdjReading = '';

          const sumOfRefReadingMeterCorr1TherCorr = sum(refReading ?? 0, meterCorr1 ?? 0, therCorr ?? 0); //prettier-ignore
          const sumOfTestBefAdjReadingMeterCorr2 = sum(testBefAdjReading ?? 0, meterCorr2 ?? 0); //prettier-ignore

          //TODO: Need also to cater if isRefTherUomDegreesCelsius - uom is in degree celsius and isRefTherCommonExist is false
          const refTherSpecialRange1R0 = number(bignumber(refTherSpecial?.ranges?.[0]?.r0 ?? 0));
          const refTherSpecialRange2R0 = number(bignumber(refTherSpecial?.ranges?.[1]?.r0 ?? 0));
          const therCorrSpecialR0ResolveValue = getTherCorrSpecialR0ResolveValue(therCorr, refTherSpecialRange1R0, refTherSpecialRange2R0); //prettier-ignore

          let actualTrueConditionValue = 0;

          if (isRefTherCommonExist && isRefTherCommonYes) {
            const refTherSpecialCalcApproxMatch = getApproximateMatchRow(therCorrSpecialR0ResolveValue, refTherSpecialCalc, 'col1'); //prettier-ignore
            const refTherSpecialValue = getResolvedValue(therCorrSpecialR0ResolveValue,  refTherSpecialCalcApproxMatch?.col1, refTherSpecialCalcApproxMatch?.col2, refTherSpecialCalcApproxMatch?.col3, refTherSpecialCalcApproxMatch?.col4); //prettier-ignore

            actualTrueConditionValue = refTherSpecialValue;
          } else {
            actualTrueConditionValue = refTherTempRefsCalc2?.[MAXIMUM_REF_TEST_LENGTH - 1]?.col1 ?? 0; //prettier-ignore
          }

          const actualFalseConditionValue = isRefTherUomDegreesCelsius ? sumOfRefReadingMeterCorr1TherCorr : 0; //prettier-ignore

          const actual1 = isRefTherCommonExist? actualTrueConditionValue: actualFalseConditionValue; //prettier-ignore
          const actual2 = sumOfTestBefAdjReadingMeterCorr2;
          const actual3 = '';

          const difference1 = subtract(actual1 ?? 0, actual2 ?? 0);
          const difference2 = '';

          return {
            actualTrueConditionValue,
            therCorrSpecialR0ResolveValue,
            refReading,
            meterCorr1,
            meterCorr2,
            meterCorr3,
            therCorr,
            testBefAdjReading,
            refTherTempRefsCalc2,
            testAftAdjReading,
            sumOfRefReadingMeterCorr1TherCorr,
            sumOfTestBefAdjReadingMeterCorr2,
            actual1,
            actual2,
            actual3,
            difference1,
            difference2,
          };
        });

        const refReadingSummary = getCalcSummaryData(mainCalcData, 'actual1');
        const testBefAdjReadingSummary = getCalcSummaryData(mainCalcData, 'actual2', pointIndex);
        const correction = getCalcSummaryData(mainCalcData, 'difference1')?.mean;
        const indicatedTemperature = subtract(setting ?? 0, correction);

        const rtdCoeffValue = getRtdCoeffValue(setting, RTD_COEFFICIENTS_RANGE?.[0]);
        const rtdCoeffValuePercent1 = multiply(rtdCoeffValue, 100);
        const rtdCoeffValuePercent2 = multiply(rtdCoeffValue, isRefTypePt1000 ? 1000 : 100);

        const refTypeCoeffRangesCalc1 = getRefTypeCoeffCalc(refType, REF_TYPE_COEFFICIENTS_RANGE);
        const refTypeCoeffRangesCalc2 = !isRefTherCommonExist ? getRefTypeCoeffCalc( refTher?.label ? refTher?.label?.split('-')[1].charAt(0) ?? '' : '', REF_TYPE_COEFFICIENTS_RANGE) : []; // prettier-ignore

        const refTypeCoeffRanges2Value1 = getRefTypeCoeffRanges2Value(setting, refTypeCoeffRangesCalc2); // prettier-ignore
        const refTypeCoeffRanges2Value2 = getRefTypeCoeffRanges2Value( setting,refTypeCoeffRangesCalc1); // prettier-ignore

        const refTypeCoeffRanges2ValueBase1 = multiply(refTypeCoeffRanges2Value1, 0.001);
        const refTypeCoeffRanges2ValueBase2 = multiply(refTypeCoeffRanges2Value2, 0.001);

        const calculations = {
          closestTherRef,
          closestIndRef,
          closestTestIndRef,
          refReadingSummary,
          refIndCorrValue,
          refIndUncerValue,
          refIndDriftValue,
          testBefAdjReadingSummary,
          testIndCorrValue,
          testIndUncerValue,
          testIndDriftValue,
          correction,
          indicatedTemperature,
          isRefTherCommonExist,
          isRefTherCommonYes,
          isRefTherUomDegreesCelsius,
          refTherCorrValue,
          refTherUncerValue,
          refTherDriftValue,
          refTherSpecial,
          refTypeCoeffRangesCalc1,
          rtdCoeffValue,
          rtdCoeffValuePercent1,
          rtdCoeffValuePercent2,
          refTypeCoeffRangesCalc2,
          refTypeCoeffRanges2Value1,
          refTypeCoeffRanges2Value2,
          refTypeCoeffRanges2ValueBase1,
          refTypeCoeffRanges2ValueBase2,
        };

        return (
          <Tab.Pane key={`${pointIndex}-tab-pane`} className='h-100' eventKey={pointIndex}>
            <Card className='h-100 w-100 shadow-none'>
              <Card.Body>
                <Row className='mb-3'>
                  <h4 className='mb-0'>Data Calculation</h4>
                  <p className='text-muted fs-6'>
                    Data calculation for the current calibration point
                  </p>

                  <div className='flex align-items-center gap-2'>
                    <div className='fs-5'>
                      <span className='pe-2'>How many Instruments?:</span>
                      <span className='fw-bold text-capitalize'>{cocInstrumentsLength}</span>
                    </div>
                  </div>
                </Row>

                <Row>
                  <Col md={4}>
                    <Table className='text-center fs-6 align-middle' bordered responsive>
                      <tbody>
                        <tr>
                          <th>Calibration Point</th>
                          <td>{pointIndex + 1}</td>
                        </tr>
                        <tr>
                          <th>Setting</th>
                          <td>{setting || 0}</td>
                        </tr>
                        <tr>
                          <th>Immer. Lth.</th>
                          <td>{immer?.label}</td>
                        </tr>
                        <tr>
                          <th>Resolution</th>
                          <td>{resolution || 0}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>

                  <Col md={8}>
                    <Table className='text-center fs-6 align-middle' bordered responsive>
                      <tbody>
                        <tr>
                          <th style={{ width: '150px' }}>Ref. Ther. Used</th>
                          <td>{refTher?.label}</td>
                          <td></td>
                          <td></td>
                          <td>{formatToDicimalString(refTherUncerValue)}</td>
                        </tr>
                        <tr>
                          <th style={{ width: '150px' }}>Ref. Ind. Used</th>
                          <td>{refInd?.label}</td>
                          <td>{refInd?.label ? refInd?.label.split('-')?.[3] || '' : ''}</td>
                          <td>{refIndUom?.label || 'I'}</td>
                          <td>{formatToDicimalString(refIndUncerValue, 4)}</td>
                        </tr>
                        <tr>
                          <th style={{ width: '150px' }}>Ref. Wire Used</th>
                          <td>{refWire?.label}</td>
                          <td></td>
                          <td></td>
                          <td>
                            {refWire
                              ? formatToDicimalString(safeParseFloat(refWire?.uncerDCelsius), 4)
                              : ''}
                          </td>
                        </tr>
                        <tr>
                          <th style={{ width: '150px' }}>Bath Used</th>
                          <td>{bath?.label}</td>
                          <td></td>
                          <td></td>
                          <td>
                            {formatToDicimalString(safeParseFloat(bath?.stabilityDCelsius), 4)}
                          </td>
                        </tr>
                        <tr>
                          <th style={{ width: '150px' }}>Test Ind. Used</th>
                          <td>{testInd?.label}</td>
                          <td>{testInd?.label ? testInd?.label.split('-')?.[3] || '' : ''}</td>
                          <td>{'I'}</td>
                          <td>{formatToDicimalString(testIndUncerValue, 4)}</td>
                        </tr>
                        <tr>
                          <th style={{ width: '150px' }}>Test Wire. Used</th>
                          <td>{testWire?.label}</td>
                          <td></td>
                          <td></td>
                          <td>
                            {testWire
                              ? formatToDicimalString(safeParseFloat(testWire?.uncerDCelsius), 4)
                              : ''}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>

                  <Col md={4}>
                    <Table className='text-center fs-6 align-middle' bordered responsive>
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Test Before Adj</th>
                        </tr>
                      </thead>

                      <tbody>
                        {Array.from({ length: MAXIMUM_REF_TEST_LENGTH }).map((_, rowIndex) => {
                          const refTestDataRow = refTestData?.[rowIndex];

                          return (
                            <tr key={`${rowIndex}-ref-test-row-data-calculation`}>
                              <td>{refTestDataRow?.[0] || 0}</td>
                              <td>{refTestDataRow?.[1] || 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Col>

                  <Col md={8}>
                    <Row>
                      <Col xs={12}>
                        <Table className='text-center fs-6 align-middle' bordered responsive>
                          <tbody>
                            <tr>
                              <th>Correction</th>
                              <td>{formatToDicimalString(correction, 4)}</td>
                            </tr>
                            <tr>
                              <th>What Ref. Function?</th>
                              <td>{refTherUom?.label}</td>
                            </tr>
                            <tr>
                              <th>What Test Function?</th>
                              <td>°C</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>

                      <Col xs={12}>
                        <Table className='text-center fs-6 align-middle' bordered responsive>
                          <tbody>
                            <tr>
                              <th>Average Reference</th>
                              <td>{formatToDicimalString(avgRefTestRefs, 3)}</td>
                            </tr>
                            <tr>
                              <th>Average Test Before Adj</th>
                              <td>{formatToDicimalString(avgRefTestTestBeforeAdj, 2)}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </Col>

                  <Col xs={12}>
                    <div
                      style={{
                        transition: 'all 0.5s ease-in-out',
                        height: showCalculationTables ? 'fit-content' : '0px',
                        overflow: 'hidden',
                      }}
                    >
                      <hr
                        className='my-4 border border-primary border-3'
                        style={{
                          width: showCalculationTables ? '100%' : '0',
                          transition: 'all 0.5s ease-in-out',
                        }}
                      />

                      <Row>
                        <Col md={6}>
                          <Table className='text-center fs-6 align-middle' bordered responsive>
                            <tbody>
                              <tr>
                                <th></th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>Mean</th>
                                <th>Std</th>
                              </tr>
                              <tr>
                                <th>Reference</th>
                                <td>{formatToDicimalString(refReadingSummary?.min, 4)}</td>
                                <td>{formatToDicimalString(refReadingSummary?.max, 4)}</td>
                                <td>{formatToDicimalString(refReadingSummary?.mean, 4)}</td>
                                <td>{formatToDicimalString(refReadingSummary?.std, 4)}</td>
                              </tr>
                              <tr>
                                <th>Test Before Adj</th>
                                <td>{formatToDicimalString(testBefAdjReadingSummary?.min, 4)}</td>
                                <td>{formatToDicimalString(testBefAdjReadingSummary?.max, 4)}</td>
                                <td>{formatToDicimalString(testBefAdjReadingSummary?.mean, 4)}</td>
                                <td>{formatToDicimalString(testBefAdjReadingSummary?.std, 4)}</td>
                              </tr>
                              <tr>
                                <th>Test After Adj</th>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                              </tr>
                            </tbody>
                          </Table>
                        </Col>

                        <Col md={6}>
                          <Table className='text-center fs-6 align-middle' bordered responsive>
                            <tbody>
                              <tr>
                                <th style={{ width: '150px' }}>Correction</th>
                                <td>{formatToDicimalString(correction, 4)}</td>
                              </tr>
                              <tr>
                                <th style={{ width: '150px' }}>Indicated Temperature</th>
                                <td>{formatToDicimalString(indicatedTemperature, 4)}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </Col>

                        <Col>
                          <Table className='text-center fs-6 align-middle' bordered responsive>
                            <tbody>
                              <tr>
                                <th>
                                  Reference <br />
                                  Reading
                                </th>
                                <th>
                                  Meter <br />
                                  Corr.
                                </th>
                                <th>
                                  Ther. <br />
                                  Corr.
                                </th>
                                <th>Actual</th>
                                <th>
                                  Test Bef Adj <br />
                                  Reading
                                </th>
                                <th>
                                  Meter <br />
                                  Corr.
                                </th>
                                <th>Actual</th>
                                <th>Difference</th>
                                <th>
                                  Test Aft Adj <br />
                                  Reading
                                </th>
                                <th>
                                  Meter <br />
                                  Corr.
                                </th>
                                <th>Actual</th>
                                <th>Difference</th>
                              </tr>
                              {Array.from({ length: MAXIMUM_REF_TEST_LENGTH }).map(
                                (_, rowIndex) => {
                                  const rowCalcData = mainCalcData?.[rowIndex];

                                  return (
                                    <tr>
                                      <td>{formatToDicimalString(rowCalcData?.refReading, 4)}</td>
                                      <td>{formatToDicimalString(rowCalcData?.meterCorr1, 4)}</td>
                                      <td>{formatToDicimalString(rowCalcData?.therCorr, 4)}</td>
                                      <td>{formatToDicimalString(rowCalcData?.actual1, 4)}</td>
                                      <td>
                                        {formatToDicimalString(rowCalcData?.testBefAdjReading, 4)}
                                      </td>
                                      <td>{formatToDicimalString(rowCalcData?.meterCorr2, 4)}</td>
                                      <td>{formatToDicimalString(rowCalcData?.actual2, 4)}</td>
                                      <td>{formatToDicimalString(rowCalcData?.difference1, 4)}</td>
                                      <td>{rowCalcData?.testAftAdjReading}</td>
                                      <td>{rowCalcData?.meterCorr3}</td>
                                      <td>{rowCalcData?.actual3}</td>
                                      <td>{rowCalcData?.difference2}</td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </Table>
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  <Col xs={12}>
                    <div
                      style={{
                        transition: 'all 0.5s ease-in-out',
                        height: showUncertaintyBudget ? 'fit-content' : '0px',
                        overflow: 'hidden',
                      }}
                    >
                      <hr
                        className='my-4 border border-primary border-3'
                        style={{
                          width: showUncertaintyBudget ? '100%' : '0',
                          transition: 'all 0.5s ease-in-out',
                        }}
                      />

                      <UncertaintyBudgetTable
                        job={job}
                        pointIndex={pointIndex}
                        calculations={calculations}
                      />
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab.Pane>
        );
      })}
    </Tab.Content>
  );
};

const UncertaintyBudgetTable = ({ job, pointIndex, calculations }) => {
  //* Common Constant values
  const COMMON_RELATIVE_UNCERTAINTY = 0.00001;
  const COMMON_V_VALUE1 = 5;
  const COMMON_V_VALUE2 = 10_000_000_000;
  const COMMON_K_VALUE1 = 2;
  const COMMON_K_VALUE2 = sqrt(3);
  const COMMON_CI_VALUE = 1;

  const form = useFormContext();

  const ck = useWatch({control: form.control, name: 'ck'}) || { data: [], isLoading: true, isError: false }; //prettier-ignore
  const cmc = useWatch({control: form.control, name: 'cmc'}) || { data: [], isLoading: true, isError: false }; //prettier-ignore

  const cData = useWatch({ control: form.control, name: 'data' });
  const refType = useWatch({ name: 'refType' });
  const resultExpandedUncertainties = useWatch({ name: 'resultExpandedUncertainties' }) || [];

  const pointData = cData?.[pointIndex];

  if (!pointData) return null;

  const {
    setting,
    bath,
    immer,
    resolution,
    refTher,
    refTherUom,
    refInd,
    refIndUom,
    refWire,
    testInd,
    testWire,
    refTestData,
  } = pointData;

  const findClosestDOF = useCallback(
    (value, inverse = false) => {
      if (!value && value !== 0) {
        return { value: 0, dof: 0 };
      }

      // * sort ck data by DOF ascending () or descending (inverse)
      const sortedCK = [...ck.data].sort((a, b) => {
        if (inverse) return safeParseFloat(b.dof) - safeParseFloat(a.dof);
        return safeParseFloat(a.dof) - safeParseFloat(b.dof);
      });

      //* If value is less than the first DOF Value, return the first entry
      if (value < safeParseFloat(sortedCK[0]?.value)) {
        return sortedCK[0];
      }

      //* Find the closest matching or lower DOF value
      const closest = sortedCK.find((entry, index) => {
        const current = safeParseFloat(entry.value);
        const next = safeParseFloat(sortedCK[index + 1]?.value);

        //* Return exact match immediately
        if (value === current) return true;

        //* If value falls between current and next, return current
        if (!isNaN(next) && value > current && value < next) return true;

        return false;
      });

      //* If no match was found, return the last element (highest DOF)
      return closest || sortedCK[sortedCK.length - 1];
    },
    [JSON.stringify(ck)]
  );

  const refReadingSummary = useMemo(() => {
    return calculations?.refReadingSummary;
  }, [JSON.stringify(calculations?.refReadingSummary)]);

  const testBefAdjReadingSummary = useMemo(() => {
    return calculations?.testBefAdjReadingSummary;
  }, [JSON.stringify(calculations?.testBefAdjReadingSummary)]);

  const correction = useMemo(() => {
    return calculations?.correction;
  }, [calculations?.correction]);

  const stdDevRef1stUi = useMemo(() => {
    return refReadingSummary?.std;
  }, [refReadingSummary?.std]);

  const stdDevRef2ndUi = useMemo(() => {
    const x = stdDevRef1stUi;
    const y = sqrt(6);
    return divide(x, y);
  }, [stdDevRef1stUi, sqrt]);

  const stdDevRefCiUi = useMemo(() => {
    return multiply(stdDevRef2ndUi, COMMON_CI_VALUE);
  }, [stdDevRef2ndUi, COMMON_CI_VALUE]);

  const stdDevTest1stUi = useMemo(() => {
    return testBefAdjReadingSummary?.std;
  }, [testBefAdjReadingSummary?.std]);

  const stdDevTest2ndUi = useMemo(() => {
    const x = stdDevTest1stUi;
    const y = sqrt(6);
    return divide(x, y);
  }, [stdDevTest1stUi, sqrt]);

  const stdDevTestCiUi = useMemo(() => {
    return multiply(stdDevTest2ndUi, COMMON_CI_VALUE);
  }, [stdDevTest2ndUi, COMMON_CI_VALUE]);

  const readability1stUi = useMemo(() => {
    return divide(safeParseFloat(resolution), 2);
  }, [resolution, safeParseFloat]);

  const repObsvCiUi = useMemo(() => {
    return hypot(stdDevRefCiUi, stdDevTestCiUi);
  }, [stdDevRefCiUi, stdDevTestCiUi]);

  const readability2ndUi = useMemo(() => {
    return divide(readability1stUi, COMMON_K_VALUE2);
  }, [readability1stUi, COMMON_K_VALUE2]);

  const readabilityCiUi = useMemo(() => {
    return multiply(readability2ndUi, COMMON_CI_VALUE);
  }, [readability2ndUi, COMMON_CI_VALUE]);

  const refIndUncerV = useMemo(() => {
    return safeParseFloat(findClosestDOF(safeParseFloat(refInd?.kFactor), true)?.dof);
  }, [refInd?.kFactor, safeParseFloat, findClosestDOF]);

  const refIndUncer1stUi = useMemo(() => {
    return calculations?.refIndUncerValue;
  }, [calculations?.closestIndRef?.uncer, calculations?.refIndUncerValue]);

  const refIndUncerK = useMemo(() => {
    return safeParseFloat(refInd?.kFactor);
  }, [refInd?.kFactor, safeParseFloat]);

  const refIndUncer2ndUi = useMemo(() => {
    if (isNaN(refIndUncer1stUi) || refIndUncer1stUi === undefined || refIndUncer1stUi === null) {
      return 0;
    }

    return divide(refIndUncer1stUi, refIndUncerK);
  }, [refIndUncer1stUi, refIndUncerK]);

  const refIndUncerCi = useMemo(() => {
    let x = 0;

    if (calculations?.isRefTherCommonExist !== undefined && calculations?.isRefTherCommonExist !== null) x = calculations?.rtdCoeffValuePercent1; 
    else x = calculations?.isRefTherUomDegreesCelsius ? COMMON_CI_VALUE : calculations?.refTypeCoeffRanges2ValueBase1; //prettier-ignore

    return divide(1, x);
  }, [
    calculations?.isRefTherCommonExist,
    calculations?.isRefTherUomDegreesCelsius,
    calculations?.rtdCoeffValuePercent1,
    calculations?.refTypeCoeffRanges2ValueBase1,
    COMMON_CI_VALUE,
  ]);

  const refIndUncerCiUi = useMemo(() => {
    return multiply(refIndUncer2ndUi, refIndUncerCi);
  }, [refIndUncer2ndUi, refIndUncerCi]);

  const testIndUncerV = useMemo(() => {
    return safeParseFloat(findClosestDOF(safeParseFloat(testInd?.kFactor), true)?.dof);
  }, [testInd?.kFactor, safeParseFloat, findClosestDOF]);

  const testIndUncer1stUi = useMemo(() => {
    return calculations?.testIndUncerValue;
  }, [calculations?.closestTestIndRef?.uncer, calculations?.testIndUncerValue]);

  const testIndUncerK = useMemo(() => {
    return safeParseFloat(testInd?.kFactor);
  }, [testInd?.kFactor, safeParseFloat]);

  const testIndUncer2ndUi = useMemo(() => {
    if (isNaN(testIndUncer1stUi) || testIndUncer1stUi === undefined || testIndUncer1stUi === null) {
      return 0;
    }

    return divide(testIndUncer1stUi, testIndUncerK);
  }, [testIndUncer1stUi, testIndUncerK]);

  const testIndUncerCi = useMemo(() => {
    //* since test ind uom is always °C return 1
    let x = COMMON_CI_VALUE;
    return divide(COMMON_CI_VALUE, x);
  }, []);

  const testIndUncerCiUi = useMemo(() => {
    return multiply(testIndUncer2ndUi, testIndUncerCi);
  }, [testIndUncer2ndUi, testIndUncerCi]);

  const refIndMasterUncerCiUi = useMemo(() => {
    return hypot(refIndUncerCiUi, testIndUncerCiUi);
  }, [refIndUncerCiUi, testIndUncerCiUi]);

  const refTherUncerV = useMemo(() => {
    return safeParseFloat(findClosestDOF(safeParseFloat(refTher?.kFactor), true)?.dof);
  }, [refTher?.kFactor, safeParseFloat, findClosestDOF]);

  const refTherUncer1stUi = useMemo(() => {
    return calculations?.refTherUncerValue;
  }, [calculations?.closestTherRef?.uncer, calculations?.refTherUncerValue]);

  const refTherUncerK = useMemo(() => {
    return safeParseFloat(refTher?.kFactor);
  }, [refTher?.kFactor, safeParseFloat]);

  const refTherUncer2ndUi = useMemo(() => {
    if (isNaN(refTherUncer1stUi) || refTherUncer1stUi === undefined || refTherUncer1stUi === null) {
      return 0;
    }

    return divide(refTherUncer1stUi, refTherUncerK);
  }, [refTherUncer1stUi, refTherUncerK]);

  const refTherUncerCiUi = useMemo(() => {
    return multiply(refTherUncer2ndUi, COMMON_CI_VALUE);
  }, [refTherUncer2ndUi, COMMON_CI_VALUE]);

  const refTherMasterUncerCiUi = useMemo(() => {
    return hypot(refTherUncerCiUi);
  }, [refTherUncerCiUi]);

  const refWireUncerV = useMemo(() => {
    return safeParseFloat(findClosestDOF(safeParseFloat(refWire?.kFactor), true)?.dof);
  }, [refWire?.kFactor, safeParseFloat, findClosestDOF]);

  const refWireUncer1stUi = useMemo(() => {
    return safeParseFloat(refWire?.uncerDCelsius);
  }, [refWire?.uncerDCelsius]);

  const refWireUncerK = useMemo(() => {
    return safeParseFloat(refWire?.kFactor);
  }, [refWire?.kFactor, safeParseFloat]);

  const refWireUncer2ndUi = useMemo(() => {
    if (isNaN(refWireUncer1stUi) || refWireUncer1stUi === undefined || refWireUncer1stUi === null) {
      return 0;
    }

    return divide(refWireUncer1stUi, refWireUncerK);
  }, [refWireUncer1stUi, refWireUncerK]);

  const refWireUncerCiUi = useMemo(() => {
    return multiply(refWireUncer2ndUi, COMMON_CI_VALUE);
  }, [refWireUncer2ndUi, COMMON_CI_VALUE]);

  const testWireUncerV = useMemo(() => {
    return safeParseFloat(findClosestDOF(safeParseFloat(testWire?.kFactor), true)?.dof);
  }, [testWire?.kFactor, safeParseFloat, findClosestDOF]);

  const testWireUncer1stUi = useMemo(() => {
    return safeParseFloat(testWire?.uncerDCelsius);
  }, [testWire?.uncerDCelsius]);

  const testWireUncerK = useMemo(() => {
    return safeParseFloat(testWire?.kFactor);
  }, [testWire?.kFactor, safeParseFloat]);

  const testWireUncer2ndUi = useMemo(() => {
    if (
      isNaN(testWireUncer1stUi) ||
      testWireUncer1stUi === undefined ||
      testWireUncer1stUi === null
    ) {
      return 0;
    }

    return divide(testWireUncer1stUi, testWireUncerK);
  }, [testWireUncer1stUi, testWireUncerK]);

  const testWireUncerCiUi = useMemo(() => {
    return multiply(testWireUncer2ndUi, COMMON_CI_VALUE);
  }, [testWireUncer2ndUi, COMMON_CI_VALUE]);

  const refWireMasterUncerCiUi = useMemo(() => {
    return hypot(safeParseFloat(refWireUncerCiUi), safeParseFloat(testWireUncerCiUi));
  }, [refWireUncerCiUi, testWireUncerCiUi]);

  const bathStabilityUncer1stUi = useMemo(() => {
    const min = safeParseFloat(bath?.minDCelsius);
    const max = safeParseFloat(bath?.maxDCelsius);

    if (setting >= min && setting <= max) {
      return safeParseFloat(bath?.stabilityDCelsius);
    }
    return 0;
  }, [bath?.stabilityDCelsius, bath?.minDCelsius, bath?.maxDCelsius, setting]);

  const bathStabilityUncer2ndUi = useMemo(() => {
    if (
      isNaN(bathStabilityUncer1stUi) ||
      bathStabilityUncer1stUi === undefined ||
      bathStabilityUncer1stUi === null
    ) {
      return 0;
    }

    return divide(bathStabilityUncer1stUi, COMMON_K_VALUE2);
  }, [bathStabilityUncer1stUi, COMMON_K_VALUE2]);

  const bathStabilityUncerCiUi = useMemo(() => {
    return multiply(bathStabilityUncer2ndUi, COMMON_CI_VALUE);
  }, [bathStabilityUncer2ndUi, COMMON_CI_VALUE]);

  const bathRadialUncer1stUi = useMemo(() => {
    const min = safeParseFloat(bath?.minDCelsius);
    const max = safeParseFloat(bath?.maxDCelsius);

    if (setting >= min && setting <= max) {
      return safeParseFloat(bath?.radialDCelsius);
    }
    return 0;
  }, [bath?.radialDCelsius, bath?.minDCelsius, bath?.maxDCelsius, setting]);

  const bathRadialUncer2ndUi = useMemo(() => {
    if (
      isNaN(bathRadialUncer1stUi) ||
      bathRadialUncer1stUi === undefined ||
      bathRadialUncer1stUi === null
    ) {
      return 0;
    }

    return divide(bathRadialUncer1stUi, COMMON_K_VALUE2);
  }, [bathRadialUncer1stUi, COMMON_K_VALUE2]);

  const bathRadialUncerCiUi = useMemo(() => {
    return multiply(bathRadialUncer2ndUi, COMMON_CI_VALUE);
  }, [bathRadialUncer2ndUi, COMMON_CI_VALUE]);

  const bathAxialDCelsius = useMemo(() => {
    const allowedLookups = ['ST-BH3', 'ST-BH4', 'ST-BH6'];

    if (bath?.label && allowedLookups.includes(bath?.label)) {
      return bath?.axialDCelsius;
    }

    return 0;
  }, [bath?.axialDCelsius, bath?.label]);

  const bathAxialUncer1stUi = useMemo(() => {
    const min = safeParseFloat(bath?.minDCelsius);
    const max = safeParseFloat(bath?.maxDCelsius);

    if (setting >= min && setting <= max) {
      return safeParseFloat(bathAxialDCelsius);
    }
    return 0;
  }, [bathAxialDCelsius, bath?.minDCelsius, bath?.maxDCelsius, setting]);

  const bathAxialUncer2ndUi = useMemo(() => {
    if (
      isNaN(bathAxialUncer1stUi) ||
      bathAxialUncer1stUi === undefined ||
      bathAxialUncer1stUi === null
    ) {
      return 0;
    }

    return divide(bathAxialUncer1stUi, COMMON_K_VALUE2);
  }, [bathAxialUncer1stUi, COMMON_K_VALUE2]);

  const bathAxialUncerCiUi = useMemo(() => {
    return multiply(bathAxialUncer2ndUi, COMMON_CI_VALUE);
  }, [bathAxialUncer2ndUi, COMMON_CI_VALUE]);

  const bathMasterUncerCiUi = useMemo(() => {
    return hypot(bathStabilityUncerCiUi, bathRadialUncerCiUi, bathAxialUncerCiUi);
  }, [bathStabilityUncerCiUi, bathRadialUncerCiUi, bathAxialUncerCiUi]);

  const refIndDrift1stUi = useMemo(() => {
    return safeParseFloat(calculations?.refIndDriftValue);
  }, [calculations?.refIndDriftValue]);

  const refIndDrift2ndUi = useMemo(() => {
    if (isNaN(refIndDrift1stUi) || refIndDrift1stUi === undefined || refIndDrift1stUi === null) {
      return 0;
    }

    return divide(refIndDrift1stUi, COMMON_K_VALUE2);
  }, [refIndDrift1stUi, COMMON_K_VALUE2]);

  const refIndDriftCiUi = useMemo(() => {
    return multiply(refIndDrift2ndUi, refIndUncerCi);
  }, [refIndDrift2ndUi, refIndUncerCi]);

  const testIndDrift1stUi = useMemo(() => {
    return safeParseFloat(calculations?.testIndDriftValue);
  }, [calculations?.testIndDriftValue]);

  const testIndDrift2ndUi = useMemo(() => {
    if (isNaN(testIndDrift1stUi) || testIndDrift1stUi === undefined || testIndDrift1stUi === null) {
      return 0;
    }

    return divide(testIndDrift1stUi, COMMON_K_VALUE2);
  }, [testIndDrift1stUi, COMMON_K_VALUE2]);

  const testIndDriftCiUi = useMemo(() => {
    return multiply(testIndDrift2ndUi, testIndUncerCi);
  }, [testIndDrift2ndUi, testIndUncerCi]);

  const refIndMasterDriftCiUi = useMemo(() => {
    return hypot(refIndDriftCiUi, testIndDriftCiUi);
  }, [refIndDriftCiUi, testIndDriftCiUi]);

  const refTherDrift1stUi = useMemo(() => {
    return safeParseFloat(calculations?.refTherDriftValue);
  }, [calculations?.refTherDriftValue]);

  const refTherDrift2ndUi = useMemo(() => {
    if (isNaN(refTherDrift1stUi) || refTherDrift1stUi === undefined || refTherDrift1stUi === null) {
      return 0;
    }

    return divide(refTherDrift1stUi, COMMON_K_VALUE2);
  }, [refTherDrift1stUi, COMMON_K_VALUE2]);

  const refTherDriftCiUi = useMemo(() => {
    return multiply(refTherDrift2ndUi, COMMON_CI_VALUE);
  }, [refTherDrift2ndUi, COMMON_CI_VALUE]);

  const refTherMasterDriftCiUi = useMemo(() => {
    return hypot(refTherDriftCiUi);
  }, [refTherDriftCiUi]);

  const refInstDriftCiUi = useMemo(() => {
    return hypot(refIndMasterDriftCiUi, refTherMasterDriftCiUi);
  }, [refIndMasterDriftCiUi, refTherMasterDriftCiUi]);

  const linearErrorCiUi = useMemo(() => {
    //TODO: TEMP
    return 0;
  }, []);

  const refIcePointCiUi = useMemo(() => {
    //TODO: TEMP
    return 0;
  }, []);

  const refInstUncerCiUi = useMemo(() => {
    return hypot(
      refIndMasterUncerCiUi,
      refTherMasterUncerCiUi,
      refWireMasterUncerCiUi,
      bathMasterUncerCiUi,
      linearErrorCiUi,
      refIcePointCiUi
    );
  }, [
    refIndMasterUncerCiUi,
    refTherMasterUncerCiUi,
    refWireMasterUncerCiUi,
    bathMasterUncerCiUi,
    linearErrorCiUi,
    refIcePointCiUi,
  ]);

  const combinedStandardUncertainty = useMemo(() => {
    return hypot(repObsvCiUi, readabilityCiUi, refInstUncerCiUi, refInstDriftCiUi);
  }, [repObsvCiUi, readabilityCiUi, refInstUncerCiUi, refInstDriftCiUi]);

  const repObsvPercentU = useMemo(() => {
    const x = pow(repObsvCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [repObsvCiUi, combinedStandardUncertainty]);

  const stdDevRefPercentU = useMemo(() => {
    const x = pow(stdDevRefCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [stdDevRefCiUi, combinedStandardUncertainty]);

  const stdDevTestPercentU = useMemo(() => {
    const x = pow(stdDevTestCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [stdDevTestCiUi, combinedStandardUncertainty]);

  const readabilityPercentU = useMemo(() => {
    const x = pow(readabilityCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [readabilityCiUi, combinedStandardUncertainty]);

  const refInstUncerPercentU = useMemo(() => {
    const x = pow(refInstUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refInstUncerCiUi, combinedStandardUncertainty]);

  const refIndMasterUncerPercentU = useMemo(() => {
    if (
      isNaN(refIndMasterUncerCiUi) ||
      refIndMasterUncerCiUi === undefined ||
      refIndMasterUncerCiUi === null
    ) {
      return 0;
    }

    const x = pow(refIndMasterUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refIndMasterUncerCiUi, combinedStandardUncertainty]);

  const refIndUncerPercentU = useMemo(() => {
    if (isNaN(refIndUncerCiUi) || refIndUncerCiUi === undefined || refIndUncerCiUi === null) {
      return 0;
    }

    const x = pow(refIndUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refIndUncerCiUi, combinedStandardUncertainty]);

  const testIndUncerPercentU = useMemo(() => {
    if (isNaN(testIndUncerCiUi) || testIndUncerCiUi === undefined || testIndUncerCiUi === null) {
      return 0;
    }

    const x = pow(testIndUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [testIndUncerCiUi, combinedStandardUncertainty]);

  const refTherMasterUncerPercentU = useMemo(() => {
    if (
      isNaN(refTherMasterUncerCiUi) ||
      refTherMasterUncerCiUi === undefined ||
      refTherMasterUncerCiUi === null
    ) {
      return 0;
    }
    const x = pow(refTherMasterUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refTherMasterUncerCiUi, combinedStandardUncertainty]);

  const refTherUncerPercentU = useMemo(() => {
    if (isNaN(refTherUncerCiUi) || refTherUncerCiUi === undefined || refTherUncerCiUi === null) {
      return 0;
    }
    const x = pow(refTherUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refTherUncerCiUi, combinedStandardUncertainty]);

  const refWireMasterUncerPercenU = useMemo(() => {
    if (
      isNaN(refWireMasterUncerCiUi) ||
      refWireMasterUncerCiUi === undefined ||
      refWireMasterUncerCiUi === null
    ) {
      return 0;
    }
    const x = pow(refWireMasterUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refWireMasterUncerCiUi, combinedStandardUncertainty]);

  const refWireUncerPercenU = useMemo(() => {
    if (isNaN(refWireUncerCiUi) || refWireUncerCiUi === undefined || refWireUncerCiUi === null) {
      return 0;
    }
    const x = pow(refWireUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refWireUncerCiUi, combinedStandardUncertainty]);

  const testWireUncerPercenU = useMemo(() => {
    if (isNaN(testWireUncerCiUi) || testWireUncerCiUi === undefined || testWireUncerCiUi === null) {
      return 0;
    }
    const x = pow(testWireUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [testWireUncerCiUi, combinedStandardUncertainty]);

  const bathMasterUncerPercentU = useMemo(() => {
    if (
      isNaN(bathMasterUncerCiUi) ||
      bathMasterUncerCiUi === undefined ||
      bathMasterUncerCiUi === null
    ) {
      return 0;
    }
    const x = pow(bathMasterUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [bathMasterUncerCiUi, combinedStandardUncertainty]);

  const bathStabilityUncerPercentU = useMemo(() => {
    if (
      isNaN(bathStabilityUncerCiUi) ||
      bathStabilityUncerCiUi === undefined ||
      bathStabilityUncerCiUi === null
    ) {
      return 0;
    }
    const x = pow(bathStabilityUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [bathStabilityUncerCiUi, combinedStandardUncertainty]);

  const bathRadialUncerPercentU = useMemo(() => {
    if (
      isNaN(bathRadialUncerCiUi) ||
      bathRadialUncerCiUi === undefined ||
      bathRadialUncerCiUi === null
    ) {
      return 0;
    }
    const x = pow(bathRadialUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [bathRadialUncerCiUi, combinedStandardUncertainty]);

  const bathAxialUncerPercentU = useMemo(() => {
    if (
      isNaN(bathAxialUncerCiUi) ||
      bathAxialUncerCiUi === undefined ||
      bathAxialUncerCiUi === null
    ) {
      return 0;
    }
    const x = pow(bathAxialUncerCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [bathAxialUncerCiUi, combinedStandardUncertainty]);

  const refInstDriftPercentU = useMemo(() => {
    if (isNaN(refInstDriftCiUi) || refInstDriftCiUi === undefined || refInstDriftCiUi === null) {
      return 0;
    }
    const x = pow(refInstDriftCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refInstDriftCiUi, combinedStandardUncertainty]);

  const refIndDriftPercentU = useMemo(() => {
    if (isNaN(refIndDriftCiUi) || refIndDriftCiUi === undefined || refIndDriftCiUi === null) {
      return 0;
    }
    const x = pow(refIndDriftCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refIndDriftCiUi, combinedStandardUncertainty]);

  const testIndDriftPercentU = useMemo(() => {
    if (isNaN(testIndDriftCiUi) || testIndDriftCiUi === undefined || testIndDriftCiUi === null) {
      return 0;
    }
    const x = pow(testIndDriftCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [testIndDriftCiUi, combinedStandardUncertainty]);

  const refTherMasterDriftPercentU = useMemo(() => {
    if (
      isNaN(refTherMasterDriftCiUi) ||
      refTherMasterDriftCiUi === undefined ||
      refTherMasterDriftCiUi === null
    ) {
      return 0;
    }
    const x = pow(refTherMasterDriftCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refTherMasterDriftCiUi, combinedStandardUncertainty]);

  const refTherDriftPercentU = useMemo(() => {
    if (isNaN(refTherDriftCiUi) || refTherDriftCiUi === undefined || refTherDriftCiUi === null) {
      return 0;
    }
    const x = pow(refTherDriftCiUi, 2);
    const y = pow(combinedStandardUncertainty, 2);
    return divide(x, y);
  }, [refTherDriftCiUi, combinedStandardUncertainty]);

  const stdDevRefCiUi4v = useMemo(() => {
    const x = pow(stdDevRefCiUi, 4);
    return divide(x, COMMON_V_VALUE1);
  }, [stdDevRefCiUi, COMMON_V_VALUE1]);

  const stdDevTestCiUi4v = useMemo(() => {
    const x = pow(stdDevTestCiUi, 4);
    return divide(x, COMMON_V_VALUE1) * 100;
  }, [stdDevTestCiUi, COMMON_V_VALUE1]);

  const repObsvCiUi4v = useMemo(() => {
    return sum(stdDevRefCiUi4v, stdDevTestCiUi4v);
  }, [stdDevRefCiUi4v, stdDevTestCiUi4v]);

  const readabilityCiUi4v = useMemo(() => {
    return divide(readabilityCiUi, COMMON_V_VALUE2);
  }, [readabilityCiUi, COMMON_V_VALUE2]);

  const refIndUncerCiUi4v = useMemo(() => {
    const x = pow(refIndUncerCiUi, 4);
    return divide(x, refIndUncerV);
  }, [refIndUncerV, refIndUncerCiUi]);

  const testIndUncerCiUi4v = useMemo(() => {
    const x = pow(testIndUncerCiUi, 4);
    return divide(x, testIndUncerV);
  }, [testIndUncerV, testIndUncerCiUi]);

  const refIndMasterCiUi4v = useMemo(() => {
    return sum(refIndUncerCiUi4v, testIndUncerCiUi4v);
  }, [refIndUncerCiUi4v, testIndUncerCiUi4v]);

  const refTherUncerCiUi4v = useMemo(() => {
    const x = pow(refTherUncerCiUi, 4);
    return divide(x, refTherUncerV);
  }, [refTherUncerV, refTherUncerCiUi]);

  const refTherMasterUncerCiUi4v = useMemo(() => {
    return sum(refTherUncerCiUi4v);
  }, [refTherUncerCiUi4v]);

  const refWireUncerCiUi4v = useMemo(() => {
    const x = pow(refWireUncerCiUi, 4);
    return divide(x, refWireUncerV);
  }, [refWireUncerV, refWireUncerCiUi]);

  const testWireUncerCiUi4v = useMemo(() => {
    const x = pow(testWireUncerCiUi, 4);
    return divide(x, testWireUncerV);
  }, [testWireUncerV, testWireUncerCiUi]);

  const refWireMasterUncerCiUi4v = useMemo(() => {
    const x = safeParseFloat(refWireUncerCiUi4v);
    const y = safeParseFloat(testWireUncerCiUi4v);
    return sum(x, y);
  }, [refWireUncerCiUi4v, testWireUncerCiUi4v]);

  const bathStabilityUncerCiUi4v = useMemo(() => {
    const x = pow(bathStabilityUncerCiUi, 4);
    return divide(x, COMMON_V_VALUE2);
  }, [bathStabilityUncerCiUi, COMMON_V_VALUE2]);

  const bathRadialUncerCiUi4v = useMemo(() => {
    const x = pow(bathRadialUncerCiUi, 4);
    return divide(x, COMMON_V_VALUE2);
  }, [bathRadialUncerCiUi, COMMON_V_VALUE2]);

  const bathAxialUncerCiUi4v = useMemo(() => {
    const x = pow(bathAxialUncerCiUi, 4);
    return divide(x, COMMON_V_VALUE2);
  }, [bathAxialUncerCiUi, COMMON_V_VALUE2]);

  const bathMasterUncerCiUi4v = useMemo(() => {
    return sum(bathStabilityUncerCiUi4v, bathRadialUncerCiUi4v, bathAxialUncerCiUi4v);
  }, [bathStabilityUncerCiUi4v, bathRadialUncerCiUi4v, bathAxialUncerCiUi4v]);

  const refIndDriftCiUi4v = useMemo(() => {
    const x = pow(refIndDriftCiUi, 4);
    return divide(x, COMMON_V_VALUE2);
  }, [refIndDriftCiUi, COMMON_V_VALUE2]);

  const testIndDriftCiUi4v = useMemo(() => {
    const x = pow(testIndDriftCiUi, 4);
    return divide(x, COMMON_V_VALUE2);
  }, [testIndDriftCiUi, COMMON_V_VALUE2]);

  const refIndMasterDriftCiUi4v = useMemo(() => {
    return sum(refIndDriftCiUi4v, testIndDriftCiUi4v);
  }, [refIndDriftCiUi4v, testIndDriftCiUi4v]);

  const refTherDriftCiUi4v = useMemo(() => {
    const x = pow(refTherDriftCiUi, 4);
    return divide(x, COMMON_V_VALUE2);
  }, [refTherDriftCiUi, COMMON_V_VALUE2]);

  const refTherMasterDriftCiUi4v = useMemo(() => {
    return sum(refTherDriftCiUi4v);
  }, [refTherDriftCiUi4v]);

  const refInstDriftCiUi4v = useMemo(() => {
    return sum(refIndMasterDriftCiUi4v, refTherMasterDriftCiUi4v);
  }, [refIndMasterDriftCiUi4v, refTherMasterDriftCiUi4v]);

  const refInstDriftV = useMemo(() => {
    const x = pow(refInstDriftCiUi, 4);
    return divide(x, refInstDriftCiUi4v);
  }, [refInstDriftCiUi, refInstDriftCiUi4v]);

  const linearErrorCiUi4v = useMemo(() => {
    //TODO: TEMP
    return 0;
  }, []);

  const refIcePointCiUi4v = useMemo(() => {
    //TODO: TEMP
    return 0;
  }, []);

  const refInstUncerCiUi4v = useMemo(() => {
    return sum(
      refIndMasterCiUi4v,
      refTherMasterUncerCiUi4v,
      refWireMasterUncerCiUi4v,
      bathMasterUncerCiUi4v,
      linearErrorCiUi4v,
      refIcePointCiUi4v
    );
  }, [
    refIndMasterCiUi4v,
    refTherMasterUncerCiUi4v,
    refWireMasterUncerCiUi4v,
    bathMasterUncerCiUi4v,
    linearErrorCiUi4v,
    refIcePointCiUi4v,
  ]);

  const refInstUncerV = useMemo(() => {
    const x = pow(refInstUncerCiUi, 4);
    return divide(x, refInstUncerCiUi4v);
  }, [refInstUncerCiUi, refInstUncerCiUi4v]);

  const refInstUncerK = useMemo(() => {
    const isBigNumberValue = isBigNumber(refInstUncerV);

    const value = isBigNumberValue ? floor(refInstUncerV.toNumber()) : floor(refInstUncerV);

    const result = findClosestDOF(value)?.value;

    const k = safeParseFloat(result);

    return { value: k, data: result };
  }, [findClosestDOF, refInstUncerV]);

  const effectiveNumberDegreesOfFreedom = useMemo(() => {
    const x = pow(combinedStandardUncertainty, 4);
    const y = sum(repObsvCiUi4v, readabilityCiUi4v, refInstUncerCiUi4v, refInstDriftCiUi4v);
    return divide(x, y);
  }, [
    combinedStandardUncertainty,
    repObsvCiUi4v,
    readabilityCiUi4v,
    refInstUncerCiUi4v,
    refInstDriftCiUi4v,
  ]);

  const converageFactor = useMemo(() => {
    const isBigNumberValue = isBigNumber(effectiveNumberDegreesOfFreedom);

    const value = isBigNumberValue
      ? floor(effectiveNumberDegreesOfFreedom.toNumber())
      : floor(effectiveNumberDegreesOfFreedom);

    const result = findClosestDOF(value)?.value;

    const cf = safeParseFloat(result);

    //* set temporary value
    form.setValue(`coverageFactors.${pointIndex}`, cf);

    return { value: cf, data: result };
  }, [findClosestDOF, effectiveNumberDegreesOfFreedom]);

  const expandedUncertainty = useMemo(() => {
    const result = multiply(combinedStandardUncertainty ?? 0, converageFactor?.value ?? 0);

    //* set temporary value
    form.setValue(`expandedUncertainties.${pointIndex}`, result);

    return result;
  }, [combinedStandardUncertainty, converageFactor]);

  const cmcLookupValues = useMemo(() => {
    const scope = job?.data?.scope;

    if (!cmc || cmc?.data?.length < 1) return [];

    if (!scope || !refType) return [];

    const type = refType?.value || refType || '';
    const cmcLookupValue = CMC_LOOKUP_MAP.find((lookup) => lookup?.type === type);
    const description = cmcLookupValue?.location?.[scope];
    const isByType = cmcLookupValue?.isByType;

    if (!cmcLookupValue || !description) return [];

    const result = cmc.data.filter((c) => {
      if (isByType) {
        return c?.type === type && c?.location === scope && c?.description === description;
      }
      return c?.location === scope && c?.description === description;
    });

    return result.map((c) => ({
      min: safeParseFloat(c?.min),
      max: safeParseFloat(c?.max),
      uncer: safeParseFloat(c?.uncer),
    }));
  }, [JSON.stringify(cmc), JSON.stringify(job), refType]);

  const resultExpandedUncertainty = useMemo(() => {
    const cmcLookupValueApproxMatch = getApproximateMatchRow(setting, cmcLookupValues, 'min')?.uncer; //prettier-ignore
    let result;

    if (expandedUncertainty >= cmcLookupValueApproxMatch) result = expandedUncertainty;
    else result = cmcLookupValueApproxMatch;

    return result;
  }, [JSON.stringify(cmcLookupValues), expandedUncertainty, setting, getApproximateMatchRow]);

  const resultEst = useMemo(() => {
    if (
      resultExpandedUncertainties?.length == 0 ||
      resultExpandedUncertainties === null ||
      resultExpandedUncertainties === undefined
    ) {
      return 0;
    }

    const scope = job?.data?.scope;
    const values = resultExpandedUncertainties.filter((v) => isNaN(v) === false && v !== null && v !== undefined); //prettier-ignore
    const x = max(values.length > 0 ? values : [0]);
    const result = ceil(x, 1);

    if (scope === 'site' && result < 0.5) return 0.5;
    else result;

    //* set temporary value
    form.setValue(`resultEsts.${pointIndex}`, result);

    return result;
  }, [JSON.stringify(resultExpandedUncertainties), JSON.stringify(job)]);

  //* set refReadingSummaries
  useEffect(() => {
    //* set this way to avoid re-render
    form.setValue(`refReadingSummaries.${pointIndex}`, refReadingSummary); // prettier-ignore
  }, [JSON.stringify(calculations?.refReadingSummary), pointIndex]);

  //* set testBefAdjReadingSummaries
  useEffect(() => {
    //* set this way to avoid re-render
    form.setValue(`testBefAdjReadingSummaries.${pointIndex}`, testBefAdjReadingSummary); // prettier-ignore
  }, [JSON.stringify(calculations?.testBefAdjReadingSummary), pointIndex]);

  //* set corrections
  useEffect(() => {
    //* set this way to avoid re-render
    form.setValue(`corrections.${pointIndex}`, correction); // prettier-ignore
  }, [JSON.stringify(calculations?.correction), pointIndex]);

  //* set resultExpandedUncertainties
  useEffect(() => {
    //* set this way to avoid re-render
    form.setValue(`resultExpandedUncertainties.${pointIndex}`, resultExpandedUncertainty);
  }, [JSON.stringify(resultExpandedUncertainty), pointIndex]);

  return (
    <Table className='text-center fs-6 m-0 align-middle' bordered responsive>
      <thead>
        <tr>
          <th className='align-middle'>
            Symbol <br />
          </th>
          <th className='align-middle' style={{ width: '100px' }}>
            No.
          </th>
          <th className='align-middle'>Sources of Uncertainty</th>
          <th className='align-middle'>Unit</th>
          <th className='align-middle'>Dist.</th>
          <th className='align-middle'>Type</th>
          <th className='align-middle'>
            <i>v</i>
          </th>
          <th className='align-middle'>
            <i>U</i>
            <sub>i</sub>
          </th>
          <th className='align-middle'>
            <i>k</i>
          </th>
          <th className='align-middle'>
            <i>u</i>
            <sub>i</sub>
          </th>
          <th className='align-middle'>
            <i>c</i>
            <sub>i</sub>
          </th>
          <th className='align-middle'>
            <i>c</i>
            <sub>i</sub>
            <i>u</i>
            <sub>i</sub>
          </th>
          <th>
            %<i>U</i>
          </th>
          <th className='align-middle'>
            (<i>c</i>
            <sub>i</sub>
            <i>u</i>
            <sub>i</sub>)<sup>^4</sup>/v
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className='fw-bold align-top' rowSpan={3}>
            U<sub>1</sub>
          </td>
          <td></td>
          <td className='text-start'>Repeated observations</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(repObsvCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(repObsvPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(repObsvCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>Standard Deviation ( Ref. )</td>
          <td>°C</td>
          <td>Normal</td>
          <td>A</td>
          <td>{COMMON_V_VALUE1}</td>
          <td>{formatToDicimalString(stdDevRef1stUi, 4)}</td>
          <td></td>
          <td>{formatToDicimalString(stdDevRef2ndUi, 4)}</td>
          <td>{formatToDicimalString(COMMON_CI_VALUE, 4)}</td>
          <td>{formatToDicimalString(stdDevRefCiUi, 4)}</td>
          <td>{formatToDicimalString(stdDevRefPercentU * 100, 2)}%</td>
          <td>{formatScientific(stdDevRefCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>b)</td>
          <td className='text-start'>Standard Deviation ( Test )</td>
          <td>°C</td>
          <td>Normal</td>
          <td>A</td>
          <td>{COMMON_V_VALUE1}</td>
          <td>{formatToDicimalString(stdDevTest1stUi, 4)}</td>
          <td></td>
          <td>{formatToDicimalString(stdDevTest2ndUi, 4)}</td>
          <td>{formatToDicimalString(COMMON_CI_VALUE, 4)}</td>
          <td>{formatToDicimalString(stdDevTestCiUi, 4)}</td>
          <td>{formatToDicimalString(stdDevTestPercentU * 100, 2)}%</td>
          <td>{formatScientific(stdDevTestCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td className='fw-bold align-top'>
            U<sub>2</sub>
          </td>
          <td></td>
          <td className='text-start'>Readability</td>
          <td>°C</td>
          <td>Rect.</td>
          <td>B</td>
          <td>{formatScientific(COMMON_V_VALUE2, 3)}</td>
          <td>{formatToDicimalString(readability1stUi, 4)}</td>
          <td>{formatToDicimalString(COMMON_K_VALUE2, 2)}</td>
          <td>{formatToDicimalString(readability2ndUi, 4)}</td>
          <td>{formatToDicimalString(COMMON_CI_VALUE, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(readabilityCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(readabilityPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(readabilityCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td className='fw-bold align-top' rowSpan={32}>
            U<sub>3</sub>
          </td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td></td>
          <td className='text-start'>Reference Instrument Uncertainty</td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatScientific(refInstUncerV, 3)}</td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(refInstUncerK.value, 2)}</td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(refInstUncerCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(refInstUncerPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(refInstUncerCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>( 1 )</td>
          <td className='text-start'>Reference Indicator / Meter Uncertainty</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>

          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(refIndMasterUncerCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(refIndMasterUncerPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(refIndMasterCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>{refInd?.label}</td>
          <td>{refTherUom?.label}</td>
          <td>{refInd?.label ? 'Normal' : ''}</td>
          <td>{refInd?.label ? 'B' : ''}</td>
          <td>{formatToDicimalString(refIndUncerV, 2)}</td>
          <td>{formatToDicimalString(refIndUncer1stUi, 4)}</td>
          <td>{formatToDicimalString(refIndUncerK, 2)}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndUncer2ndUi, 4) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndUncerCi, 4) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndUncerCiUi, 4) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndUncerPercentU * 100, 2) + '%' : ''}</td>
          <td>{refInd?.label ? formatScientific(refIndUncerCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>b)</td>
          <td className='text-start'>{testInd?.label}</td>
          <td>{testInd?.label ? '°C' : ''}</td>
          <td>{testInd?.label ? 'Normal' : ''}</td>
          <td>{testInd?.label ? 'B' : ''}</td>
          <td>{formatToDicimalString(testIndUncerV, 2)}</td>
          <td>{formatToDicimalString(testIndUncer1stUi, 4)}</td>
          <td>{formatToDicimalString(testIndUncerK, 2)}</td>
          <td>{testInd?.label ? formatToDicimalString(testIndUncer2ndUi, 4) : ''}</td>
          <td>{testInd?.label ? formatToDicimalString(testIndUncerCi, 4) : ''}</td>
          <td>{testInd?.label ? formatToDicimalString(testIndUncerCiUi, 4) : ''}</td>
          <td>
            {testInd?.label ? formatToDicimalString(testIndUncerPercentU * 100, 2) + '%' : ''}
          </td>
          <td>{testInd?.label ? formatScientific(testIndUncerCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>c)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>d)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>e)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>( 2 )</td>
          <td className='text-start'>Reference Thermometer Uncertainty</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(refTherMasterUncerCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(refTherMasterUncerPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(refTherMasterUncerCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>{refTher?.label}</td>
          <td>°C</td>
          <td>{refTher?.label ? 'Normal' : ''}</td>
          <td>{refTher?.label ? 'B' : ''}</td>
          <td>{formatToDicimalString(refTherUncerV, 2)}</td>
          <td>{formatToDicimalString(refTherUncer1stUi, 4)}</td>
          <td>{formatToDicimalString(refTherUncerK, 2)}</td>
          <td>{refTher?.label ? formatToDicimalString(refTherUncer2ndUi, 4) : ''}</td>
          <td>{refTher?.label ? formatToDicimalString(COMMON_CI_VALUE, 4) : ''}</td>
          <td>{refTher?.label ? formatToDicimalString(refTherUncerCiUi, 4) : ''}</td>
          <td>
            {refTher?.label ? formatToDicimalString(refTherUncerPercentU * 100, 2) + '%' : ''}
          </td>
          <td>{refTher?.label ? formatScientific(refTherUncerCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>b)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>c)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>d)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>e)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>( 3 )</td>
          <td className='text-start'>Extension Wires / Others</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(refWireMasterUncerCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(refWireMasterUncerPercenU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(refWireMasterUncerCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>{refWire?.label}</td>
          <td>{refWire?.label ? (!refWire?.label?.includes('ST-PT') ? '°C' : '') : ''}</td>
          <td>{refWire?.label ? (!refWire?.label?.includes('ST-PT') ? 'Normal' : '') : ''}</td>
          <td>{refWire?.label ? (!refWire?.label?.includes('ST-PT') ? 'B' : '') : ''}</td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatToDicimalString(refWireUncerV, 2)
                : ''
              : ''}
          </td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatToDicimalString(refWireUncer1stUi, 4)
                : ''
              : ''}
          </td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatToDicimalString(refWireUncerK, 2)
                : ''
              : ''}
          </td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatToDicimalString(refWireUncer2ndUi, 4)
                : ''
              : ''}
          </td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatToDicimalString(1, 4)
                : ''
              : ''}
          </td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatToDicimalString(refWireUncerCiUi, 4)
                : ''
              : ''}
          </td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatToDicimalString(refWireUncerPercenU * 100, 2) + '%'
                : ''
              : ''}
          </td>
          <td>
            {refWire?.label
              ? !refWire?.label?.includes('ST-PT')
                ? formatScientific(refWireUncerCiUi4v, 3)
                : ''
              : ''}
          </td>
        </tr>

        <tr>
          <td>b)</td>
          <td className='text-start'>{testWire?.label}</td>
          <td>{testWire?.label ? (!testWire?.label?.includes('ST-PT') ? '°C' : '') : ''}</td>
          <td>{testWire?.label ? (!testWire?.label?.includes('ST-PT') ? 'Normal' : '') : ''}</td>
          <td>{testWire?.label ? (!testWire?.label?.includes('ST-PT') ? 'B' : '') : ''}</td>
          <td>
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatToDicimalString(testWireUncerV, 2)
                : ''
              : ''}
          </td>
          <td>
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatToDicimalString(testWireUncer1stUi, 4)
                : ''
              : ''}
          </td>
          <td>
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatToDicimalString(testWireUncerK, 2)
                : ''
              : ''}
          </td>
          <td>
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatToDicimalString(testWireUncer2ndUi, 4)
                : ''
              : ''}
          </td>
          <td>
            {' '}
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatToDicimalString(COMMON_CI_VALUE, 4)
                : ''
              : ''}
          </td>
          <td>
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatToDicimalString(testWireUncerCiUi, 4)
                : ''
              : ''}
          </td>
          <td>
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatToDicimalString(testWireUncerPercenU * 100, 2) + '%'
                : ''
              : ''}
          </td>
          <td>
            {testWire?.label
              ? !testWire?.label?.includes('ST-PT')
                ? formatScientific(testWireUncerCiUi4v, 3)
                : ''
              : ''}
          </td>
        </tr>

        <tr>
          <td>c)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>d)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>e)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>( 4 )</td>
          <td className='text-start'>Bath</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(bathMasterUncerCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(bathMasterUncerPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(bathMasterUncerCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td></td>
          <td className='text-start'>{bath?.label}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>Stability</td>
          <td>{bath?.label ? '°C' : ''}</td>
          <td>{bath?.label ? 'Rect.' : ''}</td>
          <td>{bath?.label ? 'B' : ''}</td>
          <td>{bath?.label ? formatScientific(COMMON_V_VALUE2, 3) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathStabilityUncer1stUi, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(COMMON_K_VALUE2, 2) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathStabilityUncer2ndUi, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(COMMON_CI_VALUE, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathStabilityUncerCiUi, 4) : ''}</td>
          <td>
            {bath?.label ? formatToDicimalString(bathStabilityUncerPercentU * 100, 2) + '%' : ''}
          </td>
          <td>{bath?.label ? formatScientific(bathStabilityUncerCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>b)</td>
          <td className='text-start'>Radial Uniformity</td>
          <td>{bath?.label ? '°C' : ''}</td>
          <td>{bath?.label ? 'Rect.' : ''}</td>
          <td>{bath?.label ? 'B' : ''}</td>
          <td>{bath?.label ? formatScientific(COMMON_V_VALUE2, 3) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathRadialUncer1stUi, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(COMMON_K_VALUE2, 2) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathRadialUncer2ndUi, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(COMMON_CI_VALUE, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathRadialUncerCiUi, 4) : ''}</td>
          <td>
            {bath?.label ? formatToDicimalString(bathRadialUncerPercentU * 100, 2) + '%' : ''}
          </td>
          <td>{bath?.label ? formatScientific(bathRadialUncerCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>c)</td>
          <td className='text-start'>Axial Uniformity</td>
          <td>{bath?.label ? '°C' : ''}</td>
          <td>{bath?.label ? 'Rect.' : ''}</td>
          <td>{bath?.label ? 'B' : ''}</td>
          <td>{bath?.label ? formatScientific(COMMON_V_VALUE2, 3) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathAxialUncer1stUi, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(COMMON_K_VALUE2, 2) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathAxialUncer2ndUi, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(COMMON_CI_VALUE, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathAxialUncerCiUi, 4) : ''}</td>
          <td>{bath?.label ? formatToDicimalString(bathAxialUncerPercentU * 100, 2) + '%' : ''}</td>
          <td>{bath?.label ? formatScientific(bathAxialUncerCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>( 5 )</td>
          <td className='text-start'>Linearity Error</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>( 6 )</td>
          <td className='text-start'>Reference Ice Point</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>Stability</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>b)</td>
          <td className='text-start'>Radial Uniformity</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>c)</td>
          <td className='text-start'>Axial Uniformity</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td className='fw-bold align-top' rowSpan={14}>
            U<sub>4</sub>
          </td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td></td>
          <td className='text-start'>Reference Instrument Drift</td>
          <td className='fw-bold'></td>
          <td className='fw-bold'></td>
          <td className='fw-bold'></td>
          <td className='fw-bold'>{formatScientific(refInstDriftV, 3)}</td>
          <td className='fw-bold'></td>
          <td className='fw-bold'>{formatToDicimalString(COMMON_K_VALUE2, 2)}</td>
          <td className='fw-bold'></td>
          <td className='fw-bold'></td>
          <td className='fw-bold'>{formatToDicimalString(refInstDriftCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(refInstDriftPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(refInstDriftCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>( 1 )</td>
          <td className='text-start'>Reference Indicator / Meter Drift</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(refIndMasterDriftCiUi, 4)}</td>
          <td></td>
          <td className='fw-bold'>{formatScientific(refIndMasterDriftCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>{refInd?.label}</td>
          <td>{refTherUom?.label}</td>
          <td>{refInd?.label ? 'Rect.' : ''}</td>
          <td>{refInd?.label ? 'B' : ''}</td>
          <td>{refInd?.label ? formatScientific(COMMON_V_VALUE2, 3) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndDrift1stUi, 4) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(COMMON_K_VALUE2, 2) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndDrift2ndUi, 4) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndUncerCi, 4) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndDriftCiUi, 4) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(refIndDriftPercentU * 100, 2) + '%' : ''}</td>
          <td>{refInd?.label ? formatScientific(refIndDriftCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>b)</td>
          <td className='text-start'>{testInd?.label}</td>
          <td>{testInd?.label ? '°C' : ''}</td>
          <td>{testInd?.label ? 'Rect.' : ''}</td>
          <td>{testInd?.label ? 'B' : ''}</td>
          <td>{testInd?.label ? formatScientific(COMMON_V_VALUE2, 3) : ''}</td>
          <td>{refInd?.label ? formatToDicimalString(testIndDrift1stUi, 4) : ''}</td>
          <td>{testInd?.label ? formatToDicimalString(COMMON_K_VALUE2, 2) : ''}</td>
          <td>{testInd?.label ? formatToDicimalString(testIndDrift2ndUi, 4) : ''}</td>
          <td>{testInd?.label ? formatToDicimalString(testIndUncerCi, 4) : ''}</td>
          <td>{testInd?.label ? formatToDicimalString(testIndDriftCiUi, 4) : ''}</td>
          <td>
            {testInd?.label ? formatToDicimalString(testIndDriftPercentU * 100, 2) + '%' : ''}
          </td>
          <td>{testInd?.label ? formatScientific(testIndDriftCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>c)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>d)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>e)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>( 3 )</td>
          <td className='text-start'>Reference Thermometer Drift</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td className='fw-bold'>{formatToDicimalString(refTherMasterDriftCiUi, 4)}</td>
          <td className='fw-bold'>{formatToDicimalString(refTherMasterDriftPercentU * 100, 2)}%</td>
          <td className='fw-bold'>{formatScientific(refTherMasterDriftCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td>a)</td>
          <td className='text-start'>{refTher?.label}</td>
          <td>°C</td>
          <td>{refTher?.label ? 'Rect.' : ''}</td>
          <td>{refTher?.label ? 'B' : ''}</td>
          <td>{refTher?.label ? formatScientific(COMMON_V_VALUE2, 3) : ''}</td>
          <td>{refTher?.label ? formatToDicimalString(refTherDrift1stUi, 4) : ''}</td>
          <td>{refTher?.label ? formatToDicimalString(COMMON_K_VALUE2, 2) : ''}</td>
          <td>{refTher?.label ? formatToDicimalString(refTherDrift2ndUi, 4) : ''}</td>
          <td>{refTher?.label ? formatToDicimalString(COMMON_CI_VALUE, 4) : ''}</td>
          <td>{refTher?.label ? formatToDicimalString(refTherDriftCiUi, 4) : ''}</td>
          <td>
            {refTher?.label ? formatToDicimalString(refTherDriftPercentU * 100, 2) + '%' : ''}
          </td>
          <td>{refTher?.label ? formatScientific(refTherDriftCiUi4v, 3) : ''}</td>
        </tr>

        <tr>
          <td>b)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>c)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>d)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td>e)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <th>
            <i>
              u<sub>c</sub>
            </i>
          </th>
          <td className='text-start fw-bold' colSpan={9}>
            Combined Uncertainty (
            <i>
              U<sub>1</sub>
            </i>
            ,{' '}
            <i>
              U<sub>2</sub>
            </i>
            ,{' '}
            <i>
              U<sub>3</sub>
            </i>
            ,{' '}
            <i>
              U<sub>4</sub>
            </i>{' '}
            )
          </td>
          <td className='fw-bold fs-5' colSpan={4}>
            <span>{formatToDicimalString(combinedStandardUncertainty, 4)} °C</span>
          </td>
        </tr>

        <tr>
          <th>
            V<sub>eff</sub>
          </th>
          <td className='text-start' colSpan={9}>
            Effective Number of Degrees of Freedom (
            <i>
              V<sub>1</sub>
            </i>
            ,{' '}
            <i>
              V<sub>2</sub>
            </i>
            ,{' '}
            <i>
              V<sub>3</sub>
            </i>
            ,{' '}
            <i>
              V<sub>4</sub>
            </i>{' '}
            )
          </td>
          <td className='fw-bold fs-5' colSpan={4}>
            {formatScientific(effectiveNumberDegreesOfFreedom, 3)}
          </td>
        </tr>

        <tr>
          <th>
            <i>K</i>
          </th>
          <td className='text-start' colSpan={9}>
            Coverage Factor for 95% Confidence Interval
          </td>
          <td colSpan={4}>{formatToDicimalString(converageFactor.value, 2)}</td>
        </tr>

        <tr>
          <th>
            <i>U</i>
          </th>
          <td className='text-start fw-bold' colSpan={9}>
            Expanded Uncertainty at 95% Confidence Level
          </td>
          <td className='fw-bold fs-5' colSpan={4}>
            {formatToDicimalString(expandedUncertainty, 4)} °C
          </td>
        </tr>

        <tr>
          <td className='text-end fw-bold' colSpan={10}>
            Estimated To =
          </td>
          <td colSpan={4} className='fw-bold'>
            <span className='me-2'>±</span>
            {resultEst} °C
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

export default THRDataCalculation;

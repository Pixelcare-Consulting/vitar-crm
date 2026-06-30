import { TooltipContent } from '@/components/common/ToolTipContent';
import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import {
  TRACEABILITY_ACCREDITATION_BODY,
  TRACEABILITY_CALIBRATION_LAB,
  TRACEABILITY_COUNTRY,
  TRACEABILITY_TYPE,
} from '@/schema/calibrations/common-constant';
import { ACCURACY_CLASS, UNIT_USED_FOR_COC } from '@/schema/calibrations/mass/standard-weight';
import { calibrationMeasurementSchema } from '@/schema/calibrations/mass/weight-balance';
import {
  BY_PASS_AUTO_CORR,
  IMMER,
  MAXIMUM_DECIMAL_COUNT,
  MAXIMUM_RANGE_OF_CALIBRATION,
  REF_IND_UOM,
  REF_THER_UOM,
  REF_TYPE,
  REFERENCE_METHOD,
} from '@/schema/calibrations/temperature-humidity/thermocouple';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { safeParseFloat, titleCase } from '@/utils/common';
import { format, isValid } from 'date-fns';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { add, divide, exp, mean, multiply, pow, subtract, sum } from 'mathjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  OverlayTrigger,
  Row,
  Tooltip,
} from 'react-bootstrap';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

const THRCalibrationMeasurementsForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const auth = useAuth();

  const isDisabledField = useMemo(
    () => !auth.role || auth.role === 'technician',
    [JSON.stringify(auth)]
  );

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const refMethod = useWatch({ name: 'refMethod' });
  const rangeOfCalibration = useWatch({ name: 'rangeOfCalibration' });
  const resolution = useWatch({ name: 'resolution' });

  const [refTherOptions, setRefTherOptions] = useState({data: [], isLoading: true, isError: false }); //prettier-ignore
  const [refIndOptions, setRefIndOptions] = useState({data: [], isLoading: true, isError: false }); //prettier-ignore
  const [refWireOptions, setRefWireOptions] = useState({data: [], isLoading: true, isError: false }); //prettier-ignore
  const [bathOptions, setBathOptions] = useState({data: [], isLoading: true, isError: false }); //prettier-ignore

  const [refMethodOptions] = useState(REFERENCE_METHOD.map((refMethod) => ({ value: refMethod.value, label: refMethod.value, label2: refMethod.label }))); //prettier-ignore
  const [isByPassAutoCorrOptions] = useState(BY_PASS_AUTO_CORR.map((isByPassAutoCorr) => ({ value: isByPassAutoCorr, label: titleCase(isByPassAutoCorr) }))); //prettier-ignore
  const [refTypeOptions] = useState(REF_TYPE.map((refType) => ({ value: refType, label: refType }))); //prettier-ignore
  const [refTherUomOptions] = useState(REF_THER_UOM.map((refTherUom) => ({ value: refTherUom, label: refTherUom }))); //prettier-ignore
  const [refIndUomOptions] = useState(REF_IND_UOM.map((refIndUom) => ({ value: refIndUom, label: refIndUom }))); //prettier-ignore
  const [immerOptions] = useState(IMMER.map((immer) => ({ value: immer, label: immer }))); //prettier-ignore
  const [refDecimalOptions] = useState(Array.from({length: MAXIMUM_DECIMAL_COUNT}).map((_, i) => ({ value: i, label: i }))); //prettier-ignore

  const [traceabilityTypeOptions] = useState(TRACEABILITY_TYPE.map((traceabilityType) => ({ value: traceabilityType, label: traceabilityType }))); //prettier-ignore
  const [traceabilityCountryOptions] = useState(TRACEABILITY_COUNTRY.map((country) => ({ value: country, label: country }))); //prettier-ignore
  const [traceabilityCalibrationLabOptions] = useState(TRACEABILITY_CALIBRATION_LAB.map((lab) => ({ label: `${lab.name}${ lab.accreditationNo && lab.accreditationNo !== 'N/A' ? ` - ${lab.accreditationNo}` : ''}`,...lab }))); //prettier-ignore
  const [traceabilityAccreditationBodyOptions] = useState(TRACEABILITY_ACCREDITATION_BODY.map(body => ({ value: body, label: body }))); //prettier-ignore

  const handleTraceabilityTypeChange = (option, field) => {
    field.onChange(option);
    form.clearErrors('traceabilityCountry');
    form.clearErrors('traceabilityCalibrationLab');
    form.clearErrors('traceabilityAccreditationBody');

    if (option.value !== '3') {
      //* clear the fields
      form.setValue('traceabilityCountry', '');
      form.setValue('traceabilityCalibrationLab', []);
      form.setValue('traceabilityAccreditationBody', '');

      //* delay to set null value
      setTimeout(() => {
        form.setValue('traceabilityCountry', null);
        form.setValue('traceabilityCalibrationLab', null);
        form.setValue('traceabilityAccreditationBody', null);
      }, 100);
    } else {
      form.setValue('traceabilityCountry', '');
      form.setValue('traceabilityCalibrationLab', []);
      form.setValue('traceabilityAccreditationBody', '');
    }
  };

  const formatTherOptionLabel = (data) => {
    const therType = data?.type || '';

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>

        <span className='d-flex column-gap-2'>
          {therType && <Badge bg='primary'>{therType}</Badge>}
        </span>
      </div>
    );
  };

  const formatIndOptionLabel = (data) => {
    const indType = data?.type || '';

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>

        <span className='d-flex column-gap-2'>{indType && <Badge bg='info'>{indType}</Badge>}</span>
      </div>
    );
  };

  const formatBathOptionLabel = (data) => {
    const no = data?.no || '';

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>

        <span className='d-flex column-gap-2'>{no && <Badge bg='primary'>{no}</Badge>}</span>
      </div>
    );
  };

  const handleAutoPopulateCalDataOnChange = (option, field, key) => {
    field.onChange(option);

    Array.from({ length: rangeOfCalibration }, (_, pointIndex) => {
      form.setValue(`data.${pointIndex}.${key}`, option);
    });
  };

  //* query refTher
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000008', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const therDocs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setRefTherOptions({
            data: therDocs.map((thr) => ({
              value: thr.id,
              label: thr.idCode || '',
              type: thr?.type || '',
              kFactor: thr?.kFactor,
            })),
            isLoading: false,
            isError: false,
          });

          //* set temporary value for refTher
          form.setValue('therData', therDocs);

          return;
        }

        setRefTherOptions({ data: [], isLoading: false, isError: false });

        //* set temporary value for refTher
        form.setValue('therData', []);
      },
      (err) => {
        console.error(err.message);
        setRefTherOptions({ data: [], isLoading: false, isError: true });

        //* set temporary value for refTher
        form.setValue('therData', []);
      }
    );

    return () => unsubscribe();
  }, []);

  //* query refInd
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000016', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const indDocs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setRefIndOptions({
            data: indDocs.map((ind) => ({
              value: ind.id,
              label: ind.code || '',
              type: ind?.type ? (ind?.type === '-' ? '' : ind?.type) : '',
              kFactor: ind?.kFactor,
            })),
            isLoading: false,
            isError: false,
          });

          //* set temporary value for refInd
          form.setValue('meter', indDocs);

          return;
        }

        setRefIndOptions({ data: [], isLoading: false, isError: false });

        //* set temporary value for refInd
        form.setValue('meter', []);
      },
      (err) => {
        console.error(err.message);
        setRefIndOptions({ data: [], isLoading: false, isError: true });

        //* set temporary value for refInd
        form.setValue('meter', []);
      }
    );

    return () => unsubscribe();
  }, []);

  //* query refWire (extensions)
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000011', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const extDocs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setRefWireOptions({
            data: extDocs.map((ext) => ({
              value: ext.id,
              label: ext.idCode || '',
              kFactor: ext?.kFactor,
              uncerDCelsius: ext?.uncerDCelsius,
              uncerPercentRHumidity: ext?.uncerPercentRHumidity,
            })),
            isLoading: false,
            isError: false,
          });

          //* set temporary value for refWire
          form.setValue('extensionsData', extDocs);

          return;
        }

        setRefWireOptions({ data: [], isLoading: false, isError: false });

        //* set temporary value for refWire
        form.setValue('extensionsData', []);
      },
      (err) => {
        console.error(err.message);
        setRefWireOptions({ data: [], isLoading: false, isError: true });

        //* set temporary value for refWire
        form.setValue('extensionsData', []);
      }
    );

    return () => unsubscribe();
  }, []);

  //* query bath
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000012', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const bathDocs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setBathOptions({
            data: bathDocs.map((bath) => ({
              value: bath.id,
              label: bath.idCode || '',
              no: bath?.no || '',
              stabilityDCelsius: bath?.stabilityDCelsius || '',
              radialDCelsius: bath?.radialDCelsius || '',
              axialDCelsius: bath?.axialDCelsius || '',
              minDCelsius: bath?.minDCelsius || '',
              maxDCelsius: bath?.maxDCelsius || '',
            })),
            isLoading: false,
            isError: false,
          });

          //* set temporary value for bath
          form.setValue('bathData', bathDocs);
          return;
        }

        setBathOptions({ data: [], isLoading: false, isError: false });

        //* set temporary value for bath
        form.setValue('bathData', []);
      },
      (err) => {
        console.error(err.message);
        setBathOptions({ data: [], isLoading: false, isError: true });

        //* set temporary value for bath
        form.setValue('bathData', []);
      }
    );

    return () => unsubscribe();
  }, []);

  //* set traceability type, if data exist
  useEffect(() => {
    if (data && traceabilityTypeOptions.length > 0) {
      const selectedTraceabilityType = traceabilityTypeOptions.find(
        (option) => option.value === data.traceabilityType
      );

      form.setValue('traceabilityType', selectedTraceabilityType);

      if (selectedTraceabilityType.value === '3') {
        if (traceabilityCountryOptions.length > 0) {
          const selectedTraceabilityCountry = traceabilityCountryOptions.find(
            (option) => option.value === data.traceabilityCountry
          );
          form.setValue('traceabilityCountry', selectedTraceabilityCountry);
        }

        if (traceabilityCalibrationLabOptions.length > 0) {
          const selectedTraceabilityCalibrationLabCodes = data?.traceabilityCalibrationLab || [];
          const selectedTraceabilityCalibrationLab = traceabilityCalibrationLabOptions.filter(
            (option) => {
              return selectedTraceabilityCalibrationLabCodes.includes(option.value);
            }
          );

          form.setValue('traceabilityCalibrationLab', selectedTraceabilityCalibrationLab);
        }

        if (traceabilityAccreditationBodyOptions.length > 0) {
          const selectedTraceabilityAccreditationBody = traceabilityAccreditationBodyOptions.find(
            (option) => option.value === data.traceabilityAccreditationBody
          );
          form.setValue('traceabilityAccreditationBody', selectedTraceabilityAccreditationBody);
        }
      }
    }
  }, [
    data,
    traceabilityTypeOptions,
    traceabilityCountryOptions,
    traceabilityCalibrationLabOptions,
    traceabilityAccreditationBodyOptions,
  ]);

  //* set decimal count
  useEffect(() => {
    if (data && refDecimalOptions.length > 0) {
      const defaultRefDecimal = refDecimalOptions.find((option) => option.value === 1); //prettier-ignore
      const selectedRefDecimal = refDecimalOptions.find((option) => option.value === data.refDecimal); //prettier-ignore
      form.setValue('refDecimal', selectedRefDecimal ?? defaultRefDecimal); //prettier-ignore
      return;
    }

    if (!data && refDecimalOptions.length > 0) {
      const defaultRefDecimal = refDecimalOptions.find((option) => option.value === 1);
      form.setValue('refDecimal', defaultRefDecimal);
    }
  }, [JSON.stringify(data), JSON.stringify(refDecimalOptions)]);

  //* set ref. method, if data exist
  useEffect(() => {
    if (data && refMethodOptions.length > 0) {
      const selectedRefMethod = refMethodOptions.find((option) => option.value === data.refMethod);
      form.setValue('refMethod', selectedRefMethod);
    }
  }, [JSON.stringify(data), JSON.stringify(refMethodOptions)]);

  //* set is by pass auto corr, if data exist
  useEffect(() => {
    if (data && isByPassAutoCorrOptions.length > 0) {
      const selectedIsByPassAutoCorr = isByPassAutoCorrOptions.find( (option) => option.value === data.isByPassAutoCorr); //prettier-ignore
      form.setValue('isByPassAutoCorr', selectedIsByPassAutoCorr);
    }
  }, [JSON.stringify(data), JSON.stringify(isByPassAutoCorrOptions)]);

  //* set ref. type, if data exist
  useEffect(() => {
    if (data && refTypeOptions.length > 0) {
      const selectedRefType = refTypeOptions.find((option) => option.value === data.refType);
      form.setValue('refType', selectedRefType);
    }
  }, [JSON.stringify(data), JSON.stringify(refTypeOptions)]);

  //* set ref. ther, if data exist
  useEffect(() => {
    if (data && refTherOptions.data.length > 0) {
      const selectedRefTher = refTherOptions.data.find((option) => option.value === data.refTher);
      form.setValue('refTher', selectedRefTher);
    }
  }, [JSON.stringify(data), JSON.stringify(refTherOptions)]);

  //* set ther uom, if data exist
  useEffect(() => {
    if (data && refTherUomOptions.length > 0) {
      const selectedRefTherUom = refTherUomOptions.find( (option) => option.value === data.refTherUom); //prettier-ignore
      form.setValue('refTherUom', selectedRefTherUom);
    }
  }, [JSON.stringify(data), JSON.stringify(refTherUomOptions)]);

  //* set ref. ind, if data exist
  //* set test ind, if data exist
  useEffect(() => {
    if (data && refIndOptions.data.length > 0) {
      const selectedRefInd = refIndOptions.data.find((option) => option.value === data.refInd);
      const selectedTestInd = refIndOptions.data.find((option) => option.value === data.testInd);
      form.setValue('refInd', selectedRefInd);
      form.setValue('testInd', selectedTestInd);
    }
  }, [JSON.stringify(data), JSON.stringify(refIndOptions)]);

  //* set ind uom, if data exist
  useEffect(() => {
    if (data && refIndUomOptions.length > 0) {
      const selectedRefIndUom = refIndUomOptions.find((option) => option.value === data.refIndUom);
      form.setValue('refIndUom', selectedRefIndUom);
    }
  }, [JSON.stringify(data), JSON.stringify(refIndUomOptions)]);

  //* set ref. wire, if data exist
  //* set test wire, if data exist
  useEffect(() => {
    if (data && refWireOptions.data.length > 0) {
      const selectedRefWire = refWireOptions.data.find((option) => option.value === data.refWire);
      const selectedTestWire = refWireOptions.data.find((option) => option.value === data.testWire);
      form.setValue('refWire', selectedRefWire);
      form.setValue('testWire', selectedTestWire);
    }
  }, [JSON.stringify(data), JSON.stringify(refWireOptions)]);

  //* set bath, if data exist
  useEffect(() => {
    if (data && bathOptions.data.length > 0) {
      const selectedBath = bathOptions.data.find((option) => option.value === data.bath);
      form.setValue('bath', selectedBath);
    }
  }, [JSON.stringify(data), JSON.stringify(bathOptions)]);

  //* set immer, if data exist
  useEffect(() => {
    if (data && immerOptions.length > 0) {
      const selectedImmer = immerOptions.find((option) => option.value === data.immer);
      form.setValue('immer', selectedImmer);
    }
  }, [JSON.stringify(data), JSON.stringify(immerOptions)]);

  //* auto populate resolution in calibration data if measurement resolution is provided/changed
  useEffect(() => {
    if (resolution) {
      Array.from({ length: rangeOfCalibration }, (_, pointIndex) => {
        form.setValue(`data.${pointIndex}.resolution`, resolution);
      });
    }
  }, [resolution]);

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <h4 className='mb-0'>Location</h4>
        <p className='text-muted fs-6'>Location of the calibration.</p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={12}>
            <Form.Label>Calibration Location</Form.Label>

            <Controller
              name='calibrationLocation'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} type='text' value={field.value} />
                </>
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Criteria</h4>
        <p className='text-muted fs-6'>
          Measurements criteria to be used as a basis for the calibration.
        </p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Method' id='refMethod' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Ref. Method Search' info={['Search by ref. method']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refMethod'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refMethod'
                    instanceId='refMethod'
                    onChange={(option) => field.onChange(option)}
                    options={refMethodOptions}
                    placeholder='Search by ref. method'
                    noOptionsMessage={() => 'No ref. method found'}
                  />

                  {formErrors && formErrors?.refMethod?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refMethod?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label>Ref. To</Form.Label>
            <Form.Control type='text' value={refMethod?.label2 || ''} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Range of Calibration' id='rangeOfCalibration' />

            <Controller
              name='rangeOfCalibration'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/[^0-9]/.test(value)) return;
                      if (safeParseFloat(value) > MAXIMUM_RANGE_OF_CALIBRATION) return;
                      field.onChange(value);
                    }}
                    id='rangeOfCalibration'
                    placeholder='Enter range of Calibration'
                    type='number'
                  />

                  {formErrors && formErrors?.rangeOfCalibration?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.rangeOfCalibration?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Decimal' id='refDecimal' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Ref. Decimal Search' info={['Search by ref. decimal']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refDecimal'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refDecimal'
                    instanceId='refDecimal'
                    onChange={(option) => field.onChange(option)}
                    options={refDecimalOptions}
                    placeholder='Search by ref. decimal'
                    noOptionsMessage={() => 'No ref. decimal found'}
                  />

                  {formErrors && formErrors?.refDecimal?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refDecimal?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <hr className='my-1' />

          <Form.Group as={Col} md={3}>
            <Form.Label id='minTemperature'>Ambient Temperature (Min)</Form.Label>

            <Controller
              name='minTemperature'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='minTemperature'
                      type='number'
                      placeholder='Enter minimum temperature'
                    />

                    <InputGroup.Text>°C</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors?.minTemperature?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.minTemperature?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label id='maxTemperature'>Ambient Temperature (Max)</Form.Label>

            <Controller
              name='maxTemperature'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='maxTemperature'
                      type='number'
                      placeholder='Enter maximum temperature'
                    />

                    <InputGroup.Text>°C</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors?.maxTemperature?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.maxTemperature?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label id='minRHumidity'>Relative Humidity (Min)</Form.Label>

            <Controller
              name='minRHumidity'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='minRHumidity'
                      type='number'
                      placeholder='Enter minimum r. humidity'
                    />

                    <InputGroup.Text>%rh</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors?.minRHumidity?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.minRHumidity?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label id='maxRHumidity'>Relative Humidity (Max)</Form.Label>

            <Controller
              name='maxRHumidity'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='maxRHumidity'
                      type='number'
                      placeholder='Enter maximum r. humidity'
                    />

                    <InputGroup.Text>%rh</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors?.maxRHumidity?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.maxRHumidity?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label htmlFor='isByPassAutoCorr'>By Pass "Auto Corr</Form.Label>

            <Controller
              name='isByPassAutoCorr'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='isByPassAutoCorr'
                    instanceId='isByPassAutoCorr'
                    onChange={(option) => field.onChange(option)}
                    options={isByPassAutoCorrOptions}
                    placeholder='Select by Pass "Auto Corr"'
                    noOptionsMessage={() => 'No options found'}
                  />

                  {formErrors && formErrors?.isByPassAutoCorr?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.isByPassAutoCorr?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <hr className='my-1' />

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Type' id='refType' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Ref. Type Search' info={['Search by ref. type']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refType'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refType'
                    instanceId='refType'
                    onChange={(option) => field.onChange(option)}
                    options={refTypeOptions}
                    placeholder='Search by ref. type'
                    noOptionsMessage={() => 'No ref. type found'}
                  />

                  {formErrors && formErrors?.refType?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refType?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Resolution' id='resolution' />

            <Controller
              name='resolution'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='resolution'
                    placeholder='Enter resolution'
                    type='number'
                    step='any'
                  />

                  {formErrors && formErrors?.resolution?.message && (
                    <Form.Text className='text-danger'>{formErrors?.resolution?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Ther.' id='refTher' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Ref. Ther. Search'
                    info={['Search by ref. ther. id code']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refTher'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refTher'
                    instanceId='refTher'
                    onChange={(option) =>
                      handleAutoPopulateCalDataOnChange(option, field, 'refTher')
                    }
                    formatOptionLabel={formatTherOptionLabel}
                    options={refTherOptions.data}
                    placeholder={
                      refTherOptions.isLoading
                        ? 'Loading ref. ther....'
                        : 'Search by ref. ther. id code'
                    }
                    isDisabled={refTherOptions.isLoading}
                    noOptionsMessage={() =>
                      refTherOptions.isLoading ? 'Loading...' : 'No ref. ther. found'
                    }
                  />

                  {formErrors && formErrors?.refTher?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refTher?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Ther UOM' id='refTherUom' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Ref. Ther UOM Search'
                    info={['Search by ref. ther. UOM']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refTherUom'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refTherUom'
                    instanceId='refTherUom'
                    onChange={(option) =>
                      handleAutoPopulateCalDataOnChange(option, field, 'refTherUom')
                    }
                    formatOptionLabel={formatTherOptionLabel}
                    options={refTherUomOptions}
                    placeholder='Search by ref. ther. UOM'
                    noOptionsMessage={() => 'No ref. ther UOM. found'}
                  />

                  {formErrors && formErrors?.refTherUom?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refTherUom?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Ind.' id='refInd' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Ref. Ind. Search' info={['Search by ref. ind. id code']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refInd'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refInd'
                    instanceId='refInd'
                    onChange={(option) =>
                      handleAutoPopulateCalDataOnChange(option, field, 'refInd')
                    }
                    formatOptionLabel={formatIndOptionLabel}
                    options={refIndOptions.data}
                    placeholder={
                      refIndOptions.isLoading
                        ? 'Loading ref. ind....'
                        : 'Search by ref. ind. id code'
                    }
                    isDisabled={refIndOptions.isLoading}
                    noOptionsMessage={() =>
                      refIndOptions.isLoading ? 'Loading...' : 'No ref. ind. found'
                    }
                  />

                  {formErrors && formErrors?.refInd?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refInd?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Ind UOM' id='refIndUom' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Ref. Ind UOM Search' info={['Search by ref. ind. UOM']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refIndUom'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refIndUom'
                    instanceId='refIndUom'
                    onChange={(option) =>
                      handleAutoPopulateCalDataOnChange(option, field, 'refIndUom')
                    }
                    formatOptionLabel={formatIndOptionLabel}
                    options={refIndUomOptions}
                    placeholder='Search by ref. ind. UOM'
                    noOptionsMessage={() => 'No ref. ind UOM. found'}
                  />

                  {formErrors && formErrors?.refIndUom?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refIndUom?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Ref. Wire' id='refWire' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Ref. Wire Search' info={['Search by ref. wire id code']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='refWire'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='refWire'
                    instanceId='refWire'
                    onChange={(option) =>
                      handleAutoPopulateCalDataOnChange(option, field, 'refWire')
                    }
                    options={refWireOptions.data}
                    placeholder={
                      refWireOptions.isLoading
                        ? 'Loading ref. wire....'
                        : 'Search by ref. wire id code'
                    }
                    isDisabled={refWireOptions.isLoading}
                    noOptionsMessage={() =>
                      refWireOptions.isLoading ? 'Loading...' : 'No ref. wire found'
                    }
                  />

                  {formErrors && formErrors?.refWire?.message && (
                    <Form.Text className='text-danger'>{formErrors?.refWire?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Test Ind.' id='testInd' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Test Ind. Search' info={['Search by test ind. id code']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='testInd'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='testInd'
                    instanceId='testInd'
                    onChange={(option) =>
                      handleAutoPopulateCalDataOnChange(option, field, 'testInd')
                    }
                    formatOptionLabel={formatIndOptionLabel}
                    options={refIndOptions.data}
                    placeholder={
                      refIndOptions.isLoading
                        ? 'Loading test ind....'
                        : 'Search by test ind. id code'
                    }
                    isDisabled={refIndOptions.isLoading}
                    noOptionsMessage={() =>
                      refIndOptions.isLoading ? 'Loading...' : 'No test ind. found'
                    }
                  />

                  {formErrors && formErrors?.testInd?.message && (
                    <Form.Text className='text-danger'>{formErrors?.testInd?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Test Wire' id='testWire' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Test Wire Search' info={['Search by test wire id code']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='testWire'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='testWire'
                    instanceId='testWire'
                    onChange={(option) =>
                      handleAutoPopulateCalDataOnChange(option, field, 'testWire')
                    }
                    options={refWireOptions.data}
                    placeholder={
                      refWireOptions.isLoading
                        ? 'Loading test wire....'
                        : 'Search by test wire id code'
                    }
                    isDisabled={refWireOptions.isLoading}
                    noOptionsMessage={() =>
                      refWireOptions.isLoading ? 'Loading...' : 'No test wire found'
                    }
                  />

                  {formErrors && formErrors?.testWire?.message && (
                    <Form.Text className='text-danger'>{formErrors?.testWire?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Bath' id='bath' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Bath Search' info={['Search by bath id code']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='bath'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='bath'
                    instanceId='bath'
                    onChange={(option) => handleAutoPopulateCalDataOnChange(option, field, 'bath')}
                    formatOptionLabel={formatBathOptionLabel}
                    options={bathOptions.data}
                    placeholder={
                      bathOptions.isLoading ? 'Loading bath....' : 'Search by bath id code'
                    }
                    isDisabled={bathOptions.isLoading}
                    noOptionsMessage={() =>
                      bathOptions.isLoading ? 'Loading...' : 'No bath found'
                    }
                  />

                  {formErrors && formErrors?.bath?.message && (
                    <Form.Text className='text-danger'>{formErrors?.bath?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Immer' id='immer' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Immer Search' info={['Search by immer']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='immer'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='immer'
                    instanceId='immer'
                    onChange={(option) => handleAutoPopulateCalDataOnChange(option, field, 'immer')}
                    options={immerOptions}
                    placeholder='Search by immer'
                    noOptionsMessage={() => 'No immer found'}
                  />

                  {formErrors && formErrors?.immer?.message && (
                    <Form.Text className='text-danger'>{formErrors?.immer?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Traceability</h4>
        <p className='text-muted fs-6'>Details of the calibrationn traceability</p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Type' id='traceabilityType' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Type Search'
                    info={['Search by traceability type']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityType'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='traceabilityType'
                    instanceId='traceabilityType'
                    onChange={(option) => handleTraceabilityTypeChange(option, field)}
                    options={traceabilityTypeOptions}
                    placeholder='Search by traceability type'
                    noOptionsMessage={() => 'No traceability type found'}
                  />

                  {formErrors && formErrors?.traceabilityType?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.traceabilityType?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' id='traceabilityCountry'>
              Country
            </Form.Label>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Country Search'
                    info={['Search by traceability country']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityCountry'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    isDisabled={form.watch('traceabilityType.value') !== '3'}
                    inputId='traceabilityCountry'
                    instanceId='traceabilityCountry'
                    onChange={(option) => field.onChange(option)}
                    options={traceabilityCountryOptions}
                    placeholder='Search by traceability country'
                    noOptionsMessage={() => 'No traceability country found'}
                  />

                  {formErrors && formErrors?.traceabilityCountry?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.traceabilityCountry?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' id='traceabilityCalibrationLab'>
              Calibration Lab
            </Form.Label>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Calibration Lab Search'
                    info={['Search by traceability calibration lab']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityCalibrationLab'
              control={form.control}
              render={({ field }) => {
                return (
                  <>
                    <Select
                      {...field}
                      isDisabled={form.watch('traceabilityType.value') !== '3'}
                      id='traceabilityCalibrationLab'
                      inputId='traceabilityCalibrationLab'
                      instanceId='traceabilityCalibrationLab'
                      isMulti
                      onChange={(option) => field.onChange(option)}
                      options={traceabilityCalibrationLabOptions}
                      placeholder='Search by traceability calibration lab'
                      noOptionsMessage={() => 'No traceability calibration lab found'}
                    />

                    {formErrors && formErrors?.traceabilityCalibrationLab?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors?.traceabilityCalibrationLab?.message}
                      </Form.Text>
                    )}
                  </>
                );
              }}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' htmlFor='serialNumber'>
              Signatory
            </Form.Label>
            <Form.Control
              id='serialNumber'
              type='text'
              value={form.watch('traceabilityCalibrationLab.0.signatory') || ''}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' id='traceabilityAccreditationBody'>
              Accreditation Body
            </Form.Label>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Accreditation Body Search'
                    info={['Search by traceability accreditation body']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityAccreditationBody'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    isDisabled={form.watch('traceabilityType.value') !== '3'}
                    inputId='traceabilityAccreditationBody'
                    instanceId='traceabilityAccreditationBody'
                    onChange={(option) => field.onChange(option)}
                    options={traceabilityAccreditationBodyOptions}
                    placeholder='Search by traceability accreditation body'
                    noOptionsMessage={() => 'No traceability accreditation body found'}
                  />

                  {formErrors && formErrors?.traceabilityAccreditationBody?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors?.traceabilityAccreditationBody?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button disabled={isLoading} type='button' onClick={handleNext}>
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default THRCalibrationMeasurementsForm;

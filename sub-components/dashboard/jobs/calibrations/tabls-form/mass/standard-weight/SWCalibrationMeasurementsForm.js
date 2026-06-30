import { TooltipContent } from '@/components/common/ToolTipContent';
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
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { safeParseFloat } from '@/utils/common';
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

const SWCalibrationMeasurementsForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const auth = useAuth();

  const isDisabledField = useMemo(
    () => !auth.role || auth.role === 'technician',
    [JSON.stringify(auth)]
  );

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const minTemprature = useWatch({ name: 'minTemperature' });
  const maxTemprature = useWatch({ name: 'maxTemperature' });
  const minRHumidity = useWatch({ name: 'minRHumidity' });
  const maxRHumidity = useWatch({ name: 'maxRHumidity' });
  const minAPressure = useWatch({ name: 'minAPressure' });
  const maxAPressure = useWatch({ name: 'maxAPressure' });
  const material = useWatch({ name: 'material' });
  const envUP = useWatch({ name: 'envUP' });
  const envUT = useWatch({ name: 'envUT' });
  const envUHr = useWatch({ name: 'envUHr' });

  const [materialsOptions, setMaterialsOptions] = useState({data: [],isLoading: true, isError: false }); //prettier-ignore
  const [environmentalOptions, setEnvironmentalOptions] = useState({data: [], isLoading: true, isError: false }); //prettier-ignore

  const [unitUsedForCOCOptions] = useState(UNIT_USED_FOR_COC.map((unit) => ({ value: unit, label: unit }))); //prettier-ignore
  const [accuracyClassOptions] = useState(ACCURACY_CLASS.map((accuracyClass) => ({ value: accuracyClass, label: accuracyClass }))); //prettier-ignore

  const [traceabilityTypeOptions] = useState(TRACEABILITY_TYPE.map((traceabilityType) => ({ value: traceabilityType, label: traceabilityType }))); //prettier-ignore
  const [traceabilityCountryOptions] = useState(TRACEABILITY_COUNTRY.map((country) => ({ value: country, label: country }))); //prettier-ignore
  const [traceabilityCalibrationLabOptions] = useState(TRACEABILITY_CALIBRATION_LAB.map((lab) => ({ label: `${lab.name}${ lab.accreditationNo && lab.accreditationNo !== 'N/A' ? ` - ${lab.accreditationNo}` : ''}`,...lab }))); //prettier-ignore
  const [traceabilityAccreditationBodyOptions] = useState(TRACEABILITY_ACCREDITATION_BODY.map(body => ({ value: body, label: body }))); //prettier-ignore

  const averageTemprature = useMemo(() => {
    const x = safeParseFloat(minTemprature);
    const y = safeParseFloat(maxTemprature);
    return mean(x, y);
  }, [minTemprature, maxTemprature]);

  const averageRHumidity = useMemo(() => {
    const x = safeParseFloat(minRHumidity);
    const y = safeParseFloat(maxRHumidity);
    return mean(x, y);
  }, [minRHumidity, maxRHumidity]);

  const averageAPressure = useMemo(() => {
    const x = safeParseFloat(minAPressure);
    const y = safeParseFloat(maxAPressure);
    return mean(x, y);
  }, [minAPressure, maxAPressure]);

  const densityOfMoistAir = useMemo(() => {
    const a = 0.34848;
    const b = 0.009;
    const c = 100;
    const d = 0.061;
    const e = 273.15;

    const x1 = multiply(a, averageAPressure);
    const x2 = multiply(b, averageRHumidity);
    const x3 = exp(multiply(d, averageTemprature));
    const x4 = multiply(divide(x2, c), x3);

    const x = subtract(x1, x4);
    const y = add(e, averageTemprature);

    const result = divide(x, y);

    //* set temporary value
    form.setValue('densityOfMoistAir', result);

    return result;
  }, [averageTemprature, averageRHumidity, averageAPressure]);

  const envUPValue = useMemo(() => {
    const value = envUP?.u || '';
    const unit = envUP?.unit || '';

    return `${value}${unit ? ` ${unit}` : ''}`;
  }, [JSON.stringify(envUP)]);

  const envUTValue = useMemo(() => {
    const value = envUT?.u || '';
    const unit = envUT?.unit || '';

    return `${value}${unit ? ` ${unit}` : ''}`;
  }, [JSON.stringify(envUT)]);

  const envUHrValue = useMemo(() => {
    const value = envUHr?.u || '';
    const unit = envUHr?.unit || '';

    return `${value}${unit ? ` ${unit}` : ''}`;
  }, [JSON.stringify(envUHr)]);

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

  const handleMaterialChange = (option, field) => {
    field.onChange(option);
    form.setValue('ptKgMn3', option?.ptKgMn3 || '');
    form.setValue('uPtKgMn3', option?.uPtKgMn3 || '');
  };

  const formatEnvironmentalOptionLabel = (data) => {
    const dueDate =
      data?.dueDate && isValid(new Date(data?.dueDate))
        ? format(new Date(data?.dueDate), 'dd-MM-yyyy')
        : '';

    const valueWithUnit = `${data?.u}${data?.unit ? ` ${data?.unit}` : ''}`;

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>
        <span className='d-flex column-gap-2'>
          <Badge bg='primary'>{valueWithUnit}</Badge>
          {dueDate && <Badge bg='info'>{dueDate}</Badge>}
        </span>
      </div>
    );
  };

  //* query materials
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000005', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const materialDocs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setMaterialsOptions({
            data: materialDocs.map((m) => ({
              value: m.id,
              label: m.material,
              ptKgMn3: m?.ptKgMn3 || '',
              uPtKgMn3: m?.uPtKgMn3 || '',
            })),
            isLoading: false,
            isError: false,
          });

          //* set temporary value for materials
          form.setValue('materials', materialDocs);

          return;
        }

        setMaterialsOptions({ data: [], isLoading: false, isError: false });

        //* set temporary value for materials
        form.setValue('materials', []);
      },
      (err) => {
        console.error(err.message);
        setMaterialsOptions({ data: [], isLoading: false, isError: true });

        //* set temporary value for materials
        form.setValue('materials', []);
      }
    );

    return () => unsubscribe();
  }, []);

  //* query environmental
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000007', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const environmentalDocs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setEnvironmentalOptions({
            data: environmentalDocs.map((envDoc) => ({
              value: envDoc.id,
              label: `${envDoc?.code || ''}${
                envDoc?.description ? ' - ' + envDoc?.description : ''
              }`,
              u: envDoc?.u || '',
              unit: envDoc?.unit || '',
              dueDate: envDoc?.dueDate || '',
              field: envDoc?.field || '',
              isDefault: envDoc?.isDefault || false,
            })),
            isLoading: false,
            isError: false,
          });

          //* set temporary value for environmental
          form.setValue('environmental', environmentalDocs);

          return;
        }

        setEnvironmentalOptions({ data: [], isLoading: false, isError: false });

        //* set temporary value for environmental
        form.setValue('environmental', []);
      },
      (err) => {
        console.error(err.message);
        setEnvironmentalOptions({ data: [], isLoading: false, isError: true });

        //* set temporary value for environmental
        form.setValue('environmental', []);
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

  //* set environmental uP, if data exist and if no data exist, set the default value
  useEffect(() => {
    if (data && environmentalOptions.data.length > 0) {
      const selectedEnvironmental = environmentalOptions.data.find( (option) => option.value === data.envUP); //prettier-ignore
      form.setValue('envUP', selectedEnvironmental);
    }

    if (!data) {
      const defaultValue = environmentalOptions.data.find((option) => option.isDefault && option.field === 'envUP'); //prettier-ignore
      form.setValue('envUP', defaultValue);
    }
  }, [data, JSON.stringify(environmentalOptions)]);

  //* set environmental uT, if data exist and if no data exist, set the default value
  useEffect(() => {
    if (data && environmentalOptions.data.length > 0) {
      const selectedEnvironmental = environmentalOptions.data.find( (option) => option.value === data.envUT); //prettier-ignore
      form.setValue('envUT', selectedEnvironmental);
    }

    if (!data) {
      const defaultValue = environmentalOptions.data.find((option) => option.isDefault && option.field === 'envUT'); //prettier-ignore
      form.setValue('envUT', defaultValue);
    }
  }, [data, JSON.stringify(environmentalOptions)]);

  //* set environmental uHr, if data exist and if no data exist, set the default value
  useEffect(() => {
    if (data && environmentalOptions.data.length > 0) {
      const selectedEnvironmental = environmentalOptions.data.find( (option) => option.value === data.envUHr); //prettier-ignore
      form.setValue('envUHr', selectedEnvironmental);
    }

    if (!data) {
      const defaultValue = environmentalOptions.data.find((option) => option.isDefault && option.field === 'envUHr'); //prettier-ignore
      form.setValue('envUHr', defaultValue);
    }
  }, [data, JSON.stringify(environmentalOptions)]);

  //* set accuracy class, if data exist
  useEffect(() => {
    if (data && accuracyClassOptions.length > 0) {
      const selectedAccuracyClass = accuracyClassOptions.find((option) => option.value === data.accuracyClass); //prettier-ignore
      form.setValue('accuracyClass', selectedAccuracyClass);
    }
  }, [JSON.stringify(data), JSON.stringify(accuracyClassOptions)]);

  //* set unit used for coc, if data exist
  useEffect(() => {
    if (data && unitUsedForCOCOptions.length > 0) {
      const selectedUnitUsedForCOC = unitUsedForCOCOptions.find( (option) => option.value === data.unitUsedForCOC); //prettier-ignore
      form.setValue('unitUsedForCOC', selectedUnitUsedForCOC);
    }
  }, [JSON.stringify(data), JSON.stringify(unitUsedForCOCOptions)]);

  //* set material, if data exist
  useEffect(() => {
    if (data && materialsOptions.data.length > 0) {
      const selectedMaterial = materialsOptions.data.find( (option) => option.value === data.material); //prettier-ignore
      form.setValue('material', selectedMaterial);
    }
  }, [JSON.stringify(data), JSON.stringify(materialsOptions)]);

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
          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Accuracy Class' id='accuracyClass' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Accuracy Class Search'
                    info={['Search by accuracy class']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='accuracyClass'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='accuracyClass'
                    instanceId='accuracyClass'
                    onChange={(option) => field.onChange(option)}
                    options={accuracyClassOptions}
                    placeholder='Search by accuracy class'
                    noOptionsMessage={() => 'No accuracy class found'}
                  />

                  {formErrors && formErrors.accuracyClass?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.accuracyClass?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='No. of Test Weight' id='testWeightNo' />

            <Controller
              name='testWeightNo'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/[^0-9]/.test(value)) return;
                      if (safeParseFloat(value) > 30) return;
                      field.onChange(value);
                    }}
                    id='testWeightNo'
                    placeholder='Enter no. of test weight'
                    type='number'
                  />

                  {formErrors && formErrors.testWeightNo?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.testWeightNo?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <hr className='my-1' />

          <Form.Group as={Col} md={4}>
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

                  {formErrors && formErrors.minTemperature?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.minTemperature?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
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

                  {formErrors && formErrors.maxTemperature?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.maxTemperature?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label>Ambient Temperature (Average)</Form.Label>
            <InputGroup>
              <Form.Control type='text' value={averageTemprature} readOnly disabled />
              <InputGroup.Text>°C</InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group as={Col} md={4}>
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

                  {formErrors && formErrors.minRHumidity?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.minRHumidity?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
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

                  {formErrors && formErrors.maxRHumidity?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.maxRHumidity?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label>Relative Humidity (Average)</Form.Label>
            <InputGroup>
              <Form.Control type='text' value={averageRHumidity} readOnly disabled />
              <InputGroup.Text>%rh</InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label id='minAPressure'>Atmospere Pressure (Min)</Form.Label>

            <Controller
              name='minAPressure'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='minAPressure'
                      type='number'
                      placeholder='Enter minimum atmospere pressure'
                    />

                    <InputGroup.Text>mbar</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.minAPressure?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.minAPressure?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label id='maxAPressure'>Atmospere Pressure (Max)</Form.Label>

            <Controller
              name='maxAPressure'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='maxAPressure'
                      type='number'
                      placeholder='Enter maximum atmospere pressure'
                    />

                    <InputGroup.Text>mbar</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.maxAPressure?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.maxAPressure?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label>Ambient Temperature (Average)</Form.Label>
            <InputGroup>
              <Form.Control type='text' value={averageAPressure} readOnly disabled />
              <InputGroup.Text>mbar</InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label>
              Density of Moist Air, P<sub>a</sub> (Kg m<sup>-3</sup>)
            </Form.Label>
            <Form.Control
              type='text'
              value={formatToDicimalString(densityOfMoistAir, 4)}
              readOnly
              disabled
            />
          </Form.Group>

          <hr className='my-1' />

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Unit Used For COC' id='unitUsedForCOC' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Unif Used For COC Search'
                    info={['Search by unit used for COC']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='unitUsedForCOC'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='unitUsedForCOC'
                    instanceId='unitUsedForCOC'
                    onChange={(option) => field.onChange(option)}
                    options={unitUsedForCOCOptions}
                    placeholder='Search by unit used for COC'
                    noOptionsMessage={() => 'No unit used for COC found'}
                  />

                  {formErrors && formErrors.unitUsedForCOC?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.unitUsedForCOC?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Material' id='material' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Material Search' info={['Search by material name']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='material'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='material'
                    instanceId='material'
                    onChange={(option) => handleMaterialChange(option, field)}
                    options={materialsOptions.data}
                    placeholder={
                      materialsOptions.isLoading ? 'Loading material...' : 'Search by material name'
                    }
                    isDisabled={materialsOptions.isLoading}
                    noOptionsMessage={() =>
                      materialsOptions.isLoading ? 'Loading...' : 'No material found'
                    }
                  />

                  {formErrors && formErrors.material?.message && (
                    <Form.Text className='text-danger'>{formErrors.material?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label>
              Density of Test Weight P<sub>t</sub> (kg m<sup>-3</sup>)
            </Form.Label>

            <Form.Control type='text' value={material?.ptKgMn3 || ''} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label>
              u(P<sub>t</sub>) (kg m<sup>-3</sup>)
            </Form.Label>

            <Form.Control type='text' value={material?.uPtKgMn3 || ''} readOnly disabled />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Environmental</h4>
        <p className='text-muted fs-6'>
          Details of environmental values used for the calculation of the specified field
        </p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={3}>
            <RequiredLabel
              label={
                <span>
                  U<sub>p</sub>
                </span>
              }
              id='envUP'
            />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Environmental Search'
                    info={['Search by environmental code & description']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='envUP'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='envUP'
                    instanceId='envUP'
                    onChange={(option) => handleMaterialChange(option, field)}
                    formatOptionLabel={formatEnvironmentalOptionLabel}
                    options={environmentalOptions.data}
                    placeholder={
                      environmentalOptions.isLoading
                        ? 'Loading environmental value...'
                        : 'Search by environmental code & description'
                    }
                    isDisabled={environmentalOptions.isLoading || isDisabledField}
                    noOptionsMessage={() =>
                      environmentalOptions.isLoading ? 'Loading...' : 'No environmental found'
                    }
                  />

                  {formErrors && formErrors.envUP?.message && (
                    <Form.Text className='text-danger'>{formErrors.envUP?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label>
              U<sub>p</sub> Value
            </Form.Label>

            <Form.Control type='text' value={envUPValue} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel
              label={
                <span>
                  U<sub>t</sub>
                </span>
              }
              id='envUT'
            />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Environmental Search'
                    info={['Search by environmental code & description']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='envUT'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='envUT'
                    instanceId='envUT'
                    onChange={(option) => handleMaterialChange(option, field)}
                    formatOptionLabel={formatEnvironmentalOptionLabel}
                    options={environmentalOptions.data}
                    placeholder={
                      environmentalOptions.isLoading
                        ? 'Loading environmental value...'
                        : 'Search by environmental code & description'
                    }
                    isDisabled={environmentalOptions.isLoading || isDisabledField}
                    noOptionsMessage={() =>
                      environmentalOptions.isLoading ? 'Loading...' : 'No environmental found'
                    }
                  />

                  {formErrors && formErrors.envUT?.message && (
                    <Form.Text className='text-danger'>{formErrors.envUT?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label>
              U<sub>t</sub> Value
            </Form.Label>

            <Form.Control type='text' value={envUTValue} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel
              label={
                <span>
                  U<sub>hr</sub>
                </span>
              }
              id='envUHr'
            />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Environmental Search'
                    info={['Search by environmental code & description']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='envUHr'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='envUHr'
                    instanceId='envUHr'
                    onChange={(option) => handleMaterialChange(option, field)}
                    formatOptionLabel={formatEnvironmentalOptionLabel}
                    options={environmentalOptions.data}
                    placeholder={
                      environmentalOptions.isLoading
                        ? 'Loading environmental value...'
                        : 'Search by environmental code & description'
                    }
                    isDisabled={environmentalOptions.isLoading || isDisabledField}
                    noOptionsMessage={() =>
                      environmentalOptions.isLoading ? 'Loading...' : 'No environmental found'
                    }
                  />

                  {formErrors && formErrors.envUHr?.message && (
                    <Form.Text className='text-danger'>{formErrors.envUHr?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <Form.Label>
              U<sub>hr</sub> Value
            </Form.Label>

            <Form.Control type='text' value={envUHrValue} readOnly disabled />
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

                  {formErrors && formErrors.traceabilityType?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.traceabilityType?.message}
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

                  {formErrors && formErrors.traceabilityCountry?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.traceabilityCountry?.message}
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

                    {formErrors && formErrors.traceabilityCalibrationLab?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.traceabilityCalibrationLab?.message}
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

                  {formErrors && formErrors.traceabilityAccreditationBody?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.traceabilityAccreditationBody?.message}
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

export default SWCalibrationMeasurementsForm;

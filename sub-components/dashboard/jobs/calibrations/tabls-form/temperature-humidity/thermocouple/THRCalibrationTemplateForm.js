import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { useFormContext, useWatch } from 'react-hook-form';
import { Save } from 'react-bootstrap-icons';
import { getArrayType } from '@/utils/common';
import THRCalibrationTempHumidForm from './THRCalibrationTempHumidForm';
import {
  IMMER,
  REF_IND_UOM,
  REF_THER_UOM,
} from '@/schema/calibrations/temperature-humidity/thermocouple';

const THRCalibrationTemplateForm = ({ job, data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();

  const refTherData = useWatch({ name: 'therData' }) || [];
  const meter = useWatch({ name: 'meter' }) || [];
  const extensionsData = useWatch({ name: 'extensionsData' }) || [];
  const bathData = useWatch({ name: 'bathData' }) || [];

  const categoryFormValue = useWatch({ name: 'category' }) || '';

  const [isLoadedCalibrationData, setIsLoadedCalibrationData] = useState(false);

  const [refTherUomOptions] = useState(REF_THER_UOM.map((refTherUom) => ({ value: refTherUom, label: refTherUom }))); //prettier-ignore
  const [refIndUomOptions] = useState(REF_IND_UOM.map((refIndUom) => ({ value: refIndUom, label: refIndUom }))); //prettier-ignore
  const [immerOptions] = useState(IMMER.map((immer) => ({ value: immer, label: immer }))); //prettier-ignore

  const refTherOptions = useMemo(() => {
    if (!refTherData || refTherData?.length < 1) return [];

    return refTherData.map((thr) => ({
      value: thr.id,
      label: thr.idCode || '',
      type: thr?.type || '',
      kFactor: thr?.kFactor,
    }));
  }, [JSON.stringify(refTherData)]);

  const refIndOptions = useMemo(() => {
    if (!meter || meter?.length < 1) return [];

    return meter.map((ind) => ({
      value: ind.id,
      label: ind.code || '',
      type: ind?.type ? (ind?.type === '-' ? '' : ind?.type) : '',
      kFactor: ind?.kFactor,
    }));
  }, [JSON.stringify(meter)]);

  const refWireOptions = useMemo(() => {
    if (!extensionsData || extensionsData?.length < 1) return [];

    return extensionsData.map((ext) => ({
      value: ext.id,
      label: ext.idCode || '',
      kFactor: ext?.kFactor,
      uncerDCelsius: ext?.uncerDCelsius,
      uncerPercentRHumidity: ext?.uncerPercentRHumidity,
    }));
  }, [extensionsData]);

  const bathOptions = useMemo(() => {
    if (!bathData || bathData?.length < 1) return [];

    return bathData.map((bath) => ({
      value: bath.id,
      label: bath.idCode || '',
      no: bath?.no || '',
      stabilityDCelsius: bath?.stabilityDCelsius || '',
      radialDCelsius: bath?.radialDCelsius || '',
      axialDCelsius: bath?.axialDCelsius || '',
      minDCelsius: bath?.minDCelsius || '',
      maxDCelsius: bath?.maxDCelsius || '',
    }));
  }, [bathData]);

  const category = useMemo(() => {
    const value = categoryFormValue?.value || categoryFormValue || '';
    return value.toLowerCase();
  }, [categoryFormValue]);

  const cData = useMemo(() => {
    const values = data?.data;

    if (!values) return [];

    const calibrationData = JSON.parse(values);
    return Array.isArray(calibrationData) ? calibrationData : [];
  }, [JSON.stringify(data)]);

  //* set calibration test data if data exist
  useEffect(() => {
    if (data && cData.length > 0) {
      //* only loead the data when all necessary options are loaded
      if (
        isLoadedCalibrationData ||
        refTherOptions.length < 1 ||
        refTherUomOptions.length < 1 ||
        refIndOptions.length < 1 ||
        refIndUomOptions.length < 1 ||
        refWireOptions.length < 1 ||
        bathOptions.length < 1 ||
        immerOptions.length < 1
      ) {
        return;
      }

      cData.forEach((c, pointIndex) => {
        const setting = c?.setting;
        const resolution = c?.resolution;
        const refTher = c?.refTher;
        const refTherUom = c?.refTherUom;
        const refInd = c?.refInd;
        const refIndUom = c?.refIndUom;
        const refWire = c?.refWire;
        const testInd = c?.testInd;
        const testWire = c?.testWire;
        const bath = c?.bath;
        const immer = c?.immer;
        const refTestData = c?.refTestData || [];

        const selectedRefTher = refTherOptions.find((option) => option.value === refTher); //prettier-ignore
        const selectedRefTherUom = refTherUomOptions.find((option) => option.value === refTherUom); //prettier-ignore
        const selectedRefInd = refIndOptions.find((option) => option.value === refInd); //prettier-ignore
        const selectedRefIndUom = refIndUomOptions.find((option) => option.value === refIndUom); //prettier-ignore
        const selectedRefWire = refWireOptions.find((option) => option.value === refWire); //prettier-ignore
        const selectedTestInd = refIndOptions.find((option) => option.value === testInd); //prettier-ignore
        const selectedTestWire = refWireOptions.find((option) => option.value === testWire); //prettier-ignore
        const selectedBath = bathOptions.find((option) => option.value === bath); //prettier-ignore
        const selectedImmer = immerOptions.find((option) => option.value === immer); //prettier-ignore

        form.setValue(`data.${pointIndex}.setting`, setting);
        form.setValue(`data.${pointIndex}.resolution`, resolution);
        form.setValue(`data.${pointIndex}.refTher`, selectedRefTher);
        form.setValue(`data.${pointIndex}.refTherUom`, selectedRefTherUom);
        form.setValue(`data.${pointIndex}.refInd`, selectedRefInd);
        form.setValue(`data.${pointIndex}.refIndUom`, selectedRefIndUom);
        form.setValue(`data.${pointIndex}.refWire`, selectedRefWire);
        form.setValue(`data.${pointIndex}.testInd`, selectedTestInd);
        form.setValue(`data.${pointIndex}.testWire`, selectedTestWire);
        form.setValue(`data.${pointIndex}.bath`, selectedBath);
        form.setValue(`data.${pointIndex}.immer`, selectedImmer);
        form.setValue(`data.${pointIndex}.refTestData`, refTestData);
      });

      setTimeout(() => {
        setIsLoadedCalibrationData(true);
        console.count('Calibration Data Loaded..');
      }, 3000);
    } else setIsLoadedCalibrationData(true);
  }, [
    JSON.stringify(data),
    JSON.stringify(refTherOptions),
    JSON.stringify(refTherUomOptions),
    JSON.stringify(refIndOptions),
    JSON.stringify(refIndUomOptions),
    JSON.stringify(refWireOptions),
    JSON.stringify(bathOptions),
    JSON.stringify(immerOptions),
  ]);

  if (!category || category !== 'temperature & humidity') return null;

  if (!data && !isLoadedCalibrationData) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Calibration Data... It may take a while</span>
      </div>
    );
  }

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <THRCalibrationTempHumidForm data={data} job={job} />

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button type='button' className='mt-2' onClick={handleNext} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner
                  as='span'
                  animation='border'
                  size='sm'
                  role='status'
                  aria-hidden='true'
                  className='me-2'
                />
                {data ? 'Updating' : 'Finishing'}...
              </>
            ) : (
              <>
                <Save size={14} className='me-2' />
                {data ? 'Update' : 'Finish'} {' Calibration'}
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default THRCalibrationTemplateForm;

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { useFormContext, useWatch } from 'react-hook-form';
import SWCalibrationMassForm from './SWCalibrationMassForm';
import { Save } from 'react-bootstrap-icons';
import {
  NOMINAL_VALUE,
  TAG_ID,
  UNIT_USED_FOR_COC,
} from '@/schema/calibrations/mass/standard-weight';
import { getArrayType } from '@/utils/common';

const SWCalibrationTemplateForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();

  const [isLoadedCalibrationData, setIsLoadedCalibrationData] = useState(false);
  const instruments = useWatch({ control: form.control, name: 'instruments' }) || [];

  const unitUsedForCOCOptions = UNIT_USED_FOR_COC.map((unit) => ({ value: unit, label: unit })); //prettier-ignore
  const tagIdOptions = TAG_ID.map((tagId) => ({ value: tagId, label: tagId })); //prettier-ignore
  const nominalValueOptions = NOMINAL_VALUE.map((nominalValue) => ({ value: nominalValue, label: nominalValue })); //prettier-ignore

  const materialsOptions = useMemo(() => {
    const value = form.getValues('materials');

    if (!value || value?.length < 1) return [];

    return value.map((m) => ({
      value: m.id,
      label: m.material,
      ptKgMn3: m?.ptKgMn3 || '',
      uPtKgMn3: m?.uPtKgMn3 || '',
    }));
  }, [JSON.stringify(form.watch('materials'))]);

  const instrumentsOptions = useMemo(() => {
    const arrayType = getArrayType(instruments);

    if (!instruments || instruments?.length < 1 || arrayType !== 'array-of-objects') return [];

    return instruments.map((instrument) => ({
      label: instrument?.description || '',
      value: instrument.id,
      ...instrument,
    }));
  }, [JSON.stringify(instruments)]);

  const category = useMemo(() => {
    const value = form.getValues('category')?.value || form.getValues('category') || '';
    return value.toLowerCase();
  }, [form.watch('category')]);

  const cData = useMemo(() => {
    const values = data?.data;

    if (!values) return [];

    const calibrationData = JSON.parse(data.data);
    return Array.isArray(calibrationData) ? calibrationData : [];
  }, [JSON.stringify(data)]);

  //* set calibration test data if data exist
  useEffect(() => {
    if (data && cData.length > 0) {
      //* only loead the data when all necessary options are loaded
      if (
        isLoadedCalibrationData ||
        unitUsedForCOCOptions.length < 1 ||
        materialsOptions.length < 1 ||
        nominalValueOptions.length < 1 ||
        tagIdOptions.length < 1 ||
        instrumentsOptions.length < 1
      ) {
        return;
      }

      cData.forEach((c, pointIndex) => {
        const unitUsedForCOC = c?.unitUsedForCOC;
        const material = c?.material;
        const ptKgMn3 = c?.ptKgMn3;
        const uPtKgMn3 = c?.uPtKgMn3;
        const nominalValue = c?.nominalValue;
        const isNominalValueWithAsterisk = c?.isNominalValueWithAsterisk;
        const massComparatorRefEquipmentId = c?.massComparatorRefEquipmentId;
        const tagId = c?.tagId;
        const weights = c?.weights || [];
        const testWeightData = c?.testWeightData || [[], [], [], []];

        const selectedUnitUsedForCOC = unitUsedForCOCOptions.find((option) => option.value === unitUsedForCOC); //prettier-ignore
        const selectedMaterial = materialsOptions.find((option) => option.value === material); //prettier-ignore
        const selectedNominalValue = nominalValueOptions.find( (option) => option.value == nominalValue); //prettier-ignore
        const selectedTagId = tagIdOptions.find((option) => option.value === tagId); //prettier-ignore
        const selectedIntruments = instrumentsOptions.find((option) => option.value === massComparatorRefEquipmentId); //prettier-ignore

        form.setValue(`data.${pointIndex}.unitUsedForCOC`, selectedUnitUsedForCOC);
        form.setValue(`data.${pointIndex}.material`, selectedMaterial);
        form.setValue(`data.${pointIndex}.ptKgMn3`, ptKgMn3);
        form.setValue(`data.${pointIndex}.uPtKgMn3`, uPtKgMn3);
        form.setValue(`data.${pointIndex}.nominalValue`, selectedNominalValue);
        form.setValue(`data.${pointIndex}.isNominalValueWithAsterisk`, isNominalValueWithAsterisk);
        form.setValue(`data.${pointIndex}.massComparatorRefEquipmentId`, selectedIntruments);
        form.setValue(`data.${pointIndex}.tagId`, selectedTagId);
        form.setValue(`data.${pointIndex}.weights`, weights);
        form.setValue(`data.${pointIndex}.testWeightData`, testWeightData);
      });

      setTimeout(() => {
        setIsLoadedCalibrationData(true);
        console.count('Calibration Data Loaded..');
      }, 3000);
    } else setIsLoadedCalibrationData(true);
  }, [
    JSON.stringify(data),
    JSON.stringify(unitUsedForCOCOptions),
    JSON.stringify(materialsOptions),
    JSON.stringify(nominalValueOptions),
    JSON.stringify(tagIdOptions),
    JSON.stringify(instrumentsOptions),
  ]);

  if (!category || category !== 'mass') return null;

  if (!data && !isLoadedCalibrationData) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Calibration Data... It may take a while</span>
      </div>
    );
  }

  // console.log({ instrumentsOptions });

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <SWCalibrationMassForm data={data} />

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

export default SWCalibrationTemplateForm;

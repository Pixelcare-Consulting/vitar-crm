import { Accordion, Card, Col, Nav, Row, Spinner, Tab } from 'react-bootstrap';
import { CardList, Rulers, Table } from 'react-bootstrap-icons';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import THRTestData from './THRTestData';
import {
  IMMER,
  REF_IND_UOM,
  REF_THER_UOM,
} from '@/schema/calibrations/temperature-humidity/thermocouple';
import THRDataCalculation from './THRDataCalculation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';

const THRCalibrationTemplate = ({ calibration, refTher, refInd, refWire, bath }) => {
  const category = useMemo(() => {
    if (!calibration.category) return null;
    return calibration.category?.toLowerCase();
  }, [calibration]);

  const variant = useMemo(() => {
    if (!calibration.variant) return null;
    return calibration.variant?.toLowerCase()?.replace('-', ' ');
  }, [calibration]);

  if (category !== 'temperature & humidity') return null;

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body>
        <CalibrationTemplateContent
          calibration={calibration}
          variant={variant}
          category={category}
          refTher={refTher}
          refInd={refInd}
          refWire={refWire}
          bath={bath}
        />
      </Card.Body>
    </Card>
  );
};

const CalibrationTemplateContent = ({
  calibration,
  variant,
  category,
  refTher,
  refInd,
  refWire,
  bath,
}) => {
  const form = useForm({ values: calibration });

  const cData = calibration?.data || [];

  const [isLoadedCalibrationData, setIsLoadedCalibrationData] = useState(false);

  const [refTherUomOptions] = useState(REF_THER_UOM.map((refTherUom) => ({ value: refTherUom, label: refTherUom }))); //prettier-ignore
  const [refIndUomOptions] = useState(REF_IND_UOM.map((refIndUom) => ({ value: refIndUom, label: refIndUom }))); //prettier-ignore
  const [immerOptions] = useState(IMMER.map((immer) => ({ value: immer, label: immer }))); //prettier-ignore

  const [ck, setCk] = useState({ data: [], isLoading: true, isError: false });
  const [cmc, setCmc] = useState({ data: [], isLoading: true, isError: false });

  const refTherOptions = useMemo(() => {
    if (!refTher || refTher?.data?.length < 1) return [];

    return refTher.data.map((thr) => ({
      value: thr.id,
      label: thr.idCode || '',
      type: thr?.type || '',
      kFactor: thr?.kFactor,
    }));
  }, [JSON.stringify(refTher)]);

  const refIndOptions = useMemo(() => {
    if (!refInd || refInd?.data?.length < 1) return [];

    return refInd.data.map((ind) => ({
      value: ind.id,
      label: ind.code || '',
      type: ind?.type ? (ind?.type === '-' ? '' : ind?.type) : '',
      kFactor: ind?.kFactor,
    }));
  }, [JSON.stringify(refInd)]);

  const refWireOptions = useMemo(() => {
    if (!refWire || refWire?.data?.length < 1) return [];

    return refWire.data.map((ext) => ({
      value: ext.id,
      label: ext.idCode || '',
      kFactor: ext?.kFactor,
      uncerDCelsius: ext?.uncerDCelsius,
      uncerPercentRHumidity: ext?.uncerPercentRHumidity,
    }));
  }, [JSON.stringify(refWire)]);

  const bathOptions = useMemo(() => {
    if (!bath || bath?.data?.length < 1) return [];

    return bath.data.map((bath) => ({
      value: bath.id,
      label: bath.idCode || '',
      no: bath?.no || '',
      stabilityDCelsius: bath?.stabilityDCelsius || '',
      radialDCelsius: bath?.radialDCelsius || '',
      axialDCelsius: bath?.axialDCelsius || '',
      minDCelsius: bath?.minDCelsius || '',
      maxDCelsius: bath?.maxDCelsius || '',
    }));
  }, [JSON.stringify(bath)]);

  const isLoading = useMemo(() => {
    return !isLoadedCalibrationData || ck.isLoading || cmc.isLoading;
  }, [JSON.stringify(ck), JSON.stringify(cmc), isLoadedCalibrationData]);

  //* set calibration test data if data exist
  useEffect(() => {
    if (calibration && cData.length > 0) {
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

      console.log({});

      setTimeout(() => {
        setIsLoadedCalibrationData(true);
        console.count('Calibration Data Loaded..');
      }, 3000);
    } else setIsLoadedCalibrationData(true);
  }, [
    JSON.stringify(calibration),
    JSON.stringify(refTherOptions),
    JSON.stringify(refTherUomOptions),
    JSON.stringify(refIndOptions),
    JSON.stringify(refIndUomOptions),
    JSON.stringify(refWireOptions),
    JSON.stringify(bathOptions),
    JSON.stringify(immerOptions),
  ]);

  //* query CK
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000018', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const ckData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setCk(ckData);

          form.setValue(`ck`, ckData);
          return;
        }

        form.setValue(`ck`, { data: [], isLoading: false, isError: false });
        setCk({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`ck`, { data: [], isLoading: false, isError: false });
        setCk({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query cmc
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000019', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cmcData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setCmc(cmcData);

          form.setValue(`cmc`, cmcData);
          return;
        }

        form.setValue(`cmc`, { data: [], isLoading: false, isError: false });
        setCmc({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`cmc`, { data: [], isLoading: false, isError: false });
        setCmc({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Row className='mb-3'>
        <h4 className='mb-0'>Calibration</h4>
        <p className='text-muted fs-6'>
          Details of test, computation and results of the calibration.
        </p>

        <div className='flex align-items-center gap-2'>
          <div className='fs-5'>
            <span className='pe-2'>Category:</span>
            <span className='fw-bold text-capitalize'>{category}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Variant:</span>
            <span className='fw-bold text-capitalize'>{variant}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Range of Calibration:</span>
            <span className='fw-bold'>{calibration?.rangeOfCalibration || ''}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Reference Type:</span>
            <span className='fw-bold'>{calibration?.refType || ''}</span>
          </div>
        </div>
      </Row>

      <Row>
        <Accordion className='mt-1'>
          <Accordion.Item eventKey='0'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Test Data
            </Accordion.Header>

            <Accordion.Body>
              <THRTestData
                calibration={calibration}
                refTher={refTher}
                refInd={refInd}
                refWire={refWire}
                bath={bath}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='1'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Data Calculation (Thermocouple) - A1 - A{calibration?.rangeOfCalibratio || ''}
            </Accordion.Header>

            <Accordion.Body>
              <FormProvider {...form}>
                {isLoading ? (
                  <Spinner animation='border' variant='primary' />
                ) : (
                  <THRDataCalculation calibration={calibration} job={calibration?.job} />
                )}
              </FormProvider>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default THRCalibrationTemplate;

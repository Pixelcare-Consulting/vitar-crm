import React, { useEffect, useMemo, useState } from 'react';
import { Accordion, Row } from 'react-bootstrap';
import { Table } from 'react-bootstrap-icons';
import { useFormContext, useWatch } from 'react-hook-form';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';
import THRTestData from './THRTestData';
import { safeParseFloat } from '@/utils/common';
import THRDataCalculation from './THRDataCalculation';
import THRResultForm from './THRResultForm';

const THRCalibrationTempHumidForm = ({ data, job }) => {
  const form = useFormContext();

  const [ck, setCk] = useState({ data: [], isLoading: true, isError: false });
  const [cmc, setCmc] = useState({ data: [], isLoading: true, isError: false });
  const [special, setSpecial] = useState({ data: [], isLoading: true, isError: false });

  const rangeOfCalibrationFormValue = useWatch({ name: 'rangeOfCalibration' });
  const refTypeValue = useWatch({ name: 'refType' });

  const rangeOfCalibration = useMemo(() => {
    return safeParseFloat(rangeOfCalibrationFormValue);
  }, [rangeOfCalibrationFormValue]);

  const category = useMemo(() => {
    const value = form.getValues('category')?.value || form.getValues('category') || '';
    return value.toLowerCase();
  }, [form.watch('category')]);

  const variant = useMemo(() => {
    const value = form.getValues('variant')?.value || form.getValues('variant') || '';
    return value.toLowerCase();
  }, [form.watch('variant')]);

  const refType = useMemo(() => {
    return refTypeValue?.value || refTypeValue || '';
  }, [refTypeValue]);

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

  //* query special
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000020', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const specialData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setSpecial(specialData);

          form.setValue(`special`, specialData);
          return;
        }

        form.setValue(`special`, { data: [], isLoading: false, isError: false });
        setSpecial({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`special`, { data: [], isLoading: false, isError: false });
        setSpecial({ data: [], isLoading: false, isError: true });
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
            <span className='fw-bold'>{rangeOfCalibration || ''}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Reference Type:</span>
            <span className='fw-bold'>{refType || ''}</span>
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
              <THRTestData data={data} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='1'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Data Calculation (Thermocouple) - A1 - A{rangeOfCalibration || ''}
            </Accordion.Header>

            <Accordion.Body>
              <THRDataCalculation data={data} job={job} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='2'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Results
            </Accordion.Header>

            <Accordion.Body>
              <THRResultForm data={data} job={job} />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default THRCalibrationTempHumidForm;

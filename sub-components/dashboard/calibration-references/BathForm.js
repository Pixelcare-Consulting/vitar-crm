import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { bathSchema } from '@/schema/calibrationReferences';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const BathForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(bathSchema), ...data },
    resolver: zodResolver(bathSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.idCode !== formData.idCode || data?.no !== formData.no) {
        //* check if bath code exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000012', 'data'),
          where('idCode', '==', formData.idCode),
          where('no', '==', formData.no),
          limit(1)
        );

        const bathSnapshot = await getDocs(q);

        if (!bathSnapshot.empty) {
          form.setError('no', {
            type: 'custom',
            message: `No. already exist on idCode "${formData.idCode}"`,
          });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000012', 'data');

      await setDoc(
        doc(collectionRef, formData.refId),
        {
          ...formData,
          ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        },
        { merge: true }
      );

      toast.success(
        `Reference data #${formData.refId} ${data ? 'updated' : 'created'} successfully.`,
        { position: 'top-right' }
      );
      setIsLoading(false);

      if (isSavedNew) {
        window.location.assign(`/calibration-references/temperature-humidity/bath/create`);
      } else {
        router.push(
          `/calibration-references/temperature-humidity/bath/edit-bath/${formData.refId}`
        );
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last bath ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000012', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastBathRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastBathRefId + 1).toString().padStart(6, '0')}`);
        } else {
          form.setValue('refId', 'CR000001');
        }
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>Bath Info</h4>
              <p className='text-muted fs-6'>Details about the bath.</p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Reference Id</Form.Label>
                  <Form.Control type='text' value={form.watch('refId')} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='ID Code' id='idCode' />

                  <Controller
                    name='idCode'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='idCode'
                          placeholder='Enter ID Code'
                          type='string'
                        />

                        {formErrors && formErrors.idCode?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.idCode?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='no'>No.</Form.Label>

                  <Controller
                    name='no'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='no' placeholder='Enter No.' type='number' />

                        <Form.Text className='d-block'>No. must be unique per ID Code.</Form.Text>

                        {formErrors && formErrors.no?.message && (
                          <Form.Text className='text-danger'>{formErrors.no?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='minDCelsius'>Min (°C)</Form.Label>

                  <Controller
                    name='minDCelsius'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='minDCelsius'
                          placeholder='Enter Min (°C)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.minDCelsius?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.minDCelsius?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='maxDCelsius'>Max (°C)</Form.Label>

                  <Controller
                    name='maxDCelsius'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='maxDCelsius'
                          placeholder='Enter Max (°C)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.maxDCelsius?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.maxDCelsius?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='minPercentRHumidity'>Min (% r.h.)</Form.Label>

                  <Controller
                    name='minPercentRHumidity'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='minPercentRHumidity'
                          placeholder='Min (% r.h.)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.minPercentRHumidity?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.minPercentRHumidity?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='maxPercentRHumidity'>Max (% r.h.)</Form.Label>

                  <Controller
                    name='maxPercentRHumidity'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='maxPercentRHumidity'
                          placeholder='Max (% r.h.)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.maxPercentRHumidity?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.maxPercentRHumidity?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='stabilityDCelsius'>Stability (°C)</Form.Label>

                  <Controller
                    name='stabilityDCelsius'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='stabilityDCelsius'
                          placeholder='Enter Stability (°C)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.stabilityDCelsius?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.stabilityDCelsius?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='stabilityPercentRHumidity'>Stability (% r.h.)</Form.Label>

                  <Controller
                    name='stabilityPercentRHumidity'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='stabilityPercentRHumidity'
                          placeholder='Stability (% r.h.)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.stabilityPercentRHumidity?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.stabilityPercentRHumidity?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uniformityDCelsius'>Uniformity (°C)</Form.Label>

                  <Controller
                    name='uniformityDCelsius'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uniformityDCelsius'
                          placeholder='Enter Uniformity (°C)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uniformityDCelsius?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uniformityDCelsius?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uniformityPercentRHumidity'>Uniformity (% r.h.)</Form.Label>

                  <Controller
                    name='uniformityPercentRHumidity'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uniformityPercentRHumidity'
                          placeholder='Uniformity (% r.h.)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uniformityPercentRHumidity?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uniformityPercentRHumidity?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='radialDCelsius'>Radial (°C)</Form.Label>

                  <Controller
                    name='radialDCelsius'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='radialDCelsius'
                          placeholder='Enter Radial (°C)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.radialDCelsius?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.radialDCelsius?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='axialDCelsius'>Axial (°C)</Form.Label>

                  <Controller
                    name='axialDCelsius'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='axialDCelsius'
                          placeholder='Enter Axial (°C)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.axialDCelsius?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.axialDCelsius?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='dueDate'>Due Date</Form.Label>

                  <Controller
                    name='dueDate'
                    control={form.control}
                    render={({ field }) => <Form.Control {...field} id='dueDate' type='date' />}
                  />
                </Form.Group>
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() => router.push('/calibration-references/temperature-humidity/bath')}
                >
                  Cancel
                </Button>

                <div className='d-flex gap-2 align-items-center'>
                  <Button
                    disabled={isLoading}
                    type='submit'
                    variant='outline-primary'
                    onClick={() => setIsSavedNew(true)}
                  >
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} className='me-2' />
                        Save & New
                      </>
                    )}
                  </Button>

                  <Button type='submit' disabled={isLoading}>
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} className='me-2' />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Form>
      </FormProvider>
    </>
  );
};

export default BathForm;

import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { bathStabilityUniformitySchema } from '@/schema/calibrationReferences';
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

const BathStabilityUniformityForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(bathStabilityUniformitySchema), ...data },
    resolver: zodResolver(bathStabilityUniformitySchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.code !== formData.code) {
        //* check if bath code exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000013', 'data'),
          where('code', '==', formData.code),
          limit(1)
        );

        const bathStabilityUniformitySnapshot = await getDocs(q);

        if (!bathStabilityUniformitySnapshot.empty) {
          form.setError('code', {
            type: 'custom',
            message: 'Code already exist',
          });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000013', 'data');

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
        window.location.assign(
          `/calibration-references/temperature-humidity/bath/stability-uniformity/create`
        );
      } else {
        router.push(
          `/calibration-references/temperature-humidity/bath/stability-uniformity/edit-stability-uniformity/${formData.refId}`
        );
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last bath stability/uniformity ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000013', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastBathStabilityUniformityRefId = parseInt(id, 10);

          form.setValue(
            'refId',
            `CR${(lastBathStabilityUniformityRefId + 1).toString().padStart(6, '0')}`
          );
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
              <h4 className='mb-0'>Bath Stability/Uniformity Info</h4>
              <p className='text-muted fs-6'>Details about the bath stability/uniformity.</p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Reference Id</Form.Label>
                  <Form.Control type='text' value={form.watch('refId')} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Code' id='code' />

                  <Controller
                    name='code'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='code' placeholder='Enter Code' type='string' />

                        {formErrors && formErrors.code?.message && (
                          <Form.Text className='text-danger'>{formErrors.code?.message}</Form.Text>
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
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() =>
                    router.push(
                      '/calibration-references/temperature-humidity/bath/stability-uniformity'
                    )
                  }
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

export default BathStabilityUniformityForm;

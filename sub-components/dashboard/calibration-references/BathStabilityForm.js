import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { bathStability } from '@/schema/calibrationReferences';
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

const BathStabilityForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(bathStability), ...data },
    resolver: zodResolver(bathStability),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.loc !== formData.loc) {
        //* check if bath loc exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000014', 'data'),
          where('loc', '==', formData.loc),
          limit(1)
        );

        const bathStabilitySnapshot = await getDocs(q);

        if (!bathStabilitySnapshot.empty) {
          form.setError('loc', {
            type: 'custom',
            message: 'Loc. already exist',
          });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000014', 'data');

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
          `/calibration-references/temperature-humidity/bath/stability/create`
        );
      } else {
        router.push(
          `/calibration-references/temperature-humidity/bath/stability/edit-stability/${formData.refId}`
        );
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last bath stability ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000014', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastBathStabilityRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastBathStabilityRefId + 1).toString().padStart(6, '0')}`);
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
              <h4 className='mb-0'>Bath Stability Info</h4>
              <p className='text-muted fs-6'>Details about the bath stability.</p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Reference Id</Form.Label>
                  <Form.Control type='text' value={form.watch('refId')} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Loc.' id='loc' />

                  <Controller
                    name='loc'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='loc' placeholder='Enter Loc' type='string' />

                        {formErrors && formErrors.loc?.message && (
                          <Form.Text className='text-danger'>{formErrors.loc?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='value1'>Value 1</Form.Label>

                  <Controller
                    name='value1'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='value1'
                          placeholder='Enter Value 1'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.value1?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.value1?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='value2'>Value 2</Form.Label>

                  <Controller
                    name='value2'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='value2'
                          placeholder='Enter Value 2'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.value2?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.value2?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='value3'>Value 3</Form.Label>

                  <Controller
                    name='value3'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='value3'
                          placeholder='Enter Value 3'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.value3?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.value3?.message}
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
                    router.push('/calibration-references/temperature-humidity/bath/stability')
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

export default BathStabilityForm;

import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { tempRefSchema } from '@/schema/calibrationReferences';
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

const TempRefForm = ({ data, jobCalibrationRefId, path }) => {
  const router = useRouter();
  const auth = useAuth();
  const { refId } = router.query;

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(tempRefSchema), ...data },
    resolver: zodResolver(tempRefSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.reference !== formData.reference) {
        //* check if ther reference exist
        const q = query(
          collection(db, 'jobCalibrationReferences', jobCalibrationRefId, 'data'),
          where('reference', '==', formData.reference),
          limit(1)
        );

        const tempRefSnapshot = await getDocs(q);

        if (!tempRefSnapshot.empty) {
          form.setError('reference', { type: 'custom', message: 'Reference already exist' });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(
        db,
        'jobCalibrationReferences',
        jobCalibrationRefId,
        'data',
        refId,
        'temperatureRefs'
      );

      await setDoc(
        doc(collectionRef, formData.tempRefId),
        {
          ...formData,
          ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        },
        { merge: true }
      );

      toast.success(
        `Reference data #${formData.tempRefId} ${data ? 'updated' : 'created'} successfully.`,
        { position: 'top-right' }
      );
      setIsLoading(false);

      if (isSavedNew) {
        window.location.assign(
          `/calibration-references/temperature-humidity/${path}/${refId}/temperature-references/create`
        );
      } else {
        router.push(
          `/calibration-references/temperature-humidity/${path}/${refId}/temperature-references/edit-temperature-references/${formData.tempRefId}`
        );
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last temperature ref ref id
  useEffect(() => {
    if (data || !jobCalibrationRefId || !refId) return;

    const q = query(
      collection(
        db,
        'jobCalibrationReferences',
        jobCalibrationRefId,
        'data',
        refId,
        'temperatureRefs'
      )
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log({ snapshot });

        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('TR', '');
          const lastTempRefRefId = parseInt(id, 10);

          form.setValue('tempRefId', `TR${(lastTempRefRefId + 1).toString().padStart(6, '0')}`);
        } else {
          form.setValue('tempRefId', 'TR000001');
        }
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, [jobCalibrationRefId, refId]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>Temperature Reference Info</h4>
              <p className='text-muted fs-6'>Details about the temperature reference.</p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Temperature Reference Id</Form.Label>
                  <Form.Control type='text' value={form.watch('tempRefId')} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Reference' id='reference' />

                  <Controller
                    name='reference'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='reference'
                          placeholder='Enter Reference'
                          type='number'
                          step='any'
                        />

                        <Form.Text className='d-block'>Reference must be unique.</Form.Text>

                        {formErrors && formErrors.reference?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.reference?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Test' id='test' />

                  <Controller
                    name='test'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='test'
                          placeholder='Enter Test'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.test?.message && (
                          <Form.Text className='text-danger'>{formErrors.test?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='correction'>Correction</Form.Label>

                  <Controller
                    name='correction'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='correction'
                          placeholder='Enter Correction'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.correction?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.correction?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Uncer' id='uncer' />

                  <Controller
                    name='uncer'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uncer'
                          placeholder='Enter Uncer'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uncer?.message && (
                          <Form.Text className='text-danger'>{formErrors.uncer?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Drift' id='drift' />

                  <Controller
                    name='drift'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='drift'
                          placeholder='Enter Drift'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.drift?.message && (
                          <Form.Text className='text-danger'>{formErrors.drift?.message}</Form.Text>
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
                      `/calibration-references/temperature-humidity/${path}/${refId}/temperature-references`
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

export default TempRefForm;

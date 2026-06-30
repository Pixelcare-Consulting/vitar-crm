import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { temperatureInstrumentSchema } from '@/schema/calibrationReferences';
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

const TempInstrumentForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(temperatureInstrumentSchema), ...data },
    resolver: zodResolver(temperatureInstrumentSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.code !== formData.code || data?.range !== formData.range) {
        //* check if temperature Instrument code exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000017', 'data'),
          where('code', '==', formData.code),
          where('range', '==', formData.range),
          limit(1)
        );

        const tempInstrumentSnapshot = await getDocs(q);

        if (!tempInstrumentSnapshot.empty) {
          form.setError('code', {
            range: 'custom',
            message: `Code already exist on range "${formData.range ?? 'N/A'}"`,
          });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000017', 'data');

      await setDoc(
        doc(collectionRef, formData.refId),
        {
          ...formData,
          ...(!data && {
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser,
          }),
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
          `/calibration-references/temperature-humidity/temperature-instruments/create`
        );
      } else {
        router.push(
          `/calibration-references/temperature-humidity/temperature-instruments/edit-temperature-instruments/${formData.refId}`
        );
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last temperature instrument ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000017', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastTempInstrumentRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastTempInstrumentRefId + 1).toString().padStart(6, '0')}`);
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
              <h4 className='mb-0'>Temperature Instrument Info</h4>
              <p className='text-muted fs-6'>Details about the temperature instrument.</p>

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
                  <Form.Label htmlFor='description'>Description</Form.Label>

                  <Controller
                    name='description'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='description'
                          placeholder='Enter Description'
                          type='string'
                        />

                        {formErrors && formErrors.description?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.description?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='Range'>Range</Form.Label>

                  <Controller
                    name='range'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='range'
                          placeholder='Enter Range'
                          type='number'
                          step='any'
                          min={1}
                        />

                        <Form.Text className='d-block'>Range must be unique per Code.</Form.Text>

                        {formErrors && formErrors.range?.message && (
                          <Form.Text className='text-danger'>{formErrors.range?.message}</Form.Text>
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
                      '/calibration-references/temperature-humidity/temperature-instruments'
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

export default TempInstrumentForm;

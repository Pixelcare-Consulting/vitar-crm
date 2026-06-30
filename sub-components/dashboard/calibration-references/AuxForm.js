import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { auxSchema } from '@/schema/calibrationReferences';
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

const AuxForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(auxSchema), ...data },
    resolver: zodResolver(auxSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.idCode !== formData.idCode) {
        //* check if aux idCode exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000010', 'data'),
          where('idCode', '==', formData.idCode),
          limit(1)
        );

        const auxSnapshot = await getDocs(q);

        if (!auxSnapshot.empty) {
          form.setError('idCode', { type: 'custom', message: 'ID Code already exist' });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000010', 'data');

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
        window.location.assign(`/calibration-references/temperature-humidity/aux/create`);
      } else {
        router.push(`/calibration-references/temperature-humidity/aux/edit-aux/${formData.refId}`);
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last aux ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000010', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastAuxRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastAuxRefId + 1).toString().padStart(6, '0')}`);
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
              <h4 className='mb-0'>Aux Info</h4>
              <p className='text-muted fs-6'>Details about the aux.</p>

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

                        <Form.Text className='d-block'>ID Code must be unique.</Form.Text>

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
                  <RequiredLabel label='Type' id='type' />

                  <Controller
                    name='type'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='type' placeholder='Enter Type' type='text' />

                        {formErrors && formErrors.type?.message && (
                          <Form.Text className='text-danger'>{formErrors.type?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='serialNumber'>Serial No.</Form.Label>

                  <Controller
                    name='serialNumber'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='serialNumber'
                          placeholder='Enter Serial No.'
                          type='text'
                        />

                        {formErrors && formErrors.serialNumber?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.serialNumber?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Traceable' id='traceable' />

                  <Controller
                    name='traceable'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='traceable'
                          placeholder='Enter Traceable'
                          type='text'
                        />

                        {formErrors && formErrors.traceable?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.traceable?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='cocNo'>COC No.</Form.Label>

                  <Controller
                    name='cocNo'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='cocNo'
                          placeholder='Enter COC No.'
                          type='text'
                        />

                        {formErrors && formErrors.cocNo?.message && (
                          <Form.Text className='text-danger'>{formErrors.cocNo?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='kFactor'>K Factor</Form.Label>

                  <Controller
                    name='kFactor'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='kFactor'
                          placeholder='Enter K Factor'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.kFactor?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.kFactor?.message}
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
                  onClick={() => router.push('/calibration-references/temperature-humidity/aux')}
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

export default AuxForm;

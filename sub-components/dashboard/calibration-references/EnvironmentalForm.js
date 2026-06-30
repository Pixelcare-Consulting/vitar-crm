import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import {
  ENVIRONMENTAL_DEFAULT_FIELD_OPTIONS,
  environmentalSchema,
} from '@/schema/calibrationReferences';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

const EnvironmentalForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(environmentalSchema), ...data },
    resolver: zodResolver(environmentalSchema),
  });

  const formErrors = form.formState.errors;

  const isDefault = useWatch({ control: form.control, name: 'isDefault' });

  const formatEnvironmentalFieldOptionLabel = (data) => {
    const html = data.html;
    return html;
  };

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000007', 'data');

      const batch = writeBatch(db);

      //* add the main document to the batch
      const mainDocRef = doc(collectionRef, formData.refId);
      batch.set(
        mainDocRef,
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

      //* if isDefault, find all other docs with the same field and isDefault: true, then set them to false
      if (formData.isDefault) {
        const q = query(
          collectionRef,
          where('field', '==', formData.field),
          where('isDefault', '==', true),
          where('refId', '!=', formData.refId) //* exclude the current document
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((docSnap) => {
          batch.update(docSnap.ref, {
            isDefault: false,
            field: '',
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          });
        });
      }

      await batch.commit();

      toast.success(
        `Reference data #${formData.refId} ${data ? 'updated' : 'created'} successfully.`,
        { position: 'top-right' }
      );
      setIsLoading(false);

      if (isSavedNew) {
        window.location.assign(`/calibration-references/mass/environmental/create`);
      } else {
        router.push(
          `/calibration-references/mass/environmental/edit-environmental/${formData.refId}`
        );
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last environmental ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000007', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastEnvironmentalRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastEnvironmentalRefId + 1).toString().padStart(6, '0')}`);
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

  //* set field empty if isDefault is false
  useEffect(() => {
    if (!isDefault) form.setValue('field', '');
  }, [isDefault]);

  //* set field if data exist
  useEffect(() => {
    if (data && data.field) {
      const selectedOption = ENVIRONMENTAL_DEFAULT_FIELD_OPTIONS.find(
        (option) => option.value === data.field
      );
      form.setValue('field', selectedOption);
    } else form.setValue('field', '');
  }, [data]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>Environmental Info</h4>
              <p className='text-muted fs-6'>Details about the environmental.</p>

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
                          type='text'
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
                  <RequiredLabel label='Unit' id='unit' />

                  <Controller
                    name='unit'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='unit' placeholder='Enter Unit' type='text' />

                        {formErrors && formErrors.unit?.message && (
                          <Form.Text className='text-danger'>{formErrors.unit?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='U' id='u' />

                  <Controller
                    name='u'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='u'
                          placeholder='Enter U'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.u?.message && (
                          <Form.Text className='text-danger'>{formErrors.u?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md='3'>
                  <Form.Label htmlFor='dueDate'>Due Date</Form.Label>

                  <Controller
                    name='dueDate'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          type='date'
                          id='dueDate'
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />

                        {formErrors && formErrors.dueDate?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.dueDate?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md='3'>
                  <Form.Label htmlFor='isDefault'>Default</Form.Label>

                  <Controller
                    name='isDefault'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Check
                          {...field}
                          id='isDefault'
                          type='checkbox'
                          checked={field.value}
                          label='Make this the default environmental?'
                        />
                      </>
                    )}
                  />
                </Form.Group>

                {isDefault && (
                  <Form.Group as={Col} md='3'>
                    <Form.Label htmlFor='field'>Field</Form.Label>

                    <Controller
                      name='field'
                      control={form.control}
                      render={({ field }) => (
                        <>
                          <div className='d-flex flex-column gap-1'>
                            <Select
                              {...field}
                              inputId='field'
                              instanceId='field'
                              onChange={(option) => field.onChange(option)}
                              formatOptionLabel={formatEnvironmentalFieldOptionLabel}
                              options={ENVIRONMENTAL_DEFAULT_FIELD_OPTIONS}
                              placeholder='Search by field'
                              noOptionsMessage={() => 'No field found'}
                            />
                            <p className='text-muted fs-6 mb-0'>Only one default per field</p>
                          </div>

                          {formErrors && formErrors.field?.message && (
                            <Form.Text className='text-danger'>
                              {formErrors.field?.message}
                            </Form.Text>
                          )}
                        </>
                      )}
                    />
                  </Form.Group>
                )}
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() => router.push('/calibration-references/mass/environmental')}
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

export default EnvironmentalForm;

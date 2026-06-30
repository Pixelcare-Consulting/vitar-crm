import { TooltipContent } from '@/components/common/ToolTipContent';
import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { cmcSchema } from '@/schema/calibrationReferences';
import { SCOPE_TYPE } from '@/schema/job';
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
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const CmcForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);
  const [locationOptions] = useState(SCOPE_TYPE.map((scope) => ({ value: scope, label: _.startCase(scope) }))); //prettier-ignore

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(cmcSchema), ...data },
    resolver: zodResolver(cmcSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (
        !data ||
        data?.description !== formData.description ||
        data?.type !== formData.type ||
        data?.no !== formData.no ||
        data?.location !== formData.location
      ) {
        //* check if cmc code exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000019', 'data'),
          where('description', '==', formData?.description),
          where('type', '==', formData?.type),
          where('no', '==', formData?.no),
          where('location', '==', formData?.location),
          limit(1)
        );

        const cmcSnapshot = await getDocs(q);

        if (!cmcSnapshot.empty) {
          form.setError('no', {
            type: 'custom',
            message: `No. already exist on description "${formData.description}", type "${formData.type}", no. "${formData.no}" and location "${formData.location}"`,
          });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000019', 'data');

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
        window.location.assign(`/calibration-references/temperature-humidity/cmc/create`);
      } else {
        router.push(`/calibration-references/temperature-humidity/cmc/edit-cmc/${formData.refId}`);
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last cmc ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000019', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastCmcRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastCmcRefId + 1).toString().padStart(6, '0')}`);
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

  //* set location if data exist
  useEffect(() => {
    if (data && locationOptions.length > 0) {
      const selectedLocation = locationOptions.find((option) => option.value === data?.location);
      form.setValue('location', selectedLocation);
    }
  }, [JSON.stringify(data), JSON.stringify(locationOptions)]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>CMC Info</h4>
              <p className='text-muted fs-6'>Details about the CMC.</p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Reference Id</Form.Label>
                  <Form.Control type='text' value={form.watch('refId')} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Description' id='description' />

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
                  <Form.Label htmlFor='type'>Type</Form.Label>

                  <Controller
                    name='type'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='type' placeholder='Enter Type' type='string' />

                        {formErrors && formErrors.type?.message && (
                          <Form.Text className='text-danger'>{formErrors.type?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Location' id='location' />

                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent
                          title='Location Search'
                          info={['Search by location type']}
                        />
                      </Tooltip>
                    }
                  >
                    <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                  </OverlayTrigger>

                  <Controller
                    name='location'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Select
                          {...field}
                          inputId='location'
                          instanceId='location'
                          onChange={(option) => field.onChange(option)}
                          options={locationOptions}
                          placeholder='Search by location type'
                          noOptionsMessage={() => 'No locations found'}
                        />

                        {formErrors && formErrors.location?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.location?.message}
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
                  <Form.Label htmlFor='min'>Minimum</Form.Label>

                  <Controller
                    name='min'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='min'
                          placeholder='Enter Minimum'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.min?.message && (
                          <Form.Text className='text-danger'>{formErrors.min?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='max'>Maximum</Form.Label>

                  <Controller
                    name='max'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='max'
                          placeholder='Enter Max'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.max?.message && (
                          <Form.Text className='text-danger'>{formErrors.max?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uncer'>Uncertainty</Form.Label>

                  <Controller
                    name='uncer'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uncer'
                          placeholder='Enter Unceretainty'
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
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() => router.push('/calibration-references/temperature-humidity/cmc')}
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

export default CmcForm;

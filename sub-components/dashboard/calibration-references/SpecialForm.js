import { TooltipContent } from '@/components/common/ToolTipContent';
import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { specialSchema } from '@/schema/calibrationReferences';
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
import { Plus, Save, X } from 'react-bootstrap-icons';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const SpecialForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(specialSchema), ...data },
    resolver: zodResolver(specialSchema),
  });

  const formErrors = form.formState.errors;

  const { fields, append, remove } = useFieldArray({
    name: 'ranges',
    control: form.control,
  });

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.idCode !== formData.idCode) {
        //* check if special idCode exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000020', 'data'),
          where('idCode', '==', formData.idCode),
          limit(1)
        );

        const specialSnapshot = await getDocs(q);

        if (!specialSnapshot.empty) {
          form.setError('idCode', { type: 'custom', message: 'ID Code already exist' });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000020', 'data');

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
        window.location.assign(`/calibration-references/temperature-humidity/special/create`);
      } else {
        router.push(
          `/calibration-references/temperature-humidity/special/edit-special/${formData.refId}`
        );
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  const handleAddRange = () => {
    append({
      min: '',
      max: '',
      r0: '',
      a: '',
      b: '',
      c: '',
    });
  };

  const handleRemoveRange = (index) => {
    remove(index);
  };

  //* query last special ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000020', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastSpecialRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastSpecialRefId + 1).toString().padStart(6, '0')}`);
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

  //* set initial range values if data exist
  useEffect(() => {
    if (!data) {
      handleAddRange();
      handleAddRange();
    }
  }, [JSON.stringify(data)]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>Special Info</h4>
              <p className='text-muted fs-6'>Details about the Special.</p>

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
                  <Form.Label htmlFor='serialNo'>Serial No.</Form.Label>

                  <Controller
                    name='serialNo'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='serialNo'
                          placeholder='Enter Serial No.'
                          type='string'
                        />

                        {formErrors && formErrors.serialNo?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.serialNo?.message}
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
                          type='string'
                        />

                        {formErrors && formErrors.cocNo?.message && (
                          <Form.Text className='text-danger'>{formErrors.cocNo?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='traceable'>Traceable</Form.Label>

                  <Controller
                    name='traceable'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='traceable'
                          placeholder='Enter Traceable'
                          type='string'
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
                  <Form.Label htmlFor='uncer'>Uncertainty</Form.Label>

                  <Controller
                    name='uncer'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uncer'
                          placeholder='Enter Uncertainty'
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

                <Col xs={12} className='mt-3'>
                  <div className='d-flex justify-content-between align-items-center mb-3'>
                    <div>
                      <h5 className='mb-1'>
                        Range Details
                        <span className='text-danger' style={{ marginLeft: '4px', cursor: 'help' }}>
                          *
                        </span>
                      </h5>
                      <p className='text-muted m-0'>Add atleat 1 or more range for the special.</p>

                      {formErrors && formErrors.ranges?.message && (
                        <Form.Text className='text-danger mt-0'>
                          {formErrors.ranges?.message}
                        </Form.Text>
                      )}
                    </div>

                    {/* <Button variant='primary' size='sm' className='ms-2' onClick={handleAddRange}>
                      <Plus size={14} className='me-2' />
                      Add Range
                    </Button> */}
                  </div>
                </Col>

                {fields.length > 0 &&
                  fields.map((_field, i) => (
                    <Card key={_field.id} className='border mb-4 px-0'>
                      <Card.Header className='d-flex justify-content-between align-items-center bg-light'>
                        <div className='d-flex gap-2 align-items-end'>
                          <h6 className='mb-0'>Range #{i + 1}</h6>
                        </div>

                        {/* {i > 0 && (
                          <Button
                            variant='link'
                            className='p-0'
                            onClick={() => handleRemoveRange(i)}
                          >
                            <X size={20} className='text-danger' />
                          </Button>
                        )} */}
                      </Card.Header>

                      <Card.Body>
                        <Row>
                          <Form.Group as={Col} md={4}>
                            <Form.Label htmlFor={`ranges.${i}.min`}>Minimum</Form.Label>

                            <Controller
                              name={`ranges.${i}.min`}
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <Form.Control
                                    {...field}
                                    id={`ranges.${i}.min`}
                                    placeholder='Enter Minimum'
                                    type='number'
                                    step='any'
                                  />

                                  {formErrors && formErrors.ranges?.[i]?.min?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors.ranges?.[i]?.min?.message}
                                    </Form.Text>
                                  )}
                                </>
                              )}
                            />
                          </Form.Group>

                          <Form.Group as={Col} md={4}>
                            <Form.Label htmlFor={`ranges.${i}.max`}>Maximum</Form.Label>

                            <Controller
                              name={`ranges.${i}.max`}
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <Form.Control
                                    {...field}
                                    id={`ranges.${i}.max`}
                                    placeholder='Enter Maximum'
                                    type='number'
                                    step='any'
                                  />

                                  {formErrors && formErrors.ranges?.[i]?.max?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors.ranges?.[i]?.max?.message}
                                    </Form.Text>
                                  )}
                                </>
                              )}
                            />
                          </Form.Group>

                          <Form.Group as={Col} md={4}>
                            <Form.Label htmlFor={`ranges.${i}.r0`}>R(0°C)</Form.Label>

                            <Controller
                              name={`ranges.${i}.r0`}
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <Form.Control
                                    {...field}
                                    id={`ranges.${i}.r0`}
                                    placeholder='Enter R(0°C)'
                                    type='number'
                                    step='any'
                                  />

                                  {formErrors && formErrors.ranges?.[i]?.r0?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors.ranges?.[i]?.r0?.message}
                                    </Form.Text>
                                  )}
                                </>
                              )}
                            />
                          </Form.Group>

                          <Col xs={12} className='my-4'>
                            <h4 className='mb-0'>
                              W(t) = 1 + A(<i>t</i>/100) + B(<i>t </i>/100)<sp>2</sp> + C(<i>t</i>
                              /100)<sup>3</sup>
                            </h4>
                          </Col>

                          <Form.Group as={Col} md={4}>
                            <Form.Label htmlFor={`ranges.${i}.a`}>A</Form.Label>

                            <Controller
                              name={`ranges.${i}.a`}
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <Form.Control
                                    {...field}
                                    id={`ranges.${i}.a`}
                                    placeholder='Enter A'
                                    type='number'
                                    step='any'
                                  />

                                  {formErrors && formErrors.ranges?.[i]?.a?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors.ranges?.[i]?.a?.message}
                                    </Form.Text>
                                  )}
                                </>
                              )}
                            />
                          </Form.Group>

                          <Form.Group as={Col} md={4}>
                            <Form.Label htmlFor={`ranges.${i}.b`}>B</Form.Label>

                            <Controller
                              name={`ranges.${i}.b`}
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <Form.Control
                                    {...field}
                                    id={`ranges.${i}.b`}
                                    placeholder='Enter B'
                                    type='number'
                                    step='any'
                                  />

                                  {formErrors && formErrors.ranges?.[i]?.b?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors.ranges?.[i]?.b?.message}
                                    </Form.Text>
                                  )}
                                </>
                              )}
                            />
                          </Form.Group>

                          <Form.Group as={Col} md={4}>
                            <Form.Label htmlFor={`ranges.${i}.c`}>C</Form.Label>

                            <Controller
                              name={`ranges.${i}.c`}
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <Form.Control
                                    {...field}
                                    id={`ranges.${i}.c`}
                                    placeholder='Enter C'
                                    type='number'
                                    step='any'
                                  />

                                  {formErrors && formErrors.ranges?.[i]?.c?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors.ranges?.[i]?.c?.message}
                                    </Form.Text>
                                  )}
                                </>
                              )}
                            />
                          </Form.Group>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() =>
                    router.push('/calibration-references/temperature-humidity/special')
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

export default SpecialForm;

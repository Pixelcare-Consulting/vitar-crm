import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { materialSchema } from '@/schema/calibrationReferences';
import { toKebabCase } from '@/utils/common';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

const MaterialForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(materialSchema), ...data },
    resolver: zodResolver(materialSchema),
  });

  const material = useWatch({ control: form.control, name: 'material' });

  const formErrors = form.formState.errors;

  const code = useMemo(() => {
    const value = material;
    const kebabCaseValue = toKebabCase(value, true);

    form.setValue('code', kebabCaseValue);
    if (value) form.clearErrors('code');
    return kebabCaseValue;
  }, [material]);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.code !== formData.code) {
        //* check if material code exist
        const q = query(
          collection(db, 'jobCalibrationReferences', 'CR000005', 'data'),
          where('code', '==', formData.code),
          limit(1)
        );

        const materialSnapshot = await getDocs(q);

        if (!materialSnapshot.empty) {
          form.setError('code', {
            type: 'custom',
            message: 'Code already exist',
          });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000005', 'data');

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
        window.location.assign(`/calibration-references/mass/materials/create`);
      } else {
        router.push(`/calibration-references/mass/materials/edit-materials/${formData.refId}`);
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last materials ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000005', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastMaterialRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastMaterialRefId + 1).toString().padStart(6, '0')}`);
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
              <h4 className='mb-0'>Material Info</h4>
              <p className='text-muted fs-6'>Details about the material.</p>

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
                        <Form.Control
                          {...field}
                          value={code}
                          disabled
                          id='code'
                          placeholder='Enter Code'
                          type='string'
                        />

                        <Form.Text className='d-block'>Code must be unique.</Form.Text>

                        {formErrors && formErrors.code?.message && (
                          <Form.Text className='text-danger'>{formErrors.code?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Material' id='material' />

                  <Controller
                    name='material'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='material'
                          placeholder='Enter Material'
                          type='text'
                        />

                        {formErrors && formErrors.material?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.material?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='ptKgMn3'>
                    Density of Test Weight P<sub>t</sub> (kg m<sup>-3</sup>)
                  </Form.Label>

                  <Controller
                    name='ptKgMn3'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='ptKgMn3'
                          placeholder='Enter density of test weight Pt (Kg m-3)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.ptKgMn3?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.ptKgMn3?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uPtKgMn3'>
                    u(P<sub>t</sub>) (kg m<sup>-3</sup>)
                  </Form.Label>

                  <Controller
                    name='uPtKgMn3'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uPtKgMn3'
                          placeholder='Enter U(Pt) (Kg M-3)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uPtKgMn3?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uPtKgMn3?.message}
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
                  onClick={() => router.push('/calibration-references/mass/materials')}
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

export default MaterialForm;

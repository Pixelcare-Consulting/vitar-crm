import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Accordion, Col, Form, Nav, Row, Tab, Tabs } from 'react-bootstrap';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDebug from '@/components/Form/FormDebug';
import CalibrationSummaryForm from './tabls-form/CalibrateSummaryForm';
import CalibrationRefInstrumentForm from './tabls-form/CalibrationRefInstrumentForm';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import { CardList, ExclamationTriangleFill } from 'react-bootstrap-icons';
import useMounted from '@/hooks/useMounted';
import { useNotifications } from '@/hooks/useNotifications';

import { CATEGORY_VARIANTS_MAP } from '@/schema/calibrations/common-index';
import { calibrationSummarySchema } from '@/schema/calibrations/common-schema';
import WBCalibrationMeasurementsForm from './tabls-form/mass/weight-balance/WBCalibrationMeasurementsForm';
import WBCalibrationTemplateForm from './tabls-form/mass/weight-balance/WBCalibrationTemplateForm';
import SWCalibrationMeasurementsForm from './tabls-form/mass/standard-weight/SWCalibrationMeasurementsForm';
import SWCalibrationTemplateForm from './tabls-form/mass/standard-weight/SWCalibrationTemplateForm';
import THRCalibrationMeasurementsForm from './tabls-form/temperature-humidity/thermocouple/THRCalibrationMeasurementsForm';
import THRCalibrationTemplateForm from './tabls-form/temperature-humidity/thermocouple/THRCalibrationTemplateForm';

const CalibrationForm = ({ data, isAdmin = true, calibrations }) => {
  const auth = useAuth();
  const isMounted = useMounted();

  const router = useRouter();
  const { jobId, workerId } = router.query;

  const notifications = useNotifications();

  //? tabSchema will be based of what category is selected and variant is selected and mainly the schema associated with the variant
  const [tabSchema, setTabsSchema1] = useState([calibrationSummarySchema]);
  const [finalSchema, setFinalSchema] = useState(calibrationSummarySchema);
  const tabsLength = useMemo(() => tabSchema?.length ? tabSchema?.length - 1: 1, [JSON.stringify(tabSchema)]); //prettier-ignore

  const [job, setJob] = useState({
    data: null,
    isLoading: true,
    isError: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeKey, setActiveKey] = useState('0');
  const [reminded, setReminded] = useState(false);

  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [isLoadingClearCache, setIsLoadingClearCache] = useState(false);

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? calibrationSummarySchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      ...getFormDefaultValues(schema),
      ...data,
      variant: '',
      traceabilityCalibrationLab: null,
      cocInstruments: [],
      data: [],
      rangeDetails: [],
    },
    resolver: zodResolver(schema),
  });

  const category = useWatch({ control: form.control, name: 'category' });
  const variant = useWatch({ control: form.control, name: 'variant' });

  const formErrors = form.formState.errors;

  const calibratedCustomerEquipmentIds = useMemo(() => {
    if (!calibrations) return [];

    return calibrations?.data?.map((c) => c?.description?.id || '').filter(Boolean) || [];
  }, [calibrations]);

  const hasDuplicate = (array) => {
    const seen = new Set();
    const duplicates = new Set();

    for (const value of array) {
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    }

    return duplicates.size > 0 ? Array.from(duplicates) : [];
  };

  const validateWBCalibrationPointsData = (calibrationPoints) => {
    if (!calibrationPoints) return [];

    let conflict = [];
    const classes = ['E2', 'ST-MW', '1st F1', '2nd F1'];

    calibrationPoints.forEach((point, index) => {
      point.data.forEach((slot, slotIndex) => {
        const duplicates = hasDuplicate(slot);

        if (duplicates.length > 0) {
          conflict.push({
            pointIndex: index,
            slotIndex: slotIndex,
            values: slot,
            duplicates: duplicates,
            message: `Duplicate value(s) in calibration point #${index + 1}, slot ${
              classes[slotIndex]
            }`,
          });
        }
      });
    });

    return conflict;
  };

  const handleNext = useCallback(async () => {
    //* only trigger form.trigger at top if its not the final part of form becauase it clears all errors which is not needed
    if (
      (Number(activeKey) === 0 && tabSchema.length - 1 === 0) ||
      Number(activeKey) < tabSchema.length - 1
    ) {
      const isValid = await form.trigger();

      if (!isValid) {
        toast.error('Please fix the errors in the form and try again.', {
          position: 'top-right',
        });
        return;
      }
    }

    const categoryValue = typeof category === 'object' ? category?.value : category;
    const variantValue = typeof variant === 'object' ? variant?.value : variant;

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1 && tabSchema.length > 1) {
        await form.trigger(); //* trigger validation for the current tab to show errros if any
        const formValues = form.getValues();
        const parseData = finalSchema.safeParse(formValues);

        console.log({ formValues, categoryValue, variantValue });
        // return;

        // console.log({ parseData });

        if (parseData.success) {
          const formData = parseData.data;

          //* check conflict
          const formCData = formData?.data || [];

          //* do checkings based on the selected category and variant
          switch (categoryValue) {
            case 'MASS': {
              //* checkings/validation for Mass - weight-balance
              if (variantValue === 'weight-balance') {
                const rangeConflicts = formCData.map((cData) => {
                  return validateWBCalibrationPointsData(cData?.dfnv?.[0]?.calibrationPoints);
                });

                //* check if any of the range has conflict show popup
                if (rangeConflicts.some((c) => c.length > 0)) {
                  console.log({ rangeConflicts });

                  setActiveKey((prev) => prev - 1);
                  setIsLoading(false);

                  //* Swal popup with range conflict, using accordion
                  await withReactContent(Swal).fire({
                    title: 'Duplicate Value Error',
                    icon: 'error',
                    showConfirmButton: false,
                    showCloseButton: true,
                    cancelButtonText: 'Ok',
                    width: '600px',
                    html: (
                      <Tab.Container defaultActiveKey='0'>
                        <Row>
                          <Col className='px-0' xs={12}>
                            <Nav
                              variant='pills'
                              className='d-flex justify-content-center align-items-center gap-3'
                            >
                              {rangeConflicts?.length > 0 &&
                                Array.from({ length: rangeConflicts?.length }).map(
                                  (_, rangeConflictIndex) => (
                                    <Nav.Item
                                      key={`${rangeConflictIndex}-nav-item`}
                                      className='d-flex align-items-center'
                                    >
                                      <Nav.Link eventKey={`${rangeConflictIndex}`}>
                                        <CardList size={18} />
                                        Range {rangeConflictIndex + 1}
                                      </Nav.Link>
                                    </Nav.Item>
                                  )
                                )}
                            </Nav>
                          </Col>

                          <Col xs={12}>
                            <Tab.Content>
                              {rangeConflicts.map((conflicts, rangeConflictIndex) => {
                                return (
                                  <Tab.Pane
                                    key={`${rangeConflictIndex}-tab-pane-range-conflict`}
                                    className='h-100'
                                    eventKey={rangeConflictIndex}
                                  >
                                    <div className='fs-5 mt-3'>
                                      The following calibration points have duplicate values. Please
                                      fix the errors and try again.
                                    </div>

                                    <Accordion className='mt-4'>
                                      {conflicts.length > 0 ? (
                                        conflicts.map((conflict, i) => (
                                          <Accordion.Item eventKey={`${i}-${conflict.pointIndex}`}>
                                            <Accordion.Header className='text-danger'>
                                              <ExclamationTriangleFill className='me-3' size={17} />
                                              {conflict.message}
                                            </Accordion.Header>
                                            <Accordion.Body className='fs-6'>
                                              <div className='d-flex flex-column align-items-start gap-2'>
                                                <div>
                                                  <span className='fw-bold me-2'>Duplicates:</span>{' '}
                                                  {conflict?.duplicates?.join(', ')}
                                                </div>
                                                <div>
                                                  <span className='fw-bold me-2'>Values:</span>{' '}
                                                  {conflict?.values?.join(', ')}
                                                </div>
                                              </div>
                                            </Accordion.Body>
                                          </Accordion.Item>
                                        ))
                                      ) : (
                                        <div className='text-center fs-5'>No conflict found</div>
                                      )}
                                    </Accordion>
                                  </Tab.Pane>
                                );
                              })}
                            </Tab.Content>
                          </Col>
                        </Row>
                      </Tab.Container>
                    ),
                  });

                  return;
                }

                const formValueCData = formValues?.data || [];
                let dfnvHasData = true;

                const filterNullUndefined = (v) => v !== null && v !== undefined && v !== '';

                // prettier-ignore
                if (
                    formValues.data?.dfnv?.[0]?.calibrationPoints?.length === 0 || 
                    formValues.data?.dfnv?.[0]?.calibrationPoints?.every((point) => point?.data?.filter(filterNullUndefined).every((columnData) => columnData?.filter(filterNullUndefined).length === 0)) || 
                    formValues?.data?.nominalValues?.filter(filterNullUndefined).length === 0 ||
                    formValues?.data?.measuredValues?.filter(filterNullUndefined).every((mValues) =>mValues?.filter(filterNullUndefined).length === 0)
                  ) {
                    dfnvHasData = false;
                  }

                //* check if some of the range data dont have dfnv data then dfnvHasData will be false,
                dfnvHasData = !formValueCData.some((fcData) => {
                  // prettier-ignore
                  if (
                      fcData?.dfnv?.[0]?.calibrationPoints?.length === 0 ||
                      fcData?.dfnv?.[0]?.calibrationPoints?.every((point) => point?.data ?.filter(filterNullUndefined) .every((columnData) => columnData?.filter(filterNullUndefined).length === 0)) ||
                      fcData?.nominalValues?.filter(filterNullUndefined).length === 0 ||
                      fcData?.measuredValues ?.filter(filterNullUndefined).every((mValues) => mValues?.filter(filterNullUndefined).length === 0)
                    ) {
                      return true;
                    }
                });

                //* check if there are some of the range that dont have dfnv data, no nominal values , measuredValues and the other measurement show popup
                if (
                  !reminded &&
                  (!dfnvHasData ||
                    (!formValues.minTemperature && !formValues.minTemperature !== 0) ||
                    (!formValues.maxTemperature && !formValues.maxTemperature !== 0) ||
                    (!formValues.minRHumidity && !formValues.minRHumidity !== 0) ||
                    (!formValues.maxRHumidity && !formValues.maxRHumidity !== 0) ||
                    formValueCData.some((fcData) => !fcData?.typeOfBalance))
                ) {
                  await Swal.fire({
                    title: 'Reminder!',
                    text: 'Please fill-in the data in "Departure From Nominal Value (g)" and "Other Measurements"',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Ok',
                    customClass: {
                      confirmButton: 'btn btn-primary rounded',
                    },
                  }).then((data) => {
                    if (data.isConfirmed) {
                      setReminded(true);
                      setActiveKey((prev) => prev - 1);
                    }
                  });

                  return;
                }
              }

              if (variantValue === 'standard-weight') {
                const weights = formCData?.map((cData) => cData?.weights || [])?.filter(Boolean) || []; //prettier-ignore

                console.log('trigger... standard weight', { weights });

                //* check if some og the point dont have weights, if so show popup
                if (!reminded && weights.some((w) => w.length < 1)) {
                  await Swal.fire({
                    title: 'Reminder!',
                    text: 'Please fill-in the data in "Weight(s) Used"',
                    icon: 'warning',
                    showCancelButton: false,
                    confirmButtonText: 'Ok',
                    customClass: {
                      confirmButton: 'btn btn-primary rounded',
                    },
                  }).then((data) => {
                    if (data.isConfirmed) {
                      setReminded(true);
                      setActiveKey((prev) => prev - 1);
                    }
                  });

                  return;
                }
              }
            }
          }

          handleSubmit(formData);
        } else {
          toast.error('Failed to parse data. Please try again later.');
          setActiveKey((prev) => prev - 1);
        }
      }
    }
  }, [activeKey, JSON.stringify(tabSchema), JSON.stringify(category), JSON.stringify(variant)]);

  const handlePrevious = useCallback(() => {
    if (Number(activeKey) > 0) handleOnSelect(activeKey - 1);
  }, [activeKey]);

  const getResult = (formData) => {
    const category = formData?.category;
    const variant = formData?.variant;

    if (!category || !variant) return null;

    const formCalibrationData = formData?.data || [];

    switch (category) {
      case 'TEMPERATURE & HUMIDITY': {
        if (variant === 'thermocouple') {
          return {
            corrections: formData?.corrections || [],
            resultCorrections: formData?.resultCorrections || [],
            coverageFactors: formData?.coverageFactors || [],
            expandedUncertainties: formData?.expandedUncertainties || [],
            resultEsts: formData?.resultEsts || [],
            resultInfoEst: formData?.resultInfoEst || 0,
            resultInfoK: formData?.resultInfoK || 0,
            resultExpandedUncertainties: formData?.resultExpandedUncertainties || [],
            refReadingSummaries: formData?.refReadingSummaries || [],
            testBefAdjReadingSummaries: formData?.testBefAdjReadingSummaries || [],
          };
        }

        return null;
      }

      case 'MASS': {
        if (variant === 'weight-balance') {
          return formCalibrationData.map((cData, i) => {
            const rangeDetails = formData?.rangeDetails || [];
            const currentRange = rangeDetails.find((_, rIndex) => rIndex === i);

            return {
              nominalValues: cData?.nominalValues || [],
              measuredValuesM: cData?.measuredValuesM || [],
              corrections: cData?.corrections || [],
              expandedUncertainties: cData?.expandedUncertainties || [],
              rangeType: formData?.rangeType || 'single',
              resolution: !isNaN(parseFloat(currentRange?.resolution))
                ? parseFloat(currentRange?.resolution)
                : 0,
              rtestMaxError: cData?.rtest?.maxError || 0,
            };
          });
        }

        if (variant === 'standard-weight') {
          return {
            nominalValues: formData?.nominalValues || [],
            isNominalValueWithAsterisks: formData?.isNominalValueWithAsterisks || [],
            resultExpandedUncertainties: formData?.resultExpandedUncertainties || [],
            conventionalValues: formData?.conventionalValues || [],
            mpes: formData?.mpes || [],
            unitsUsedForCOC: formData?.unitsUsedForCOC || [],
            coverageFactors: formData?.coverageFactors || [],
            massComparatorUsedRefIds:
              formData?.massComparatorRefEquipment?.map((eq) => eq?.id).filter(Boolean) || [],
          };
        }

        return null;
      }
    }

    return null;
  };

  const handleSubmit = useCallback(
    async ({ massComparatorRefEquipment, ...formData }) => {
      try {
        setIsLoading(true);

        const results = getResult({ ...formData, massComparatorRefEquipment });

        const promises = [
          setDoc(
            doc(db, 'jobCalibrations', formData.calibrateId),
            {
              ...formData,
              ...(data &&
                data?.status === 'data-rejected' && {
                  status: 'data-resubmission',
                }),
              approvedSignatory: {
                id: formData.approvedSignatory.id,
                name: formData.approvedSignatory.name,
              },
              data: JSON.stringify(formData.data),
              ...(!data && {
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser,
              }),
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            },
            { merge: true }
          ),
          setDoc(
            doc(db, 'jobCertificates', formData.calibrateId),
            {
              results,
              jobId: formData.jobId,
              calibrateId: formData.calibrateId,
              certificateNumber: formData.certificateNumber,
              ...(!data && {
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser,
              }),
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            },
            { merge: true }
          ),
        ];

        await Promise.all(promises);

        if (!data) {
          //* create notification for admin and supervisor when created a calibration
          await notifications.create({
            module: 'calibration',
            target: ['admin', 'supervisor'],
            title: 'New calibration created',
            message: `
             A new calibration (#${formData.calibrateId}) has been created by ${auth.currentUser.displayName} for job (#${formData.jobId}) and calibrated by ${formData.calibratedBy.name}.`,
            data: {
              redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
            },
          });
        } else {
          //* create notification for admin and supervisor when updated a calibration
          await notifications.create({
            module: 'calibration',
            target: ['admin', 'supervisor'],
            title: 'Calibration updated',
            message: `
             A calibration (#${formData.calibrateId}) has been updated by ${auth.currentUser.displayName} for job (#${formData.jobId}) and calibrated by ${formData.calibratedBy.name}.`,
            data: {
              redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
            },
          });

          if (data?.status === 'data-rejected') {
            //* create notification for admin and supervisor when updated a calibration status to resubmission
            notifications.create({
              module: 'calibration',
              target: ['admin', 'supervisor'],
              title: 'Calibration status updated',
              message: `Calibration (#${formData.calibrateId}) status was updated by ${auth.currentUser.displayName} to "Data Resubmission".`, //prettier-ignore
              data: {
                redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
              },
            });
          }
        }

        //* create notification for assigned approved signatory
        if (formData?.approvedSignatory?.uid) {
          await notifications.create({
            module: 'calibration',
            target: [formData.approvedSignatory.uid],
            title: `You are assigned as an approved signatory`,
            message: `
             A calibration (#${formData.calibrateId}) has been assigned to you by ${auth.currentUser.displayName} for job (#${formData.jobId}).`,
            data: {
              redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
            },
          });
        }

        toast.success(`Calibration ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore

        setTimeout(() => {
          if (isAdmin) {
            window.location.assign(
              `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`
            );
          } else {
            workerId &&
              window.location.assign(
                `/user/${workerId}/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`
              );
          }
        }, 1500);

        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      } catch (error) {
        console.error('Error submitting calibraiton:', error);
        toast.error('Something went wrong. Please try again later.');
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      }
    },
    [data, formErrors]
  );

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', {
        position: 'top-right',
      });
      return;
    }

    setActiveKey(key);
  };

  const handleLoadDataCache = useCallback(async () => {
    setIsLoadingCache(true);

    const calibrationId = data?.calibrateId;
    const cacheKey = `calibration-${auth.currentUser.uid}-${auth.workerId}${calibrationId ? `-${calibrationId}` : ''}`; //prettier-ignore
    const cachedData = localStorage.getItem(cacheKey);

    //TODO: Handle Cashe based on Calibration 'Category' and 'Variants' and other respective differences per variants

    if (cachedData) {
      const formData = JSON.parse(cachedData);

      const fieldToRestore = [
        { delay: 500, group: [{ name: 'category', value: formData.category }] },
        {
          delay: 500,
          group: [
            { name: 'certificateNumber', value: formData.certificateNumber },
            { name: 'serialNumber', value: formData.serialNumber },
          ],
        },
        {
          delay: 500,
          group: [{ name: 'description', value: formData.description }],
        },
        {
          delay: 500,
          group: [{ name: 'dateCalibrated', value: formData.dateCalibrated }],
        },
        {
          delay: 500,
          group: [{ name: 'dueDateRequested', value: formData.dueDateRequested }],
        },
        {
          delay: 500,
          group: [
            { name: 'dueDateDuration', value: formData.dueDateDuration },
            { name: 'dueDate', value: formData.dueDate },
          ],
        },
        {
          delay: 500,
          group: [{ name: 'rangeType', value: formData.rangeType }],
        },
        {
          delay: 500,
          group: [
            {
              name: 'rangeMinCalibration',
              value: formData.rangeMinCalibration,
            },
            {
              name: 'rangeMaxCalibration',
              value: formData.rangeMaxCalibration,
            },
          ],
        },
        {
          delay: 500,
          group: [
            { name: 'traceabilityType', value: formData.traceabilityType },
            {
              name: 'traceabilityCountry',
              value: formData.traceabilityCountry,
            },
            {
              name: 'traceabilityCalibrationLab',
              value: formData.traceabilityCalibrationLab,
            },
            {
              name: 'traceabilityAccreditationBody',
              value: formData.traceabilityAccreditationBody,
            },
          ],
        },
        {
          delay: 1000,
          group: [{ name: 'resolution', value: formData.resolution }],
        },
        {
          delay: 2500,
          group: [
            { name: 'unitUsedForCOC', value: formData.unitUsedForCOC },
            { name: 'calibrationPointNo', value: formData.calibrationPointNo },
            { name: 'instruments', value: formData.instruments },
            { name: 'cocInstruments', value: formData.cocInstruments },
          ],
        },
        { delay: 1000, group: [{ name: 'data', value: formData.data }] },
      ];

      //* restore form data with delays
      for (const fieldGroup of fieldToRestore) {
        for (const field of fieldGroup.group) {
          form.setValue(field.name, field.value);
          delete formData[field.name];
        }

        await new Promise((resolve) => setTimeout(resolve, fieldGroup.delay));
      }

      //* Reset remaining form values if any
      form.reset((formValues) => ({ ...formValues, ...formData }));
      toast.success('Data cache loaded successfully.');
    } else toast.error('Failed to load data cache. Please try again later.');

    setIsLoadingCache(false);
  }, [auth, data]);

  const handleClearCache = useCallback(async () => {
    setIsLoadingClearCache(true);

    const calibrationId = data?.calibrateId;
    const cacheKey = `calibration-${auth.currentUser.uid}-${auth.workerId}${calibrationId ? `-${calibrationId}` : ''}`; //prettier-ignore
    const cachedData = localStorage.getItem(cacheKey);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    if (cachedData) {
      localStorage.removeItem(cacheKey);
      toast.success('Data cache cleared successfully.');
    } else toast.error('Failed to clear data cache. Please try again later.');

    setIsLoadingClearCache(false);
  }, [auth, data]);

  const renderTabs = (props) => {
    if (!category || !variant) return null;

    const categoryValue = typeof category === 'object' ? category?.value : category;
    const variantValue = typeof variant === 'object' ? variant?.value : variant;

    if (!categoryValue || !variantValue) return null;

    switch (categoryValue) {
      case 'TEMPERATURE & HUMIDITY': {
        if (variantValue === 'thermocouple') {
          return [
            <Tab eventKey='1' title='Measurements'>
              <THRCalibrationMeasurementsForm {...props} />
            </Tab>,

            <Tab eventKey='2' title='Reference Instruments'>
              <CalibrationRefInstrumentForm {...props} />
            </Tab>,

            <Tab eventKey='3' title='Calibration'>
              <THRCalibrationTemplateForm {...props} />
            </Tab>,
          ];
        }
      }

      case 'MASS': {
        if (variantValue === 'weight-balance') {
          return [
            <Tab eventKey='1' title='Measurements'>
              <WBCalibrationMeasurementsForm {...props} />
            </Tab>,

            <Tab eventKey='2' title='Reference Instruments'>
              <CalibrationRefInstrumentForm {...props} />
            </Tab>,

            <Tab eventKey='3' title='Calibration'>
              <WBCalibrationTemplateForm {...props} />
            </Tab>,
          ];
        }

        if (variantValue === 'standard-weight') {
          return [
            <Tab eventKey='1' title='Measurements'>
              <SWCalibrationMeasurementsForm {...props} />
            </Tab>,

            <Tab eventKey='2' title='Reference Instruments'>
              <CalibrationRefInstrumentForm {...props} />
            </Tab>,

            <Tab eventKey='3' title='Calibration'>
              <SWCalibrationTemplateForm {...props} />
            </Tab>,
          ];
        }
      }

      default:
        return null;
    }
  };

  //* set tabs schemas and final schema
  useEffect(() => {
    if (!category || !variant) return;

    const categoryValue = typeof category === 'object' ? category?.value : category;
    const variantValue = typeof variant === 'object' ? variant?.value : variant;

    const variantObj = CATEGORY_VARIANTS_MAP?.[categoryValue]?.find((variantObj) =>  variantObj?.value === variantValue); //prettier-ignore
    const schema = variantObj?.schema;
    const schemas = variantObj?.schemas || [];

    if (!variantObj || schemas?.length < 1) return;

    setTabsSchema1(schemas);
    setFinalSchema(schema);
  }, [JSON.stringify(category), JSON.stringify(variant)]);

  //* query job
  useEffect(() => {
    if (jobId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);
      const jobDetailsRef = doc(db, 'jobDetails', jobId);

      Promise.all([getDoc(jobHeaderRef), getDoc(jobDetailsRef)])
        .then(([jobHeader, jobDetails]) => {
          if (jobHeader.exists() && jobDetails.exists()) {
            setJob({
              data: {
                id: jobHeader.id,
                ...jobHeader.data(),
                ...jobDetails.data(),
              },
              isLoading: false,
              isError: false,
            });

            form.setValue('jobId', jobHeader.id);
            return;
          }

          setJob({ data: null, isLoading: false, isError: false });
        })
        .catch((err) => {
          console.error(err.message);
          setJob({ data: null, isLoading: false, isError: true });
        });
    }
  }, [jobId]);

  //* store form data into cache
  useEffect(() => {
    if (auth.currentUser && isMounted && form.formState.isDirty && !isLoadingCache) {
      const calibrationId = data?.calibrateId;
      const cacheKey = `calibration-${auth.currentUser.uid}-${auth.workerId}${calibrationId ? `-${calibrationId}` : ''}`; //prettier-ignore
      localStorage.setItem(cacheKey, JSON.stringify(form.getValues()));
    }
  }, [JSON.stringify(form.watch()), auth, data, isLoadingCache]);

  // useEffect(() => {
  //   console.log({ formValues: form.getValues() });
  // }, [form.watch()]);

  // console.log({ data, jobCalibrations: calibrations, calibratedCustomerEquipmentIds });

  return (
    <>
      {/* <FormDebug
        form={form}
        keys={
          [
            // 'minTemperature',
            // 'maxTemperature',
            // 'minRHumidity',
            // 'maxRHumidity',
            // 'minAPressure',
            // 'maxAPressure',
            // 'testWeightNo',
            // 'unitUsedForCOC',
            // 'material',
            // 'ptKgMn3',
            // 'uPtKgMn3',
            // 'data',
            // 'data.weights',
            // 'densityOfMoistAir',
            // 'accuracyClass',
            // `data.${0}`,
            // 'envUP',
            // 'envUT',
            // 'envUHr',
            // 'ck',
            // 'data',
            // 'coverageFactors',
            // 'expandedUncertainties',
            // 'ck',
            // 'accuracyClass',
            // 'instruments',
            // 'unitsUsedForCOC',
            // 'mpes',
          ]
        }
      /> */}
      {/* <FormDebug form={form} keys={['refDecimal']} /> */}

      {/* //* Render specific tabs based on the category and variant selected */}
      <FormProvider {...form}>
        <Form>
          <Tabs
            id='calibration-tab'
            activeKey={activeKey > tabsLength ? tabsLength : activeKey}
            onSelect={handleOnSelect}
          >
            <Tab eventKey='0' title='Summary'>
              <CalibrationSummaryForm
                job={job}
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                isAdmin={isAdmin}
                handleLoadDataCache={handleLoadDataCache}
                handleClearCache={handleClearCache}
                isLoadingCache={isLoadingCache}
                isLoadingClearCache={isLoadingClearCache}
                calibratedCustomerEquipmentIds={calibratedCustomerEquipmentIds}
              />
            </Tab>

            {renderTabs({
              category,
              variant,
              job,
              data,
              isLoading,
              handleNext,
              handlePrevious,
              isAdmin,
              handleLoadDataCache,
              handleClearCache,
              isLoadingCache,
              isLoadingClearCache,
              calibratedCustomerEquipmentIds,
            })}
          </Tabs>
        </Form>
      </FormProvider>
    </>
  );
};

export default CalibrationForm;

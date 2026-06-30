import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import {
  Badge,
  Card,
  Col,
  Form,
  Nav,
  OverlayTrigger,
  Row,
  Tab,
  Table,
  Tooltip,
} from 'react-bootstrap';
import { safeParseFloat } from '@/utils/common';
import { Database } from 'react-bootstrap-icons';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { TooltipContent } from '@/components/common/ToolTipContent';
import Select from '@/components/Form/Select';

import styles from '../../../mass.module.css';

import {
  IMMER,
  MAXIMUM_RANGE_OF_CALIBRATION,
  MAXIMUM_REF_TEST_LENGTH,
  REF_IND_UOM,
  REF_THER_UOM,
} from '@/schema/calibrations/temperature-humidity/thermocouple';
import FormDebug from '@/components/Form/FormDebug';

const THRTestData = ({ data }) => {
  const isMounted = useRef(false);

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const refTherData = useWatch({ name: 'therData' }) || [];
  const meter = useWatch({ name: 'meter' }) || [];
  const extensionsData = useWatch({ name: 'extensionsData' }) || [];
  const bathData = useWatch({ name: 'bathData' }) || [];
  const rangeOfCalibrationFormValue = useWatch({ name: 'rangeOfCalibration' });

  const [refTherUomOptions] = useState(REF_THER_UOM.map((refTherUom) => ({ value: refTherUom, label: refTherUom }))); //prettier-ignore
  const [refIndUomOptions] = useState(REF_IND_UOM.map((refIndUom) => ({ value: refIndUom, label: refIndUom }))); //prettier-ignore
  const [immerOptions] = useState(IMMER.map((immer) => ({ value: immer, label: immer }))); //prettier-ignore

  const rangeOfCalibration = useMemo(() => {
    return safeParseFloat(rangeOfCalibrationFormValue);
  }, [rangeOfCalibrationFormValue]);

  const refTherOptions = useMemo(() => {
    if (!refTherData || refTherData?.length < 1) return [];

    return refTherData.map((thr) => ({
      value: thr.id,
      label: thr.idCode || '',
      type: thr?.type || '',
      kFactor: thr?.kFactor,
    }));
  }, [JSON.stringify(refTherData)]);

  const refIndOptions = useMemo(() => {
    if (!meter || meter?.length < 1) return [];

    return meter.map((ind) => ({
      value: ind.id,
      label: ind.code || '',
      type: ind?.type ? (ind?.type === '-' ? '' : ind?.type) : '',
      kFactor: ind?.kFactor,
    }));
  }, [JSON.stringify(meter)]);

  const refWireOptions = useMemo(() => {
    if (!extensionsData || extensionsData?.length < 1) return [];

    return extensionsData.map((ext) => ({
      value: ext.id,
      label: ext.idCode || '',
      kFactor: ext?.kFactor,
      uncerDCelsius: ext?.uncerDCelsius,
      uncerPercentRHumidity: ext?.uncerPercentRHumidity,
    }));
  }, [extensionsData]);

  const bathOptions = useMemo(() => {
    if (!bathData || bathData?.length < 1) return [];

    return bathData.map((bath) => ({
      value: bath.id,
      label: bath.idCode || '',
      no: bath?.no || '',
      stabilityDCelsius: bath?.stabilityDCelsius || '',
      radialDCelsius: bath?.radialDCelsius || '',
      axialDCelsius: bath?.axialDCelsius || '',
      minDCelsius: bath?.minDCelsius || '',
      maxDCelsius: bath?.maxDCelsius || '',
    }));
  }, [bathData]);

  const formatTherOptionLabel = (data) => {
    const therType = data?.type || '';

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>

        <span className='d-flex column-gap-2'>
          {therType && <Badge bg='primary'>{therType}</Badge>}
        </span>
      </div>
    );
  };

  const formatIndOptionLabel = (data) => {
    const indType = data?.type || '';

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>

        <span className='d-flex column-gap-2'>{indType && <Badge bg='info'>{indType}</Badge>}</span>
      </div>
    );
  };

  const numberInputOnWheel = (e) => {
    e.target.blur();
  };

  const handleRefTestDataChange = (e, field) => {
    if (e.target.value === '') {
      field.onChange('');
      return;
    }

    field.onChange(safeParseFloat(e.target.value));
  };

  const formatBathOptionLabel = (data) => {
    const no = data?.no || '';

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>

        <span className='d-flex column-gap-2'>{no && <Badge bg='primary'>{no}</Badge>}</span>
      </div>
    );
  };

  // //* set initial values for calibration data
  useEffect(() => {
    //* if data exist and rangeOfCalibration is the sames as data dont do something, else set initial data
    if (data && safeParseFloat(data?.rangeOfCalibration) == rangeOfCalibration) {
      return;
    }

    if (
      !isMounted.current &&
      rangeOfCalibration &&
      rangeOfCalibration <= MAXIMUM_RANGE_OF_CALIBRATION
    ) {
      isMounted.current = true;

      const initialData = Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => ({
        setting: 0,
        resolution: 0,
        refTher: '',
        refTherUom: '',
        refInd: '',
        refIndUom: '',
        refWire: '',
        testInd: '',
        testWire: '',
        bath: '',
        immer: '',
        refTestData: Array.from({ length: MAXIMUM_REF_TEST_LENGTH }).map(() => [0, 0]),
      }));

      setTimeout(() => {
        form.setValue('data', initialData);
      }, 1000);
    }
  }, [JSON.stringify(data), rangeOfCalibration]);

  return (
    <Tab.Container defaultActiveKey='0'>
      <Row>
        <Col className='px-0' md={12}>
          <Nav variant='pills' className='d-flex justify-content-center gap-3'>
            {rangeOfCalibration &&
              rangeOfCalibration > 0 &&
              Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => (
                <Nav.Item key={`${pointIndex}-nav-item`} className='d-flex align-items-center'>
                  <Nav.Link eventKey={`${pointIndex}`}>
                    <Database size={18} />A{pointIndex + 1}
                  </Nav.Link>
                </Nav.Item>
              ))}
          </Nav>
        </Col>

        <Col md={12} className='ps-0'>
          <Tab.Content className='w-100 h-100'>
            {Array.from({ length: rangeOfCalibration }).map((_, pointIndex) => {
              return (
                <Tab.Pane key={`${pointIndex}-tab-pane`} className='h-100' eventKey={pointIndex}>
                  <Card className='h-100 w-100 shadow-none'>
                    <Card.Body>
                      <h4 className='mb-0'>Test Data {pointIndex + 1}</h4>
                      <p className='text-muted fs-6'>Data inputs for test data {pointIndex + 1}</p>

                      <Row className='mb-4 row-gap-3'>
                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Setting' id={`data.${pointIndex}.setting`} />

                          <Controller
                            name={`data.${pointIndex}.setting`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Form.Control
                                  {...field}
                                  id={`data.${pointIndex}.setting`}
                                  placeholder='Enter Setting'
                                  type='number'
                                  step='any'
                                />

                                {formErrors && formErrors?.data?.[pointIndex]?.setting?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors?.data?.[pointIndex]?.setting?.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Resolution' id={`data.${pointIndex}.resolution`} />

                          <Controller
                            name={`data.${pointIndex}.resolution`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Form.Control
                                  {...field}
                                  id={`data.${pointIndex}.resolution`}
                                  placeholder='Enter resolution'
                                  type='number'
                                  step='any'
                                />

                                {formErrors &&
                                  formErrors?.data?.[pointIndex]?.resolution?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors?.data?.[pointIndex]?.resolution?.message}
                                    </Form.Text>
                                  )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Ref. Ther.' id={`data.${pointIndex}.refTher`} />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Ref. Ther. Search'
                                  info={['Search by ref. ther. id code']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.refTher`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.refTher`}
                                  instanceId={`data.${pointIndex}.refTher`}
                                  onChange={(option) => field.onChange(option)}
                                  formatOptionLabel={formatTherOptionLabel}
                                  options={refTherOptions}
                                  placeholder='Search by ref. ther. id code'
                                  noOptionsMessage={() => 'No ref. ther. found'}
                                />

                                {formErrors && formErrors?.data?.[pointIndex]?.refTher?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors?.data?.[pointIndex]?.refTher?.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel
                            label='Ref. Ther UOM.'
                            id={`data.${pointIndex}.refTherUom`}
                          />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Ref. Ther UOM. Search'
                                  info={['Search by ref. ther. UOM']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.refTherUom`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.refTherUom`}
                                  instanceId={`data.${pointIndex}.refTherUom`}
                                  onChange={(option) => field.onChange(option)}
                                  formatOptionLabel={formatTherOptionLabel}
                                  options={refTherUomOptions}
                                  placeholder='Search by ref. ther. UOM'
                                  noOptionsMessage={() => 'No ref. ther UOM. found'}
                                />

                                {formErrors &&
                                  formErrors?.data?.[pointIndex]?.refTherUom?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors?.data?.[pointIndex]?.refTherUom?.message}
                                    </Form.Text>
                                  )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Ref. Ind.' id={`data.${pointIndex}.refInd`} />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Ref. Ind. Search'
                                  info={['Search by ref. ind. id code']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.refInd`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.refInd`}
                                  instanceId={`data.${pointIndex}.refInd`}
                                  onChange={(option) => field.onChange(option)}
                                  formatOptionLabel={formatIndOptionLabel}
                                  options={refIndOptions}
                                  placeholder='Search by ref. ind. id code'
                                  noOptionsMessage={() => 'No ref. ind. found'}
                                />

                                {formErrors && formErrors?.data?.[pointIndex]?.refInd?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors?.data?.[pointIndex]?.refInd?.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel
                            label='Ref. Ind UOM.'
                            id={`data.${pointIndex}.refIndUom`}
                          />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Ref. Ind UOM. Search'
                                  info={['Search by ref. ind. UOM']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.refIndUom`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.refIndUom`}
                                  instanceId={`data.${pointIndex}.refIndUom`}
                                  onChange={(option) => field.onChange(option)}
                                  formatOptionLabel={formatIndOptionLabel}
                                  options={refIndUomOptions}
                                  placeholder='Search by ref. ind. UOM'
                                  noOptionsMessage={() => 'No ref. ind UOM. found'}
                                />

                                {formErrors &&
                                  formErrors?.data?.[pointIndex]?.refIndUom?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors?.data?.[pointIndex]?.refIndUom?.message}
                                    </Form.Text>
                                  )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Ref. Wire' id={`data.${pointIndex}.refWire`} />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Ref. Wire Search'
                                  info={['Search by ref. wire id code']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.refWire`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.refWire`}
                                  instanceId={`data.${pointIndex}.refWire`}
                                  onChange={(option) => field.onChange(option)}
                                  options={refWireOptions}
                                  placeholder='Search by ref. wire id code'
                                  noOptionsMessage={() => 'No ref. wire found'}
                                />

                                {formErrors && formErrors?.data?.[pointIndex]?.refWire?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors?.data?.[pointIndex]?.refWire?.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Test Ind.' id={`data.${pointIndex}.testInd`} />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Test Ind. Search'
                                  info={['Search by test ind. id code']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.testInd`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.testInd`}
                                  instanceId={`data.${pointIndex}.testInd`}
                                  onChange={(option) => field.onChange(option)}
                                  formatOptionLabel={formatIndOptionLabel}
                                  options={refIndOptions}
                                  placeholder='Search by test ind. id code'
                                  noOptionsMessage={() => 'No test ind. found'}
                                />

                                {formErrors && formErrors?.data?.[pointIndex]?.testInd?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors?.data?.[pointIndex]?.testInd?.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Test Wire' id={`data.${pointIndex}.testWire`} />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Test Wire Search'
                                  info={['Search by test wire id code']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.testWire`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.testWire`}
                                  instanceId={`data.${pointIndex}.testWire`}
                                  onChange={(option) => field.onChange(option)}
                                  options={refWireOptions}
                                  placeholder='Search by test wire id code'
                                  noOptionsMessage={() => 'No test wire found'}
                                />

                                {formErrors &&
                                  formErrors?.data?.[pointIndex]?.testWire?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors?.data?.[pointIndex]?.testWire?.message}
                                    </Form.Text>
                                  )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Bath' id={`data.${pointIndex}.bath`} />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Bath Search'
                                  info={['Search by bath id code']}
                                />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.bath`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.bath`}
                                  instanceId={`data.${pointIndex}.bath`}
                                  onChange={(option) => field.onChange(option)}
                                  formatOptionLabel={formatBathOptionLabel}
                                  options={bathOptions}
                                  placeholder='Search by bath id code'
                                  isDisabled={bathOptions.isLoading}
                                  noOptionsMessage={() => 'No bath found'}
                                />

                                {formErrors && formErrors?.data?.[pointIndex]?.bath?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors?.data?.[pointIndex]?.bath?.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Immer' id={`data.${pointIndex}.immer`} />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent title='Immer Search' info={['Search by immer']} />
                              </Tooltip>
                            }
                          >
                            <i
                              className='fe fe-help-circle text-muted'
                              style={{ cursor: 'pointer' }}
                            />
                          </OverlayTrigger>

                          <Controller
                            name={`data.${pointIndex}.immer`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.immer`}
                                  instanceId={`data.${pointIndex}.immer`}
                                  onChange={(option) => field.onChange(option)}
                                  options={immerOptions}
                                  placeholder='Search by immer'
                                  noOptionsMessage={() => 'No immer found'}
                                />

                                {formErrors && formErrors?.data?.[pointIndex]?.immer?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors?.data?.[pointIndex]?.immer?.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <hr className='my-1' />

                        <Col className='d-flex justify-content-center align-items-center'>
                          <div className='mx-0 border border-primary rounded overflow-hidden w-100'>
                            <Table className='text-center align-middle' bordered responsive>
                              <thead>
                                <tr>
                                  <th>Ref</th>
                                  <th>Test</th>
                                </tr>
                              </thead>

                              <tbody>
                                {Array.from({ length: MAXIMUM_REF_TEST_LENGTH }).map(
                                  (_, rowIndex) => {
                                    return (
                                      <tr key={`${rowIndex}-ref-test-row`}>
                                        <td>
                                          <Controller
                                            name={`data.${pointIndex}.refTestData.${rowIndex}.${0}`}
                                            control={form.control}
                                            render={({ field }) => (
                                              <Form.Control
                                                onChange={(e) => handleRefTestDataChange(e, field)}
                                                onWheel={numberInputOnWheel}
                                                name={field.name}
                                                ref={field.ref}
                                                value={field.value}
                                                className={`${styles.columnData} text-center`}
                                                type='number'
                                              />
                                            )}
                                          />
                                        </td>

                                        <td>
                                          <Controller
                                            name={`data.${pointIndex}.refTestData.${rowIndex}.${1}`}
                                            control={form.control}
                                            render={({ field }) => (
                                              <Form.Control
                                                onChange={(e) => handleRefTestDataChange(e, field)}
                                                onWheel={numberInputOnWheel}
                                                name={field.name}
                                                ref={field.ref}
                                                value={field.value}
                                                className={`${styles.columnData} text-center`}
                                                type='number'
                                              />
                                            )}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </Table>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Tab.Pane>
              );
            })}
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};

export default THRTestData;

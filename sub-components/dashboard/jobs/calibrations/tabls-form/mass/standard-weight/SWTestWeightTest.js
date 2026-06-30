import { useEffect, useMemo, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Card, Col, Form, Nav, OverlayTrigger, Row, Tab, Table, Tooltip } from 'react-bootstrap';
import { safeParseFloat } from '@/utils/common';
import { Database } from 'react-bootstrap-icons';
import {
  MAXIMUM_INSPECTION_POINT,
  NOMINAL_VALUE,
  TAG_ID,
  UNIT_USED_FOR_COC,
} from '@/schema/calibrations/mass/standard-weight';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { TooltipContent } from '@/components/common/ToolTipContent';
import Select from '@/components/Form/Select';

import styles from '../../../mass.module.css';
import { useDebouncedCallback } from 'use-debounce';
import Checkbox from '@/components/common/Checkbox';

const SWTestWeightTest = ({ data }) => {
  const isMounted = useRef(false);

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const materials = useWatch({ control: form.control, name: 'materials' }) || [];
  const material = useWatch({ control: form.control, name: 'material' });
  const testWeightNoValue = useWatch({
    control: form.control,
    name: 'testWeightNo',
  });

  const unitUsedForCOC = useWatch({
    control: form.control,
    name: 'unitUsedForCOC',
  });
  const instruments = useWatch({ control: form.control, name: 'instruments' });
  const cData = useWatch({ control: form.control, name: 'data' });

  const unitUsedForCOCOptions = UNIT_USED_FOR_COC.map((unit) => ({ value: unit, label: unit })); //prettier-ignore
  const tagIdOptions = TAG_ID.map((tagId) => ({ value: tagId, label: tagId })); //prettier-ignore
  const nominalValueOptions = NOMINAL_VALUE.map((nominalValue) => ({ value: nominalValue, label: nominalValue })); //prettier-ignore

  const materialsOptions = useMemo(() => {
    if (!materials || materials.length < 1) return [];
    return materials.map((m) => ({
      value: m.id,
      label: m.material,
      ptKgMn3: m?.ptKgMn3 || '',
      uPtKgMn3: m?.uPtKgMn3 || '',
    }));
  }, [materials]);

  const instrumentsOptions = useMemo(() => {
    if (!instruments || instruments?.length < 1) return [];

    return instruments.map((instrument) => ({
      label: instrument?.description || '',
      value: instrument.id,
      ...instrument,
    }));
  }, [JSON.stringify(instruments)]);

  const testWeightNo = useMemo(() => {
    return safeParseFloat(testWeightNoValue);
  }, [testWeightNoValue]);

  const handleMaterialChange = (option, pointIndex) => {
    form.setValue(`data.${pointIndex}.material`, option || '');
    form.setValue(`data.${pointIndex}.ptKgMn3`, option?.ptKgMn3 || '');
    form.setValue(`data.${pointIndex}.uPtKgMn3`, option?.uPtKgMn3 || '');
    form.clearErrors(`data.${pointIndex}.material`);
  };

  const handleValueOnChange = ({ value, key, weights }) => {
    //* allow only number, dot, and asterisk
    if (/[^0-9.*]/.test(value)) return;

    //* check if value is already exist
    if (weights && Array.isArray(weights) && weights.includes(value)) {
      form.setError(key, { message: 'Duplicate value' });
    } else form.clearErrors(key);

    form.setValue(key, value);
  };

  const handleValueSubmit = ({ value, key, weights, pointIndex }) => {
    const existingDataArray = weights && Array.isArray(weights) ? [...weights] : [];
    const newValue = [...existingDataArray, value];

    console.log({ existingDataArray, newValue });

    //* update data
    form.setValue(`data.${pointIndex}.weights`, newValue);

    //* reset
    form.setValue(key, '');
  };

  const handleEditData = ({ value, key, weights, pointIndex, dataIndex }) => {
    //* allow only number, dot, and asterisk
    if (/[^0-9.*]/.test(value)) {
      form.setError(key, { message: 'Invalid value' });
      return;
    }

    const existingDataArray = weights && Array.isArray(weights) ? [...weights] : [];

    //* replace data from array
    existingDataArray.splice(dataIndex, 1, value);
    //* update data
    form.setValue(`data.${pointIndex}.weights`, existingDataArray);

    //* check if value is already exist
    if (
      value &&
      existingDataArray?.length > 0 &&
      existingDataArray?.includes(value) &&
      existingDataArray.filter((item, index) => item === value && index !== dataIndex).length > 0
    ) {
      form.setError(key, { message: 'Duplicate value' });
    } else form.clearErrors(key);
  };

  const handleRemoveData = ({ key, weights, pointIndex, dataIndex }) => {
    const existingDataArray = weights && Array.isArray(weights) ? [...weights] : [];

    //* remove data from array
    existingDataArray.splice(dataIndex, 1);
    //* update data
    form.setValue(`data.${pointIndex}.weights`, existingDataArray);
    //* clear errors
    form.clearErrors(key);
  };

  const debouncedHandleEditData = useDebouncedCallback(handleEditData, 500);

  const handleOnPasteData = (e) => {
    const pastedText = event.clipboardData.getData('text');
    if (!/[0-9.*]/.test(pastedText)) e.preventDefault();
  };

  const putCursorAtEnd = (target) => {
    //* ensure the cursor is at the end value

    //* Create a new range
    const range = document.createRange();
    //* Create a new selection
    const selection = window.getSelection();

    //* Select the last child node (text node) and set the cursor at the end
    range.selectNodeContents(target);
    range.collapse(false); //* false collapses to the end

    //* Clear any existing selection and add the new range
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleKeyDownData = (e) => {
    //*Allow: Numbers (0-9), Backspace, Arrow keys, Delete, Enter, and Tab.
    if (
      !/[0-9.*]/.test(e.key) &&
      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)
    ) {
      //* Allow Ctrl + A (Select All). Ctrl + C (Copy). Ctrl + V (Paste),
      if (
        (e.ctrlKey && e.key.toLowerCase() === 'a') ||
        (e.ctrlKey && e.key.toLowerCase() === 'c') | (e.ctrlKey && e.key.toLowerCase() === 'v')
      ) {
        return;
      }

      e.preventDefault(); //* Block keypress
    }
  };

  const dataInputOnKeyDown = ({ event, key, weights, pointIndex }) => {
    const value = form.getValues(key);

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      //* check if value is already exist
      if (weights && Array.isArray(weights) && weights.includes(value)) {
        form.setError(key, { message: 'Duplicate value' });
        return;
      }

      handleValueSubmit({ value, key, weights, pointIndex });
    }
  };

  const numberInputOnWheel = (e) => {
    e.target.blur();
  };

  const handleTestWeightDataChange = (e, field) => {
    if (e.target.value === '') {
      field.onChange('');
      return;
    }

    field.onChange(safeParseFloat(e.target.value));
  };

  //* set initial values for calibration data
  useEffect(() => {
    //* if data exist and testWeightNo is the sames as data dont do something, else set initial data
    if (data && safeParseFloat(data?.testWeightNo) == testWeightNo) {
      return;
    }

    if (!isMounted.current && testWeightNo && testWeightNo <= 30) {
      isMounted.current = true;

      const initialData = Array.from({ length: testWeightNo }).map((_, pointIndex) => ({
        unitUsedForCOC: '',
        material: '',
        ptKgMn3: 0,
        uPtKgMn3: 0,
        nominalValue: 0,
        isNominalValueWithAsterisk: false,
        massComparatorRefEquipmentId: '',
        tagId: 0,
        weights: [],
        testWeightData: Array.from({ length: MAXIMUM_INSPECTION_POINT }).map(() => [0, 0, 0, 0]),
      }));

      setTimeout(() => {
        form.setValue('data', initialData);
      }, 1000);
    }

    return () => (isMounted.current = false);
  }, [JSON.stringify(data), testWeightNo]);

  //* set initial value for unit used for coc
  useEffect(() => {
    if (!cData) return;

    cData.forEach((_, index) => {
      if (unitUsedForCOC) form.setValue(`data.${index}.unitUsedForCOC`, unitUsedForCOC);
    });
  }, [JSON.stringify(unitUsedForCOC)]);

  //* set initial value for unit used for coc and material if specified in measurement
  useEffect(() => {
    if (!cData) return;

    cData.forEach((_, index) => {
      if (material) {
        form.setValue(`data.${index}.material`, material);
        form.setValue(`data.${index}.ptKgMn3`, material?.ptKgMn3 || 0);
        form.setValue(`data.${index}.uPtKgMn3`, material?.uPtKgMn3 || 0);
      }
    });
  }, [JSON.stringify(material)]);

  // console.log({ instrumentsOptions, materialsOptions });

  return (
    <Tab.Container defaultActiveKey='0'>
      <Row>
        <Col className='px-0' md={12}>
          <Nav variant='pills' className='d-flex justify-content-center gap-3'>
            {testWeightNo &&
              testWeightNo > 0 &&
              Array.from({ length: testWeightNo }).map((_, pointIndex) => (
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
            {Array.from({ length: testWeightNo }).map((_, pointIndex) => {
              const currentMaterial = form.getValues(`data.${pointIndex}.material`);
              const currentWeights = form.getValues(`data.${pointIndex}.weights`);

              const maximumWeightLength = currentWeights?.length > 0 ? currentWeights?.length : 0;

              return (
                <Tab.Pane key={`${pointIndex}-tab-pane`} className='h-100' eventKey={pointIndex}>
                  <Card className='h-100 w-100 shadow-none'>
                    <Card.Body>
                      <h4 className='mb-0'>Test Weight {pointIndex + 1}</h4>
                      <p className='text-muted fs-6'>
                        Data inputs for test weight {pointIndex + 1}
                      </p>

                      <Row className='mb-4 row-gap-3'>
                        <Form.Group as={Col} md={3}>
                          <RequiredLabel
                            label='Unit Used For COC'
                            id={`data.${pointIndex}.unitUsedForCOC`}
                          />
                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Unif Used For COC Search'
                                  info={['Search by unit used for COC']}
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
                            name={`data.${pointIndex}.unitUsedForCOC`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.unitUsedForCOC`}
                                  instanceId={`data.${pointIndex}.unitUsedForCOC`}
                                  onChange={(option) => field.onChange(option)}
                                  options={unitUsedForCOCOptions}
                                  placeholder='Search by unit used for COC'
                                  noOptionsMessage={() => 'No unit used for COC found'}
                                />

                                {formErrors &&
                                  formErrors?.data?.[pointIndex]?.unitUsedForCOC?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors?.data?.[pointIndex]?.unitUsedForCOC?.message}
                                    </Form.Text>
                                  )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <RequiredLabel label='Material' id={`data.${pointIndex}.material`} />

                          <OverlayTrigger
                            placement='right'
                            overlay={
                              <Tooltip>
                                <TooltipContent
                                  title='Material Search'
                                  info={['Search by material name']}
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
                            name={`data.${pointIndex}.material`}
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <Select
                                  {...field}
                                  inputId={`data.${pointIndex}.material`}
                                  instanceId={`data.${pointIndex}.material`}
                                  onChange={(option) => handleMaterialChange(option, pointIndex)}
                                  options={materialsOptions}
                                  placeholder='Search by material name'
                                  noOptionsMessage={() => 'No material found'}
                                />

                                {formErrors &&
                                  formErrors?.data?.[pointIndex]?.material?.message && (
                                    <Form.Text className='text-danger'>
                                      {formErrors?.data?.[pointIndex]?.material?.message}
                                    </Form.Text>
                                  )}
                              </>
                            )}
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <Form.Label>
                            Density of Test Weight P<sub>t</sub> (kg m<sup>-3</sup>)
                          </Form.Label>

                          <Form.Control
                            type='text'
                            value={currentMaterial?.ptKgMn3 || ''}
                            readOnly
                            disabled
                          />
                        </Form.Group>

                        <Form.Group as={Col} md={3}>
                          <Form.Label>
                            u(P<sub>t</sub>) (kg m<sup>-3</sup>)
                          </Form.Label>

                          <Form.Control
                            type='text'
                            value={currentMaterial?.uPtKgMn3 || ''}
                            readOnly
                            disabled
                          />
                        </Form.Group>

                        <hr className='my-1' />

                        <Col md={6}>
                          <Row className='mb-4 row-gap-3'>
                            <Form.Group as={Col} xs={9}>
                              <RequiredLabel
                                label='Nominal Value (g)'
                                id={`data.${pointIndex}.nominalValue`}
                              />
                              <OverlayTrigger
                                placement='right'
                                overlay={
                                  <Tooltip>
                                    <TooltipContent
                                      title='Nominal Value (g) Search'
                                      info={['Search by nominal value (g)']}
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
                                name={`data.${pointIndex}.nominalValue`}
                                control={form.control}
                                render={({ field }) => (
                                  <>
                                    <Select
                                      {...field}
                                      inputId={`data.${pointIndex}.nominalValue`}
                                      instanceId={`data.${pointIndex}.nominalValue`}
                                      onChange={(option) => field.onChange(option)}
                                      options={nominalValueOptions}
                                      placeholder='Search by nominal value (g)'
                                      noOptionsMessage={() => 'No nominal value (g) found'}
                                    />

                                    {formErrors &&
                                      formErrors?.data?.[pointIndex]?.nominalValue?.message && (
                                        <Form.Text className='text-danger'>
                                          {formErrors?.data?.[pointIndex]?.nominalValue?.message}
                                        </Form.Text>
                                      )}
                                  </>
                                )}
                              />
                            </Form.Group>

                            <Form.Group className='mt-6' as={Col} xs={3}>
                              <Controller
                                name={`data.${pointIndex}.isNominalValueWithAsterisk`}
                                control={form.control}
                                render={({ field }) => (
                                  <Checkbox
                                    inline
                                    label='With Asterisk (*)'
                                    name={`data.${pointIndex}.isNominalValueWithAsterisk`}
                                    id={`inline-${pointIndex}-isNominalValueWithAsterisk`}
                                    checked={field.value}
                                    onChange={(e) => field.onChange(!field.value)}
                                  />
                                )}
                              />
                            </Form.Group>

                            <Form.Group as={Col} xs={12}>
                              <RequiredLabel
                                label='Mass Comparator Used'
                                id={`data.${pointIndex}.massComparatorRefEquipmentId`}
                              />
                              <OverlayTrigger
                                placement='right'
                                overlay={
                                  <Tooltip>
                                    <TooltipContent
                                      title='Mass Comparator Used Search'
                                      info={['Search by mass comparator used']}
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
                                name={`data.${pointIndex}.massComparatorRefEquipmentId`}
                                control={form.control}
                                render={({ field }) => (
                                  <>
                                    <Select
                                      {...field}
                                      inputId={`data.${pointIndex}.massComparatorRefEquipmentId`}
                                      instanceId={`data.${pointIndex}.massComparatorRefEquipmentId`}
                                      onChange={(option) => field.onChange(option)}
                                      options={instrumentsOptions}
                                      placeholder='Search by mass comparator used'
                                      noOptionsMessage={() => 'No mass comparator used found'}
                                    />

                                    {formErrors &&
                                      formErrors?.data?.[pointIndex]?.massComparatorRefEquipmentId
                                        ?.message && (
                                        <Form.Text className='text-danger'>
                                          {
                                            formErrors?.data?.[pointIndex]
                                              ?.massComparatorRefEquipmentId?.message
                                          }
                                        </Form.Text>
                                      )}
                                  </>
                                )}
                              />
                            </Form.Group>

                            <Form.Group as={Col} xs={12}>
                              <RequiredLabel label='Tag Id' id={`data.${pointIndex}.tagId`} />
                              <OverlayTrigger
                                placement='right'
                                overlay={
                                  <Tooltip>
                                    <TooltipContent
                                      title='Tag ID Search'
                                      info={['Search by tag id']}
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
                                name={`data.${pointIndex}.tagId`}
                                control={form.control}
                                render={({ field }) => (
                                  <>
                                    <Select
                                      {...field}
                                      inputId={`data.${pointIndex}.tagId`}
                                      instanceId={`data.${pointIndex}.tagId`}
                                      onChange={(option) => field.onChange(option)}
                                      options={tagIdOptions}
                                      placeholder='Search by tag id'
                                      noOptionsMessage={() => 'No tag id found'}
                                    />

                                    {formErrors &&
                                      formErrors?.data?.[pointIndex]?.tagId?.message && (
                                        <Form.Text className='text-danger'>
                                          {formErrors?.data?.[pointIndex]?.tagId?.message}
                                        </Form.Text>
                                      )}
                                  </>
                                )}
                              />
                            </Form.Group>
                          </Row>
                        </Col>

                        <Col md={6}>
                          <div className='mx-0 border border-primary rounded overflow-hidden'>
                            <Table className='text-center align-middle' bordered responsive>
                              <tbody>
                                <tr>
                                  <td className='p-0 align-top'>
                                    <Table
                                      responsive
                                      className='mb-0'
                                      style={{ borderCollapse: 'collapse' }}
                                    >
                                      <tr>
                                        <th className='border-top-0'>Weight(s) Used</th>
                                      </tr>
                                      <tbody>
                                        <tr key={`${pointIndex}-row-weights-value`}>
                                          <td className='align-top'>
                                            <Form
                                              onKeyDown={(e) => {
                                                dataInputOnKeyDown({
                                                  event: e,
                                                  key: `data.${pointIndex}.weightInputValue`,
                                                  weights: currentWeights,
                                                  pointIndex,
                                                });
                                              }}
                                            >
                                              <Controller
                                                name={`data.${pointIndex}.weightInputValue`}
                                                control={form.control}
                                                render={({ field }) => (
                                                  <Form.Control
                                                    onChange={(e) => {
                                                      handleValueOnChange({
                                                        value: e.target.value,
                                                        key: `data.${pointIndex}.weightInputValue`,
                                                        weights: currentWeights,
                                                      });
                                                    }}
                                                    name={field.name}
                                                    ref={field.ref}
                                                    value={field.value}
                                                    className={`${styles.columnData} text-center`}
                                                    type='text'
                                                  />
                                                )}
                                              />
                                            </Form>

                                            {formErrors &&
                                              formErrors?.data?.[pointIndex]?.weightInputValue
                                                ?.message && (
                                                <Form.Text
                                                  className='text-danger'
                                                  style={{ fontSize: 10.2 }}
                                                >
                                                  {formErrors &&
                                                    formErrors?.data?.[pointIndex]?.weightInputValue
                                                      ?.message}
                                                </Form.Text>
                                              )}
                                          </td>
                                        </tr>

                                        {Array.from({
                                          length: maximumWeightLength,
                                        }).map((_, dataIndex) => {
                                          return (
                                            <tr key={dataIndex}>
                                              <td
                                                className={`${styles.columnDataContent} align-top`}
                                              >
                                                {currentWeights?.[dataIndex] ? (
                                                  <div
                                                    className={`${styles.columnData}`}
                                                    key={dataIndex}
                                                  >
                                                    <div
                                                      className={styles.columnDataValue}
                                                      contentEditable
                                                      suppressContentEditableWarning={true}
                                                      onKeyDown={handleKeyDownData}
                                                      onPaste={handleOnPasteData}
                                                      onInput={(e) => {
                                                        debouncedHandleEditData({
                                                          value: e.target.innerText,
                                                          key: `data.${pointIndex}.weights.${dataIndex}`,
                                                          weights: currentWeights,
                                                          pointIndex,
                                                          dataIndex,
                                                        });

                                                        putCursorAtEnd(e.target);
                                                      }}
                                                    >
                                                      {currentWeights?.[dataIndex]}
                                                    </div>

                                                    <div
                                                      contentEditable={false}
                                                      className={styles.columnDataClose}
                                                      onClick={() => {
                                                        handleRemoveData({
                                                          key: `data.${pointIndex}.weights.${dataIndex}`,
                                                          weights: currentWeights,
                                                          pointIndex,
                                                          dataIndex,
                                                        });
                                                      }}
                                                    >
                                                      X
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div
                                                    className={`${styles.columnData}`}
                                                    key={dataIndex}
                                                    style={{
                                                      borderColor: 'transparent',
                                                    }}
                                                  >
                                                    &nbsp;
                                                  </div>
                                                )}

                                                {formErrors &&
                                                  formErrors?.data?.[pointIndex]?.weights?.[
                                                    dataIndex
                                                  ]?.message && (
                                                    <Form.Text
                                                      className='text-danger'
                                                      style={{
                                                        fontSize: 10.2,
                                                      }}
                                                      contentEditable={false}
                                                    >
                                                      {
                                                        formErrors?.data?.[pointIndex]?.weights?.[
                                                          dataIndex
                                                        ]?.message
                                                      }
                                                    </Form.Text>
                                                  )}
                                              </td>
                                            </tr>
                                          );
                                        })}

                                        {maximumWeightLength === 0 && (
                                          <tr>
                                            <td className='border-bottom'>&nbsp;</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </Table>
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </div>
                        </Col>

                        <Col xs={12}>
                          <div className='mx-0 border border-primary rounded overflow-hidden'>
                            <Table className='text-center align-middle' bordered responsive>
                              <thead>
                                <tr>
                                  <th>Inspection Point</th>
                                  <th>
                                    <em>I</em>
                                    <sub>r1</sub>
                                  </th>

                                  <th>
                                    <em>I</em>
                                    <sub>t1</sub>
                                  </th>

                                  <th>
                                    <em>I</em>
                                    <sub>t2</sub>
                                  </th>

                                  <th>
                                    <em>I</em>
                                    <sub>r2</sub>
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {Array.from({
                                  length: MAXIMUM_INSPECTION_POINT,
                                }).map((_, rowIndex) => {
                                  return (
                                    <tr key={`${rowIndex}-row-inspection-point`}>
                                      <td className='align-top'>{rowIndex + 1}</td>

                                      <td className='align-top'>
                                        {rowIndex === 0 && (
                                          <Controller
                                            name={`data.${pointIndex}.testWeightData.${rowIndex}.${0}`}
                                            control={form.control}
                                            render={({ field }) => (
                                              <Form.Control
                                                onChange={(e) =>
                                                  handleTestWeightDataChange(e, field)
                                                }
                                                onWheel={numberInputOnWheel}
                                                name={field.name}
                                                ref={field.ref}
                                                value={field.value}
                                                className={`${styles.columnData} text-center`}
                                                type='number'
                                              />
                                            )}
                                          />
                                        )}
                                      </td>
                                      <td className='align-top'>
                                        <Controller
                                          name={`data.${pointIndex}.testWeightData.${rowIndex}.${1}`}
                                          control={form.control}
                                          render={({ field }) => (
                                            <Form.Control
                                              onChange={(e) => handleTestWeightDataChange(e, field)}
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
                                      <td className='align-top'>
                                        <Controller
                                          name={`data.${pointIndex}.testWeightData.${rowIndex}.${2}`}
                                          control={form.control}
                                          render={({ field }) => (
                                            <Form.Control
                                              onChange={(e) => handleTestWeightDataChange(e, field)}
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

                                      <td className='align-top'>
                                        <Controller
                                          name={`data.${pointIndex}.testWeightData.${rowIndex}.${3}`}
                                          control={form.control}
                                          render={({ field }) => (
                                            <Form.Control
                                              onChange={(e) => handleTestWeightDataChange(e, field)}
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
                                })}
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

export default SWTestWeightTest;

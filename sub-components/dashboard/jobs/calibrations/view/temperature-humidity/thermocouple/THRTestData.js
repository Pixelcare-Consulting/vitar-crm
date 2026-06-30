import { safeParseFloat } from '@/utils/common';
import { useMemo, useState } from 'react';
import { Card, Col, Nav, Row, Tab, Table } from 'react-bootstrap';
import {
  Box,
  Crosshair,
  Database,
  DropletHalf,
  Gear,
  Hash,
  Plug,
  Rulers,
  Signpost,
  Speedometer2,
  SquareFill,
  ThermometerHalf,
  WrenchAdjustable,
} from 'react-bootstrap-icons';
import styles from '../../../mass.module.css';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import {
  IMMER,
  MAXIMUM_REF_TEST_LENGTH,
  REF_IND_UOM,
  REF_THER_UOM,
} from '@/schema/calibrations/temperature-humidity/thermocouple';

export default function THRTestData({ calibration, refTher, refInd, refWire, bath }) {
  const [refTherUomOptions] = useState(REF_THER_UOM.map((refTherUom) => ({ value: refTherUom, label: refTherUom }))); //prettier-ignore
  const [refIndUomOptions] = useState(REF_IND_UOM.map((refIndUom) => ({ value: refIndUom, label: refIndUom }))); //prettier-ignore
  const [immerOptions] = useState(IMMER.map((immer) => ({ value: immer, label: immer }))); //prettier-ignore

  const rangeOfCalibration = useMemo(() => {
    return safeParseFloat(calibration?.rangeOfCalibration);
  }, [calibration]);

  const calibrationData = useMemo(() => {
    return calibration?.data;
  }, [JSON.stringify(calibration)]);

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
              const pointData = calibrationData?.[pointIndex];

              const currRefTherUom = refTherUomOptions.find((option) => option.value === pointData?.refTherUom)?.label; //prettier-ignore
              const currRefIndUom = refIndUomOptions.find((option) => option.value === pointData?.refIndUom)?.label; //prettier-ignore
              const immer = immerOptions.find((option) => option.value === calibration?.immer)?.label; //prettier-ignore

              const currRefTher = refTher?.data?.find((option) => option.id === pointData?.refTher); //prettier-ignore
              const currRefInd = refInd?.data?.find((option) => option.id === pointData?.refInd); //prettier-ignore
              const currTestInd = refInd?.data?.find((option) => option.id === pointData?.testInd); //prettier-ignore
              const currRefWire = refWire?.data?.find((option) => option.id === pointData?.refWire); //prettier-ignore
              const currTestWire = refWire?.data?.find((option) => option.id === pointData?.testWire); //prettier-ignore
              const currBath = bath?.data?.find((option) => option.id === pointData?.bath); //prettier-ignore

              const refTestData = pointData?.refTestData?.length > 0 ? pointData?.refTestData : []; //prettier-ignore

              if (!pointData) return null;

              return (
                <Tab.Pane key={`${pointIndex}-tab-pane`} className='h-100' eventKey={pointIndex}>
                  <Card className='h-100 w-100 shadow-none'>
                    <Card.Body>
                      <h4 className='mb-0'>Test Data {pointIndex + 1}</h4>
                      <p className='text-muted fs-6'>Data inputs for test data {pointIndex + 1}</p>

                      <Row className='mb-4 row-gap-3'>
                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Gear size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Setting:</div>
                              <div className='text-primary-label fw-semibold text-capitalize'>
                                {pointData?.setting || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Crosshair size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Resolution:</div>
                              <div className='text-primary-label fw-semibold '>
                                {pointData?.resolution ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <ThermometerHalf size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Ref. Ther.:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currRefTher?.idCode ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Rulers size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Ref. Ther UOM:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currRefTherUom ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Speedometer2 size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Ref. Ind.:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currRefInd?.code ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Rulers size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Ref. Ind UOM:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currRefIndUom ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Plug size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Ref. Wire:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currRefWire?.idCode ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Speedometer2 size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Test. Ind.:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currTestInd?.code ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Plug size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Test. Wire:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currTestWire?.idCode ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <DropletHalf size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Bath:</div>
                              <div className='text-primary-label fw-semibold '>
                                {currBath?.idCode ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Rulers size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Immer:</div>
                              <div className='text-primary-label fw-semibold '>
                                {immer ?? 'N/A'}
                              </div>
                            </div>
                          </div>
                        </Col>

                        <hr className='my-1' />

                        <Col className='d-flex justify-content-center align-items-center'>
                          <div className='mx-0 border rounded overflow-hidden w-100'>
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
                                        <td className={`${styles.columnDataContent} align-top`}>
                                          {refTestData?.[rowIndex]?.[0]}
                                        </td>

                                        <td className={`${styles.columnDataContent} align-top`}>
                                          {refTestData?.[rowIndex]?.[1]}
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
}

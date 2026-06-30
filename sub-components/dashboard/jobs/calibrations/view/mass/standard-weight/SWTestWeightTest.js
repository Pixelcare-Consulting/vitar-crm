import { safeParseFloat } from '@/utils/common';
import { useMemo } from 'react';
import { Card, Col, Nav, Row, Tab, Table } from 'react-bootstrap';
import {
  Box,
  Database,
  Hash,
  Rulers,
  Signpost,
  SquareFill,
  WrenchAdjustable,
} from 'react-bootstrap-icons';
import styles from '../../../mass.module.css';
import { MAXIMUM_INSPECTION_POINT } from '@/schema/calibrations/mass/standard-weight';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';

export default function SWTestWeightTest({ calibration, materials, instruments }) {
  const testWeightNo = useMemo(() => {
    return safeParseFloat(calibration?.testWeightNo);
  }, [JSON.stringify(calibration)]);

  const calibrationData = useMemo(() => {
    return calibration?.data;
  }, [JSON.stringify(calibration)]);

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
              const material = materials.data.find((material) => material.id === calibrationData?.[pointIndex]?.material); //prettier-ignore
              const weights = calibrationData?.[pointIndex]?.weights;
              const unitUsedForCOC = calibrationData?.[pointIndex]?.unitUsedForCOC;
              const nominalValue = calibrationData?.[pointIndex]?.nominalValue;
              const isNominalValueWithAsterisk = calibrationData?.[pointIndex]?.isNominalValueWithAsterisk; //prettier-ignore
              const massComparatorRefEquipmentId = calibrationData?.[pointIndex]?.massComparatorRefEquipmentId; //prettier-ignore
              const instrument = instruments.data.find((instrument) => instrument.id === massComparatorRefEquipmentId); //prettier-ignore
              const tagId = calibrationData?.[pointIndex]?.tagId;
              const testWeightData = calibrationData?.[pointIndex]?.testWeightData;

              const maximumWeightLength = weights?.length > 0 ? weights?.length : 0;

              // console.log({ unitUsedForCOC, pointIndex, calibrationData });

              return (
                <Tab.Pane key={`${pointIndex}-tab-pane`} className='h-100' eventKey={pointIndex}>
                  <Card className='h-100 w-100 shadow-none'>
                    <Card.Body>
                      <h4 className='mb-0'>Test Weight {pointIndex + 1}</h4>
                      <p className='text-muted fs-6'>
                        Data inputs for test weight {pointIndex + 1}
                      </p>

                      <Row className='mb-4 row-gap-3'>
                        <Col md={6} lg={3}>
                          <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                            <div
                              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                              style={{ width: '40px', height: '40px' }}
                            >
                              <Rulers size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Unit Used For COC:</div>
                              <div className='text-primary-label fw-semibold text-capitalize'>
                                {unitUsedForCOC}
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
                              <Box size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>Material:</div>
                              <div className='text-primary-label fw-semibold text-capitalize'>
                                {material?.material || 'N/A'}
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
                              <SquareFill size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>
                                Density of Test Weight P<sub>t</sub> (kg m<sup>-3</sup>)
                              </div>
                              <div className='text-primary-label fw-semibold text-capitalize'>
                                {material?.ptKgMn3 || 'N/A'}
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
                              <SquareFill size={20} />
                            </div>
                            <div>
                              <div className='text-secondary fs-6'>
                                u(P<sub>t</sub>) (kg m<sup>-3</sup>)
                                <div className='text-primary-label fw-semibold text-capitalize'>
                                  {material?.uPtKgMn3 || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>

                        <hr className='my-1' />

                        <Col md={6}>
                          <Row className='mb-4 row-gap-3'>
                            <Col xs={12}>
                              <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                                <div
                                  className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <Signpost size={20} />
                                </div>
                                <div>
                                  <div className='text-secondary fs-6'>
                                    Nominal Value (g)
                                    <div className='text-primary-label fw-semibold text-capitalize'>
                                      {nominalValue
                                        ? `${nominalValue}${isNominalValueWithAsterisk ? '*' : ''}`
                                        : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Col>

                            <Col xs={12}>
                              <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                                <div
                                  className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <WrenchAdjustable size={20} />
                                </div>
                                <div>
                                  <div className='text-secondary fs-6'>
                                    Mass Comparator Used
                                    <div className='text-primary-label fw-semibold text-capitalize'>
                                      {instrument?.description || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Col>

                            <Col xs={12}>
                              <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                                <div
                                  className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <Hash size={20} />
                                </div>
                                <div>
                                  <div className='text-secondary fs-6'>
                                    Tag ID
                                    <div className='text-primary-label fw-semibold'>
                                      {tagId || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Col>

                        <Col md={6}>
                          <div className='mx-0 rounded overflow-hidden'>
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
                                        {Array.from({ length: maximumWeightLength }).map(
                                          (_, dataIndex) => {
                                            return (
                                              <tr key={dataIndex}>
                                                <td
                                                  className={`${styles.columnDataContent} align-top`}
                                                >
                                                  {weights?.[dataIndex] || <>&nbsp;</>}
                                                </td>
                                              </tr>
                                            );
                                          }
                                        )}

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
                          <div className='mx-0 rounded overflow-hidden'>
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
                                        {formatToDicimalString(
                                          safeParseFloat(testWeightData?.[rowIndex]?.[0]),
                                          5
                                        ) || <>&nbsp;</>}
                                      </td>
                                      <td className='align-top'>
                                        {formatToDicimalString(
                                          safeParseFloat(testWeightData?.[rowIndex]?.[1]),
                                          5
                                        ) || <>&nbsp;</>}
                                      </td>
                                      <td className='align-top'>
                                        {formatToDicimalString(
                                          safeParseFloat(testWeightData?.[rowIndex]?.[2]),
                                          5
                                        ) || <>&nbsp;</>}
                                      </td>

                                      <td className='align-top'>
                                        {formatToDicimalString(
                                          safeParseFloat(testWeightData?.[rowIndex]?.[3]),
                                          5
                                        ) || <>&nbsp;</>}
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
}

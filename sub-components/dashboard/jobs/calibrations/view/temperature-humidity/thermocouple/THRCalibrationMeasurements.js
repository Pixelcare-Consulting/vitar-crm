import { TRACEABILITY_CALIBRATION_LAB } from '@/schema/calibrations/common-constant';
import {
  IMMER,
  REF_IND_UOM,
  REF_THER_UOM,
  REF_TYPE,
  REFERENCE_METHOD,
} from '@/schema/calibrations/temperature-humidity/thermocouple';
import { useState } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import {
  BookmarkCheck,
  BoxArrowUpRight,
  Buildings,
  Crosshair,
  DropletHalf,
  GlobeAsiaAustralia,
  Hash,
  JournalText,
  Plug,
  Rulers,
  ShieldCheck,
  Speedometer2,
  Tags,
  Thermometer,
  ThermometerHalf,
  ThermometerHigh,
  ThermometerSnow,
  ThermometerSun,
  Toggles2,
} from 'react-bootstrap-icons';

const THRCalibrationMeasurements = ({ calibration, refTher, refInd, refWire, bath }) => {
  const [refMethodOptions] = useState(REFERENCE_METHOD.map((refMethod) => ({ value: refMethod.value, label: refMethod.value, label2: refMethod.label }))); //prettier-ignore
  const [refTypeOptions] = useState(REF_TYPE.map((refType) => ({ value: refType, label: refType }))); //prettier-ignore
  const [refTherUomOptions] = useState(REF_THER_UOM.map((refTherUom) => ({ value: refTherUom, label: refTherUom }))); //prettier-ignore
  const [refIndUomOptions] = useState(REF_IND_UOM.map((refIndUom) => ({ value: refIndUom, label: refIndUom }))); //prettier-ignore
  const [immerOptions] = useState(IMMER.map((immer) => ({ value: immer, label: immer }))); //prettier-ignore

  const refMethod = refMethodOptions.find((option) => option.value === calibration?.refMethod); //prettier-ignore
  const refType = refTypeOptions.find((option) => option.value === calibration?.refType)?.label; //prettier-ignore
  const currRefTherUom = refTherUomOptions.find((option) => option.value === calibration?.refTherUom)?.label; //prettier-ignore
  const currRefIndUom = refIndUomOptions.find((option) => option.value === calibration?.refIndUom)?.label; //prettier-ignore
  const immer = immerOptions.find((option) => option.value === calibration?.immer)?.label; //prettier-ignore

  const currRefTher = refTher?.data?.find((option) => option.id === calibration?.refTher); //prettier-ignore
  const currRefInd = refInd?.data?.find((option) => option.id === calibration?.refInd); //prettier-ignore
  const currTestInd = refInd?.data?.find((option) => option.id === calibration?.testInd); //prettier-ignore
  const currRefWire = refWire?.data?.find((option) => option.id === calibration?.refWire); //prettier-ignore
  const currTestWire = refWire?.data?.find((option) => option.id === calibration?.testWire); //prettier-ignore
  const currBath = bath?.data?.find((option) => option.id === calibration?.bath); //prettier-ignore

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Location</h4>
            <p className='text-muted fs-6 mb-0'>Location of the calibration.</p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={12}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Buildings size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Location:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.calibrationLocation || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-0 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Criteria</h4>
            <p className='text-muted fs-6 mb-0'>
              Measurements criteria to be used as a basis for the calibration.
            </p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <JournalText size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ref. Method:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {refMethod?.value || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <BoxArrowUpRight size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ref. To:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {refMethod?.label2 || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Range of Calibration:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.rangeOfCalibration || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ref. Decimal:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.refDecimal || 1}
                </div>
              </div>
            </div>
          </Col>

          <hr className='my-1' />

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Thermometer size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ambient Temperature (Min):</div>
                <div className='text-primary-label fw-semibold e'>
                  {calibration?.minTemperature || 'N/A'} °C
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <ThermometerHigh size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ambient Temperature (Max):</div>
                <div className='text-primary-label fw-semibold '>
                  {calibration?.maxTemperature ?? 'N/A'} °C
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <ThermometerSnow size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Relative Humidity (Min):</div>
                <div className='text-primary-label fw-semibold '>
                  {calibration?.minRHumidity ?? 'N/A'} %rh
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <ThermometerSun size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Relative Humidity (Max):</div>
                <div className='text-primary-label fw-semibold '>
                  {calibration?.maxRHumidity ?? 'N/A'} %rh
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Toggles2 size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>By Pass "Auto Corr:</div>
                <div className='text-primary-label fw-semibold '>
                  {calibration?.isByPassAutoCorr ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </Col>

          <hr className='my-1' />

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Tags size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ref. Type:</div>
                <div className='text-primary-label fw-semibold '>{refType ?? 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
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
                  {calibration?.resolution ?? 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
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

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Rulers size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ref. Ther UOM:</div>
                <div className='text-primary-label fw-semibold '>{currRefTherUom ?? 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Speedometer2 size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ref. Ind.:</div>
                <div className='text-primary-label fw-semibold '>{currRefInd?.code ?? 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Rulers size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ref. Ind UOM:</div>
                <div className='text-primary-label fw-semibold '>{currRefIndUom ?? 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
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

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Speedometer2 size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Test. Ind.:</div>
                <div className='text-primary-label fw-semibold '>{currTestInd?.code ?? 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
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

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <DropletHalf size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Bath:</div>
                <div className='text-primary-label fw-semibold '>{currBath?.idCode ?? 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Rulers size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Immer:</div>
                <div className='text-primary-label fw-semibold '>{immer ?? 'N/A'}</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-0 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Traceability</h4>
            <p className='text-muted fs-6 mb-0'>Details of the calibration traceability.</p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <BookmarkCheck size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Traceability Type:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityType ?? 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <GlobeAsiaAustralia size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Country:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityCountry ?? 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Buildings size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Country Lab:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityCalibrationLab?.length > 0
                    ? TRACEABILITY_CALIBRATION_LAB.filter((lab) =>
                        calibration?.traceabilityCalibrationLab?.includes(lab.value)
                      )
                        .filter(Boolean)
                        .map((lab) => `${lab.name} - ${lab.accreditationNo}`)
                        .join(', ')
                    : 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Buildings size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Signatory:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityCalibrationLab?.length > 0
                    ? TRACEABILITY_CALIBRATION_LAB.filter((lab) =>
                        calibration?.traceabilityCalibrationLab?.includes(lab.value)
                      )?.[0]?.signatory
                    : 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Accreditation Body:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityAccreditationBody || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default THRCalibrationMeasurements;

import { TRACEABILITY_CALIBRATION_LAB } from '@/schema/calibrations/common-constant';
import { ACCURACY_CLASS, UNIT_USED_FOR_COC } from '@/schema/calibrations/mass/standard-weight';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { safeParseFloat } from '@/utils/common';
import { add, divide, exp, mean, multiply, subtract } from 'mathjs';
import { useMemo, useState } from 'react';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import {
  BookmarkCheck,
  Box,
  Buildings,
  Bullseye,
  Calculator,
  CloudFog2,
  Crosshair,
  GlobeAsiaAustralia,
  Hash,
  ListOl,
  Rulers,
  ShieldCheck,
  Speedometer,
  Speedometer2,
  SquareFill,
  Thermometer,
  ThermometerHalf,
  ThermometerHigh,
  ThermometerSnow,
  ThermometerSun,
  ViewStacked,
} from 'react-bootstrap-icons';

function SWCalibrationMeasurements({ calibration, materials, environmental }) {
  const [unitUsedForCOCOptions] = useState(UNIT_USED_FOR_COC.map((unit) => ({ value: unit, label: unit }))); //prettier-ignore
  const [accuracyClassOptions] = useState(ACCURACY_CLASS.map((accuracyClass) => ({ value: accuracyClass, label: accuracyClass }))); //prettier-ignore

  const accuracyClass = accuracyClassOptions.find((option) => option.value === calibration?.accuracyClass)?.value; //prettier-ignore
  const unitUsedForCOC = unitUsedForCOCOptions.find((option) => option.value === calibration?.unitUsedForCOC)?.value; //prettier-ignore
  const material = materials.data.find((option) => option.id === calibration?.material); //prettier-ignore
  const envUP = environmental.data.find((option) => option.id === calibration?.envUP); //prettier-ignore
  const envUT = environmental.data.find((option) => option.id === calibration?.envUT); //prettier-ignore
  const envUHr = environmental.data.find((option) => option.id === calibration?.envUHr); //prettier-ignore

  const minTemprature = calibration?.minTemperature;
  const maxTemprature = calibration?.maxTemperature;
  const minRHumidity = calibration?.minRHumidity;
  const maxRHumidity = calibration?.maxRHumidity;
  const minAPressure = calibration?.minAPressure;
  const maxAPressure = calibration?.maxAPressure;

  const averageTemprature = useMemo(() => {
    const x = safeParseFloat(minTemprature);
    const y = safeParseFloat(maxTemprature);
    return mean(x, y);
  }, [minTemprature, maxTemprature]);

  const averageRHumidity = useMemo(() => {
    const x = safeParseFloat(minRHumidity);
    const y = safeParseFloat(maxRHumidity);
    return mean(x, y);
  }, [minRHumidity, maxRHumidity]);

  const averageAPressure = useMemo(() => {
    const x = safeParseFloat(minAPressure);
    const y = safeParseFloat(maxAPressure);
    return mean(x, y);
  }, [minAPressure, maxAPressure]);

  const densityOfMoistAir = useMemo(() => {
    const a = 0.34848;
    const b = 0.009;
    const c = 100;
    const d = 0.061;
    const e = 273.15;

    const x1 = multiply(a, averageAPressure);
    const x2 = multiply(b, averageRHumidity);
    const x3 = exp(multiply(d, averageTemprature));
    const x4 = multiply(divide(x2, c), x3);

    const x = subtract(x1, x4);
    const y = add(e, averageTemprature);

    const result = divide(x, y);

    return result;
  }, [averageTemprature, averageRHumidity, averageAPressure]);

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
                <Bullseye size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Accuracy Class:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {accuracyClass || 'N/A'}
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
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>No. of Test Weight:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.testWeightNo || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <hr className='my-1' />

          <Col md={4}>
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

          <Col md={4}>
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

          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <ThermometerHalf size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Ambient Temperature (Average):</div>
                <div className='text-primary-label fw-semibold '>
                  {averageTemprature ?? 'N/A'} °C
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

          <Col md={4}>
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

          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <ThermometerHalf size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Relative Humidity (Average):</div>
                <div className='text-primary-label fw-semibold '>
                  {averageRHumidity ?? 'N/A'} %rh
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
                <Speedometer2 size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Atmospere Pressure (Min):</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.minAPressure ?? 'N/A'} mbar
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
                <Speedometer size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Atmospere Pressure (Max):</div>
                <div className='text-primary-label fw-semibold '>
                  {calibration?.maxAPressure ?? 'N/A'} mbar
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
                <Speedometer2 size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Atmospere Pressure (Average):</div>
                <div className='text-primary-label fw-semibold'>
                  {averageAPressure ?? 'N/A'} mbar
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
                <CloudFog2 size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>
                  Density of Moist Air, P<sub>a</sub> (Kg m<sup>-3</sup>)
                </div>
                <div className='text-primary-label fw-semibold'>
                  {densityOfMoistAir ? formatToDicimalString(densityOfMoistAir, 4) : 'N/A'}
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

          <Col md={3}>
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

          <Col md={3}>
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

          <Col md={3}>
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
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-0 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Environmental</h4>
            <p className='text-muted fs-6 mb-0'>
              Details of environmental values used for the calculation of the specified field
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
                <Calculator size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>
                  U<sub>p</sub>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {envUP
                      ? `${envUP?.code || ''}${
                          envUP?.description ? ' - ' + envUP?.description : ''
                        }`
                      : 'N/A'}
                  </div>
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
                <Calculator size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>
                  U<sub>p</sub> Value
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {envUP?.u || 'N/A'}
                  </div>
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
                <Calculator size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>
                  U<sub>t</sub>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {envUT
                      ? `${envUT?.code || ''}${
                          envUT?.description ? ' - ' + envUT?.description : ''
                        }`
                      : 'N/A'}
                  </div>
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
                <Calculator size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>
                  U<sub>t</sub> Value
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {envUT?.u || 'N/A'}
                  </div>
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
                <Calculator size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>
                  U<sub>hr</sub>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {envUHr
                      ? `${envUHr?.code || ''}${
                          envUHr?.description ? ' - ' + envUHr?.description : ''
                        }`
                      : 'N/A'}
                  </div>
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
                <Calculator size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>
                  U<sub>hr</sub> Value
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {envUHr?.u || 'N/A'}
                  </div>
                </div>
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
}

export default SWCalibrationMeasurements;

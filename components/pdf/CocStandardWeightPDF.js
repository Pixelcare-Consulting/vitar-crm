import TimesNewRomanRegular from 'public/fonts/times-new-roman/Times-New-Roman-Regular.ttf';
import TimesNewRomanBold from 'public/fonts/times-new-roman/Times-New-Roman-Bold.ttf';
import TimesNewRomanItalic from 'public/fonts/times-new-roman/Times-New-Roman-Italic.ttf';
import TimesNewRomanBoldItalic from 'public/fonts/times-new-roman/Times-New-Roman-Bold-Italic.ttf';

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { useCallback, useMemo } from 'react';
import { add, format } from 'date-fns';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { max } from 'mathjs';
import { countDecimals, safeParseFloat } from '@/utils/common';
import {
  TRACEABILITY_ACCREDITATION_BODY,
  TRACEABILITY_CALIBRATION_LAB,
  TRACEABILITY_COUNTRY,
  TRACEABILITY_MAP,
} from '@/schema/calibrations/common-constant';
import { UNIT_USED_FOR_COC_ABBREVIATION_MAP } from '@/schema/calibrations/mass/standard-weight';

const styles = StyleSheet.create({
  body: {
    fontFamily: 'TimesNewRomanRegular',
    width: '100%',
    height: '100%',
    paddingTop: 99.2088,
    paddingBottom: 19.836,
    paddingLeft: 25.2,
    paddingRight: 25.2,
  },
  title: {
    fontSize: 24,
    fontFamily: 'TimesNewRomanBold',
    textAlign: 'center',
    marginBottom: 10,
    borderBottom: '1px solid #000000',
    borderTop: '1px solid #000000',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    fontSize: 10,
    position: 'relative',
  },
  block: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockContentBold: {
    fontFamily: 'TimesNewRomanBold',
  },
  blockContentLeftFirst: {
    width: '110px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blockContentLeft: {
    width: '20%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    width: '4%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  blockContentRight: {
    width: '76%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    marginBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingLeft: 54,
    paddingRight: 25.2,
  },
});

//? 1 inch = 72 pt

Font.register({
  family: 'TimesNewRomanRegular',
  src: TimesNewRomanRegular,
});

Font.register({
  family: 'TimesNewRomanBold',
  src: TimesNewRomanBold,
});

Font.register({
  family: 'TimesNewRomanItalic',
  src: TimesNewRomanItalic,
});

Font.register({
  family: 'TimesNewRomanBoldItalic',
  src: TimesNewRomanBoldItalic,
});

const CocStandardWeightPDF = ({ calibration, instruments, calibratedBy, approvedSignatory }) => {
  const handleGetLocationValue = useCallback(() => {
    if (calibration.location) {
      const locationData = calibration.location;
      let value = locationData.siteName || '';

      if (locationData?.addresses && locationData?.addresses?.length > 0) {
        const defaultAddress = locationData.addresses.find((address) => address.isDefault);

        if (defaultAddress) {
          if (defaultAddress?.street1) value += ` ${defaultAddress.street1}`;
          else if (defaultAddress?.street2) value += ` ${defaultAddress.street2}`;
          else if (defaultAddress?.street3) value += ` ${defaultAddress.street3}`;

          if (defaultAddress?.city) value += ` ${defaultAddress.city}`;
          if (defaultAddress?.province) value += ` ${defaultAddress.province}`;
          if (defaultAddress?.postalCode) value += ` ${defaultAddress.postalCode}`;
          if (defaultAddress?.country) value += ` ${defaultAddress.country}`;
        }
      }

      return value;
    }

    return '';
  }, [calibration.location]);

  const unitUsedForCOCAcronym = (unit) => {
    if (!unit) return 'g';
    if (unit === 'kilogram') return 'kg';
    return 'g';
  };

  const cocInstruments = useMemo(() => {
    if (!instruments.data || instruments.data.length < 1) return [];
    const selectedInstruments = calibration?.cocInstruments || [];
    return instruments.data.filter((instrument) => selectedInstruments.includes(instrument.id));
  }, [calibration, instruments.data]);

  const testWeightNo = useMemo(() => {
    return safeParseFloat(calibration?.testWeightNo);
  }, [calibration]);

  const nominalValues = calibration?.nominalValues || [];
  const isNominalValueWithAsterisks = calibration?.isNominalValueWithAsterisks || [];
  const resultExpandedUncertainties = calibration?.resultExpandedUncertainties || [];
  const conventionalValues = calibration?.conventionalValues || [];
  const mpes = calibration?.mpes || [];
  const unitsUsedForCOC = calibration?.unitsUsedForCOC || [];
  const coverageFactors = calibration?.coverageFactors || [];

  const maxCoverageFactor = useMemo(() => {
    if (coverageFactors.length < 1) return '';

    const values = coverageFactors.map((v) => safeParseFloat(v));

    const result = max(values);
    return result;
  }, [JSON.stringify(coverageFactors)]);

  const massComparatorUsedRefIds = calibration?.results?.massComparatorUsedRefIds || [];

  const massComparatorRefEqUncertainties = useMemo(() => {
    const values = massComparatorUsedRefIds.map((id) => {
      const eq = instruments.data.find((eq) => eq.id === id);
      const uncertainty = safeParseFloat(eq?.uncertainty);
      return uncertainty;
    });

    return values;
  }, [JSON.stringify(massComparatorUsedRefIds), JSON.stringify(instruments)]);

  const convertValueBasedOnUnit = (value, unitToUsed) => {
    if (!unitToUsed) return '';

    if (typeof value === 'string' || value === undefined || value === null || isNaN(value)) {
      return '';
    }

    switch (unitToUsed) {
      case 'milligram':
        return value * 1000;
      case 'kilogram':
        return value / 1000;
      case 'g':
      default:
        return value;
    }
  };

  const formatToDecimalStrByUncertainty = (value, uncertainty, unitToUsed) => {
    //* uncertainty is the selected mass comparator's uncertainty, and its used to get the precision of the value
    const precision = countDecimals(uncertainty) || 2;

    switch (unitToUsed) {
      case 'milligram':
        return formatToDicimalString(safeParseFloat(value), 2);
      case 'kilogram':
        return formatToDicimalString(safeParseFloat(value), 6);
      case 'gram':
      default:
        return formatToDicimalString(safeParseFloat(value), precision);
    }
  };

  const renderValueWithSymbol = (value) => {
    const parseValue = parseFloat(value);

    if (isNaN(parseValue)) return value;

    const valueToFormat = String(value);

    if (parseValue > 0) {
      if (/^0+(\.0+)?$/.test(valueToFormat)) return valueToFormat;
      return `+${valueToFormat}`;
    } else {
      if (valueToFormat.includes('-')) {
        const valueWithoutSymbol = valueToFormat.replace('-', '');
        if (/^0+(\.0+)?$/.test(valueWithoutSymbol)) return valueWithoutSymbol;
        return `-${valueWithoutSymbol}`;
      }

      return value;
    }
  };

  const getUnitUsedForCOCAcronym = (unit) => {
    if (!unit) return 'g';
    return UNIT_USED_FOR_COC_ABBREVIATION_MAP[unit] || 'g';
  };

  const dueDate = useMemo(() => {
    if (!calibration?.dueDateRequested || !calibration?.dateCalibrated) {
      return 'N/A';
    }

    if (calibration?.dueDateRequested === 'no') {
      if (calibration?.dueDate) return calibration.dueDate;
      else return 'N/A';
    }

    const dueDate = add(new Date(calibration.dateCalibrated), {
      months: calibration?.dueDateDuration || 0,
    });

    return format(dueDate, 'dd MMMM yyyy');
  }, [calibration]);

  const dateReceived = useMemo(() => {
    if (!calibration.dateReceivedRequested || !calibration?.dateReceived) return 'N/A';

    if (calibration.dateReceivedRequested === 'no') {
      if (calibration.dateReceived) return calibration.dateReceived;
      else return 'N/A';
    }

    return format(new Date(calibration.dateReceived), 'dd MMMM yyyy');
  }, [calibration]);

  const traceability = useMemo(() => {
    if (!calibration?.traceabilityType) return '';

    if (calibration?.traceabilityType === '1' || calibration?.traceabilityType === '2') {
      return TRACEABILITY_MAP?.[calibration?.traceabilityType] || '';
    }

    if (calibration?.traceabilityType === '3') {
      const traceabilityCountry = calibration?.traceabilityCountry || TRACEABILITY_COUNTRY[0]; // prettier-ignore
      const traceabilityAccreditationBody = calibration?.traceabilityAccreditationBody || TRACEABILITY_ACCREDITATION_BODY[0]; // prettier-ignore
      const traceabilityCalibrationLabValues = calibration?.traceabilityCalibrationLab || [TRACEABILITY_CALIBRATION_LAB[4].value]; // prettier-ignore

      const selectedTraceabilityCalibrationLab = traceabilityCalibrationLabValues.map(value => TRACEABILITY_CALIBRATION_LAB.find(item => item.value === value)).filter(Boolean); // prettier-ignore
      const selectedAccreditationNos = selectedTraceabilityCalibrationLab.map(item => item.accreditationNo) // prettier-ignore
      const signatory = selectedTraceabilityCalibrationLab[0].signatory;

      let accreditationNos = '';
      if (selectedTraceabilityCalibrationLab.length >= 2) {
        const lastAccreditationNo = selectedAccreditationNos.pop();
        accreditationNos = `${selectedAccreditationNos.join(', ')} and ${lastAccreditationNo}`;
      } else {
        accreditationNos = selectedAccreditationNos[0];
      }

      const text = `The measurement results included in this document are traceable to ${traceabilityCountry}'s national standards through SAMM ${accreditationNos} via calibration	Certificate No. as indicated below. ${traceabilityAccreditationBody} is a signatory to the ${signatory}`;
      return text;
    }

    return '';
  }, [calibration]);

  const location = useMemo(() => {
    const l = calibration.location;
    let defaultAddress;

    if (l?.addresses && l?.addresses?.length > 0) {
      defaultAddress = l.addresses.find((address) => address.isDefault);
    }

    return { siteName: l?.siteName || '', defaultAddress };
  }, [calibration.location]);

  const formatCertNo = (certNo) => {
    const parts = certNo.split('-');

    if (!certNo || parts.length < 3) return '';

    const part1 = parts[0];
    const initials = part1.substring(0, 3);
    const date = part1.slice(3);

    return [`${initials} - ${date}`, ...parts.slice(1)].join(' - ');
  };

  return (
    <Document>
      <Page size='A4' style={styles.body} wrap>
        <View>
          <Text style={styles.title}>CERTIFICATE OF CALIBRATION</Text>
        </View>

        <View style={styles.container}>
          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text style={styles.blockContentBold}>CERTIFICATE NO.</Text>
            </View>

            <View style={styles.separator}>
              <Text style={styles.blockContentBold}>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={[styles.blockContentBold, { flexGrow: 1 }]}>
                  <Text>{formatCertNo(calibration?.certificateNumber)}</Text>
                </View>

                <View>
                  <Text
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    fixed
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text style={styles.blockContentBold}>Submitted By</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View style={{ display: 'flex', flexDirection: 'column' }}>
                {location?.defaultAddress?.siteName && (
                  <Text>{location?.defaultAddress?.siteName}</Text>
                )}
                {location?.defaultAddress?.street1 && (
                  <Text>{location?.defaultAddress?.street1}</Text>
                )}
                {location?.defaultAddress?.street2 && (
                  <Text>{location?.defaultAddress?.street2}</Text>
                )}
                {location?.defaultAddress?.street3 && (
                  <Text>{location?.defaultAddress?.street3}</Text>
                )}
                <Text>{`${
                  location?.defaultAddress?.postalCode
                    ? `${location?.defaultAddress?.postalCode} `
                    : ''
                }${location?.defaultAddress?.city ? `${location?.defaultAddress?.city} ` : ''}${
                  location?.defaultAddress?.province ? `${location?.defaultAddress?.province} ` : ''
                }${location?.defaultAddress?.country || ''}`}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Date Issued</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{format(new Date(), 'dd MMMM yyyy')}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Date Received</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{dateReceived}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 2 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Date Calibrated</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ paddingRight: 30 }}>
                  {calibration?.dateCalibrated
                    ? format(new Date(calibration.dateCalibrated), 'dd MMMM yyyy')
                    : ''}
                </Text>
                <Text>Recalibration Date Specified By Client</Text>
                <Text style={{ paddingLeft: 4, paddingRight: 4 }}>:</Text>
                <Text>{dueDate}</Text>
              </View>
            </View>
          </View>

          <View style={{ width: '100%', fontSize: 7, marginBottom: 8 }}>
            <Text>
              The User should be aware that any number of factors may cause this instrument to drift
              out of calibration before the specified calibration interval has expired.
            </Text>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 10,
              fontFamily: 'TimesNewRomanBold',
              textDecoration: 'underline',
              marginBottom: 4,
            }}
          >
            <Text>Instrument Description</Text>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Description</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.description || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Make</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.make || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Model</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.model || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Serial No.</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.serialNumber || ''}</Text>
            </View>
          </View>

          <View style={{ width: '100%', fontSize: 7 }}>
            <Text>
              The result of calibration shown relates only to the instrument being calibrated as
              described above.
            </Text>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 10,
              fontFamily: 'TimesNewRomanBold',
              textDecoration: 'underline',
              marginBottom: 4,
            }}
          >
            <Text>Environmental Condition</Text>
          </View>

          <View style={styles.block}>
            <View style={styles.blockContentLeft}>
              <Text>Ambient Temperature</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View style={{ display: 'flex', flexDirection: 'row' }}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                    paddingRight: 30,
                  }}
                >
                  <Text style={{ paddingRight: 20 }}>Max:</Text>
                  <Text>{calibration?.maxTemperature ?? 0} °C</Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                  <Text style={{ paddingRight: 20 }}>Min:</Text>
                  <Text>{calibration?.minTemperature ?? 0} °C</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.block}>
            <View style={styles.blockContentLeft}>
              <Text>Relative Humidity</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View style={{ display: 'flex', flexDirection: 'row' }}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                    paddingRight: 30,
                  }}
                >
                  <Text style={{ paddingRight: 20 }}>Max:</Text>
                  <Text>{calibration?.maxRHumidity ?? 0} %rh</Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                  <Text style={{ paddingRight: 20 }}>Min:</Text>
                  <Text>{calibration?.minRHumidity ?? 0} %rh</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ width: '100%', fontSize: 7, marginBottom: 8 }}>
            <Text>
              The instrument has been calibrated on site under the environmental condition as stated
              above.
            </Text>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text
                style={{
                  fontFamily: 'TimesNewRomanBold',
                  textDecoration: 'underline',
                }}
              >
                Reference Method
              </Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>The calibration was based upon Calibration Procedure CP-(M)D.</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8, fontSize: 8 }]}>
            <Text>{traceability}</Text>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              textDecoration: 'underline',
              fontFamily: 'TimesNewRomanBold',
            }}
          >
            <View style={{ width: '22%' }}>
              <Text>Reference Standard</Text>
            </View>

            <View style={{ width: '16%' }}>
              <Text>ID. No. </Text>
            </View>

            <View style={{ width: '16%' }}>
              <Text>Serial No.</Text>
            </View>

            <View style={{ width: '12%' }}>
              <Text>Traceable</Text>
            </View>

            <View style={{ width: '22%' }}>
              <Text>Cert. No</Text>
            </View>

            <View style={{ width: '12%' }}>
              <Text>Due Date</Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
            break={cocInstruments.length > 6 ? true : false}
          >
            {cocInstruments.length > 0 &&
              cocInstruments.map((instrument) => (
                <View
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ width: '22%' }}>
                    <Text>{instrument?.description || ''}</Text>
                  </View>

                  <View style={{ width: '16%' }}>
                    <Text>{instrument?.tagId || ''}</Text>
                  </View>

                  <View style={{ width: '16%' }}>
                    <Text>{instrument?.serialNumber || ''}</Text>
                  </View>

                  <View style={{ width: '12%' }}>
                    <Text>{instrument?.traceability || ''}</Text>
                  </View>

                  <View style={{ width: '22%' }}>
                    <Text>{instrument?.certificateNo || ''}</Text>
                  </View>

                  <View style={{ width: '12%' }}>
                    <Text>
                      {instrument?.dueDate
                        ? format(new Date(instrument?.dueDate), 'dd-MM-yyyy')
                        : ''}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        <View break style={styles.container}>
          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text style={styles.blockContentBold}>CERTIFICATE NO.</Text>
            </View>

            <View style={styles.separator}>
              <Text style={styles.blockContentBold}>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={[styles.blockContentBold, { flexGrow: 1 }]}>
                  <Text>{formatCertNo(calibration?.certificateNumber)}</Text>
                </View>

                <View>
                  <Text
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    fixed
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* //* result of calibation */}
        <View fixed style={styles.footer}>
          <View
            style={{
              width: '80%',
              margin: '0 auto',
              marginTop: 30,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 8 }}>Calibrated By</Text>

              {calibratedBy?.data?.signature && (
                <Image
                  style={{ width: '60px', height: '40px', marginTop: 7 }}
                  src={calibratedBy?.data?.signature}
                />
              )}

              <Text
                style={{
                  fontSize: 8,
                  marginTop: calibratedBy?.data?.signature ? 5 : 20,
                  padding: '8px 0',
                  borderTop: '1px dotted #00000',
                  maxWidth: 180,
                }}
              >
                {calibration?.calibratedBy?.name || ''}
              </Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 8 }}>Approved Signatory</Text>

              {approvedSignatory?.data?.signature && (
                <Image
                  style={{ width: '60px', height: '40px', marginTop: 7 }}
                  src={approvedSignatory?.data?.signature}
                />
              )}

              <Text
                style={{
                  fontSize: 8,
                  marginTop: approvedSignatory?.data?.signature ? 5 : 20,
                  padding: '8px 0',
                  borderTop: '1px dotted #00000',
                  maxWidth: 180,
                }}
              >
                {calibration?.approvedSignatory?.name || ''}
              </Text>
            </View>
          </View>

          <View style={{ width: '85%', margin: '0 auto' }}>
            <Text
              style={{
                fontSize: 7,
                textAlign: 'center',
                paddingBottom: '4px',
                fontFamily: 'TimesNewRomanBold',
              }}
              render={({ pageNumber, totalPages }) => {
                if (pageNumber > 1)
                  return (
                    <>
                      The expanded uncertainty is stated as the standard measurement uncertainty
                      multiplied by the coverage factor k, such that the coverage probability
                      corresponds to approximately 95 %.
                    </>
                  );

                return null;
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 7,
              borderTop: '1px solid #00000',
              paddingTop: '2px',
            }}
          >
            This certificate is issued in accordance with the laboratory accreditation requirements
            of Skim Akreditasi Makmal Malaysia ( SAMM ) of Standards Malaysia which is a signatory
            to the ILAC MRA. Copyright of this certificate is owned by the issuing laboratory and
            may not be reproduced other than in full except with the prior written approval of the
            Head of the issuing laboratory.
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            fontSize: 10,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: '20%',
              fontFamily: 'TimesNewRomanBold',
              textDecoration: 'underline',
            }}
          >
            <Text>Result of Caliberation</Text>
          </View>

          <View
            style={{
              width: '70%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ width: '50%', textAlign: 'center' }}>
              <Text>
                Range of Calibration : {nominalValues?.[0]} g to{' '}
                {nominalValues?.[nominalValues?.length - 1]} g
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '95%',
            margin: '0 auto',
            fontSize: 10,
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #00000',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderBottom: '1px solid #00000',
              }}
            >
              <View style={{ width: '25%', textAlign: 'center' }}>
                <Text> </Text>
                <Text>Nominal Value</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '25%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>Conventional Value</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>Expanded Uncertainty</Text>
                <Text> </Text>
              </View>
              {calibration?.accuracyClass !== 'N/A' && (
                <View
                  style={{
                    width: '20%',
                    borderLeft: '1px solid #00000',
                    textAlign: 'center',
                  }}
                >
                  <Text> </Text>
                  <Text>MPE (±)</Text>
                  <Text> </Text>
                </View>
              )}
            </View>

            {/* //* empty for space */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: '25%', textAlign: 'center' }}>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '25%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '20%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
            </View>

            {testWeightNo &&
              Array.from({ length: testWeightNo }).map((_, i) => (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ width: '25%', textAlign: 'center' }}>
                    <Text>
                      {convertValueBasedOnUnit(nominalValues?.[i], unitsUsedForCOC?.[i], true)}
                      {isNominalValueWithAsterisks?.[i] ? '*' : ''}{' '}
                      {getUnitUsedForCOCAcronym(unitsUsedForCOC?.[i])}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: '25%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                    }}
                  >
                    <Text>
                      {convertValueBasedOnUnit(nominalValues?.[i], unitsUsedForCOC?.[i], true)}{' '}
                      {getUnitUsedForCOCAcronym(unitsUsedForCOC?.[i])} &nbsp;&nbsp;&nbsp;
                      {renderValueWithSymbol(
                        formatToDecimalStrByUncertainty(
                          convertValueBasedOnUnit(conventionalValues?.[i], unitsUsedForCOC?.[i]),
                          massComparatorRefEqUncertainties?.[i],
                          unitsUsedForCOC?.[i]
                        )
                      )}{' '}
                      {getUnitUsedForCOCAcronym(unitsUsedForCOC?.[i])}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: '30%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                    }}
                  >
                    <Text>
                      {formatToDecimalStrByUncertainty(
                        convertValueBasedOnUnit(
                          resultExpandedUncertainties?.[i],
                          unitsUsedForCOC?.[i]
                        ),
                        massComparatorRefEqUncertainties?.[i],
                        unitsUsedForCOC?.[i]
                      )}{' '}
                      {getUnitUsedForCOCAcronym(unitsUsedForCOC?.[i])}
                    </Text>
                  </View>

                  {calibration?.accuracyClass !== 'N/A' && (
                    <View
                      style={{
                        width: '20%',
                        borderLeft: '1px solid #00000',
                        textAlign: 'center',
                      }}
                    >
                      <Text>
                        {formatToDecimalStrByUncertainty(
                          convertValueBasedOnUnit(mpes?.[i], unitsUsedForCOC?.[i]),
                          massComparatorRefEqUncertainties?.[i],
                          unitsUsedForCOC?.[i]
                        )}{' '}
                        {getUnitUsedForCOCAcronym(unitsUsedForCOC?.[i])}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

            {/* //* empty for space */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: '25%', textAlign: 'center' }}>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '25%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '20%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
            </View>
          </View>

          <View>
            {calibration?.accuracyClass !== 'N/A' && (
              <>
                <Text style={{ fontSize: 7, fontFamily: 'TimesNewRomanItalic' }}>
                  Note: MPE with reference to OIML R111-1
                </Text>
                <Text style={{ fontSize: 7, marginBottom: 4 }}>
                  MPE - Maximum Permissible Error
                </Text>
              </>
            )}

            <Text style={{ fontSize: 7 }}>
              The expanded uncertainties for calibration results shown above are based on an
              estimated confidence probability of not less than 95%. with coverage factor k =
              {maxCoverageFactor}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CocStandardWeightPDF;

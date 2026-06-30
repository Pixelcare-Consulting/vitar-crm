import { useState, useEffect, useMemo } from 'react';
import { parseExcelFile } from '../utils/excelParser';
import { Alert, Button, ProgressBar, Card, Badge } from 'react-bootstrap';
import { resumeUpload } from '@/services/excelUploadService';
import { dataExcelParser, dataProcessExcelUploader } from './Uploader';

//* routes
//* - data/upload/locations/S
//* - data/upload/equipments/D
//* - data/upload/equipments/E
//* - data/upload/equipments/M
//* - data/upload/equipments/P
//* - data/upload/equipments/T
//* - data/upload/equipments/V
//* - data/upload/customerEquipments/CE
//* - data/upload/jobCalibrationReferences_CR000001_data/CR
//* - data/upload/jobCalibrationReferences_CR000002_data/CR
//* - data/upload/jobCalibrationReferences_CR000003_data/CR
//* - data/upload/jobCalibrationReferences_CR000004_data/CR
//* - data/upload/jobCalibrationReferences_CR000005_data/CR
//* - data/upload/jobCalibrationReferences_CR000006_data/CR
//* - data/upload/jobCalibrationReferences_CR000007_data/CR

//* - data/upload/jobCalibrationReferences_CR000008_data/CR
//* - data/upload/jobCalibrationReferences_CR000008_data_temperatureRefs_<idCode>/TR?idCode=ST-R1  - idCode e.g (ST-R1, ST-R2 etc)

//* - data/upload/jobCalibrationReferences_CR000009_data/CR
//* - data/upload/jobCalibrationReferences_CR000009_data_temperatureRefs_<code>/TR?code=ST-NF1  - idCode e.g (ST-NF1, ST-NF2 etc)

//* with Type
//* - data/upload/jobCalibrationReferences_CR000009_data/CR
//* - data/upload/jobCalibrationReferences_CR000009_data_temperatureRefs_<code>_<type>/TR?code=ST-NF1&type=T  - idCode e.g (ST-NF1, ST-NF2 etc), type e.g (T, R, -)

//* - data/upload/jobCalibrationReferences_CR000010_data/CR
//* - data/upload/jobCalibrationReferences_CR000010_data_temperatureRefs_<idCode>/TR?idCode=ST-R1  - idCode e.g (ST-R1, ST-R2 etc)

//* - data/upload/jobCalibrationReferences_CR000011_data/CR
//* - data/upload/jobCalibrationReferences_CR000012_data/CR
//* - data/upload/jobCalibrationReferences_CR000013_data/CR
//* - data/upload/jobCalibrationReferences_CR000014_data/CR
//* - data/upload/jobCalibrationReferences_CR000015_data/CR

//* - data/upload/jobCalibrationReferences_CR000016_data/CR
//* - data/upload/jobCalibrationReferences_CR000016_data_temperatureRefs_<code>/TR?code=ST-NF1  - idCode e.g (ST-NF1, ST-NF2 etc)

//* - data/upload/jobCalibrationReferences_CR000017_data/CR
//* - data/upload/jobCalibrationReferences_CR000018_data/CR
//* - data/upload/jobCalibrationReferences_CR000019_data/CR

const ExcelUploader = ({ dataKey, prefix, searchParams }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const [canResume, setCanResume] = useState(false);

  const searchParamsObj = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    const lastDataId = localStorage.getItem(`lastProcessed${dataKey}`);
    setCanResume(!!lastDataId);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setStats(null);

      const data = await dataExcelParser[dataKey](file);

      await dataProcessExcelUploader[dataKey]({
        prefix,
        dataKey,
        data,
        onProgress: (progress) => setProgress(progress),
        onStats: (stats) => setStats(stats),
        searchParams,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload error: ${error.message}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleResume = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parseExcelFile(file);

      await resumeUpload(
        prefix,
        dataKey,
        data,
        (progress) => setProgress(progress),
        (stats) => setStats(stats)
      );
    } catch (error) {
      setError(`Resume error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!dataKey) return null;

  return (
    <Card className='mb-3'>
      <Card.Header className='text-center'>
        <h5 className='text-capitalize mb-0'>
          {dataKey} Master List Upload | Prefix: {prefix}
        </h5>
        <p className='text-muted mb-0' style={{ fontSize: '11px' }}>
          Linear data upload only
        </p>

        <h5 className='text-capitalize mb-0 text-center mt-5'>Search Params:</h5>
        <pre className='bg-red-500'>{JSON.stringify(searchParamsObj)}</pre>
      </Card.Header>
      <Card.Body>
        <div className='mb-3'>
          <input
            type='file'
            accept='.xlsx,.xls'
            onChange={handleFileUpload}
            className='d-none'
            id='fileUpload'
            disabled={loading}
          />
          <label htmlFor='fileUpload' style={{ display: 'block', width: '100%' }}>
            <Button
              className='text-capitalize w-100'
              variant='primary'
              as='span'
              disabled={loading}
            >
              {loading ? 'Processing...' : `Upload ${dataKey} List`}
            </Button>
          </label>
        </div>

        {loading && (
          <div className='mb-3'>
            <ProgressBar now={progress} label={`${progress}%`} animated />
            {stats && (
              <div className='mt-2 small'>
                <p className='mb-1'>Processing: {stats.currentItem}</p>
                <div className='d-flex gap-2'>
                  {stats.customersSuccess > 0 && (
                    <Badge bg='success'>Customers Added: {stats.customersSuccess}</Badge>
                  )}
                  {stats.locationsSuccess > 0 && (
                    <Badge bg='success'>Locations Added: {stats.locationsSuccess}</Badge>
                  )}
                  {stats.customerEquipmentsSuccess > 0 && (
                    <Badge bg='success'>
                      Customer Equipments Added: {stats.customerEquipmentsSuccess}
                    </Badge>
                  )}
                  {stats.errors > 0 && <Badge bg='danger'>Errors: {stats.errors}</Badge>}
                  <Badge bg='info'>Total Processed: {stats.processed}</Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <Alert variant='danger'>{error}</Alert>}

        {stats && stats.status === 'completed' && (
          <Alert variant='success'>
            Upload completed successfully!
            <div className='mt-2'>
              <Badge bg='success' className='me-2'>
                {dataKey} Added: {stats[`${dataKey}Success`]}
              </Badge>
              {stats.errors > 0 && (
                <Badge bg='danger' className='me-2'>
                  Errors: {stats.errors}
                </Badge>
              )}
              <Badge bg='info'>Total Processed: {stats.total}</Badge>
            </div>
          </Alert>
        )}

        {canResume && (
          <Button variant='secondary' onClick={handleResume} disabled={loading} className='ms-2'>
            Resume Upload
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default ExcelUploader;

import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import TempInstrumentForm from '@/sub-components/dashboard/calibration-references/TempInstrumentForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  Eye,
  HouseDoorFill,
  ListColumns,
  PencilFill,
  Table,
  Thermometer,
} from 'react-bootstrap-icons';

function EditTempInstrument() {
  const router = useRouter();
  const { refId } = router.query;

  const [tempInstrument, setTempInstrument] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query Temperature Instrument
  useEffect(() => {
    if (refId) {
      const tempInstrumentDocRef = doc(db, 'jobCalibrationReferences', 'CR000017', 'data', refId);

      getDoc(tempInstrumentDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setTempInstrument({ id: doc.id, ...doc.data() });
            setIsLoading(false);
          } else {
            setError('Reference Data not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching reference data');
          setIsLoading(false);
        });
    }
  }, [refId]);

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <Button
            onClick={() =>
              router.push('/calibration-references/temperature-humidity/temperature-instruments')
            }
          >
            Back to Temperature Instruments List
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Reference Data...</span>
      </div>
    );
  }

  if (!tempInstrument) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/temperature-instruments'>
            <Button variant='primary' className='mt-3'>
              Back to Temperature Instruments List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Temperature Instruments - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Temperature Instruments'
        description='Edit temperature instruments information'
        badgeText='Calibration References Data Management'
        badgeText2='Edit Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/temperature-humidity/temperature-instruments',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/temperature-instruments',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Temperature Instruments',
            link: '/calibration-references/temperature-humidity/temperature-instruments',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: tempInstrument ? tempInstrument.id : 'Create',
            link: `/calibration-references/temperature-humidity/temperature-instruments/edit-temperature-instruments/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/temperature-instruments'),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Temperature Instruments',
            icon: Eye,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/temperature-instruments/view/${refId}`
              ),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <TempInstrumentForm data={tempInstrument} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditTempInstrument;

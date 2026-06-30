import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { GeeksSEO } from '@/widgets';
import { format, isValid } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Table } from 'react-bootstrap';
import {
  ArrowLeftShort,
  EyeFill,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Table as TableIcon,
  Thermometer,
} from 'react-bootstrap-icons';

const BathStabilityUniformityDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [bathStabilityUniformity, setBathStabilityUniformity] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query bath stability/uniformity
  useEffect(() => {
    if (refId) {
      const bathStabilityUniformityDocRef = doc(
        db,
        'jobCalibrationReferences',
        'CR000013',
        'data',
        refId
      );

      getDoc(bathStabilityUniformityDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setBathStabilityUniformity({ id: doc.id, ...doc.data() });
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
              router.push('/calibration-references/temperature-humidity/bath/stability-uniformity')
            }
          >
            Back to Bath Stability/Uniformity List
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

  if (!bathStabilityUniformity) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/bath/stability-uniformity'>
            <Button variant='primary' className='mt-3'>
              Back to Bath Stability/Uniformity List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO
        title={`View Details for Bath Stability/Uniformity #${bathStabilityUniformity.id} - VITAR Group | Portal`}
      />

      <ContentHeader
        title={`View Details for Bath Stability/Uniformity #${bathStabilityUniformity.id}`}
        description='View comprehensive details of reference data'
        badgeText='Calibration References Data Management'
        badgeText2='View Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Bath Stability/Uniformity',
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
            icon: <TableIcon className='me-2' size={14} />,
          },
          ,
          {
            text: refId,
            icon: <EyeFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/bath/stability-uniformity'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Bath Stability/Uniformity',
            icon: PencilSquare,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/bath/stability-uniformity/edit-stability-uniformity/${refId}`
              ),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Bath Stability/Uniformity</h4>
                <p className='text-muted fs-6 mb-0'>Details about the reference data.</p>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            <Table
              className='w-75 mx-auto text-center fs-6 align-middle mt-3 mb-5'
              bordered
              responsive
            >
              <tbody>
                <tr>
                  <th>Reference ID</th>
                  <td colSpan={5}>{bathStabilityUniformity?.refId || ''}</td>
                </tr>
                <tr>
                  <th>Code</th>
                  <td colSpan={5}>{bathStabilityUniformity?.code || ''}</td>
                </tr>
                <tr>
                  <th>Stability (°C)</th>
                  <td colSpan={5}>{bathStabilityUniformity?.stabilityDCelsius || ''}</td>
                </tr>
                <tr>
                  <th>Stability (% r.h.)</th>
                  <td colSpan={5}>{bathStabilityUniformity?.stabilityPercentRHumidity || ''}</td>
                </tr>
                <tr>
                  <th>Uniformity (°C)</th>
                  <td colSpan={5}>{bathStabilityUniformity?.uniformityDCelsius || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {bathStabilityUniformity?.createdAt
                      ? format(bathStabilityUniformity?.createdAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{bathStabilityUniformity?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {bathStabilityUniformity?.updatedAt
                      ? format(bathStabilityUniformity?.updatedAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{bathStabilityUniformity?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default BathStabilityUniformityDetails;

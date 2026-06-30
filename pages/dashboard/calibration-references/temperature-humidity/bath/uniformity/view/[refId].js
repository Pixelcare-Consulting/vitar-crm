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

const BathUniformityDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [bathUniformity, setBathUniformity] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query bath uniformity
  useEffect(() => {
    if (refId) {
      const bathUniformityDocRef = doc(db, 'jobCalibrationReferences', 'CR000015', 'data', refId);

      getDoc(bathUniformityDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setBathUniformity({ id: doc.id, ...doc.data() });
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
              router.push('/calibration-references/temperature-humidity/bath/uniformity')
            }
          >
            Back to Bath Uniformity List
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

  if (!bathUniformity) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/bath/uniformity'>
            <Button variant='primary' className='mt-3'>
              Back to Bath Uniformity List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO
        title={`View Details for Bath Uniformity #${bathUniformity.id} - VITAR Group | Portal`}
      />

      <ContentHeader
        title={`View Details for Bath Uniformity #${bathUniformity.id}`}
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
            link: '/calibration-references/temperature-humidity/bath/uniformity',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/bath/uniformity',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Bath Uniformity',
            link: '/calibration-references/temperature-humidity/bath/uniformity',
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
              router.push('/calibration-references/temperature-humidity/bath/uniformity'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Bath Uniformity',
            icon: PencilSquare,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/bath/uniformity/edit-uniformity/${refId}`
              ),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Bath Uniformity</h4>
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
                  <td colSpan={5}>{bathUniformity?.refId || ''}</td>
                </tr>
                <tr>
                  <th>Loc.</th>
                  <td colSpan={5}>{bathUniformity?.loc || ''}</td>
                </tr>
                <tr>
                  <th>Param 1</th>
                  <td colSpan={5}>{bathUniformity?.value1 || ''}</td>
                </tr>
                <tr>
                  <th>Param 2</th>
                  <td colSpan={5}>{bathUniformity?.value2 || ''}</td>
                </tr>
                <tr>
                  <th>Param 2</th>
                  <td colSpan={5}>{bathUniformity?.value3 || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {bathUniformity?.createdAt
                      ? format(bathUniformity?.createdAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{bathUniformity?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {bathUniformity?.updatedAt
                      ? format(bathUniformity?.updatedAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{bathUniformity?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default BathUniformityDetails;

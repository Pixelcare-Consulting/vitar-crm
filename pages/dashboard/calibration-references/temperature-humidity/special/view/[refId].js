import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { GeeksSEO } from '@/widgets';
import { format, isValid } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import {
  ArrowLeftShort,
  EyeFill,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Table as TableIcon,
  Thermometer,
} from 'react-bootstrap-icons';

const SpecialDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [special, setSpecial] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query special
  useEffect(() => {
    if (refId) {
      const specialDocRef = doc(db, 'jobCalibrationReferences', 'CR000020', 'data', refId);

      getDoc(specialDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setSpecial({ id: doc.id, ...doc.data() });
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
            onClick={() => router.push('/calibration-references/temperature-humidity/special')}
          >
            Back to Special List
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

  if (!special) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/special'>
            <Button variant='primary' className='mt-3'>
              Back to Special List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`View Details for Special #${special.id} - VITAR Group | Portal`} />

      <ContentHeader
        title={`View Details for Special #${special.id}`}
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
            link: '/calibration-references/temperature-humidity/special',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/special',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Special',
            link: '/calibration-references/temperature-humidity/special',
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
            onClick: () => router.push('/calibration-references/temperature-humidity/special'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Special',
            icon: PencilSquare,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/special/edit-special/${refId}`
              ),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Special</h4>
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
                  <td colSpan={5}>{special?.refId || ''}</td>
                </tr>
                <tr>
                  <th>ID Code</th>
                  <td colSpan={5}>{special?.idCode || ''}</td>
                </tr>
                <tr>
                  <th>Serial No.</th>
                  <td colSpan={5}>{special?.serialNo || ''}</td>
                </tr>
                <tr>
                  <th>COC No..</th>
                  <td colSpan={5}>{special?.cocNo || ''}</td>
                </tr>

                <tr>
                  <th>Traceable</th>
                  <td colSpan={5}>{special?.traceable || ''}</td>
                </tr>
                <tr>
                  <th>Uncertainty</th>
                  <td colSpan={5}>{special?.uncer || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {special?.createdAt ? format(special?.createdAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{special?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {special?.updatedAt ? format(special?.updatedAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{special?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>

          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Ranges</h4>
                <p className='text-muted fs-6 mb-0'>Range details of {special?.idCode || ''}</p>
              </div>
            </div>
          </Card.Header>

          {special?.ranges?.length > 0 ? (
            <Row>
              {special?.ranges?.map((range, i) => (
                <Col xs={12}>
                  <Table
                    className='w-75 mx-auto text-center fs-6 align-middle mt-3 mb-5'
                    bordered
                    responsive
                  >
                    <tbody>
                      <tr>
                        <th colSpan={6}>Range #{i + 1}</th>
                      </tr>
                      <tr>
                        <th>Min</th>
                        <th>Max</th>
                        <th>R(0°C)</th>
                        <th>A</th>
                        <th>B</th>
                        <th>C</th>
                      </tr>
                      <tr>
                        <td>{range?.min || ''}</td>
                        <td>{range?.max || ''}</td>
                        <td>{range?.r0 || ''}</td>
                        <td>{range?.a || ''}</td>
                        <td>{range?.b || ''}</td>
                        <td>{range?.c || ''}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              ))}
            </Row>
          ) : (
            <>
              <div className='d-flex justify-content-center align-items-center text-center py-5'>
                <div>
                  <h4 className='mb-0'>Ranges not found</h4>
                  <p className='text-muted fs-6'>Range details not found</p>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default SpecialDetails;

import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import { db } from '@/firebase';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import _, { orderBy } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import {
  Activity,
  Building,
  Calendar,
  Clock,
  Envelope,
  EnvelopePaper,
  ExclamationCircle,
  ExclamationCircleFill,
  Eye,
  Geo,
  Map,
  Person,
  PersonFill,
  PersonUp,
  PersonVcard,
  Phone,
  Signpost,
} from 'react-bootstrap-icons';

const SummaryTab = ({ jobRequest, customer, contact, location }) => {
  const renderError = () => {
    return (
      <div
        className='d-flex flex-column justify-content-center align-items-center fs-6 py-2'
        style={{ height: '200px' }}
      >
        <ExclamationCircleFill className='text-danger mb-2' size={32} />
        <h5 className='text-danger'>Something went wrong. Please try again Later</h5>
      </div>
    );
  };

  const defaultLocation = useMemo(() => {
    if (location.data) {
      const locationData = location.data;

      if (locationData?.addresses && locationData?.addresses?.length > 0) {
        const defaultAddress = locationData?.addresses?.find((address) => address?.isDefault);
        return defaultAddress;
      }
    }

    return undefined;
  }, [location.data]);

  console.log({ job: jobRequest, customer, location, jobRequest });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        {jobRequest &&
          (jobRequest?.status === 'request-cancelled' ||
            jobRequest?.status === 'request-resubmit') && (
            <Alert
              className='mb-5 d-flex align-items-center gap-2'
              style={{ width: 'fit-content' }}
              variant='danger'
            >
              <ExclamationCircle className='flex-shrink-0 me-1' size={20} />{' '}
              <div>
                Job request status is{' '}
                <span className='fw-bold'>{_.startCase(jobRequest?.status)}. </span>
                {jobRequest?.reasonMessage ? (
                  <span>
                    Reason/message is "<span className='fw-bold'>{jobRequest?.reasonMessage}</span>
                    ."
                  </span>
                ) : (
                  ''
                )}
              </div>
            </Alert>
          )}

        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Job Request</h5>
            <small className='text-muted'>Basic Details about the associated job request</small>
          </div>
        </div>
      </Card.Header>

      <Card.Body className='pt-4'>
        <Row>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <EnvelopePaper size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Job Request ID:</div>
                <div className='text-primary-label fw-semibold'>{jobRequest?.id || 'N/A'}</div>
              </div>
            </div>
          </Col>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <PersonUp size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Supervisor:</div>
                <div className='text-primary-label fw-semibold'>
                  {jobRequest?.supervisor?.name || 'N/A'}
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
                <Person size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Created By:</div>
                <div className='text-primary-label fw-semibold'>
                  {jobRequest?.createdBy?.displayName || 'N/A'}
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
                <Activity size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>status:</div>
                <div className='text-primary-label fw-semibold'>
                  {jobRequest?.status ? _.startCase(jobRequest?.status) : 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Customer Details</h5>
            <small className='text-muted'>Basic customer details</small>
          </div>
        </div>
      </Card.Header>

      {customer.isLoading ? (
        <div
          className='d-flex justify-content-center align-items-center fs-6 py-2'
          style={{ height: '200px' }}
        >
          <Spinner size='sm' className='me-2' animation='border' variant='primary' /> Loading
          Customer Details...
        </div>
      ) : (
        <>
          <Card.Body>
            <Row className='row-gap-3'>
              <Col className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Person size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Customer:</div>
                    <div className='text-primary-label fw-semibold'>
                      {customer?.data?.customerName}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>

          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h5 className='mb-0'>Contact Details</h5>
                <small className='text-muted'>Basic contact details</small>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            <Row>
              <Col md={3}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <PersonVcard size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>First Name:</div>
                    <div className='text-primary-label fw-semibold'>
                      {contact?.firstName || 'N/A'}
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
                    <PersonVcard size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Last Name:</div>
                    <div className='text-primary-label fw-semibold'>
                      {contact?.lastName || 'N/A'}
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
                    <Envelope size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Email:</div>
                    <div className='text-primary-label fw-semibold'>{contact?.email || 'N/A'}</div>
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Phone:</div>
                    <div className='text-primary-label fw-semibold'>{contact?.phone || 'N/A'}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </>
      )}

      {customer.isError && renderError()}

      {location.isLoading ? (
        <div
          className='d-flex justify-content-center align-items-center fs-6 py-2'
          style={{ height: '200px' }}
        >
          <Spinner size='sm' className='me-2' animation='border' variant='primary' /> Loading
          Location Details...
        </div>
      ) : (
        <>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h5 className='mb-0'>Location Details</h5>
                <small className='text-muted'>Basic location details.</small>
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
                    <Building size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Location:</div>
                    <div className='text-primary-label fw-semibold'>
                      {location.data.siteName || 'N/A'}
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
                    <Geo size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Longitude:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.longitude || 'N/A'}
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
                    <Geo size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Latitude:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.latitude || 'N/A'}
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
                    <Signpost size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Street Address #1:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.street1 || 'N/A'}
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
                    <Signpost size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Street Address #2:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.street2 || 'N/A'}
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
                    <Signpost size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Street Address #3:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.street3 || 'N/A'}
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
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>City:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.city || 'N/A'}
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
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Posttal Code:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.postalCode || 'N/A'}
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
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>State:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.province || 'N/A'}
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
                    <Map size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Country:</div>
                    <div className='text-primary-label fw-semibold'>
                      {defaultLocation?.country || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </>
      )}

      <Card.Header className='bg-transparent border-0 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Record Details</h5>
            <small className='text-muted'>
              Details about who created or updated the record and when it was modified.
            </small>
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
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Date:</div>
                <div className='text-primary-label fw-semibold'>
                  {jobRequest?.createdAt
                    ? format(jobRequest.createdAt.toDate(), 'dd/MM/yyyy')
                    : 'N/A'}
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
                <PersonFill size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Created By:</div>
                <div className='text-primary-label fw-semibold'>
                  {jobRequest?.createdBy?.displayName || 'N/A'}
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
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Last Updated:</div>
                <div className='text-primary-label fw-semibold'>
                  {jobRequest?.updatedAt
                    ? format(jobRequest.createdAt.toDate(), 'dd/MM/yyyy')
                    : 'N/A'}
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
                <PersonFill size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Updated By:</div>
                <div className='text-primary-label fw-semibold'>
                  {jobRequest?.updatedBy?.displayName || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Schedule</h5>
            <small className='text-muted'>Details about the requested job schedule.</small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={3} className='d-flex flex-column gap-3'>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Start Date:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {jobRequest?.startDate || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3} className='d-flex flex-column gap-3'>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Start Time:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {jobRequest?.startTime || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3} className='d-flex flex-column gap-3'>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>End Date:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {jobRequest?.endDate || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3} className='d-flex flex-column gap-3'>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>End Time:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {jobRequest?.endTime || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      {location.isError && renderError()}
    </Card>
  );
};

export default SummaryTab;

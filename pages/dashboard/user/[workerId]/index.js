import { useRouter } from 'next/router';
import {
  Row,
  Col,
  Button,
  Card,
  Badge,
  OverlayTrigger,
  Dropdown,
  Spinner,
  Tooltip,
} from 'react-bootstrap';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import DefaultLayout from '../../../../layouts/marketing/DefaultLayout';
import { RouteGuard } from '../../../../components/RouteGuard';
import {
  ArrowReturnLeft,
  Briefcase,
  Building,
  Calendar2,
  CalendarWeek,
  CalendarX,
  CardList,
  CheckCircle,
  ClipboardCheck,
  Clock,
  ClockHistory,
  ExclamationCircle,
  ExclamationTriangleFill,
  Eye,
  Gear,
  HandThumbsDown,
  PencilSquare,
  PersonFill,
  PersonLinesFill,
  Play,
  PlusSquare,
  ShieldCheck,
  Stop,
  Thermometer,
  ThreeDotsVertical,
  XCircle,
  XOctagon,
} from 'react-bootstrap-icons';
import { format, formatDistanceStrict, isAfter, isBefore, isEqual } from 'date-fns';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import DataTable from '@/components/common/DataTable';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { dateFilter, dateSort } from '@/utils/datatable';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import _ from 'lodash';
import { GeeksSEO } from '@/widgets';
import { JobTimer } from '@/sub-components/dashboard/user/jobs/JobTimer';
import PageHeader from '@/components/common/PageHeader';
import { useNotifications } from '@/hooks/useNotifications';
import { STATUS_COLOR } from '@/schema/job';
import Select from '@/components/Form/Select';
import { TooltipContent } from '@/components/common/ToolTipContent';

function WorkerDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { workerId } = router.query;
  const notifications = useNotifications();

  const [activeFilterId, setActiveFilterId] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });

  const [year, setYear] = useState({
    value: new Date().getFullYear(),
    label: new Date().getFullYear(),
  });

  const columnHelper = createColumnHelper();

  const stats = useMemo(() => {
    const total = jobs.data.length;
    const upcomingJobs = jobs.data.filter((job) => {
      const startDate = job.startDate;
      const startTime = job.startTime;
      const endDate = job.endDate;
      const endTime = job.endTime;
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(`${endDate}T${endTime}:00`);
      const pending = job.status === 'job-confirm';

      return (isEqual(start, new Date()) || isAfter(start, new Date()) || isEqual(end, new Date()) || isAfter(end, new Date())) && pending; //prettier-ignore
    }).length;
    const onSiteJobs = jobs.data.filter((job) => job.scope === 'site').length;
    const onLabJobs = jobs.data.filter((job) => job.scope === 'lab').length;
    const urgentJobs = jobs.data.filter((job) => job.priority === 'urgent').length;
    const overdueJobs = jobs.data.filter((job) => {
      const endDate = job.endDate;
      const endTime = job.endTime;
      const end = new Date(`${endDate}T${endTime}:00`);
      const pending = job.status === 'job-confirm';

      return isBefore(end, new Date()) && pending;
    }).length;
    const confirmedJobs = jobs.data.filter((job) => job.status === 'job-confirm').length;
    const inProgressJobs = jobs.data.filter((job) => job.status === 'job-in-progress').length;
    const jobValidationJobs = jobs.data.filter((job) => job.status === 'job-validation').length;
    const cancelledJobs = jobs.data.filter((job) => job.status === 'job-cancel').length;
    const completedJobs = jobs.data.filter((job) => job.status === 'job-complete').length;
    const rescheduledJobs = jobs.data.filter((job) => job.status === 'job-reschedule').length;
    const unReturnedEquipmentJobs = jobs.data.filter(
      (job) => !job.details?.isReturnedEquipment
    ).length;

    return [
      {
        id: 'all',
        value: total,
        title: 'Total Jobs',
        icon: Briefcase,
        color: 'secondary',
        width: 12,
        filter: 'all',
        filterValue: '',
      },
      {
        id: 'upcoming-jobs',
        value: upcomingJobs,
        title: 'Upcoming',
        icon: Clock,
        color: 'dark',
        width: 2,
        filter: 'startDate',
        filterValue: null,
      },
      {
        id: 'overdue-jobs',
        value: overdueJobs,
        title: 'Overdue',
        icon: CalendarX,
        color: 'secondary',
        width: 2,
        filter: 'endDate',
        filterValue: null,
      },
      {
        id: 'urgent-jobs',
        value: urgentJobs,
        title: 'Urgent',
        icon: ExclamationCircle,
        color: 'warning',
        width: 2,
        filter: 'priority',
        filterValue: 'urgent',
      },
      {
        id: 'on-site',
        value: onSiteJobs,
        title: 'On Site',
        icon: Building,
        color: 'secondary',
        width: 2,
        filter: 'scope',
        filterValue: 'site',
      },
      {
        id: 'on-lab',
        value: onLabJobs,
        title: 'On Laboratory',
        icon: Thermometer,
        color: 'secondary',
        width: 2,
        filter: 'scope',
        filterValue: 'lab',
      },
      {
        id: 'in-progress-jobs',
        value: inProgressJobs,
        title: 'In Progress',
        icon: Clock,
        color: 'primary',
        width: 2,
        filter: 'status',
        filterValue: 'job-in-progress',
      },
      {
        id: 'confirmed-jobs',
        value: confirmedJobs,
        title: 'Confirmed',
        icon: ClipboardCheck,
        color: 'info',
        width: 2,
        filter: 'status',
        filterValue: 'job-confirm',
      },
      {
        id: 'for-validation-jobs',
        value: jobValidationJobs,
        title: 'For Validation',
        icon: CheckCircle,
        color: 'success',
        width: 2,
        filter: 'status',
        filterValue: 'job-validation',
      },
      {
        id: 'completed-jobs',
        value: completedJobs,
        title: 'Completed',
        icon: ShieldCheck,
        color: 'purple',
        width: 2,
        filter: 'status',
        filterValue: 'job-complete',
      },
      {
        id: 'rescheduled-jobs',
        value: rescheduledJobs,
        title: 'Rescheduled',
        icon: CalendarWeek,
        color: 'warning',
        width: 2,
        filter: 'status',
        filterValue: 'job-reschedule',
      },
      {
        id: 'cancelled-jobs',
        value: cancelledJobs,
        title: 'Cancelled',
        icon: XCircle,
        color: 'danger',
        width: 2,
        filter: 'status',
        filterValue: 'job-cancel',
      },
      {
        id: 'un-returned-equipment-jobs',
        value: unReturnedEquipmentJobs,
        title: 'Unreturned Equipment',
        icon: XOctagon,
        color: 'danger',
        width: 2,
        filter: 'equipment status',
        filterValue: 'unreturned',
      },
    ];
  }, [JSON.stringify(jobs), workerId]);

  const getStartEnd = (startDate, endDate, startTime, endTime) => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    return { duration: formatDistanceStrict(start, end), start, end };
  };

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: ({ row, table }) => (
          <div>
            {(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) ||
              0) + 1}
          </div>
        ),
      }),
      columnHelper.accessor((row) => `${row.id} - ${row.jobRequestId || ''}`, {
        id: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
        cell: ({ row }) => {
          const { id, jobRequestId, jobCn } = row.original;
          return (
            <div className='d-flex flex-column gap-2 justify-content-center align-items-center'>
              <div className='d-flex flex-column justify-content-center'>
                <div className='fw-bold'>ID:</div> <div>{id}</div>
              </div>

              {jobRequestId && (
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Request ID:</div> <div>{jobRequestId}</div>
                </div>
              )}

              {jobCn && (
                <Badge className='d-flex align-items-center' bg='danger'>
                  <ExclamationTriangleFill className='me-2' size={12} /> CN
                </Badge>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => format(row.createdAt.toDate(), 'dd-MM-yyyy'), {
        id: 'date',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        cell: ({ row }) => {
          const createdAt = row.original.createdAt.toDate();
          return <div>{format(createdAt, 'dd-MM-yyyy')}</div>;
        },
        filterFn: (row, columnId, filterValue, addMeta) => {
          const createdAt = row.original.createdAt.toDate();
          const filterDateValue = new Date(filterValue);
          return dateFilter(createdAt, filterDateValue);
        },
        sortingFn: (rowA, rowB, columnId) => {
          const rowACreatedAt = rowA.original.createdAt.toDate();
          const rowBCreatedAt = rowB.original.createdAt.toDate();
          return dateSort(rowACreatedAt, rowBCreatedAt);
        },
      }),
      columnHelper.accessor('scope', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scope' />,
        cell: ({ row }) => {
          const colors = {
            lab: 'info',
            site: 'warning',
          };

          return (
            <Badge className='text-capitalize' bg={colors[row.original.scope] || 'secondary'}>
              {row.original.scope}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('priority', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
        cell: ({ row }) => {
          const colors = {
            normal: 'secondary',
            urgent: 'warning',
          };

          return (
            <Badge className='text-capitalize' bg={colors[row.original.priority] || 'secondary'}>
              {row.original.priority}
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => `${row.customer.name} - ${row.location.name}`, {
        id: 'customer',
        filterFn: 'includesString',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
        cell: ({ row }) => (
          <div className='d-flex flex-column justify-content-center row-gap-1'>
            <div>
              <PersonFill size={14} className='text-primary me-2' /> {row.original.customer.name}
            </div>
            <div>
              <Building size={14} className='text-primary me-2' /> {row.original.location.name}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => {
          const status = row.original.status;

          return (
            <div className='d-flex flex-column justify-content-center align-items-sm-center gap-2'>
              <Badge bg={STATUS_COLOR[status] || 'secondary'}>{_.startCase(status)}</Badge>

              {status === 'job-cancel' && (
                <span className='fw-medium fst-italic'>
                  "{row.original.reasonMessage || 'N/A'}"
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor(
        (row) => {
          return row?.workers?.length > 0
            ? row.workers.map((worker) => worker.name).join(', ')
            : 'N/A';
        },
        {
          id: 'workers',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Technician/s' />,
          cell: ({ row }) => {
            const { workers } = row.original;

            if (!workers || workers.length < 1) return 'N/A';

            return (
              <div>
                <PersonLinesFill size={14} className='text-primary me-2' />

                {/* //* show the first 3 workers */}
                <span className='me-1'>
                  {workers
                    ?.slice(0, 3)
                    .map((worker) => worker?.name)
                    .join(', ')}
                </span>

                {/* //* show the rest workers */}
                {workers?.length > 3 && (
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent
                          title='Assigned workers'
                          info={workers
                            ?.slice(3, workers?.length)
                            .map((worker) => worker?.name || '')}
                        />
                      </Tooltip>
                    }
                  >
                    <Badge pill style={{ fontSize: '10px' }}>
                      + {workers?.slice(3, workers?.length).length}
                    </Badge>
                  </OverlayTrigger>
                )}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          //TODO: filtering & sorting logic
          const { startDate, endDate, startTime, endTime } = row;
          return getStartEnd(startDate, endDate, startTime, endTime);
        },
        {
          id: 'Schedule',
          size: 180,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Schedule' />,
          cell: ({ row }) => {
            const { startDate, endDate, startTime, endTime } = row.original;
            const startEnd = getStartEnd(startDate, endDate, startTime, endTime);
            return (
              <div className='d-flex flex-column gap-2 justify-content-center'>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Start</div>
                  <div>{format(startEnd.start, 'dd-MM-yyyy hh:mm a')}</div>
                </div>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>End</div>
                  <div>{format(startEnd.end, 'dd-MM-yyyy hh:mm a')}</div>
                </div>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Duration:</div> <div>{startEnd.duration}</div>
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          //TODO: filtering & sorting logic
          const { startDate, endDate, startTime, endTime } = row;
          return getStartEnd(startDate, endDate, startTime, endTime);
        },
        {
          id: 'Start / End',
          size: 180,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Stard / End' />,
          cell: ({ row }) => {
            const startBy = row.original?.details?.startBy?.displayName;
            const startByAt = row.original?.details?.startByAt?.toDate();

            const endBy = row.original?.details?.endBy?.displayName;
            const endByAt = row.original?.details?.endByAt?.toDate();

            return (
              <div className='d-flex flex-column gap-2 justify-content-center'>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Start:</div>
                  <div>{startBy || 'N/A'}</div>
                  <div>{startByAt ? format(startByAt, 'dd-MM-yyyy hh:mm a') : 'N/A'}</div>
                </div>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Completed:</div>
                  <div>{endBy || 'N/A'}</div>
                  <div>{endByAt ? format(endByAt, 'dd-MM-yyyy hh:mm a') : 'N/A'}</div>
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => (row?.details?.isReturnedEquipment ? 'returned' : 'unreturned'),
        {
          id: 'equipment status',
          size: 100,
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Equipment Status' />
          ),
          cell: ({ row }) => {
            const status = row.original?.details?.isReturnedEquipment;

            return (
              <Badge className='text-capitalize' bg={status ? 'success' : 'danger'}>
                {status ? 'Returned' : 'Unreturned'}
              </Badge>
            );
          },
        }
      ),
      columnHelper.accessor((row) => row.createdBy?.displayName || 'N/A', {
        id: 'created by',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created By' />,
        cell: ({ row }) => {
          const displayName = row.original.createdBy?.displayName || 'N/A';
          return (
            <div>
              <PersonFill size={14} className='text-primary me-2' />
              <span>{displayName}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('startDate', {
        filterFn: (row, columnId, filterValue, addMeta) => {
          const startDate = row.original.startDate;
          const startTime = row.original.startTime;
          const endDate = row.original.endDate;
          const endTime = row.original.endTime;
          const start = new Date(`${startDate}T${startTime}:00`);
          const end = new Date(`${endDate}T${endTime}:00`);

          const pending = row.original.status === 'job-confirm';

          return (
            (isEqual(start, filterValue) ||
              isAfter(start, filterValue) ||
              isEqual(end, filterValue) ||
              isAfter(end, filterValue)) &&
            pending
          );
        },
      }),
      columnHelper.accessor('endDate', {
        filterFn: (row, columnId, filterValue, addMeta) => {
          const endDate = row.original.endDate;
          const endTime = row.original.endTime;
          const end = new Date(`${endDate}T${endTime}:00`);
          const pending = row.original.status === 'job-confirm';

          return isBefore(end, filterValue) && pending;
        },
      }),
      columnHelper.accessor((row) => (row?.jobCn ? 'true' : 'false'), {
        id: 'cn',
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id, details, status, jobRequest, jobCn } = row.original;

          const salesperson = jobRequest?.createdBy?.uid;

          const handleViewJob = (id) => {
            router.push(`/user/${workerId}/jobs/view/${id}`);
          };

          const handleEditJob = (id) => {
            router.push(`/user/${workerId}/jobs/edit-jobs/${id}`);
          };

          const handlejobCn = (cnId, jobId) => {
            if (!cnId) router.push(`/user/${workerId}/job-cns/create?jobId=${jobId}`);
            else router.push(`/user/${workerId}/job-cns/edit-job-cns/${cnId}`);
          };

          const handleViewJobCn = (id) => {
            router.push(`/user/${workerId}/job-cns/view/${id}`);
          };

          const handleDeleteJob = (id) => {
            Swal.fire({
              title: 'Are you sure?',
              text: 'This action cannot be undone.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Confirm',
              cancelButtonText: 'Cancel',
              customClass: {
                confirmButton: 'btn btn-primary rounded',
                cancelButton: 'btn btn-secondary rounded',
              },
            }).then(async (data) => {
              if (data.isConfirmed) {
                try {
                  setIsLoading(true);

                  const jobHeaderRef = doc(db, 'jobHeaders', id);
                  const jobDetailsRef = doc(db, 'jobDetails', id);

                  await Promise.all([
                    await deleteDoc(jobHeaderRef),
                    await deleteDoc(jobDetailsRef),
                  ]);

                  toast.success('Job removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing job:', error);
                  toast.error('Error removing job: ' + error.message, { position: 'top-right' });
                  setIsLoading(false);
                }
              }
            });
          };

          const handleUpdateJobStatus = (id, jobStatus) => {
            Swal.fire({
              title: `Job Status Update - Job #${id}`,
              text: `Are you sure you want to update the job status to "${_.startCase(
                jobStatus
              )}"?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Confirm',
              cancelButtonText: 'Cancel',
              customClass: {
                confirmButton: 'btn btn-primary rounded',
                cancelButton: 'btn btn-secondary rounded',
              },
            }).then(async (data) => {
              if (data.isConfirmed) {
                try {
                  setIsLoading(true);

                  const jobHeaderRef = doc(db, 'jobHeaders', id);

                  //* if job status is in progress, check if there is any job in progress
                  //* if there is in progress job, throw error you cannot update job to in progress if there is any job in progress
                  if (jobStatus === 'in progress') {
                    const jobCollectionInProgressRef = query(
                      collection(db, 'jobHeaders'),
                      where('status', '==', 'job-in-progress'),
                      where('workers', 'array-contains', {
                        id: workerId,
                        name: auth.currentUser.displayName,
                      }),
                      where('startDate', '>=', format(new Date(), 'yyyy-MM-dd'))
                    );

                    const jobInProgressSnapshot = await getDocs(jobCollectionInProgressRef);
                    const inProgressJobCount = jobInProgressSnapshot.empty
                      ? 0
                      : jobInProgressSnapshot.docs.length;

                    if (inProgressJobCount > 0) {
                      toast.error('You cannot start a job while there is a job in progress', {
                        position: 'top-right',
                      });
                      setIsLoading(false);
                      return;
                    }
                  }

                  await updateDoc(jobHeaderRef, {
                    status: jobStatus,
                    updatedAt: serverTimestamp(),
                    updatedBy: auth.currentUser,
                  });

                  toast.success('Job status updated successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error updating job status:', error);
                  toast.error('Error updating job status: ' + error.message, { position: 'top-right' }); //prettier-ignore
                  setIsLoading(false);
                }
              }
            });
          };

          const handleReturnEquipment = (id, details) => {
            if (!details || !details.equipments) {
              toast.error('Job details not found');
              return;
            }

            Swal.fire({
              title: 'Are you sure?',
              text: 'Are you sure you want to return all the equipment related to this job?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#1e40a6',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Confirm',
              cancelButtonText: 'Cancel',
            }).then(async (data) => {
              if (data.isConfirmed) {
                try {
                  setIsLoading(true);

                  await runTransaction(db, async (transaction) => {
                    try {
                      //* update equipment qty
                      details.equipments.map((eq) => {
                        transaction.update(doc(db, 'equipments', eq.id), { qty: increment(1) });
                      });

                      //* update job header
                      const jobDetails = doc(db, 'jobDetails', id);
                      transaction.update(jobDetails, {
                        isReturnedEquipment: true,
                        updatedAt: serverTimestamp(),
                        updatedBy: auth.currentUser,
                      });

                      //* update job header
                      const jobHeader = doc(db, 'jobHeaders', id);
                      transaction.update(jobHeader, {
                        updatedAt: serverTimestamp(),
                        updatedBy: auth.currentUser,
                      });
                    } catch (error) {
                      throw error;
                    }
                  });

                  //* create notification when equipment is returned
                  await notifications.create({
                    module: 'job',
                    target: ['admin', 'supervisor'],
                    title: 'Equipment returned',
                    message: `Job (#${id}) equipment was returned by ${auth.currentUser.displayName}.`,
                    data: {
                      redirectUrl: `/jobs/view/${id}`,
                    },
                  });

                  toast.success('Equipment returned successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error returning equipment:', error);
                  toast.error('Error returning equipment: ' + error.message, {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                }
              }
            });
          };

          if (!workerId) return null;

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left'
              offset={[0, 20]}
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewJob(id)}>
                    <Eye className='me-2' size={16} />
                    View Job
                  </Dropdown.Item>

                  {status !== 'job-complete' && (
                    <Dropdown.Item onClick={() => handleEditJob(id)}>
                      <PencilSquare className='me-2' size={16} />
                      Edit Job
                    </Dropdown.Item>
                  )}

                  {/* <Dropdown.Item onClick={() => handleDeleteJob(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Job
                  </Dropdown.Item> */}

                  {!details?.isReturnedEquipment && (
                    <Dropdown.Item onClick={() => handleReturnEquipment(id, details)}>
                      <ArrowReturnLeft className='me-2' size={16} />
                      Return Equipment
                    </Dropdown.Item>
                  )}

                  {/* <OverlayTrigger
                    rootClose
                    trigger='click'
                    placement='right-end'
                    overlay={
                      <Dropdown.Menu show style={{ zIndex: 999 }}>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'in progress')}>
                          <Hourglass className='me-2' size={16} />
                          In Progress
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'confirmed')}>
                          <Flag className='me-2' size={16} />
                          Confirmed
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'completed')}>
                          <CheckCircle className='me-2' size={16} />
                          Completed
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'cancelled')}>
                          <XCircle className='me-2' size={16} />
                          Cancelled
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'validated')}>
                          <ShieldCheck className='me-2' size={16} />
                          Validated
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    }
                  >
                    <Dropdown.Item>
                      <ArrowRepeat className='me-2' size={16} />
                      Update Status
                    </Dropdown.Item>
                  </OverlayTrigger> */}

                  {status !== 'job-in-progress' &&
                    status !== 'job-validation' &&
                    status === 'job-confirm' && (
                      <Dropdown.Item onClick={() => startJob(id, setIsLoading, salesperson)}>
                        <Play className='me-2' size={18} /> Initiate Job
                      </Dropdown.Item>
                    )}

                  {status === 'job-in-progress' && (
                    <>
                      <Dropdown.Item onClick={() => stopJob(id, setIsLoading, salesperson)}>
                        <Stop className='me-2' size={18} /> Complete Job
                      </Dropdown.Item>
                      {/* 
                      <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'cancelled')}>
                        <XCircle className='me-2' size={18} /> Cancel Job
                      </Dropdown.Item> */}
                    </>
                  )}

                  {['job-in-progress', 'job-validation', 'job-complete'].includes(status) &&
                    jobCn?.cnId && (
                      <OverlayTrigger
                        rootClose
                        trigger='click'
                        placement='left'
                        overlay={
                          <Dropdown.Menu show style={{ zIndex: 999 }}>
                            <Dropdown.Item onClick={() => handleViewJobCn(jobCn.cnId)}>
                              <Eye className='me-2' size={16} />
                              View Job Cn
                            </Dropdown.Item>

                            <Dropdown.Item onClick={() => handlejobCn(jobCn.cnId, id)}>
                              <PencilSquare className='me-2' size={16} />
                              Edit Job CN
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        }
                      >
                        <Dropdown.Item>
                          <Gear className='me-2' size={16} />
                          Manage Job CN
                        </Dropdown.Item>
                      </OverlayTrigger>
                    )}

                  {['job-in-progress', 'job-validation', 'job-complete'].includes(status) &&
                    !jobCn?.cnId && (
                      <Dropdown.Item onClick={() => handlejobCn(jobCn?.cnId, id)}>
                        <PlusSquare className='me-2' size={16} />
                        Create Job CN
                      </Dropdown.Item>
                    )}

                  {status !== 'job-confirm' && (
                    <Dropdown.Item
                      onClick={() => router.push(`/user/${workerId}/jobs/${id}/calibrations`)}
                    >
                      <Eye className='me-2' size={16} />
                      View Calibrations
                    </Dropdown.Item>
                  )}

                  {status === 'job-in-progress' && (
                    <Dropdown.Item
                      onClick={() =>
                        router.push(`/user/${workerId}/jobs/${id}/calibrations/create`)
                      }
                    >
                      <PlusSquare className='me-2' size={16} />
                      Add Calibration
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              }
            >
              <Button variant='light' className='p-2' size='sm'>
                {isLoading ? (
                  <Spinner animation='border' size='sm' />
                ) : (
                  <ThreeDotsVertical size={16} />
                )}
              </Button>
            </OverlayTrigger>
          );
        },
      }),
    ];
  }, [workerId]);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by job id & job request id...',
      },
      {
        label: 'Technician',
        columnId: 'workers',
        type: 'text',
        placeholder: 'Search by technician...',
      },
      {
        label: 'Created By',
        columnId: 'created by',
        type: 'text',
        placeholder: 'Search by created by...',
      },
      {
        label: 'Date',
        columnId: 'date',
        type: 'date',
      },
      {
        label: 'CN',
        columnId: 'cn',
        type: 'select',
        options: [
          { label: 'N/A', value: '' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    ];
  }, []);

  const table = useReactTable({
    data: jobs.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      columnVisibility: { startDate: false, endDate: false, cn: false },
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'date', desc: true }],
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
  });

  const setFilterBasedOnStat = (stat) => {
    switch (stat.filter) {
      case 'all':
        table.resetColumnFilters();
        setActiveFilterId('all');
        break;

      case 'status':
        setColumnFilters([{ id: 'status', value: stat.filterValue }]);
        setActiveFilterId(stat.id);
        break;

      case 'scope':
        setColumnFilters([{ id: 'scope', value: stat.filterValue }]);
        setActiveFilterId(stat.id);
        break;

      case 'priority':
        setColumnFilters([{ id: 'priority', value: stat.filterValue }]);
        setActiveFilterId(stat.id);
        break;

      case 'startDate':
        setColumnFilters([{ id: 'startDate', value: new Date() }]);
        setActiveFilterId(stat.id);
        break;

      case 'endDate':
        setColumnFilters([{ id: 'endDate', value: new Date() }]);
        setActiveFilterId(stat.id);
        break;

      case 'equipment status':
        setColumnFilters([{ id: 'equipment status', value: stat.filterValue }]);
        setActiveFilterId(stat.id);
        break;

      default:
        table.resetColumnFilters();
        setActiveFilterId('');
        break;
    }
  };

  const startJob = async (id, setIsLoading, salesperson) => {
    if (!id) return;

    Swal.fire({
      title: 'Initiate Job?',
      text: 'Are you sure you want to mark the job as "Job In Progress"?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary rounded',
        cancelButton: 'btn btn-secondary rounded',
      },
    }).then(async (data) => {
      if (data.isConfirmed) {
        try {
          setIsLoading(true);

          //* update job header & details
          const jobHeaderRef = doc(db, 'jobHeaders', id);
          const jobDetailsRef = doc(db, 'jobDetails', id);

          await runTransaction(db, async (transaction) => {
            try {
              transaction.update(jobHeaderRef, {
                status: 'job-in-progress',
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });

              transaction.update(jobDetailsRef, {
                startByAt: serverTimestamp(),
                startBy: auth.currentUser,
                endByAt: null,
                endBy: null,
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });
            } catch (error) {
              throw error;
            }
          });

          //* create notification for admin and supervisor when updated a job status
          await notifications.create({
            module: 'job',
            target: ['admin', 'supervisor', ...(salesperson ? [salesperson] : [])],
            title: 'Job started',
            message: `Job (#${id}) has been started by ${auth.currentUser.displayName}.`,
            data: {
              redirectUrl: `/jobs/view/${id}`,
            },
          });

          toast.success('Job has been started successfully.', { position: 'top-right' });
          setIsLoading(false);

          //* redirect to job calibrations
          setTimeout(() => {
            router.push(`/user/${workerId}/jobs/${id}/calibrations`);
          }, 2000);
        } catch (error) {
          setIsLoading(false);
          console.error('Error stopping job', error);
          toast.error('Unexpected error occured while stopping job. Please try again later.');
        }
      }
    });
  };

  const stopJob = async (id, setIsLoading, salesperson) => {
    if (!id) return;

    Swal.fire({
      title: 'Finished Job?',
      text: 'Are you sure you want you want to mark the job as "Job Validation"?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary rounded',
        cancelButton: 'btn btn-secondary rounded',
      },
    }).then(async (data) => {
      if (data.isConfirmed) {
        try {
          setIsLoading(true);

          //* update job header & details
          const jobHeaderRef = doc(db, 'jobHeaders', id);
          const jobDetailsRef = doc(db, 'jobDetails', id);

          await runTransaction(db, async (transaction) => {
            try {
              transaction.update(jobHeaderRef, {
                status: 'job-validation',
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });

              transaction.update(jobDetailsRef, {
                endByAt: serverTimestamp(),
                endBy: auth.currentUser,
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });
            } catch (error) {
              throw error;
            }
          });

          //* create notification for admin and supervisor when updated a job status
          await notifications.create({
            module: 'job',
            target: ['admin', 'supervisor', ...(salesperson ? [salesperson] : [])],
            title: 'Job finished',
            message: `Job (#${id}) has been finished by ${auth.currentUser.displayName}.`,
            data: {
              redirectUrl: `/jobs/view/${id}`,
            },
          });

          toast.success('Job has been finished successfully.', { position: 'top-right' });
          setIsLoading(false);
          console.log('stop timer..');
        } catch (error) {
          setIsLoading(false);
          console.error('Error stopping job', error);
          toast.error('Unexpected error occured while stopping job. Please try again later.');
        }
      }
    });
  };

  const StatCard = ({ stat, rowKey }) => {
    const Icon = stat.icon;

    return (
      <Col
        lg={stat.width}
        key={rowKey}
        style={{ cursor: 'pointer' }}
        onClick={() => setFilterBasedOnStat(stat)}
      >
        <div
          className={`bg-${activeFilterId !== stat.id ? stat.color : 'primary-subtle'} rounded`}
          style={{ height: 8 }}
        />

        {stat.id !== 'all' ? (
          <div
            className={`d-flex flex-column justify-content-start align-items-center align-items-lg-start shadow-sm bg-white rounded-top-0 rounded-bottom p-4 h-100 border border-transaparent w-100 ${
              activeFilterId === stat.id ? 'border-primary' : 'hover-item'
            }`}
          >
            <div className='d-flex align-items-center mb-3 flex-wrap gap-2'>
              <Icon size={18} className={`text-${stat.color} flex-shrink-0`} />
              <span
                style={{ maxWidth: '120px' }}
                className={`small fw-semibold py-1 px-2 text-${stat.color} bg-${stat.color}-soft rounded-3`}
              >
                {stat.title}
              </span>
            </div>

            {jobs.isLoading ? (
              <Spinner style={{ width: 20, height: 20 }} animation='border' size='sm' />
            ) : (
              <>
                <h3 className='mb-1'>{stat.value}</h3>
                <small className='text-muted'>{stat.subtitle}</small>
              </>
            )}
          </div>
        ) : (
          <div
            className={`d-flex flex-column justify-content-center align-items-center shadow-sm bg-white rounded-top-0 rounded-bottom p-4 h-100 border border-transaparent w-100 ${
              activeFilterId === stat.id ? 'border-primary' : 'hover-item'
            }`}
          >
            <div
              className='d-flex flex-column gap-2 justify-content-center align-items-center mb-3'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='d-flex align-items-center flex-wrap gap-2'>
                <Calendar2 size={18} />

                <span
                  className={`small fw-semibold py-1 px-2 text-secondary bg-secondary-soft rounded-3`}
                >
                  Year
                </span>
              </div>

              <Select
                value={year}
                inputId='year-select'
                instanceId='year-select'
                onChange={(option) => setYear(option)}
                options={getYears(2020).map((year) => ({ label: year, value: year }))}
                placeholder='Select year'
                noOptionsMessage={() => 'No options found'}
              />
            </div>

            <div className='d-flex align-items-center mb-3 flex-wrap gap-2'>
              <Icon size={18} className={`text-${stat.color} flex-shrink-0`} />
              <span
                className={`small fw-semibold py-1 px-2 text-${stat.color} bg-${stat.color}-soft rounded-3`}
              >
                {stat.title}
              </span>
            </div>

            {jobs.isLoading ? (
              <Spinner style={{ width: 20, height: 20 }} animation='border' size='sm' />
            ) : (
              <>
                <h3 className='mb-1'>{stat.value}</h3>
                <small className='text-muted'>{stat.subtitle}</small>
              </>
            )}
          </div>
        )}
      </Col>
    );
  };

  const getYears = (startYear) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };

  //* Optimize idea query
  useEffect(() => {
    if (!year?.value) {
      setJobs({ data: [], isLoading: false, isError: false });
      return;
    }

    if (!workerId || !auth) {
      setJobs({ data: [], isLoading: false, isError: false });
      return;
    }

    const startOfYear = new Date(year.value, 0, 1); //* Jan 1
    const endOfYear = new Date(year.value + 1, 0, 1); //* Jan 1 of next year

    const q = query(
      collection(db, 'jobHeaders'),
      where('createdAt', '>=', Timestamp.fromDate(startOfYear)),
      where('createdAt', '<', Timestamp.fromDate(endOfYear)),
      where('workers', 'array-contains', {
        id: workerId,
        name: auth.currentUser.displayName,
      })
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          setJobs({ data: [], isLoading: false, isError: false });
          return;
        }

        const jobDocs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const promises = jobDocs.map(async (job) => {
          try {
            const jobDetailsPromise = getDoc(doc(db, 'jobDetails', job.id));
            const jobRequestPromise = job?.jobRequestId
              ? getDoc(doc(db, 'jobRequests', job.jobRequestId))
              : Promise.resolve(null);

            const jobCnPromise = getDocs(
              query(
                collection(db, 'jobCustomerNotifications'),
                where('jobId', '==', job.id),
                limit(1)
              )
            );

            const [jobDetailsDoc, jobRequestDoc, jobCNDocs] = await Promise.all([
              jobDetailsPromise,
              jobRequestPromise,
              jobCnPromise,
            ]);

            return {
              ...job,
              details: jobDetailsDoc.exists() ? jobDetailsDoc.data() : null,
              jobRequest: jobRequestDoc?.exists() ? jobRequestDoc.data() : null,
              jobCn: jobCNDocs.empty ? null : jobCNDocs?.docs?.[0]?.data() || null,
            };
          } catch (err) {
            console.warn(`Failed to fetch details for job ${job.id}:`, err);
            return null; // Skip this job
          }
        });

        const settledResults = await Promise.allSettled(promises);

        const validJobs = settledResults
          .filter((result) => result.status === 'fulfilled' && result.value !== null)
          .map((result) => result.value);

        setJobs({ data: validJobs, isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setJobs({ data: [], isLoading: false, isError: true });
      }
    );

    return () => {
      unsubscribe();
      setJobs({ data: [], isLoading: true, isError: false });
    };
  }, [year?.value, workerId, auth]);

  //* set default filtert
  useEffect(() => {
    if (!jobs.isLoading) {
      setFilterBasedOnStat({ filter: 'startDate', id: 'upcoming-jobs' });
    }
  }, [JSON.stringify(jobs)]);

  return (
    <>
      <GeeksSEO title='Technician Dashboard | VITAR Group | Portal' />

      <div className='d-flex flex-column row-gap-4'>
        <PageHeader
          title='Dashboard Overview'
          subtitle="Welcome back! Here's what's happening with your work."
        />

        <Row className='row-gap-4'>
          <Col lg={12} xl={2}>
            <Row className='row-gap-4 h-100'>
              {stats
                .filter((stat) => stat.id === 'all')
                .map((stat) => (
                  <StatCard stat={stat} rowKey={`${stat.id}-${stat.title}`} />
                ))}
            </Row>
          </Col>

          <Col lg={12} xl={10}>
            <Row className='row-gap-4'>
              {stats
                .filter((stat) => stat.id !== 'all')
                .map((stat, i) => (
                  <StatCard stat={stat} rowKey={`${stat.id}-${stat.title}`} />
                ))}
            </Row>
          </Col>
        </Row>

        <Card className='border-0 shadow-sm'>
          <Card.Body className='p-4'>
            <DataTable table={table} pageSize={5} isLoading={jobs.isLoading} isError={jobs.isError}>
              <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
                <DataTableSearch table={table} isGlobalSearch={false} columnId='customer' />

                <div className='d-flex align-items-center gap-2'>
                  <DataTableFilter table={table} filterFields={filterFields} />
                  <DataTableViewOptions table={table} />
                </div>
              </div>
            </DataTable>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}

export default function ProtectedWorkerProfile() {
  return (
    <RouteGuard>
      <WorkerDashboard />
    </RouteGuard>
  );
}

ProtectedWorkerProfile.Layout = DefaultLayout;

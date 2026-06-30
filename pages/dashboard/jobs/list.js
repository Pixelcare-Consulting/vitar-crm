import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from 'react-bootstrap';
import {
  ArrowRepeat,
  ArrowReturnLeft,
  Briefcase,
  BriefcaseFill,
  Building,
  Calendar2,
  CalendarWeek,
  CalendarX,
  CardList,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Copy,
  ExclamationCircle,
  ExclamationTriangleFill,
  Eye,
  Flag,
  Gear,
  HandThumbsDown,
  Hourglass,
  HouseDoorFill,
  PencilSquare,
  PersonFill,
  PersonLinesFill,
  Plus,
  PlusSquare,
  ShieldCheck,
  Thermometer,
  ThreeDotsVertical,
  Trash,
  XCircle,
  XOctagon,
} from 'react-bootstrap-icons';
import ContentHeader from '@/components/dashboard/ContentHeader';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
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
import { db, storage } from '@/firebase';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import DataTable from '@/components/common/DataTable';
import { format, formatDistanceStrict, isAfter, isBefore, isEqual } from 'date-fns';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import DataTableSearch from '@/components/common/DataTableSearch';
import { dateFilter, dateSort } from '@/utils/datatable';
import DataTableFilter from '@/components/common/DataTableFilter';
import { TooltipContent } from '@/components/common/ToolTipContent';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import _ from 'lodash';
import { useNotifications } from '@/hooks/useNotifications';
import { deleteObject, listAll, ref } from 'firebase/storage';
import { PRIORITY_LEVELS_COLOR, SCOPE_TYPE_COLOR, STATUS, STATUS_COLOR } from '@/schema/job';
import withReactContent from 'sweetalert2-react-content';
import Select from '@/components/Form/Select';

const JobList = () => {
  const router = useRouter();
  const auth = useAuth();
  const notifications = useNotifications();

  const [jobs, setJobs] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

  const [year, setYear] = useState({
    value: new Date().getFullYear(),
    label: new Date().getFullYear(),
  });

  const [activeFilterId, setActiveFilterId] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
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
  }, [JSON.stringify(jobs)]);

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
                <Badge className='d-flex align-items-center about-section' bg='danger'>
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
          const scope = row?.original?.scope;

          return (
            <Badge className='text-capitalize' bg={SCOPE_TYPE_COLOR[scope] || 'secondary'}>
              {scope}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('priority', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
        cell: ({ row }) => {
          const priority = row?.original?.priority;

          return (
            <Badge className='text-capitalize' bg={PRIORITY_LEVELS_COLOR[priority] || 'secondary'}>
              {priority}
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
          const status = row?.original?.status;

          return (
            <div className='d-flex flex-column justify-content-center align-items-center gap-2'>
              <Badge bg={STATUS_COLOR[status] || 'secondary'}>{_.startCase(status)}</Badge>

              {status === 'job-cancel' && (
                <span className='fw-medium fst-italic'>
                  "{row?.original?.reasonMessage || 'N/A'}"
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
      columnHelper.accessor((row) => row.jobRequest?.createdBy?.displayName || '', {
        id: 'sales person',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Sales Person' />,
        cell: ({ row }) => {
          const salesPerson = row.original.jobRequest?.createdBy?.displayName || '';
          return <div>{salesPerson}</div>;
        },
      }),
      columnHelper.accessor((row) => row.createdBy?.displayName || 'N/A', {
        id: 'created by',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created By' />,
        cell: ({ row }) => {
          const displayName = row.original.createdBy?.displayName || 'N/A';
          const createdAt = row.original.createdAt.toDate();

          return (
            <div className='d-flex flex-column justify-content-center align-items-center gap-2'>
              <span>{displayName}</span>
              <span>{format(createdAt, 'dd-MM-yyyy')}</span>
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

          const { id, details, status, workers, jobRequest, jobCn } = row.original;

          const salesperson = jobRequest?.createdBy?.uid;

          const handleViewJob = (id) => {
            router.push(`/jobs/view/${id}`);
          };

          const handleEditJob = (id) => {
            router.push(`/jobs/edit-jobs/${id}`);
          };

          const handleDuplicateJob = (id) => {
            router.push(`/jobs/duplicate/${id}`);
          };

          const handlejobCn = (cnId, jobId) => {
            if (!cnId) router.push(`/job-cns/create?jobId=${jobId}`);
            else router.push(`/job-cns/edit-job-cns/${cnId}`);
          };

          const handleViewJobCn = (id) => {
            router.push(`/job-cns/view/${id}`);
          };

          const handleRescheduleJob = async (id, status, workers, salesperson) => {
            Swal.fire({
              title: `Reschedule Job - Job #${id}`,
              text: `Are you sure you want to reschedule this job?`,
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

                  if (status !== 'job-reschedule') {
                    const jobHeaderRef = doc(db, 'jobHeaders', id);

                    const workerIds = workers.map((worker) => worker?.id).filter(Boolean);

                    const workerSnapshot = await getDocs(
                      query(collection(db, 'users'), where('workerId', 'in', workerIds))
                    );

                    const workerUids = workerSnapshot.empty
                      ? []
                      : workerSnapshot.docs.map((doc) => doc.id);

                    await Promise.all([
                      updateDoc(jobHeaderRef, {
                        status: 'job-reschedule',
                        updatedAt: serverTimestamp(),
                        updatedBy: auth.currentUser,
                      }),
                      //* create notification for admin and supervisor when updated a job status
                      notifications.create({
                        module: 'job',
                        target: [
                          'admin',
                          'supervisor',
                          ...workerUids,
                          ...(salesperson ? [salesperson] : []),
                        ],
                        title: 'Job rescheduled',
                        message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase('job-reschedule')}".`, //prettier-ignore
                        data: {
                          redirectUrl: `/jobs/view/${id}`,
                        },
                      }),
                    ]);
                  }

                  setIsLoading(false);
                  toast.success('Job rescheduled successfully', {
                    position: 'top-right',
                  });

                  setTimeout(() => {
                    router.push(`/jobs/edit-jobs/${id}?tab=4`);
                  }, 1000);
                } catch (error) {
                  console.error('Error rescheduling job:', error);
                  toast.error('Error rescheduling job: ' + error.message, { position: 'top-right' }); //prettier-ignore
                  setIsLoading(false);
                }
              }
            });
          };

          const handleDeleteJob = (id, details) => {
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

                  const deleteFiles = async () => {
                    try {
                      const storageRef = ref(storage, `jobs/${id}/documents`);
                      const res = await listAll(storageRef);

                      //* delete all files
                      const deletePromises = res.items.map((itemRef) => deleteObject(itemRef));

                      await Promise.all(deletePromises);

                      console.log('deleted files from path: ', `job/${id}/documents`);
                    } catch (error) {
                      console.error(err, 'Failed to delete related documents/files:');
                    }
                  };

                  const updateEquipmentQty = async (details) => {
                    if (!details || !details.equipments) {
                      console.log('job details not found');
                      return;
                    }

                    try {
                      await Promise.all(
                        details.equipments.map(async (eq) => {
                          try {
                            return updateDoc(doc(db, 'equipments', eq.id), { qty: increment(1) });
                          } catch (error) {
                            return null;
                          }
                        })
                      );
                    } catch (error) {
                      console.error(error, 'Failed to update equipment qty');
                    }
                  };

                  await Promise.all([
                    deleteDoc(jobHeaderRef),
                    deleteDoc(jobDetailsRef),
                    deleteFiles(),
                    //* create notification when job is removed
                    notifications.create({
                      module: 'job',
                      target: ['admin', 'supervisor'],
                      title: 'Job removed',
                      message: `Job (#${id}) was removed by ${auth.currentUser.displayName}.`,
                      data: {
                        redirectUrl: `/jobs`,
                      },
                    }),
                    updateEquipmentQty(details),
                  ]);

                  toast.success('Job removed successfully', {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing job:', error);
                  toast.error('Error removing job: ' + error.message, {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                }
              }
            });
          };

          const handleUpdateJobStatus = (id, status, salesperson) => {
            if (status === 'job-cancel') {
              withReactContent(Swal)
                .fire({
                  title: `Job Status Update - Job #${id}`,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Confirm',
                  cancelButtonText: 'Cancel',
                  customClass: {
                    confirmButton: 'btn btn-primary rounded',
                    cancelButton: 'btn btn-secondary rounded',
                  },
                  html: (
                    <div className='d-flex flex-column gap-4'>
                      <div
                        style={{ color: '#545454' }}
                      >{`Are you sure you want to update the job status to "${_.startCase(
                        status
                      )}"?`}</div>

                      <div>
                        <Form.Control
                          id={`job-status-update-${id}`}
                          type='text'
                          as='textarea'
                          rows={4}
                          placeholder='Enter a message/reason'
                        />
                      </div>
                    </div>
                  ),
                  preConfirm: () => {
                    return document.getElementById(`job-status-update-${id}`).value;
                  },
                })
                .then(async ({ value, isConfirmed }) => {
                  if (isConfirmed) {
                    try {
                      setIsLoading(true);

                      const jobHeaderRef = doc(db, 'jobHeaders', id);

                      await Promise.all([
                        updateDoc(jobHeaderRef, {
                          status,
                          reasonMessage: value,
                          updatedAt: serverTimestamp(),
                          updatedBy: auth.currentUser,
                        }),
                        //* create notification for admin and supervisor when updated a job status
                        notifications.create({
                          module: 'job',
                          target: ['admin', 'supervisor', ...(salesperson ? [salesperson] : [])],
                          title: 'Job status updated',
                          message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                          data: {
                            redirectUrl: `/jobs/view/${id}`,
                          },
                        }),
                      ]);

                      toast.success('Job status updated successfully', {
                        position: 'top-right',
                      });
                      setIsLoading(false);
                    } catch (error) {
                      console.error('Error updating job status:', error);
                      toast.error('Error updating job status: ' + error.message, { position: 'top-right' }); //prettier-ignore
                      setIsLoading(false);
                    }
                  }
                });
              return;
            }

            Swal.fire({
              title: `Job Status Update - Job #${id}`,
              text: `Are you sure you want to update the job status to "${_.startCase(status)}"?`,
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

                  await Promise.all([
                    updateDoc(jobHeaderRef, {
                      status,
                      reasonMessage: null,
                      updatedAt: serverTimestamp(),
                      updatedBy: auth.currentUser,
                    }),
                    //* create notification for admin and supervisor when updated a job status
                    notifications.create({
                      module: 'job',
                      target: ['admin', 'supervisor', ...(salesperson ? [salesperson] : [])],
                      title: 'Job status updated',
                      message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                      data: {
                        redirectUrl: `/jobs/view/${id}`,
                      },
                    }),
                  ]);

                  toast.success('Job status updated successfully', {
                    position: 'top-right',
                  });
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
                        transaction.update(doc(db, 'equipments', eq.id), {
                          qty: increment(1),
                        });
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

                  toast.success('Equipment returned successfully', {
                    position: 'top-right',
                  });
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

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left-start'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewJob(id)}>
                    <Eye className='me-2' size={16} />
                    View Job
                  </Dropdown.Item>

                  {(auth.role === 'admin' || auth.role === 'supervisor') && (
                    <>
                      <Dropdown.Item onClick={() => handleEditJob(id)}>
                        <PencilSquare className='me-2' size={16} />
                        Edit Job
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDeleteJob(id, details)}>
                        <Trash className='me-2' size={16} />
                        Delete Job
                      </Dropdown.Item>

                      <Dropdown.Item onClick={() => handleDuplicateJob(id)}>
                        <Copy className='me-2' size={16} />
                        Duplicate Job
                      </Dropdown.Item>

                      {(status === 'job-confirm' ||
                        status === 'job-in-progress' ||
                        'job-cancel') && (
                        <Dropdown.Item
                          onClick={() => handleRescheduleJob(id, status, workers, salesperson)}
                        >
                          <CalendarWeek className='me-2' size={16} />
                          Reschedule Job
                        </Dropdown.Item>
                      )}

                      {!details?.isReturnedEquipment && (
                        <Dropdown.Item onClick={() => handleReturnEquipment(id, details)}>
                          <ArrowReturnLeft className='me-2' size={16} />
                          Return Equipment
                        </Dropdown.Item>
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

                      <OverlayTrigger
                        rootClose
                        trigger='click'
                        placement='left'
                        overlay={
                          <Dropdown.Menu show style={{ zIndex: 999 }}>
                            <Dropdown.Item
                              onClick={() => handleUpdateJobStatus(id, 'job-confirm', salesperson)}
                            >
                              <Flag className='me-2' size={16} />
                              Job Confirm
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                handleUpdateJobStatus(id, 'job-validation', salesperson)
                              }
                            >
                              <CheckCircle className='me-2' size={16} />
                              Job Validation
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleUpdateJobStatus(id, 'job-cancel', salesperson)}
                            >
                              <XCircle className='me-2' size={16} />
                              Job Cancel
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleUpdateJobStatus(id, 'job-complete', salesperson)}
                            >
                              <ShieldCheck className='me-2' size={16} />
                              Job Complete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        }
                      >
                        <Dropdown.Item>
                          <ArrowRepeat className='me-2' size={16} />
                          Update Status
                        </Dropdown.Item>
                      </OverlayTrigger>

                      {status !== 'job-confirm' && (
                        <Dropdown.Item onClick={() => router.push(`/jobs/${id}/calibrations`)}>
                          <Eye className='me-2' size={16} />
                          View Calibrations
                        </Dropdown.Item>
                      )}

                      <Dropdown.Item onClick={() => router.push(`/jobs/${id}/calibrations/create`)}>
                        <PlusSquare className='me-2' size={16} />
                        Add Calibration
                      </Dropdown.Item>
                    </>
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
  }, [auth.role]);

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
        label: 'Sales Person',
        columnId: 'sales person',
        type: 'text',
        placeholder: 'Search by sales person...',
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
      columnVisibility: { date: false, startDate: false, endDate: false, cn: false },
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'date', desc: true }],
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
  });

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
                options={getYears(2020).map((year) => ({
                  label: year,
                  value: year,
                }))}
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

  //* Optimize query job header
  useEffect(() => {
    if (!year?.value) {
      setJobs({ data: [], isLoading: false, isError: false });
      return;
    }

    const startOfYear = new Date(year.value, 0, 1); //* Jan 1
    const endOfYear = new Date(year.value + 1, 0, 1); //* Jan 1 of next year

    const q = query(
      collection(db, 'jobHeaders'),
      where('createdAt', '>=', Timestamp.fromDate(startOfYear)),
      where('createdAt', '<', Timestamp.fromDate(endOfYear))
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
  }, [year?.value]);

  return (
    <>
      <GeeksSEO title='Jobs - VITAR Group | Portal' />

      <ContentHeader
        title='Job List'
        description='Create, manage and tract all your jobs assignments in one centralize dashboard'
        infoText='Manage job assignment and track progress updates'
        badgeText='Job Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          ...(auth.role === 'admin' || auth.role === 'supervisor'
            ? [
                {
                  text: 'Create Job',
                  icon: <Plus size={20} />,
                  variant: 'light',
                  onClick: () => router.push('/jobs/create'),
                },
              ]
            : []),
        ]}
      />

      <Row className='row-gap-4 mb-5'>
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

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={jobs.isLoading} isError={jobs.isError}>
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
    </>
  );
};

export default JobList;

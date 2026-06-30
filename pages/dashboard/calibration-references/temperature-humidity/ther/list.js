import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { globalSearchFilter } from '@/utils/datatable';
import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  Eye,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
  Table,
  Thermometer,
  ListUl,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const TherList = () => {
  const router = useRouter();
  const auth = useAuth();

  const [ther, setTher] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

  const columnHelper = createColumnHelper();

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
      columnHelper.accessor('idCode', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID Code' />,
      }),
      columnHelper.accessor('type', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
      }),
      columnHelper.accessor('serialNumber', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial No.' />,
      }),
      columnHelper.accessor('traceable', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Traceable' />,
      }),
      columnHelper.accessor('cocNo', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='COC No.' />,
      }),
      columnHelper.accessor('kFactor', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='K Factor' />,
      }),
      columnHelper.accessor('dueDate', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewData = (id) => {
            router.push(`/calibration-references/temperature-humidity/ther/view/${id}`);
          };

          const handleEditData = (id) => {
            router.push(`/calibration-references/temperature-humidity/ther/edit-ther/${id}`);
          };

          const handleViewTempRef = (id) => {
            router.push(
              `/calibration-references/temperature-humidity/ther/${id}/temperature-references`
            );
          };

          const handleAddTempRef = (id) => {
            router.push(
              `/calibration-references/temperature-humidity/ther/${id}/temperature-references/create`
            );
          };

          const handleDeleteData = (id) => {
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

                  const therDocRef = doc(db, 'jobCalibrationReferences', 'CR000008', 'data', id);

                  await deleteDoc(therDocRef);

                  toast.success('Refence data removed successfully', {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing refence data:', error);
                  toast.error('Error removing refence data: ' + error.message, {
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
              placement='left'
              offset={[0, 20]}
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewData(id)}>
                    <Eye className='me-2' size={16} />
                    View Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditData(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteData(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleViewTempRef(id)}>
                    <ListUl className='me-2' size={16} />
                    View Temperature Ref
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleAddTempRef(id)}>
                    <Plus className='me-2' size={16} />
                    Add Temperature Ref
                  </Dropdown.Item>
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
  }, []);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'ID Code',
        columnId: 'idCode',
        type: 'text',
        placeholder: 'Search by id code...',
      },
      {
        label: 'Type',
        columnId: 'type',
        type: 'text',
        placeholder: 'Search by type...',
      },
      {
        label: 'Serial No.',
        columnId: 'serialNumber',
        type: 'text',
        placeholder: 'Search by serial no...',
      },
      {
        label: 'Traceable',
        columnId: 'traceable',
        type: 'text',
        placeholder: 'Search by traceable...',
      },
      {
        label: 'COC No.',
        columnId: 'cocNo',
        type: 'text',
        placeholder: 'Search by coc no...',
      },
      {
        label: 'K Factor',
        columnId: 'kFactor',
        type: 'text',
        placeholder: 'Search by k factor...',
      },
      {
        label: 'Due Date',
        columnId: 'dueDate',
        type: 'date',
      },
    ];
  }, []);

  const table = useReactTable({
    data: ther.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {
      columnPinning: { right: ['actions'] },
    },
  });

  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000008', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setTher({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setTher({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setTher({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Ther - VITAR Group | Portal' />

      <ContentHeader
        title='Ther'
        description='Create, manage all your calibration references in one centralize dashboard'
        badgeText='Calibration References Data Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },

          {
            text: 'Calibration References',
            link: '/#',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/#',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Ther',
            link: '/calibration-references/temperature-humidity/ther',
            icon: <Table className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add Data',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/temperature-humidity/ther/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={ther.isLoading} isError={ther.isError}>
            <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
              <DataTableSearch table={table} />

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

export default TherList;

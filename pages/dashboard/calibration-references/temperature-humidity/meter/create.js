import ContentHeader from '@/components/dashboard/ContentHeader';
import MeterForm from '@/sub-components/dashboard/calibration-references/MeterForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  HouseDoorFill,
  ListColumns,
  PlusCircleFill,
  Table,
  Thermometer,
} from 'react-bootstrap-icons';

const CreateMeter = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Meter - VITAR Group | Portal' />

      <ContentHeader
        title='Create Meter'
        description='Create meter data for your calibration'
        badgeText='Calibration References Data Management'
        badgeText2='New Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/temperature-humidity/meter',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/meter',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Meter',
            link: '/calibration-references/temperature-humidity/meter',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Meter',
            link: '/calibration-references/temperature-humidity/meter/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/meter'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <MeterForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateMeter;

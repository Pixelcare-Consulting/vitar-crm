import ContentHeader from '@/components/dashboard/ContentHeader';
import WiresForm from '@/sub-components/dashboard/calibration-references/WiresForm';
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

const CreateWires = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Wires - VITAR Group | Portal' />

      <ContentHeader
        title='Create Wires'
        description='Create wires data for your calibration'
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
            link: '/calibration-references/temperature-humidity/wires',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/wires',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Wires',
            link: '/calibration-references/temperature-humidity/wires',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Wires',
            link: '/calibration-references/temperature-humidity/wires/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/wires'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <WiresForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateWires;

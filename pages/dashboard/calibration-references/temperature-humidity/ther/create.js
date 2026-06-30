import ContentHeader from '@/components/dashboard/ContentHeader';
import TherForm from '@/sub-components/dashboard/calibration-references/TherForm';
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

const CreateTher = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Ther - VITAR Group | Portal' />

      <ContentHeader
        title='Create Ther'
        description='Create ther data for your calibration'
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
            link: '/calibration-references/temperature-humidity/ther',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/ther',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Ther',
            link: '/calibration-references/temperature-humidity/ther',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Ther',
            link: '/calibration-references/temperature-humidity/ther/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/ther'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <TherForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateTher;

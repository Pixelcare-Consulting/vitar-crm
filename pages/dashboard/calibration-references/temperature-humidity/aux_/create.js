import ContentHeader from '@/components/dashboard/ContentHeader';
import AuxForm from '@/sub-components/dashboard/calibration-references/AuxForm';
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

const CreateAux = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Aux - VITAR Group | Portal' />

      <ContentHeader
        title='Create Aux'
        description='Create aux data for your calibration'
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
            link: '/calibration-references/temperature-humidity/aux',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/aux',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Aux',
            link: '/calibration-references/temperature-humidity/aux',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Aux',
            link: '/calibration-references/temperature-humidity/aux/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/aux'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <AuxForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateAux;

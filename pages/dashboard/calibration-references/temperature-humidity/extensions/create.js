import ContentHeader from '@/components/dashboard/ContentHeader';
import ExtensionsForm from '@/sub-components/dashboard/calibration-references/ExtensionsForm';
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

const CreateExtensions = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Extension - VITAR Group | Portal' />

      <ContentHeader
        title='Create Extensions'
        description='Create extension data for your calibration'
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
            link: '/calibration-references/temperature-humidity/extensions',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/extensions',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Extensions',
            link: '/calibration-references/temperature-humidity/extensions',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Extensions',
            link: '/calibration-references/temperature-humidity/extensions/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/extensions'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <ExtensionsForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateExtensions;

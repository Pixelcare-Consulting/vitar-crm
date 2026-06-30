import ContentHeader from '@/components/dashboard/ContentHeader';
import CmcForm from '@/sub-components/dashboard/calibration-references/CmcForm';
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

const CreateCmc = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Extension - VITAR Group | Portal' />

      <ContentHeader
        title='Create CMC'
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
            link: '/calibration-references/temperature-humidity/cmc',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/cmc',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'CMC',
            link: '/calibration-references/temperature-humidity/cmc',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create CMC',
            link: '/calibration-references/temperature-humidity/cmc/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/cmc'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <CmcForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCmc;

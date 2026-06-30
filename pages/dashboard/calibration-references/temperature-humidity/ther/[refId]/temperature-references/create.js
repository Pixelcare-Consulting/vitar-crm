import ContentHeader from '@/components/dashboard/ContentHeader';
import TempRefForm from '@/sub-components/dashboard/calibration-references/TempRefForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  Hash,
  HouseDoorFill,
  ListColumns,
  PlusCircleFill,
  Table,
  Thermometer,
} from 'react-bootstrap-icons';

const CreateTherTemperatureReference = () => {
  const router = useRouter();
  const { refId } = router.query;

  return (
    <>
      <GeeksSEO title="Create Ther's Temperature References - VITAR Group | Portal" />

      <ContentHeader
        title="Create Ther's Temperature References"
        description='Create ther data for your calibration'
        badgeText='Calibration References Data Management'
        badgeText2='New Temperature Reference Data'
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
          {
            text: refId,
            link: `/calibration-references/temperature-humidity/ther/${refId}/temperature-references`,
            icon: <Hash className='me-2' size={14} />,
          },
          {
            text: 'Temperature References',
            link: `/calibration-references/temperature-humidity/ther/${refId}/temperature-references`,
            icon: <Table className='me-2' size={14} />,
          },
          {
            text: 'Create Temperature Reference',
            link: `/calibration-references/temperature-humidity/ther/${refId}/temperature-references/create`,
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/ther/${refId}/temperature-references`
              ),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <TempRefForm jobCalibrationRefId='CR000008' path='ther' />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateTherTemperatureReference;

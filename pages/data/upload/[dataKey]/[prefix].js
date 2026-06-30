import ExcelUploader from '@/components/ExcelUploader';
import { useParams, useSearchParams } from 'next/navigation';
import React from 'react';

const DataUploads = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  return (
    <div className='d-flex justify-content-center align-items-center' style={{ height: '89vh' }}>
      <ExcelUploader
        dataKey={params?.dataKey}
        prefix={params?.prefix}
        searchParams={searchParams}
      />
    </div>
  );
};

export default DataUploads;

import { forwardRef } from 'react';
import { Spinner } from 'react-bootstrap';
import ReactSelect from 'react-select';

const LoadingIndicator = (props) => {
  return (
    <div className='d-flex align-items-center gap-2 fs-6 me-3'>
      <Spinner animation='border' size='sm' {...props} style={{ color: '#1e40a6' }}></Spinner>
      Loading...
    </div>
  );
};

//* custom react select component
const Select = forwardRef((props, ref) => {
  const selectCustomStyles = {
    control: (base, state) => ({
      ...base,
      paddingTop: '6px',
      paddingBottom: '6px',
      color: '#64748b',
      borderColor: state.isFocused ? '#1e40a6' : '#e2e8f0',
      backgroundColor: state.isFocused ? 'white' : state.isDisabled ? '#e2e8f0' : '#f8fafc',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(53, 150, 220, 0.1)' : 'none',
      transform: 'translateY(-1px)',
      ':hover': {
        borderColor: '#e2e8f0',
      },
      ...(props.controlStyles && props.controlStyles),
    }),
    placeholder: (base, state) => ({
      ...base,
      ...(props.placeholderStyles && props.placeholderStyles),
    }),
    multiValue: (styles, { data }) => ({
      ...styles,
      backgroundColor: '#edf2ff',
      borderRadius: '4px',
    }),
    multiValueLabel: (styles, { data }) => ({
      ...styles,
      color: '#1e293b',
    }),
    multiValueRemove: (styles, { data }) => ({
      ...styles,
      ':hover': {
        backgroundColor: '#f8d4d4',
        borderRadius: '4px',
        color: '#dc2626',
      },
    }),
    menu: (styles, { data }) => ({
      ...styles,
      zIndex: 500,
    }),
  };

  return (
    <ReactSelect
      {...props}
      ref={ref}
      styles={{ ...selectCustomStyles, ...props.styles }}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: '#1e40a6',
          primary75: '#4b66b8',
          primary50: '#8fa0d3',
          primary25: '#edf2ff',
        },
      })}
      isClearable
      components={{
        LoadingIndicator,
      }}
    />
  );
});

export default Select;

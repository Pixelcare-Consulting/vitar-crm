import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Plus, X } from 'react-bootstrap-icons';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import axios from 'axios';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';

const SiteAddressForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const router = useRouter();

  const [countriesOptions, setCountriesOptions] = React.useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const form = useFormContext();

  const formErrors = form.formState.errors;

  const { fields, append, remove } = useFieldArray({
    name: 'addresses',
    control: form.control,
  });

  const handleAddAddress = () => {
    append({
      street1: '',
      street2: '',
      street3: '',
      province: '',
      city: '',
      country: undefined,
      postalCode: '',
      isDefault: fields.length === 0,
      longitude: '',
      latitude: '',
    });
  };

  const handleRemoveAddress = (index) => {
    remove(index);
  };

  //* fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get('/api/countries');
        const countries = res.data;

        if (res.status === 200 && countries?.length > 0) {
          setCountriesOptions({
            data: countries.map((country) => ({
              value: country.name,
              label: country.name,
            })),
            isLoading: false,
            isError: false,
          });
        } else
          setCountriesOptions({ data: [], isLoading: false, isError: false });
      } catch (error) {
        console.error(error.message);
        setCountriesOptions({ data: [], isLoading: false, isError: true });
      }
    };

    fetchCountries();
  }, []);

  //* set address country if data exist
  useEffect(() => {
    if (
      data &&
      countriesOptions.data.length > 0 &&
      data.addresses?.length > 0
    ) {
      console.log({ addresses: data.addresses });
      const addresses = data.addresses.map((address) => ({
        ...address,
        country: address.country
          ? countriesOptions.data.find(
              (country) => country.value === address.country
            )
          : '',
      }));

      form.setValue('addresses', addresses);
    }
  }, [data, countriesOptions]);

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body className='pb-0'>
          <Form>
            <div className='d-flex justify-content-between align-items-center mb-3'>
              <div>
                <h5 className='mb-1'>
                  Address Details
                  <span
                    className='text-danger'
                    style={{ marginLeft: '4px', cursor: 'help' }}
                  >
                    *
                  </span>
                </h5>
                <p className='text-muted m-0'>
                  Add 1 or more addresses for the site. Note first address will
                  be the default/main address.
                </p>

                {formErrors && formErrors.addresses?.message && (
                  <Form.Text className='text-danger mt-0'>
                    {formErrors.addresses?.message}
                  </Form.Text>
                )}
              </div>

              <Button
                variant='primary'
                size='sm'
                className='ms-2'
                onClick={handleAddAddress}
              >
                <Plus size={14} className='me-2' />
                Add Address
              </Button>
            </div>
          </Form>

          {fields.length === 0 && (
            <div className='text-center py-5'>
              <h5 className='mb-1'>No address added yet.</h5>
              <p className='text-muted'>Click "Add Address" to begin.</p>
            </div>
          )}

          {fields.length > 0 &&
            fields.map((_field, i) => (
              <Card key={_field.id} className='border mb-4'>
                <Card.Header className='d-flex justify-content-between align-items-center bg-light'>
                  <div className='d-flex gap-2 align-items-end'>
                    <h6 className='mb-0'>Address #{i + 1}</h6>

                    {_field.isDefault && (
                      <Badge className='me-2' bg='primary'>
                        Default
                      </Badge>
                    )}
                  </div>

                  {!_field.isDefault && (
                    <Button
                      variant='link'
                      className='p-0'
                      onClick={() => handleRemoveAddress(i)}
                    >
                      <X size={20} className='text-danger' />
                    </Button>
                  )}
                </Card.Header>

                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <Form.Group className='mb-3'>
                        <RequiredLabel
                          label='Street 1'
                          id={`addresses.${i}.street1`}
                        />

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.street1`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                {...field}
                                id={`addresses.${i}.street1`}
                                type='text'
                                placeholder='Enter street 1'
                              />

                              {formErrors &&
                                formErrors.addresses?.[i]?.street1?.message && (
                                  <Form.Text className='text-danger'>
                                    {
                                      formErrors.addresses?.[i]?.street1
                                        ?.message
                                    }
                                  </Form.Text>
                                )}
                            </>
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group className='mb-3'>
                        <Form.Label htmlFor={`addresses.${i}.street2`}>
                          Street 2
                        </Form.Label>

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.street2`}
                          control={form.control}
                          render={({ field }) => (
                            <Form.Control
                              {...field}
                              id={`addresses.${i}.street2`}
                              type='text'
                              placeholder='Enter street 2'
                            />
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group className='mb-3'>
                        <Form.Label htmlFor={`addresses.${i}.street3`}>
                          Street 3
                        </Form.Label>

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.street3`}
                          control={form.control}
                          render={({ field }) => (
                            <Form.Control
                              {...field}
                              id={`addresses.${i}.street3`}
                              type='text'
                              placeholder='Enter street 2'
                            />
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className='mb-3'>
                        <RequiredLabel
                          label='State'
                          id={`addresses.${i}.province`}
                        />

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.province`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                {...field}
                                id={`addresses.${i}.province`}
                                type='text'
                                placeholder='Enter province'
                              />

                              {formErrors &&
                                formErrors.addresses?.[i]?.province
                                  ?.message && (
                                  <Form.Text className='text-danger'>
                                    {
                                      formErrors.addresses?.[i]?.province
                                        ?.message
                                    }
                                  </Form.Text>
                                )}
                            </>
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className='mb-3'>
                        <RequiredLabel
                          label='City'
                          id={`addresses.${i}.city`}
                        />

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.city`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                {...field}
                                id={`addresses.${i}.city`}
                                type='text'
                                placeholder='Enter city'
                              />

                              {formErrors &&
                                formErrors.addresses?.[i]?.city?.message && (
                                  <Form.Text className='text-danger'>
                                    {formErrors.addresses?.[i]?.city?.message}
                                  </Form.Text>
                                )}
                            </>
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className='mb-3'>
                        <RequiredLabel
                          label='Postal Code'
                          id={`addresses.${i}.postalCode`}
                        />

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.postalCode`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                {...field}
                                id={`addresses.${i}.postalCode`}
                                type='text'
                                placeholder='Enter postal code'
                              />

                              {formErrors &&
                                formErrors.addresses?.[i]?.postalCode
                                  ?.message && (
                                  <Form.Text className='text-danger'>
                                    {
                                      formErrors.addresses?.[i]?.postalCode
                                        ?.message
                                    }
                                  </Form.Text>
                                )}
                            </>
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className='mb-3'>
                        <RequiredLabel
                          label='Country'
                          id={`addresses.${i}.country`}
                        />

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.country`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Select
                                {...field}
                                inputId={`addresses.${i}.country`}
                                instanceId={`addresses.${i}.country`}
                                onChange={(option) => field.onChange(option)}
                                options={countriesOptions.data}
                                placeholder='Search by coutry'
                                isDisabled={
                                  countriesOptions.isLoading ||
                                  countriesOptions.length < 1
                                }
                                noOptionsMessage={() =>
                                  countriesOptions.isLoading
                                    ? 'Loading...'
                                    : 'No countries found'
                                }
                              />

                              {formErrors &&
                                formErrors.addresses?.[i]?.country?.message && (
                                  <Form.Text className='text-danger'>
                                    {
                                      formErrors.addresses?.[i]?.country
                                        ?.message
                                    }
                                  </Form.Text>
                                )}
                            </>
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className='mb-3'>
                        <Form.Label htmlFor={`addresses.${i}.longitude`}>
                          Longitude
                        </Form.Label>

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.longitude`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                {...field}
                                id={`addresses.${i}.longitude`}
                                type='text'
                                placeholder='Enter longitude'
                              />

                              {formErrors &&
                                formErrors.addresses?.[i]?.longitude
                                  ?.message && (
                                  <Form.Text className='text-danger'>
                                    {
                                      formErrors.addresses?.[i]?.longitude
                                        ?.message
                                    }
                                  </Form.Text>
                                )}
                            </>
                          )}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className='mb-3'>
                        <Form.Label htmlFor={`addresses.${i}.latitude`}>
                          Latitude
                        </Form.Label>

                        <Controller
                          key={_field.id}
                          name={`addresses.${i}.latitude`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                {...field}
                                id={`addresses.${i}.latitude`}
                                type='text'
                                placeholder='Enter latitude'
                              />

                              {formErrors &&
                                formErrors.addresses?.[i]?.latitude
                                  ?.message && (
                                  <Form.Text className='text-danger'>
                                    {
                                      formErrors.addresses?.[i]?.latitude
                                        ?.message
                                    }
                                  </Form.Text>
                                )}
                            </>
                          )}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

          <div className='mt-4 d-flex justify-content-between align-items-center'>
            <Button
              disabled={isLoading}
              type='button'
              variant='outline-primary'
              onClick={handlePrevious}
            >
              Previous
            </Button>

            <Button disabled={isLoading} type='button' onClick={handleNext}>
              Next
            </Button>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default SiteAddressForm;

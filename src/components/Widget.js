import React, { useMemo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTable, useSortBy } from "react-table";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

import {
  TiArrowUnsorted,
  TiArrowSortedUp,
  TiArrowSortedDown,
} from "react-icons/ti";

import mapIcon from "../assets/images/baseline_home_black_36dp.png";

/*global google*/

const Widget = () => {
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const libraries = ["places"];

  const getDirections = (addressTo, addressFrom, travelMode) => {
    var directionsService = new google.maps.DirectionsService();
    var origin = new google.maps.LatLng(addressFrom.lat, addressFrom.lng);
    var destination = new google.maps.LatLng(addressTo.lat, addressTo.lng);
    var request = {
      origin: "Chicago, IL",
      destination: "Los Angeles, CA",
      travelMode: "DRIVING",
    };
    directionsService.route(request, function (response, status) {
      if (status === "OK") {
        console.log(response);
      }
    });
  };

  const containerStyle = {
    width: "390px",
    height: "390px",
  };

  const center = {
    lat: -33.8688,
    lng: 151.2093,
  };

  const [tableData, setTableData] = React.useState([
    {
      addressTo: "Taronga Zoo Sydney, Mosman NSW",
      walkTime: 40,
      cycleTime: 23,
      driveTime: 10,
      pubTransTime: 51,
    },
    {
      addressTo: "University of Sydney, Camperdown NSW",
      walkTime: 30,
      cycleTime: 15,
      driveTime: 8,
      pubTransTime: 21,
    },
  ]);

  const data = React.useMemo(() => tableData, []);

  const columns = React.useMemo(
    () => [
      {
        Header: "Location",
        accessor: "addressTo", // accessor is the "key" in the data
      },
      {
        Header: "Walk",
        accessor: "walkTime",
      },
      {
        Header: "Cycle",
        accessor: "cycleTime",
      },
      {
        Header: "Drive",
        accessor: "driveTime",
      },
      {
        Header: "Public Transport",
        accessor: "pubTransTime",
      },
    ],
    []
  );

  const tableInstance = useTable({ columns, data: data }, useSortBy);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const addAddressTo = (formData) => console.log(formData);

  const setAddressFrom = (formData) => console.log(formData);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={libraries}>
      <main className="h-full w-auto rounded-xl bg-tertiary-100 border-2 border-typography-200 shadow-xl">
        {/* Heading Div */}
        <div className="my-6 mx-8 items-center">
          <h1>Location Buddy</h1>
          <h2 className="my-2 font-extralight">
            We help you find the perfectly located home
          </h2>
        </div>

        {/* Form Div */}
        <div className="mx-8 flex flex-col md:flex-row justify-center">
          <div>
            {/* Address From Section */}
            <form
              id="addressFrom"
              className=""
              onSubmit={handleSubmit(setAddressFrom)}
            >
              <h3>From</h3>
              {errors.addressFrom ? (
                <p className="text-red-500 text-sm font-light ">
                  Enter an address to check the travel times
                </p>
              ) : (
                <p className="font-light text-sm">
                  Enter an address to check the travel times
                </p>
              )}
              <div className="flex flex-row items-center">
                <Autocomplete>
                  <input
                    type="text"
                    id="addressFrom"
                    className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                    {...register("addressFrom", { required: true })}
                  />
                </Autocomplete>
                {/* <input
                  className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300 shadow-sm "
                  defaultValue="42 Wallaby Way, Sydney NSW"
                  {...register("addressFrom", { required: true })}
                /> */}
                <input
                  className="py-2 px-4 mx-6 my-4 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                  type="submit"
                  value="Select"
                />
              </div>
            </form>

            {/* Map */}
            <div className="my-4">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
              >
                <Marker icon={mapIcon} position={center} />
              </GoogleMap>
            </div>
          </div>

          {/* Address To Div */}
          <div>
            {/* Address To Form */}
            <form
              id="addressTo"
              className=""
              onSubmit={handleSubmit(addAddressTo)}
            >
              <h3>To</h3>
              {errors.addressTo ? (
                <p className="text-red-500 text-sm font-light ">
                  Enter the locations you visit most
                </p>
              ) : (
                <p className="font-light text-sm">
                  Enter the locations you visit most
                </p>
              )}

              <div className="flex flex-row items-center">
                <Autocomplete>
                  <input
                    type="text"
                    id="addressTo"
                    className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                    {...register("addressTo", { required: true })}
                  />
                </Autocomplete>
                {/* <input
                  className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  defaultValue="Taronga Zoo Sydney, Mosman NSW"
                  {...register("addressTo", { required: true })}
                /> */}
                <input
                  className="py-2 px-4 mx-6 my-4 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                  type="submit"
                  value="Add"
                />
              </div>
            </form>

            {/* Content Div */}
            <div className="">
              {/* Results Table */}
              <table className="table-auto bg-white my-4" {...getTableProps()}>
                <thead className="bg-secondary-100 rounded-lg">
                  {
                    // Loop over the header rows
                    headerGroups.map((headerGroup) => (
                      // Apply the header row props
                      <tr {...headerGroup.getHeaderGroupProps()}>
                        {
                          // Loop over the headers in each row
                          headerGroup.headers.map((column) => (
                            // Apply the header cell props
                            <th
                              className="text-typography-300 font-semibold text-sm p-4 text-center"
                              {...column.getHeaderProps(
                                column.getSortByToggleProps()
                              )}
                            >
                              <div className="flex flex-row items-center justify-end">
                                {
                                  // Render the header
                                  column.render("Header")
                                }
                                <span className="pl-1">
                                  {column.isSorted ? (
                                    column.isSortedDesc ? (
                                      <TiArrowSortedDown />
                                    ) : (
                                      <TiArrowSortedUp />
                                    )
                                  ) : (
                                    <TiArrowUnsorted />
                                  )}
                                </span>
                              </div>
                            </th>
                          ))
                        }
                      </tr>
                    ))
                  }
                </thead>
                {/* Apply the table body props */}
                <tbody {...getTableBodyProps()}>
                  {
                    // Loop over the table rows
                    rows.map((row) => {
                      // Prepare the row for display
                      prepareRow(row);
                      return (
                        // Apply the row props
                        <tr
                          className="hover:bg-tertiary-200 border-t border-tertiary-300 font-light text-sm  text-center "
                          {...row.getRowProps()}
                        >
                          {
                            // Loop over the rows cells
                            row.cells.map((cell, index) => {
                              // Apply the cell props
                              return (
                                <td className=" p-4 " {...cell.getCellProps()}>
                                  {
                                    // Render the cell contents
                                    cell.render("Cell")
                                  }{" "}
                                  {index > 0 && <>Minutes</>}
                                </td>
                              );
                            })
                          }
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </LoadScript>
  );
};

export default Widget;

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
  const containerStyle = {
    width: "390px",
    height: "390px",
  };
  const libraries = ["places"];

  // Set default center
  const [center, setCenter] = useState({
    lat: -33.8512893,
    lng: 151.2191385,
  });
  // Create state for tracking addressFrom
  const [addressFrom, setAddressFromState] = useState(
    "Kirribilli House, Kirribilli Avenue, Kirribilli NSW, Australia"
  );
  //Create state to track results for table
  const [tableData, setTableData] = React.useState([]);

  // Declare and Memoize columns for React table
  const columns = React.useMemo(
    () => [
      {
        Header: "Location",
        accessor: "addressTo", // accessor is the "key" in the data
      },
      {
        Header: "Walk",
        accessor: "WALKING",
      },
      {
        Header: "Cycle",
        accessor: "BICYCLING",
      },
      {
        Header: "Drive",
        accessor: "DRIVING",
      },
      {
        Header: "Public Transport",
        accessor: "TRANSIT",
      },
    ],
    []
  );

  // Create table with useSortBy function
  const tableInstance = useTable({ columns, data: tableData }, useSortBy);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const getCoords = async (addressFrom) => {
    const geoObj = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${addressFrom}&key=${GOOGLE_API_KEY}`
    );
    const geoData = await geoObj.json();
    return geoData.results[0].geometry.location;
  };

  const setAddressFrom = async (formData) => {
    // Update address from state
    setAddressFromState(formData.addressFrom);
    // Get Coords of address and update Google map center property.
    const coords = await getCoords(formData.addressFrom);
    setCenter(coords);
  };

  const getDirections = async (addressFrom, addressTo, travelMode) => {
    const directionsService = new google.maps.DirectionsService();
    // var origin = new google.maps.LatLng(addressFrom.lat, addressFrom.lng);
    // var destination = new google.maps.LatLng(addressTo.lat, addressTo.lng);
    const request = {
      origin: addressFrom,
      destination: addressTo,
      travelMode: travelMode,
    };
    const directionsData = await directionsService.route(request);
    await delay(300);

    return directionsData;
  };
  const delay = (time) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  const addAddressTo = async (formData) => {
    const travelModes = ["WALKING", "BICYCLING", "DRIVING", "TRANSIT"];
    const directionsData = [];

    for (let index = 0; index < travelModes.length; index++) {
      try {
        const directions = await getDirections(
          formData.addressTo,
          formData.addressFrom,
          travelModes[index]
        );
        directionsData.push(directions);
      } catch (error) {
        alert("There is no route between these locations");
        break;
      }
    }

    let newTableObj = {
      addressFrom: formData.addressFrom,
      addressTo: formData.addressTo,
      WALKING: directionsData[0].routes[0].legs[0].duration.text,
      BICYCLING: directionsData[1].routes[0].legs[0].duration.text,
      DRIVING: directionsData[2].routes[0].legs[0].duration.text,
      TRANSIT: directionsData[3].routes[0].legs[0].duration.text,
    };
    // const newTableData = React.useMemo(() => [tableData, newTableObj], []);
    setTableData((oldTableData) => [...oldTableData, newTableObj]);
  };

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
                  Enter the address you're interested in first
                </p>
              ) : (
                <p className="font-light text-sm">
                  Enter the address you're interested in
                </p>
              )}
              <div className="flex flex-row items-center">
                <Autocomplete>
                  <input
                    type="text"
                    id="addressFrom"
                    defaultValue="Kirribilli House, Kirribilli Avenue, Kirribilli NSW, Australia"
                    className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                    {...register("addressFrom", { required: true })}
                  />
                </Autocomplete>

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
                  Add a location you visit often first
                </p>
              ) : (
                <p className="font-light text-sm">
                  Add a location you visit often
                </p>
              )}

              <div className="flex flex-row items-center">
                <Autocomplete>
                  <input
                    type="text"
                    id="addressTo"
                    bounds={center}
                    defaultValue="Taronga Zoo Sydney, Bradleys Head Road, Mosman NSW, Australia"
                    className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                    {...register("addressTo", { required: true })}
                  />
                </Autocomplete>

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
                                  }
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

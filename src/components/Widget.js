import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTable, useSortBy } from "react-table";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";

import {
  TiArrowUnsorted,
  TiArrowSortedUp,
  TiArrowSortedDown,
  TiDelete,
} from "react-icons/ti";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import homeIcon from "../assets/images/baseline_home_black_36dp.png";
import locationIcon from "../assets/images/baseline_place_black_36dp.png";
/*global google*/

const schema = yup.object().shape({
  addressFrom: yup.string().required(),
  addressTo: yup.string().required(),
});

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

  // Set search radius for autocomplete
  const radius = 0.001;

  // Set the bounds for autocomplete based on center of map and search radius
  const [bounds, setBounds] = useState({
    east: center.lng + radius,
    north: center.lat + radius,
    south: center.lat - radius,
    west: center.lng - radius,
  });

  // Create state for tracking addressFrom
  const [addressFrom, setAddressFromState] = useState(false);

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
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const delay = (time) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });

  const getCoords = async (addressFrom) => {
    const geoObj = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${addressFrom}&key=${GOOGLE_API_KEY}`
    );
    const geoData = await geoObj.json();
    return geoData.results[0].geometry.location;
  };

  const setAddressFrom = async (addressFrom) => {
    // Remove data that is for different "From" address
    tableData.forEach((data) => {
      // Check if the data object addressFrom = new addressFrom
      if (data.addressFrom !== addressFrom) {
        deleteAddressFromTable(addressFrom);
      }
    });
    // Get Coords of address and update Google map center property.
    const coords = await getCoords(addressFrom);
    setCenter(coords);
    setBounds({
      east: coords.lng + radius,
      north: coords.lat + radius,
      south: coords.lat - radius,
      west: coords.lng - radius,
    });
    //Set new addressFrom state
    setAddressFromState(addressFrom);
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

  const addAddressTo = async (formData) => {
    try {
      if (
        tableData.length < 6 &&
        getIndexOfAddress(formData.addressTo) === -1
      ) {
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
          addressToCoords: await getCoords(formData.addressTo),
          drivingDirections: directionsData[2],
          WALKING: directionsData[0].routes[0].legs[0].duration.text,
          BICYCLING: directionsData[1].routes[0].legs[0].duration.text,
          DRIVING: directionsData[2].routes[0].legs[0].duration.text,
          TRANSIT: directionsData[3].routes[0].legs[0].duration.text,
        };
        setTableData((oldTableData) => [...oldTableData, newTableObj]);
      } else if (tableData.length >= 6) {
        alert("You can only compare six locations at a time");
      } else if (getIndexOfAddress(formData.addressTo) !== -1) {
        alert("You've already added this location!");
      }
    } catch (error) {
      alert("An unexpected error occurred, try again.");
    }
  };

  const getIndexOfAddress = (address) => {
    const index = tableData.findIndex(
      (element) => element.addressTo === address
    );
    return index;
  };

  const deleteAddressFromTable = (address) => {
    const index = getIndexOfAddress(address);
    setTableData((oldTableData) => {
      let newTableData = [...oldTableData];
      newTableData.splice(index, 1);
      return newTableData;
    });
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={libraries}>
      <main className="w-2/3 rounded-xl bg-tertiary-100 border-2 border-typography-200 shadow-xl">
        {/* Heading Div */}
        <div className="my-6 mx-8 items-center">
          <h1>Location Buddy</h1>
          <h2 className="my-2 font-extralight">
            We help you find the perfectly located home
          </h2>
        </div>

        {/* Form Div */}
        <form onSubmit={handleSubmit(addAddressTo)}>
          <div className="mx-8 grid grid-cols-3 justify-between">
            <div className="col-span-1">
              {/* Address From Section */}

              <h3>From</h3>
              {errors.addressFrom ? (
                <p className="text-red-500 text-sm font-light ">
                  Select the address you're interested in first
                </p>
              ) : (
                <p className="font-light text-sm">
                  Select the address you're interested in
                </p>
              )}
              <div className="flex flex-row items-center">
                <Autocomplete bounds={bounds}>
                  <input
                    type="text"
                    id="addressFrom"
                    placeholder="Kirribilli House, Kirribilli Avenue, Kirribilli NSW, Australia"
                    className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                    {...register("addressFrom", { required: true })}
                  />
                </Autocomplete>

                <button
                  className="py-2 px-4 mx-6 my-4 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                  type="button"
                  value="Select"
                  onClick={async () => {
                    await trigger("addressFrom").then((data) => {
                      if (data) {
                        const addressFrom = getValues("addressFrom");
                        setAddressFrom(addressFrom);
                      }
                    });
                  }}
                >
                  Select
                </button>
              </div>

              {/* Map */}
              <div className="my-4">
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={12}
                  options={{ style: {} }}
                >
                  {addressFrom && <Marker icon={homeIcon} position={center} />}

                  {tableData.map((data, index) => (
                    <>
                      <DirectionsRenderer
                        directions={data.drivingDirections}
                        options={{ markerOptions: { visible: false } }}
                      />
                      <Marker
                        key={index}
                        icon={{
                          url: locationIcon,
                          scaledSize: new window.google.maps.Size(35, 35),
                        }}
                        position={data.addressToCoords}
                      />
                    </>
                  ))}
                </GoogleMap>
              </div>
            </div>

            {/* Address To Div */}
            <div className="col-span-2">
              {/* Address To Form */}

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
                <Autocomplete bounds={bounds}>
                  <input
                    type="text"
                    id="addressTo"
                    placeholder="Taronga Zoo Sydney, Bradleys Head Road, Mosman NSW, Australia"
                    className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                    {...register("addressTo", {
                      required: true,
                    })}
                  />
                </Autocomplete>

                <button
                  className="py-2 px-4 mx-6 my-4 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                  type="submit"
                  value="Add"
                >
                  Add
                </button>
              </div>

              {/* Content Div */}
              <div className="w-full">
                {/* Results Table */}
                <table
                  className="table-auto w-full bg-white my-4"
                  {...getTableProps()}
                >
                  <thead className="bg-secondary-100 rounded-lg">
                    {
                      // Loop over the header rows
                      headerGroups.map((headerGroup) => (
                        // Apply the header row props
                        <tr {...headerGroup.getHeaderGroupProps()}>
                          <td className="contents-center"></td>
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
                            className=" border-t border-tertiary-300 font-light text-sm  text-center "
                            {...row.getRowProps()}
                          >
                            <td className="contents-center">
                              <TiDelete
                                onClick={() =>
                                  deleteAddressFromTable(row.values.addressTo)
                                }
                                className="h-8 w-8 m-2 hover:opacity-80 active:opacity-100"
                              ></TiDelete>
                            </td>
                            {
                              // Loop over the rows cells
                              row.cells.map((cell, index) => {
                                // Apply the cell props
                                return (
                                  <td
                                    className=" p-4 "
                                    {...cell.getCellProps()}
                                  >
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
        </form>
      </main>
    </LoadScript>
  );
};

export default Widget;

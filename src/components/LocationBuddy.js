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
import ClimbingBoxLoader from "react-spinners/ClipLoader";
import homeIcon from "../assets/images/baseline_home_black_36dp.png";
import locationIcon from "../assets/images/baseline_place_black_36dp.png";

/*global google*/

const schema = yup.object().shape({
  addressFrom: yup.string().required(),
  addressTo: yup.string().required(),
});

const LocationBuddy = () => {
  const GOOGLE_API_KEY = process.env.GATSBY_GOOGLE_API_KEY;
  const GEOCODING_API_KEY = process.env.GATSBY_GEOCODING_API_KEY;
  const containerStyle = {
    width: "405px",
    height: "405px",
  };
  // Register React Hook Form
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  // Set library for Autocomplete
  const [libraries] = useState(["places"]);
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
  // Create state to track results for table
  const [tableData, setTableData] = React.useState([]);
  // Create state to track loading of results
  const [loading, setLoading] = React.useState(false);
  // Declare and Memoize columns for React table
  const columns = React.useMemo(
    () => [
      {
        Header: "Direction",
        accessor: "travelDirection", // accessor is the "key" in the data
      },
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
  // Create React Table instance
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  // Function to delay API calls to avoid query limit
  const delay = (time) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });

  // Get the coordinates of a given address
  const getCoords = async (addressFrom) => {
    const geoObj = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${addressFrom}&key=${GEOCODING_API_KEY}`
    );
    const geoData = await geoObj.json();
    return geoData.results[0].geometry.location;
  };

  // Set the address you are interested in
  const setAddressFrom = async (newAddressFrom) => {
    if (addressFrom !== newAddressFrom) {
      // Remove data that is for different "From" address
      tableData.forEach((data) => {
        // Check if the data object addressFrom = new addressFrom
        if (data.addressFrom !== newAddressFrom) {
          deleteAddressFromTable(newAddressFrom);
        }
      });
      // Get Coords of address and update Google map center property.
      const coords = await getCoords(newAddressFrom);
      setCenter(coords);
      setBounds({
        east: coords.lng + radius,
        north: coords.lat + radius,
        south: coords.lat - radius,
        west: coords.lng - radius,
      });
      //Set new addressFrom state
      setAddressFromState(newAddressFrom);
    } else {
      alert("You've already selected this address");
    }
  };

  // Get directions for a given location
  const getDirections = async (
    addressFrom,
    addressTo,
    travelMode
    // travelTime,
    // travelTimeRule
  ) => {
    // let drivingOptions = {};
    // let transitOptions = {};
    // let request = {};
    // if (travelMode === "DRIVING" && travelTimeRule === "Depart At") {
    //   drivingOptions = { departureTime: travelTime };
    //   request = {
    //     origin: addressFrom,
    //     destination: addressTo,
    //     travelMode: travelMode,
    //     drivingOptions: drivingOptions,
    //     // transitOptions: transitOptions,
    //   };
    // } else if (travelMode === "TRANSIT" && travelTimeRule === "Depart At") {
    //   transitOptions = { departureTime: travelTime };
    //   request = {
    //     origin: addressFrom,
    //     destination: addressTo,
    //     travelMode: travelMode,
    //     // drivingOptions: drivingOptions,
    //     transitOptions: transitOptions,
    //   };
    // } else if (travelMode === "TRANSIT" && travelTimeRule === "Arrive By") {
    //   transitOptions = { arrivalBy: travelTime };
    //   request = {
    //     origin: addressFrom,
    //     destination: addressTo,
    //     travelMode: travelMode,
    //     // drivingOptions: drivingOptions,
    //     transitOptions: transitOptions,
    //   };
    // } else {
    //   request = {
    //     origin: addressFrom,
    //     destination: addressTo,
    //     travelMode: travelMode,
    //   };
    // }
    const directionsService = new google.maps.DirectionsService();
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
        getIndexOfAddress(formData.addressTo, formData.travelDirection) === -1
      ) {
        const travelModes = ["WALKING", "BICYCLING", "DRIVING", "TRANSIT"];
        // let travelTime = new Date(Date.now());
        // let travelTimeRule = formData.travelTimeRule;
        // if (formData.travelTime !== "") {
        //   travelTime = new Date(formData.travelTime);
        //   travelTimeRule = formData.travelTimeRule;
        // }
        const preferredTravelModeIndex = travelModes.indexOf(
          formData.preferredTravelMode
        );
        const directionsData = [];
        setLoading(true);
        for (let index = 0; index < travelModes.length; index++) {
          try {
            if (formData.travelDirection === "From Home") {
              const directions = await getDirections(
                formData.addressTo,
                formData.addressFrom,
                travelModes[index]
                // travelTime,
                // travelTimeRule
              );
              directionsData.push(directions);
            } else if (formData.travelDirection === "To Home") {
              const directions = await getDirections(
                formData.addressFrom,
                formData.addressTo,
                travelModes[index]
              );
              directionsData.push(directions);
            }
          } catch (error) {
            setLoading(false);
            alert("There is no route between these locations");
            break;
          }
        }
        let newTableObj = {
          addressFrom: formData.addressFrom,
          addressTo: formData.addressTo,
          addressToCoords: await getCoords(formData.addressTo),
          travelDirection: formData.travelDirection,
          mapDirections: directionsData[preferredTravelModeIndex],
          WALKING: directionsData[0].routes[0].legs[0].duration.text,
          BICYCLING: directionsData[1].routes[0].legs[0].duration.text,
          DRIVING: directionsData[2].routes[0].legs[0].duration.text,
          TRANSIT: directionsData[3].routes[0].legs[0].duration.text,
        };
        setTableData((oldTableData) => [...oldTableData, newTableObj]);
        setLoading(false);
      } else if (tableData.length >= 6) {
        alert("You can only compare six locations at a time");
      } else if (
        getIndexOfAddress(formData.addressTo, formData.travelDirection) !== -1
      ) {
        alert("You've already added this location!");
      }
    } catch (error) {
      alert("An unexpected error occurred, try again.");
    }
  };

  const getIndexOfAddress = (address, travelDirection) => {
    const index = tableData.findIndex(
      (element) =>
        element.addressTo === address &&
        element.travelDirection === travelDirection
    );
    return index;
  };

  const deleteAddressFromTable = (address, travelDirection) => {
    const index = getIndexOfAddress(address, travelDirection);
    setTableData((oldTableData) => {
      let newTableData = [...oldTableData];
      newTableData.splice(index, 1);
      return newTableData;
    });
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={libraries}>
      {/* <body className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 body-bg min-h-screen pt-12 md:pt-20 pb-6 px-2 md:px-0">
        <header className="max-w-lg mx-auto">
          <a href="#">
            <h1 className="text-4xl font-bold text-white text-center">
              LocationBuddy
            </h1>
          </a>
        </header>

        <main className="bg-white max-w-lg mx-auto p-8 md:p-12 my-10 rounded-lg shadow-2xl">
          <section>
            <h3 className="font-bold text-2xl">Welcome to Startup</h3>
            <p className="text-gray-600 pt-2">Sign in to your account.</p>
          </section>

          <section className="mt-10">
            <form className="flex flex-col" method="POST" action="#">
              <div className="mb-6 pt-3 rounded bg-gray-200">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2 ml-3"
                  for="email"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  className="bg-gray-200 rounded w-full text-gray-700 focus:outline-none border-b-4 border-gray-300 focus:border-purple-600 transition duration-500 px-3 pb-3"
                />
              </div>
              <div className="mb-6 pt-3 rounded bg-gray-200">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2 ml-3"
                  for="password"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="bg-gray-200 rounded w-full text-gray-700 focus:outline-none border-b-4 border-gray-300 focus:border-purple-600 transition duration-500 px-3 pb-3"
                />
              </div>
              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline mb-6"
                >
                  Forgot your password?
                </a>
              </div>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded shadow-lg hover:shadow-xl transition duration-200"
                type="submit"
              >
                Sign In
              </button>
            </form>
          </section>
        </main>

        <div className="max-w-lg mx-auto text-center mt-12 mb-6">
          <p className="text-white">
            Don't have an account?{" "}
            <a href="#" className="font-bold hover:underline">
              Sign up
            </a>
            .
          </p>
        </div>

        <footer className="max-w-lg mx-auto flex justify-center text-white">
          <a href="#" className="hover:underline">
            Contact
          </a>
          <span className="mx-3">•</span>
          <a href="#" className="hover:underline">
            Privacy
          </a>
        </footer>
      </body> */}
      <main className="relative flex-grow pt-20 bg-tertiary-100">
        {/* Form Div */}
        <form onSubmit={handleSubmit(addAddressTo)}>
          <div className="mx-8 grid grid-cols-3 justify-between">
            <div className="col-span-1">
              {/* Heading Div */}
              <div className="my-6 items-center">
                <h1>Location Buddy</h1>
                <h2 className="my-2 font-extralight">
                  We help you find the perfectly located home
                </h2>
              </div>
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
                  className="py-2 px-4 mx-6 my-4 w-24 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
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
                >
                  {addressFrom && <Marker icon={homeIcon} position={center} />}

                  {tableData.map((data, index) => (
                    <>
                      <DirectionsRenderer
                        directions={data.mapDirections}
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
              <div className="grid grid-cols-2">
                <div className="grid pt-32 mt-2">
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
                    {loading ? (
                      <button
                        disabled
                        key="disabled-button"
                        className="py-2 px-4 mx-6 my-4 w-24 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                      >
                        <ClimbingBoxLoader
                          className="mr-2"
                          color={"#ffffff"}
                          loading={loading}
                          size={15}
                        />
                      </button>
                    ) : (
                      <button
                        key="add-button"
                        className="py-2 px-4 mx-6 my-4 w-24 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                        type="submit"
                        value="Add"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col text-sm pt-28 my-2">
                  <h3 className="text-right">Options</h3>
                  <div className="flex flex-row items-center justify-end">
                    <p className="mr-4">
                      Choose your preferred mode of transport
                    </p>
                    <select
                      defaultValue="BICYCLING"
                      className="py-2 px-4 my-2 w-32 text-typography-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300"
                      {...register("preferredTravelMode", { required: true })}
                    >
                      <option value="WALKING">Walk</option>
                      <option value="BICYCLING">Cycle</option>
                      <option value="DRIVING">Drive</option>
                      <option value="TRANSIT">Public Transport</option>
                    </select>
                  </div>
                  <div className="flex flex-row items-center justify-end">
                    <p className="mr-4">Choose your travel direction</p>
                    <select
                      defaultValue="From Home"
                      className="py-2 px-4 my-2 w-32 text-typography-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300"
                      {...register("travelDirection", { required: true })}
                    >
                      <option value="From Home">From Home</option>
                      <option value="To Home">To Home</option>
                    </select>
                  </div>
                  {/* <div className="flex flex-row items-center justify-end">
                    <p className="mr-4">Select a travel time</p>
                    <div className="mr-2">
                      <select
                        defaultValue="Depart At"
                        className="py-2 px-4 my-2 w-32 text-typography-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300"
                        {...register("travelTimeRule", { required: true })}
                      >
                        <option value="Depart At">Depart At</option>
                        <option value="Arrive By">Arrive By</option>
                      </select>
                    </div>

                    <input
                      type="datetime-local"
                      className="py-2 px-4 my-2 w-64 text-typography-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="Travel Time"
                      {...register("travelTime", {})}
                    />
                  </div> */}
                </div>
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
                                  deleteAddressFromTable(
                                    row.values.addressTo,
                                    row.values.travelDirection
                                  )
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
                                    key={index}
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

export default LocationBuddy;

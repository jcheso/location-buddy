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
import {
  FaFacebookF,
  FaInstagram,
  FaGithub,
  FaLinkedinIn,
} from "react-icons/fa";
import {
  IoLocationOutline,
  IoHomeOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { OutboundLink } from "gatsby-plugin-google-analytics";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  BrowserView,
  MobileView,
  isBrowser,
  isMobile,
} from "react-device-detect";
import HashLoader from "react-spinners/ClipLoader";
import homeIcon from "../assets/images/baseline_home_black_36dp.png";
import locationIcon from "../assets/images/baseline_place_black_36dp.png";
import smileIcon from "../assets/images/smile-icon-2.png";

/*global google*/

const schema = yup.object().shape({
  addressFrom: yup.string().required(),
  addressTo: yup.string().required(),
});

const LocationBuddy = () => {
  const GOOGLE_API_KEY = process.env.GATSBY_GOOGLE_API_KEY;
  const GEOCODING_API_KEY = process.env.GATSBY_GEOCODING_API_KEY;

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
    lat: 51.50191164662122,
    lng: -0.1415895926254931,
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
        Header: "",
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
        Header: "Transit",
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
  const getDirections = async (addressFrom, addressTo, travelMode) => {
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

  //Get directions for the address to
  const addAddressTo = async (formData) => {
    try {
      if (
        tableData.length < 6 &&
        getIndexOfAddress(formData.addressTo, formData.travelDirection) === -1
      ) {
        const travelModes = ["WALKING", "BICYCLING", "DRIVING", "TRANSIT"];
        const preferredTravelModeIndex = travelModes.indexOf(
          formData.preferredTravelMode
        );
        const directionsData = [];
        setLoading(true);
        for (let index = 0; index < travelModes.length; index++) {
          try {
            if (formData.travelDirection === "From") {
              const directions = await getDirections(
                formData.addressTo,
                formData.addressFrom,
                travelModes[index]
              );
              directionsData.push(directions);
            } else if (formData.travelDirection === "To") {
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

  const mapProps = {
    mapContainerStyle: { width: "100%", height: "100%" },
    center: isMobile
      ? { lat: center.lat, lng: center.lng }
      : { lat: center.lat, lng: center.lng + 0.1 },
    zoom: 12,
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={libraries}>
      {/* Header */}
      <header className="text-gray-600 body-font">
        <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
          <a className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
            <img src={smileIcon} className="h-10 w-10"></img>
            <span className="ml-3 text-xl font-fredokaOne">LocationBuddy</span>
          </a>
          <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4 md:border-l md:border-gray-400	flex flex-wrap items-center text-base justify-center text-center">
            Here to find you the perfectly placed home
          </nav>
        </div>
      </header>
      <MobileView>
        <section className="text-gray-600 body-font">
          <form onSubmit={handleSubmit(addAddressTo)}>
            <div className="container px-5 py-4 md:py-12 mx-auto">
              <div className="flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4 md:space-y-0 space-y-6">
                <div className="p-4 md:w-1/3 flex">
                  <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mb-4 flex-shrink-0">
                    <IoHomeOutline className="w-6 h-6"></IoHomeOutline>
                  </div>
                  <div className="flex-grow pl-6">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      Your Potential Home
                    </h2>
                    <p
                      className={
                        (errors.addressFrom
                          ? "text-red-500"
                          : "text-gray-600") + "leading-relaxed text-base"
                      }
                    >
                      Select the address you're interested in.
                    </p>
                    <div className="mt-3 text-red-500 inline-flex items-center justify-start">
                      <div className="relative mr-4 lg:w-full w-2/4 md:w-full text-left">
                        <Autocomplete bounds={bounds}>
                          <input
                            type="text"
                            id="addressFrom"
                            placeholder="Buckingham Palace, London, UK"
                            className="w-full bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                            {...register("addressFrom", { required: true })}
                          />
                        </Autocomplete>
                      </div>
                      <button
                        className="inline-flex text-center text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg"
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
                  </div>
                </div>
                <div className="p-4 md:w-1/3 flex">
                  <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mb-4 flex-shrink-0">
                    <IoLocationOutline className="w-6 h-6"></IoLocationOutline>
                  </div>
                  <div className="flex-grow pl-6">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      Your Frequent Destination
                    </h2>
                    <p
                      className={
                        (errors.addressTo ? "text-red-500" : "text-gray-600") +
                        "leading-relaxed text-base"
                      }
                    >
                      Select a location you'll be visiting often.
                    </p>
                    <div className="mt-3 text-red-500 inline-flex justify-start">
                      <div className="relative mr-4 lg:w-full w-2/4 md:w-full text-left">
                        <Autocomplete bounds={bounds}>
                          <input
                            type="text"
                            id="addressTo"
                            placeholder="Imperial College London, Exhibition Road, London, UK"
                            className="w-full bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                            {...register("addressTo", {
                              required: true,
                            })}
                          />
                        </Autocomplete>
                      </div>
                      {loading ? (
                        <button
                          disabled
                          key="disabled-button"
                          className="inline-flex text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg"
                        >
                          <HashLoader color={"#ffffff"} loading={loading} />
                        </button>
                      ) : (
                        <button
                          key="add-button"
                          className="inline-flex text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg"
                          type="submit"
                          value="Add"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 md:w-1/3 flex">
                  <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mb-4 flex-shrink-0">
                    <IoSettingsOutline className="w-6 h-6"></IoSettingsOutline>
                  </div>
                  <div className="flex-grow pl-6">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      Your Commute Settings
                    </h2>
                    <p className="leading-relaxed text-base">
                      Choose your mode of transport and travel direction.
                    </p>
                    <div className="mt-3 text-red-500 inline-flex items-center align-middle w-full justify-start">
                      <select
                        defaultValue="BICYCLING"
                        className="bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                        {...register("preferredTravelMode", { required: true })}
                      >
                        <option value="WALKING">Walk</option>
                        <option value="BICYCLING">Cycle</option>
                        <option value="DRIVING">Drive</option>
                        <option value="TRANSIT">Transit</option>
                      </select>
                      {/* <p className="leading-relaxed text-base">
                        Choose your direction of travel
                      </p> */}
                      <select
                        defaultValue="To"
                        className="ml-2 bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                        {...register("travelDirection", { required: true })}
                      >
                        <option value="To">From Home</option>
                        <option value="From">To Home</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </section>
      </MobileView>
      <section className="text-gray-600 body-font md:relative pt-12 md:p-0">
        <div className="md:absolute flex inset-0 bg-gray-300 w-full h-full">
          <GoogleMap
            {...mapProps}
            // mapContainerStyle={{ width: "100%", height: "100%" }}
            // center={{ lat: center.lat, lng: center.lng + 0.1 }}
            // zoom={12}
          >
            {addressFrom && <Marker icon={homeIcon} position={center} />}

            {tableData.map((data, index) => (
              <React.Fragment key={index}>
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
              </React.Fragment>
            ))}
          </GoogleMap>
        </div>
        <div className="container px-5 xl:py-10 md:py-24 py-0 mx-auto flex text-gray-600 body-font">
          <div className="lg:w-1/2 bg-white md:rounded-lg md:p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0 md:relative z-10 md:shadow-md h-1/2">
            <h2 className="text-gray-900 text-lg mb-1 font-medium title-font">
              {addressFrom ? `${addressFrom}` : "Your Travel Summary"}
            </h2>
            <div className="w-full md:h-96 h-64 mx-auto overflow-auto ">
              <table
                className="table-auto w-full text-left whitespace-no-wrap 	"
                {...getTableProps()}
              >
                <thead>
                  {
                    // Loop over the header rows
                    headerGroups.map((headerGroup, index) => (
                      // Apply the header row props
                      <tr key={index} {...headerGroup.getHeaderGroupProps()}>
                        <th className="px-2 py-3 title-font tracking-wider font-medium text-gray-900 md:text-sm bg-gray-100 rounded-tl rounded-bl text-xs"></th>
                        {
                          // Loop over the headers in each row
                          headerGroup.headers.map((column, index) => (
                            // Apply the header cell props
                            <th
                              key={index}
                              className={
                                index === headerGroup.headers.length - 1
                                  ? "px-2 py-3 title-font tracking-wider font-medium text-gray-900 md:text-sm bg-gray-100 rounded-tr rounded-br text-xs"
                                  : "px-2 py-3 title-font tracking-wider font-medium text-gray-900 md:text-sm bg-gray-100 text-xs"
                              }
                              {...column.getHeaderProps(
                                column.getSortByToggleProps()
                              )}
                            >
                              <div className="flex flex-row items-center">
                                {
                                  // Render the header
                                  column.render("Header")
                                }
                                {index > 0 ? (
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
                                ) : (
                                  <span></span>
                                )}
                              </div>
                            </th>
                          ))
                        }
                      </tr>
                    ))
                  }
                </thead>
                {/* Apply the table body props */}
                <tbody className="overflow-y-scroll" {...getTableBodyProps()}>
                  {
                    // Loop over the table rows
                    rows.map((row, index) => {
                      // Prepare the row for display
                      prepareRow(row);
                      return (
                        // Apply the row props
                        <tr key={index} {...row.getRowProps()}>
                          <td className="border-t-2 border-b-2 border-gray-200 px-1 py-3 ">
                            <TiDelete
                              onClick={() =>
                                deleteAddressFromTable(
                                  row.values.addressTo,
                                  row.values.travelDirection
                                )
                              }
                              className="h-6 w-6 hover:opacity-80 active:opacity-100"
                            ></TiDelete>
                          </td>
                          {
                            // Loop over the rows cells
                            row.cells.map((cell, index) => {
                              // Apply the cell props
                              return (
                                <td
                                  className={
                                    index === 0
                                      ? "border-t-2 border-b-2 border-gray-200 px-1 py-3 md:text-sm text-xs"
                                      : "border-t-2 border-b-2 border-gray-200 px-2 py-3 md:text-sm text-xs"
                                  }
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
      </section>
      <BrowserView>
        <section className="text-gray-600 body-font pt-80 md:pt-0">
          <form onSubmit={handleSubmit(addAddressTo)}>
            <div className="container px-5 py-12 mx-auto">
              <div className="flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4 md:space-y-0 space-y-6">
                <div className="p-4 md:w-1/3 flex">
                  <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mb-4 flex-shrink-0">
                    <IoHomeOutline className="w-6 h-6"></IoHomeOutline>
                  </div>
                  <div className="flex-grow pl-6">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      Your Potential Home
                    </h2>
                    <p
                      className={
                        (errors.addressFrom
                          ? "text-red-500"
                          : "text-gray-600") + "leading-relaxed text-base"
                      }
                    >
                      Select the address you're interested in.
                    </p>
                    <div className="mt-3 text-red-500 inline-flex items-center justify-start">
                      <div className="relative mr-4 lg:w-full w-2/4 md:w-full text-left">
                        <Autocomplete bounds={bounds}>
                          <input
                            type="text"
                            id="addressFrom"
                            placeholder="Buckingham Palace, London, UK"
                            className="w-full bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                            {...register("addressFrom", { required: true })}
                          />
                        </Autocomplete>
                      </div>
                      <button
                        className="inline-flex text-center text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg"
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
                  </div>
                </div>
                <div className="p-4 md:w-1/3 flex">
                  <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mb-4 flex-shrink-0">
                    <IoLocationOutline className="w-6 h-6"></IoLocationOutline>
                  </div>
                  <div className="flex-grow pl-6">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      Your Frequent Destination
                    </h2>
                    <p
                      className={
                        (errors.addressTo ? "text-red-500" : "text-gray-600") +
                        "leading-relaxed text-base"
                      }
                    >
                      Select a location you'll be visiting often.
                    </p>
                    <div className="mt-3 text-red-500 inline-flex justify-start">
                      <div className="relative mr-4 lg:w-full w-2/4 md:w-full text-left">
                        <Autocomplete bounds={bounds}>
                          <input
                            type="text"
                            id="addressTo"
                            placeholder="Imperial College London, Exhibition Road, London, UK"
                            className="w-full bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                            {...register("addressTo", {
                              required: true,
                            })}
                          />
                        </Autocomplete>
                      </div>
                      {loading ? (
                        <button
                          disabled
                          key="disabled-button"
                          className="inline-flex text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg"
                        >
                          <HashLoader color={"#ffffff"} loading={loading} />
                        </button>
                      ) : (
                        <button
                          key="add-button"
                          className="inline-flex text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg"
                          type="submit"
                          value="Add"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 md:w-1/3 flex">
                  <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mb-4 flex-shrink-0">
                    <IoSettingsOutline className="w-6 h-6"></IoSettingsOutline>
                  </div>
                  <div className="flex-grow pl-6">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      Your Commute Settings
                    </h2>
                    <p className="leading-relaxed text-base">
                      Choose your mode of transport and travel direction.
                    </p>
                    <div className="mt-3 text-red-500 inline-flex items-center align-middle w-full justify-start">
                      <select
                        defaultValue="BICYCLING"
                        className="bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                        {...register("preferredTravelMode", { required: true })}
                      >
                        <option value="WALKING">Walk</option>
                        <option value="BICYCLING">Cycle</option>
                        <option value="DRIVING">Drive</option>
                        <option value="TRANSIT">Transit</option>
                      </select>
                      {/* <p className="leading-relaxed text-base">
                        Choose your direction of travel
                      </p> */}
                      <select
                        defaultValue="To"
                        className="ml-2 bg-gray-100 bg-opacity-50 rounded focus:ring-2 focus:ring-red-200 focus:bg-transparent border border-gray-300 focus:border-red-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                        {...register("travelDirection", { required: true })}
                      >
                        <option value="To">From Home</option>
                        <option value="From">To Home</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </section>
      </BrowserView>
      <footer className="text-gray-600 body-font md:pt-0 pt-96">
        <div className="container px-5 py-6 mx-auto flex items-center sm:flex-row flex-col">
          <a className="flex title-font font-medium items-center md:justify-start justify-center text-gray-900">
            <img src={smileIcon} className="h-10 w-10"></img>
            <span className="ml-3 text-xl font-fredokaOne">LocationBuddy</span>
          </a>
          <OutboundLink href="https://www.jarrydcheso.me/">
            <p className="text-sm text-gray-500 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 sm:py-2 sm:mt-0 mt-4">
              © 2021 Jarryd Cheso
            </p>
          </OutboundLink>

          <span className="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
            <OutboundLink
              href="https://www.facebook.com/jarryd.cheso"
              className="text-gray-500"
            >
              <FaFacebookF className="w-5 h-5"></FaFacebookF>
            </OutboundLink>
            <OutboundLink
              href="https://www.instagram.com/jarryd711/"
              className="ml-3 text-gray-500"
            >
              <FaInstagram className="w-5 h-5"></FaInstagram>
            </OutboundLink>
            <OutboundLink
              href="https://github.com/jcheso"
              className="ml-3 text-gray-500"
            >
              <FaGithub className="w-5 h-5"></FaGithub>
            </OutboundLink>
            <OutboundLink
              href="https://www.linkedin.com/in/jcheso/"
              className="ml-3 text-gray-500"
            >
              <FaLinkedinIn className="w-5 h-5"></FaLinkedinIn>
            </OutboundLink>
          </span>
        </div>
      </footer>
    </LoadScript>
  );
};

export default LocationBuddy;

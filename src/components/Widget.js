import React, { useMemo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTable, useSortBy } from "react-table";
import mapPlaceholder from "../assets/images/mapPlaceholder.png";
import {
  TiArrowUnsorted,
  TiArrowSortedUp,
  TiArrowSortedDown,
  TiLocation,
} from "react-icons/ti";
import GoogleMapReact from "google-map-react";

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
console.log(GOOGLE_API_KEY);

const Widget = () => {
  const defaultLocation = {
    center: {
      lat: -33.8688,
      lng: 151.2093,
    },
    zoom: 11,
  };

  const [data, setData] = React.useState(
    React.useMemo(
      () => [
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
      ],
      []
    )
  );
  const [skipPageReset, setSkipPageReset] = React.useState(false);

  //  const updateMyData = (rowIndex, columnId, value) => {
  //    // We also turn on the flag to not reset the page
  //    setSkipPageReset(true);
  //    setData((old) =>
  //      old.map((row, index) => {
  //        if (index === rowIndex) {
  //          return {
  //            ...old[rowIndex],
  //            [columnId]: value,
  //          };
  //        }
  //        return row;
  //      })
  //    );
  //  };

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

  const tableInstance = useTable({ columns, data }, useSortBy);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => console.log(data);

  return (
    <main className="rounded-xl bg-tertiary-100 border-2 border-typography-200 shadow-xl">
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
          <form className="" onSubmit={handleSubmit(onSubmit)}>
            <h3>From</h3>
            <p className="font-light text-sm">
              Enter the address you're interested in
            </p>
            <div className="">
              <input
                className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300 shadow-sm "
                defaultValue="42 Wallaby Way, Sydney NSW"
                {...register("addressFrom", { required: true })}
              />
              <input
                className="py-2 px-4 mx-6 my-4 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                type="submit"
                value="Select"
              />
            </div>
            {errors.addressFrom && (
              <span className="text-red-500 text-sm mb-2">
                Enter an address of interest
              </span>
            )}
          </form>

          {/* Map */}
          {/* <img className="my-4" src={mapPlaceholder} alt="mapPlaceholder" /> */}
          <div className="w-96 h-96 my-4">
            <GoogleMapReact
              bootstrapURLKeys={{ key: GOOGLE_API_KEY }}
              defaultCenter={defaultLocation.center}
              defaultZoom={defaultLocation.zoom}
            >
              <TiLocation
                className="h-12 w-12 text-primary-300"
                lat={defaultLocation.center.lat}
                lng={defaultLocation.center.lng}
                text="My House"
              />
            </GoogleMapReact>
          </div>
        </div>

        {/* Address To Div */}
        <div>
          {/* Address To Form */}
          <form className="" onSubmit={handleSubmit(onSubmit)}>
            <h3>To</h3>
            <p className="font-light text-sm">
              Enter the locations you visit most
            </p>
            <div className="">
              <input
                className="py-2 px-4 my-4 w-72 text-typography-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300"
                defaultValue="Taronga Zoo Sydney, Mosman NSW"
                {...register("addressTo", { required: true })}
              />
              <input
                className="py-2 px-4 mx-6 my-4 bg-primary-300 text-white rounded-lg hover:bg-opacity-90 active:bg-opacity-100"
                type="submit"
                value="Add"
              />
            </div>
            {errors.addressTo && (
              <span className="text-red-500 text-sm mb-2">
                Enter an address to check the travel times
              </span>
            )}
          </form>
          {/* Content Div */}
          <div className="">
            {/* Results Table */}
            <table
              className="table-auto rounded-lg bg-white my-4"
              {...getTableProps()}
            >
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
  );
};

export default Widget;

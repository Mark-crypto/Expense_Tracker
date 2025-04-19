import React, { useEffect } from "react";
import { useFetch } from "../hooks/useFetch";
import LoadingSpinner from "./LoadingSpinner";
import ErrorPage from "./ErrorPage";
import { useParams } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { PieData } from "../graph-data/data";

ChartJS.register(Title, Tooltip, Legend, ArcElement);
const PieChart = () => {
  const id = useParams().id;
  const url = `http:localhost:5000/api/dashboard/${id}`;
  // const url = `http:localhost:5000/api/dashboard`;
  // const { data, loading, error } = useFetch(url);

  // Pass in data values to the chart

  // if (loading) return <LoadingSpinner />;
  // if (error) return <ErrorPage />;
  const options = {};

  return (
    <>
      <h1>Pie chart</h1>
      <Pie options={options} data={PieData} />
    </>
  );
};

export default PieChart;

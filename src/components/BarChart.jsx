// import { useFetch } from "../hooks/useFetch";
// import LoadingSpinner from "./LoadingSpinner";
// import ErrorPage from "./ErrorPage";
import { useParams } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { BarData } from "../graph-data/data";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = () => {
  //get id from url
  const id = useParams().id;
  const url = `http:localhost:5000/api/dashboard/${id}`;

  // const { data, loading, error } = useFetch(url);

  //Pass in data values to the chart

  // if (error) return <ErrorPage />;
  // if (loading) return <LoadingSpinner />;
  const options = {};

  return (
    <>
      <h1>Bar chart</h1>
      <Bar options={options} data={BarData} />
    </>
  );
};

export default BarChart;

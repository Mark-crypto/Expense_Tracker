import React, { useEffect } from "react";
import { useFetch } from "@/hooks/useFetch";

const PieChart = () => {
  const url = `http:localhost:5000/api/dashboard/${id}`;
  const { data, loading, error } = useFetch(url);

  // Pass in data values to the chart

  useEffect(() => {
    // Load Google Charts script dynamically
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://www.gstatic.com/charts/loader.js";
      script.async = true;
      script.onload = () => {
        drawChart();
      };
      document.body.appendChild(script);
    } else {
      drawChart();
    }

    function drawChart() {
      if (!window.google) return; // Ensure google is available

      window.google.charts.load("current", { packages: ["corechart"] });
      window.google.charts.setOnLoadCallback(() => {
        const data = new window.google.visualization.DataTable();
        data.addColumn("string", "Topping");
        data.addColumn("number", "Slices");
        data.addRows([
          ["Mushrooms", 3],
          ["Onions", 1],
          ["Olives", 1],
          ["Zucchini", 1],
          ["Pepperoni", 2],
        ]);

        const options = {
          title: "How Much Pizza I Ate Last Night",
          width: 400,
          height: 300,
        };

        const chart = new window.google.visualization.PieChart(
          document.getElementById("chart_div")
        );
        chart.draw(data, options);
      });
    }
  }, []);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return (
    <div
      id="chart_div"
      style={{
        width: "400px",
        height: "300px",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
      }}
    ></div>
  );
};

export default PieChart;

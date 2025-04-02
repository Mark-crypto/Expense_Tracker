import React, { useEffect } from "react";
import { useFetch } from "@/hooks/useFetch";

const BarChart = () => {
  const url = `http:localhost:5000/api/dashboard/${id}`;
  const { data, loading, error } = useFetch(url);

  //Pass in data values to the chart

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://www.gstatic.com/charts/loader.js";
      script.async = true;
      script.onload = () => drawChart();
      document.body.appendChild(script);
    } else {
      drawChart();
    }

    function drawChart() {
      if (!window.google) return;

      window.google.charts.load("current", { packages: ["corechart", "bar"] });
      window.google.charts.setOnLoadCallback(() => {
        const data = new window.google.visualization.DataTable();
        data.addColumn("timeofday", "Time of Day");
        data.addColumn("number", "Motivation Level");

        data.addRows([
          [{ v: [8, 0, 0], f: "8 am" }, 1],
          [{ v: [9, 0, 0], f: "9 am" }, 2],
          [{ v: [10, 0, 0], f: "10 am" }, 3],
          [{ v: [11, 0, 0], f: "11 am" }, 4],
          [{ v: [12, 0, 0], f: "12 pm" }, 5],
          [{ v: [13, 0, 0], f: "1 pm" }, 6],
          [{ v: [14, 0, 0], f: "2 pm" }, 7],
          [{ v: [15, 0, 0], f: "3 pm" }, 8],
          [{ v: [16, 0, 0], f: "4 pm" }, 9],
          [{ v: [17, 0, 0], f: "5 pm" }, 10],
        ]);

        const options = {
          title: "Motivation Level Throughout the Day",
          hAxis: {
            title: "Time of Day",
            format: "h:mm a",
            viewWindow: {
              min: [7, 30, 0],
              max: [17, 30, 0],
            },
          },
          vAxis: {
            title: "Rating (scale of 1-10)",
          },
          colors: ["#9d00ff"], // Purple bars
          chartArea: {
            width: "80%", // Make sure the chart fits inside the container
            height: "70%", // Avoid overflow
          },
          bar: {
            groupWidth: "60%", // Adjust the bar width
          },
        };

        const chart = new window.google.visualization.ColumnChart(
          document.getElementById("chart_div2")
        );
        chart.draw(data, options);
      });
    }
  }, []);
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "600px",
        height: "300px",
        backgroundColor: "white", // White background
        borderRadius: "12px", // Rounded corners
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", // Soft shadow
        padding: "16px", // Some padding inside the container
      }}
    >
      <div id="chart_div2" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default BarChart;

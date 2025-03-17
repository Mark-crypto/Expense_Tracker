import Navbar from "./Navbar.jsx";

const Prediction = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div style={{ width: "20%" }}>
        <Navbar />
      </div>
      <div
        style={{
          backgroundColor: "#9D00FF",
          height: "100vh",

          width: "80%",
        }}
      >
        <h1>
          AI Predictions - total, debt, advised budget amount,month v
          amount,future category vs expenditure
        </h1>
      </div>
    </div>
  );
};

export default Prediction;

import Navbar from "./Navbar";

const Budget = () => {
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
        <h1>Budget</h1>
      </div>
    </div>
  );
};

export default Budget;

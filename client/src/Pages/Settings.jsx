import Navbar from "../components/Navbar";
const Settings = () => {
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
        <h1>Settings</h1>
      </div>
    </div>
  );
};

export default Settings;

import { FaArrowAltCircleDown } from "react-icons/fa";
import { FaArrowAltCircleUp } from "react-icons/fa";

const BudgetBtn = ({ show, setShow }) => {
  return (
    <>
      {" "}
      <div className="btn-budget">
        <button type="button" onClick={() => setShow(!show)}>
          {show ? (
            <>
              Hide Previous Budgets{" "}
              <FaArrowAltCircleUp
                style={{ marginLeft: "10px", fontSize: "30px" }}
              />
            </>
          ) : (
            <>
              Show Previous Budgets{" "}
              <FaArrowAltCircleDown
                style={{
                  marginLeft: "10px",
                  fontSize: "30px",
                }}
              />
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default BudgetBtn;

import { FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
// import ProfileForm from "@/components/ProfileForm";
import Loading from "@/components/Loading";
import { useState } from "react";

const Profile = () => {
  let { id } = useParams();
  id = parseInt(id);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const { data, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await axiosInstance.get(`/profile/${id}`);
    },
  });

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    toast.error("SOmething went wrong");
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-8">
        <motion.div
          className="max-w-md mx-auto bg-white  shadow-2xl rounded-2xl p-6 text-center space-y-4 border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center">
            <FaUserCircle className="text-gray-400 text-7xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            {data?.data?.data?.name || "N/A"}
          </h2>
          <p className="text-gray-500">
            Email: {data?.data?.data?.email || "N/A"}
          </p>
          <p className="text-gray-500">
            Occupation: {data?.data?.data?.occupation || "N/A"}
          </p>
          <p className="text-gray-500">
            Age: {data?.data?.data?.age || "N/A"} years
          </p>
          <p className="text-gray-600 text-sm leading-relaxed break-words whitespace-pre-line max-w-full">
            <span className="font-medium text-gray-700">Goal:</span>{" "}
            {data?.data?.data?.goal || "N/A"}
          </p>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleShow}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700 transition"
            >
              Edit profile
            </Button>
            <Modal.Dialog>
              <Modal.Header closeButton>
                <Modal.Title>Modal title</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <p>Modal body text goes here.</p>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary">Close</Button>
                <Button variant="primary">Save changes</Button>
              </Modal.Footer>
            </Modal.Dialog>
            {/* <ProfileForm show={show} handleClose={handleClose} /> */}
            <a href="/history">
              <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm hover:bg-gray-300 transition">
                View Expenses
              </button>
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;

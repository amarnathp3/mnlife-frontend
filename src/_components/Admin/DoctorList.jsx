import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Edit, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import ScheduleModal from "./ScheduleModal";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditClinicModal from "./EditClinicModal";
import AdminNavbar from "./AdminNavbar";
import { useDispatch, useSelector } from "react-redux";
import { fetchClinics, deleteClinic, archiveClinic, updateClinic } from "@/redux/doctorList";
import 'react-toastify/dist/ReactToastify.css';

const DoctorList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [scheduleType, setScheduleType] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loadingClinicId, setLoadingClinicId] = useState(null);
    

    const dispatch = useDispatch();
    const { filteredClinics, status, error } = useSelector((state) => state.doctorList);


    useEffect(() => {
        // Dispatch the fetchClinics action when the component loads
        dispatch(fetchClinics());
    }, [dispatch]);

    const openScheduleModal = (clinic, type) => {
        setSelectedClinic(clinic);
        setScheduleType(type);
        setIsModalOpen(true);
    };

    const handleLocationClick = (coordinates) => {
        setMapCoordinates(coordinates);
        setIsMapPopupOpen(true);
    };

    const handleEditClick = (clinic) => {
        setSelectedClinic(clinic);
        setIsEditModalOpen(true);
    };

    const handleUpdateClinic = (updatedClinic) => {
        dispatch(updateClinic(updatedClinic))
            .unwrap()
            .then(() => {
                toast.success("Clinic updated successfully");
    
                // Update only the selected clinic in local state
                setSelectedClinic(updatedClinic);
    
                // Optionally, you can also update the filteredClinics state
                const updatedClinics = filteredClinics.map(clinic =>
                    clinic._id === updatedClinic._id ? updatedClinic : clinic
                );
                // Update the local state if you want to reflect changes in the table
                dispatch(fetchClinics(updatedClinics)); // If you have a way to set this in your redux store
                setIsEditModalOpen(false);
            })
            .catch((error) => {
                toast.error(error || "Failed to update clinic");
            });
    };

    const handleDeleteClinic = async (id) => {
        try {
            await dispatch(deleteClinic({ id }));
            toast.success("Clinic deleted successfully");
        } catch (err) {
            toast.error(err || "Failed to delete clinic");
        }
    };

    const handleArchiveClinic = async (clinicId) => {
        setLoadingClinicId(clinicId);
        try {
            await dispatch(archiveClinic({ clinicId }));
            toast.success("Doctor Archived successfully");
        } catch (err) {
            toast.error(err || "Failed to Archive clinic");
        } finally {
            setLoadingClinicId(null);
        }
    };

    return (
        <div>
            <AdminNavbar />

            <div className="overflow-x-auto mt-[80px] w-full p-0 m-0">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="ltr:text-left rtl:text-right ">
                        <tr>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Edit</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Delete</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Date</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Doctor Name</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Doctor Number</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Pharmacy Name</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Pharmacy Number</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Location</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Grade</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">MR Name</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Remarks</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Notes</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {filteredClinics.map((clinic, index) => (
                            <tr className="odd:bg-gray-50" key={clinic._id} style={{ height: "80px" }}>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    <Edit className="w-5 h-5 text-gray-700 cursor-pointer" onClick={() => handleEditClick(clinic)} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    <Trash2 className="w-5 h-5 text-gray-700 cursor-pointer" onClick={() => handleDeleteClinic(clinic._id)} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    {moment(clinic.createdAt).format('D MMM YYYY')}
                                    <button className="block p-1 px-4 rounded-md mt-2 text-sm bg-[#FFD9BD]" onClick={() => handleArchiveClinic(clinic._id)}>
                                        Archive
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                                    {clinic.doctorName}
                                    <button
                                        className="block p-1 px-4 rounded-md mt-2 text-sm bg-[#E2FFBD]"
                                        onClick={() => openScheduleModal(clinic, 'doctor')}
                                    >
                                        Schedule Call
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    {clinic.doctorNumber}
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            id={`doctor-contacted-${clinic._id}`}
                                            checked={clinic.doctorWhatsAppContacted}
                                            readOnly
                                            className="mr-2"
                                        />
                                        <label htmlFor={`doctor-contacted-${clinic._id}`} className="text-sm">
                                            What's App Contacted
                                        </label>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    {clinic.pharmacyName}
                                    <button
                                        className="block p-1 px-4 rounded-md mt-2 text-sm bg-[#E2FFBD]"
                                        onClick={() => openScheduleModal(clinic, 'pharmacy')}
                                    >
                                        Schedule Call
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    {clinic.pharmacyNumber}
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            id={`pharmacy-contacted-${clinic._id}`}
                                            checked={clinic.pharmacyWhatsAppContacted}
                                            readOnly
                                            className="mr-2"
                                        />
                                        <label htmlFor={`pharmacy-contacted-${clinic._id}`} className="text-sm">
                                            Pharmacy Contacted
                                        </label>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-blue-500 cursor-pointer"
                                    onClick={() => handleLocationClick(clinic.url)}>
                                    {clinic.url && clinic.url.length > 0 ? "Location" : "No Location"}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    {/* <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center">
                                            {clinic.grade}
                                            <ChevronDown className="ml-2" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>A</DropdownMenuItem>
                                            <DropdownMenuItem>B</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu> */}

                                    {clinic.grade}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{clinic.createdBy.name}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{clinic.remarks}</td>
                                <td className="whitespace-nowrap px-4 py-2">
                                    <Input className="w-[300px] h-[50px]" value={clinic.notes} readOnly />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {isModalOpen && (
                    <ScheduleModal
                        selectedClinic={selectedClinic}
                        selectedType={scheduleType}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}

                {isEditModalOpen && (
                    <EditClinicModal
                        clinic={selectedClinic}
                        onClose={() => setIsEditModalOpen(false)}
                        onUpdate={handleUpdateClinic}
                        isLoading={loadingClinicId === selectedClinic._id}
                    />
                )}
            </div>
        </div>
    );
};

export default DoctorList;
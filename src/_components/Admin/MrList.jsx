import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import moment from "moment";
import { Dialog, Transition } from '@headlessui/react';
import { Download } from 'lucide-react';
import Navbar from "./Navbar";
import { toast } from "react-toastify";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Trash2, Upload } from "lucide-react";
import { archiveMR, deleteMR, uploadCard } from "@/redux/mrSlice";
import { useDispatch } from "react-redux";
import CircularProgress from '@mui/material/CircularProgress';
import { Button } from "@/components/ui/button";
import LoadingAnimation from "./LoadingAnimation";

const MrList = () => {
    const [uploadingStatus, setUploadingStatus] = useState({});
    const dispatch = useDispatch();
    const [mrs, setMrs] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isOpen, setIsOpen] = useState(false);  // For Aadhaar/PAN dialog
    const [isPasswordOpen, setIsPasswordOpen] = useState(false); // For password dialog
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentMrId, setCurrentMrId] = useState(null);  // Keep track of MR ID for password change
    const [loadingStatuses, setLoadingStatuses] = useState({});
    const [loading, setLoading] = useState(false);

    const aadhaarFileInputRef = useRef(null);
    const panFileInputRef = useRef(null);

    useEffect(() => {
        const fetchMrs = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    const response = await axios.get("https://mnlifescience.vercel.app/api/getMrs", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setMrs(response.data);

                    // Initialize loading statuses
                    const initialLoadingStatuses = response.data.reduce((acc, mr) => {
                        acc[mr._id] = false;
                        return acc;
                    }, {});
                    setLoadingStatuses(initialLoadingStatuses);
                } else {
                    console.error("No token found in localStorage");
                }
            } catch (error) {
                console.error("Error fetching MRs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMrs();
    }, [dispatch]);


    const openModal = (doc) => {
        setSelectedDoc(doc);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const openPasswordModal = (mrId) => {
        setCurrentMrId(mrId);
        setIsPasswordOpen(true);
    };

    const closePasswordModal = () => {
        setIsPasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("File downloaded successfully", { autoClose: 3000 });
        } catch (error) {
            toast.error("Error downloading file, Please try Again", { autoClose: 3000 });
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword === confirmPassword) {
            try {
                const token = localStorage.getItem("token");

                // Prepare only necessary data for the request
                const data = {
                    id: currentMrId,
                    newPassword,
                    confirmPassword,
                };

                console.log("Data being sent to backend:", data);

                // Make the API request
                const response = await axios.patch(
                    "https://mnlifescience.vercel.app/api/admin/edit-mr",
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("Response from backend:", response.data);

                // Handle response
                if (response.status === 200) {
                    toast.success('Password updated successfully');
                    closePasswordModal();
                } else {
                    toast.error('Error updating password');
                }
            } catch (error) {
                console.error('Error updating password:', error.response ? error.response.data : error.message);
                toast.error('Failed to update password');
            }
        } else {
            toast.error('Passwords do not match!');
        }
    };



    const handleUpdateStatus = async (id, status) => {
        setLoadingStatuses(prev => ({ ...prev, [id]: true }));
        try {
            const token = localStorage.getItem("token");
            await axios.patch(
                `https://mnlifescience.vercel.app/api/admin/edit-mr`,
                { id, status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update the local state
            setMrs(prevMrs => prevMrs.map(mr =>
                mr._id === id ? { ...mr, status } : mr
            ));
            toast.success("Status updated successfully");
        } catch (error) {
            toast.error(`Error updating status: ${error.response.data}`);
        } finally {
            setLoadingStatuses(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleDeleteMR = async (id) => {
        try {
            await dispatch(deleteMR({ id })).unwrap(); // Use unwrap to handle fulfilled/rejected actions directly
            setMrs(prevMrs => prevMrs.filter(mr => mr._id !== id));
            toast.success("MR deleted successfully");
        } catch (err) {
            toast.error(err || "Failed to delete MR");
        }
    };

    const handleArchiveMR = async (id) => {
        try {
            await dispatch(archiveMR({ id })).unwrap(); // Use unwrap to handle fulfilled/rejected actions directly
            setMrs(prevMrs => prevMrs.filter(mr => mr._id !== id));
            toast.success("MR Archived successfully");
        } catch (err) {
            toast.error(err || "Failed to delete MR");
        }
    };

    const handleFileUpload = async (mrId, event, cardType) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected");
            return;
        }

         // Check file size (2MB = 2 * 1024 * 1024 bytes)
         const maxSize = 2 * 1024 * 1024; // 2MB in bytes
         if (file.size > maxSize) {
             toast.error(`${cardType === 'aadhaarCard' ? 'Aadhaar' : 'PAN'} card exceeds 2 MB. Please upload a smaller image.`);
             return;
         }

        // Start loader for the specific MR and card type
        setUploadingStatus(prev => ({
            ...prev,
            [mrId]: { ...prev[mrId], [cardType]: true }
        }));

        try {
            const resultAction = await dispatch(uploadCard({ mrId, cardType, file }));
            if (uploadCard.fulfilled.match(resultAction)) {
                const updatedMR = resultAction.payload.updatedMR;
                setMrs(prevMrs => prevMrs.map(mr =>
                    mr._id === mrId ? updatedMR : mr
                ));
                toast.success(`${cardType === 'aadhaarCard' ? 'Aadhaar' : 'PAN'} card uploaded successfully`);

                // Immediately open the modal to show the uploaded card
                openModal({ type: cardType === 'aadhaarCard' ? 'Aadhaar' : 'PAN', url: updatedMR[cardType] });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast.error(`Failed to upload ${cardType === 'aadhaarCard' ? 'Aadhaar' : 'PAN'} card`);
            console.error(`Error uploading ${cardType === 'aadhaarCard' ? 'Aadhaar' : 'PAN'} card:`, error);
        } finally {
            // Stop loader for the specific MR and card type
            setUploadingStatus(prev => ({
                ...prev,
                [mrId]: { ...prev[mrId], [cardType]: false }
            }));
        }
    };


    const triggerFileInput = (mrId, cardType) => {
        console.log("Triggering file input for MR ID:", mrId, "Card Type:", cardType);
        setCurrentMrId(mrId);
        if (cardType === 'aadhaarCard') {
            console.log("Opening Aadhaar file input");
            aadhaarFileInputRef.current.click();
        } else {
            console.log("Opening PAN file input");
            panFileInputRef.current.click();
        }
    };



    return (
        <div>
            <Navbar />
            <div className="overflow-x-auto mt-16">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="text-left">
                        <tr>
                            <th className="p-2 font-medium text-gray-900">Delete</th>
                            <th className="p-2 font-medium text-gray-900">Archive</th>
                            <th className="p-2 font-medium text-gray-900">Joining Date</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">MR Name</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">MR Number</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">MR Area</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Update Password</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Update Status</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Aadhaar Card</th>
                            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Pan Card</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {mrs?.map((mr, index) => (
                            <tr className="odd:bg-gray-50" key={index}>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700"><Trash2 className="w-5 h-5 text-gray-700 cursor-pointer" onClick={() => handleDeleteMR(mr._id)} /></td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    <button className="block p-1 px-4 rounded-md mt-2 text-sm bg-[#FFD9BD]" onClick={() => handleArchiveMR(mr._id)}>Archive</button>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{moment(mr?.joiningDate).format('D MMM YYYY')}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{mr?.name}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{mr?.mobileNumber}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{mr?.areaName}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    <button
                                        onClick={() => openPasswordModal(mr._id)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Update Password
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outlined"
                                                disabled={loadingStatuses[mr?._id]}
                                                startIcon={loadingStatuses[mr?._id] ? <CircularProgress size={20} /> : null}
                                            >
                                                {mr.status}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(mr?._id, 'Active')}>Active</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(mr?._id, 'In-Active')}>In-active</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-blue-500 cursor-pointer">
                                    {uploadingStatus[mr._id]?.aadhaarCard ? (
                                        <CircularProgress size={20} />
                                    ) : mr?.aadhaarCard ? (
                                        <span onClick={() => openModal({ type: 'Aadhaar', url: mr?.aadhaarCard })}>View Aadhaar</span>
                                    ) : (
                                        <button onClick={() => triggerFileInput(mr._id, 'aadhaarCard')} className="flex items-center">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload Aadhaar
                                        </button>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-blue-500 cursor-pointer">
                                    {uploadingStatus[mr._id]?.panCard ? (
                                        <CircularProgress size={20} />
                                    ) : mr?.panCard ? (
                                        <span onClick={() => openModal({ type: 'PAN', url: mr?.panCard })}>View PAN</span>
                                    ) : (
                                        <button onClick={() => triggerFileInput(mr._id, 'panCard')} className="flex items-center">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload PAN
                                        </button>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Hidden file inputs */}
            <input
                type="file"
                ref={aadhaarFileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(currentMrId, e, 'aadhaarCard')}
                accept="image/*"
            />
            <input
                type="file"
                ref={panFileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(currentMrId, e, 'panCard')}
                accept="image/*"
            />

            {/* Aadhaar/PAN Modal */}
            <Transition appear show={isOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                                        {selectedDoc?.type} Card
                                        <button
                                            onClick={() => handleDownload(selectedDoc?.url, `${selectedDoc?.type.toLowerCase()}_card.jpg`)}
                                            className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download {selectedDoc?.type}
                                        </button>
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <img src={selectedDoc?.url} alt={`${selectedDoc?.type} Card`} className="w-full h-auto" />
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Update Password Modal */}
            <Transition appear show={isPasswordOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closePasswordModal}>
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Update Password
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <Input
                                            type="password"
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="mb-2"
                                        />
                                        <Input
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleUpdatePassword}
                                            className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default MrList;

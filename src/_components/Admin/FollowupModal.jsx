import React from "react";
import { Dialog } from "@headlessui/react";
import { Input } from "@/components/ui/input"; // Import the Shadcn UI Input component
import moment from "moment";

const FollowUpModal = ({ isOpen, onClose, followUps }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-3xl rounded bg-white p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-bold">Follow-ups</Dialog.Title>

                    {/* Scrollable Table Container */}
                    <div className="mt-4 max-h-64 overflow-y-auto">
                        {followUps && followUps.length > 0 ? (
                            <table className="min-w-full table-auto border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border px-4 py-2 text-left">Followed-Up Date</th>
                                        <th className="border px-4 py-2 text-left">Followed-Up Location</th>
                                        <th className="border px-4 py-2 text-left">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {followUps.map((followUp, index) => (
                                        <tr key={followUp._id} className="border-b">
                                            <td className="border px-4 py-2 text-sm text-gray-600">
                                                {moment(followUp.followUpDate).format('D MMM YYYY')}
                                            </td>
                                            <td className="border px-4 py-2 text-sm text-gray-600">
                                                <a
                                                    href={followUp.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 underline"
                                                >
                                                    View Location
                                                </a>
                                            </td>
                                            <td className="border px-4 py-2">
                                                <Input
                                                    type="text"
                                                    value={followUp.remarks}
                                                    className="text-sm w-full"
                                                    readOnly
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No follow-ups available.</p>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Close
                    </button>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default FollowUpModal;
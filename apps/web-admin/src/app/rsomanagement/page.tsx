"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Search,
  Plus,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Edit3,
  Mail,
  Trash2,
  MoreVertical,
  Shield,
  Award,
  Clock,
  X,
  Download,
  FileText,
  Check,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
  getOrganizations,
  Organization,
  DocumentReviews,
  submitOrganizationReview,
  downloadDocumentFromBase64,
} from "../../services/organizations";
import { firestore, auth } from "@/Firebase";
import RegisterOrganizationModal from "../components/modals/RegisterOrganizationModal";
import { useAuthState } from "react-firebase-hooks/auth";
import { autoCreateUser } from "../../services/organizations";

const RSOManagement = () => {
  const [activeNav, setActiveNav] = useState("RSO Management");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCollege, setFilterCollege] = useState("all");
  const [selectedRSOs, setSelectedRSOs] = useState<string[]>([]);
  const [rsos, setRsos] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user] = useAuthState(auth);
  const userEmail = user?.email ?? "";

  // Document review states
  const [documentReviews, setDocumentReviews] = useState<
    Record<string, string | null>
  >({});
  const [documentRemarks, setDocumentRemarks] = useState<
    Record<string, string>
  >({});
  const [finalAction, setFinalAction] = useState<
    "approve" | "reject" | "update" | "hold" | "terminated" | ""
  >("");
  const [finalRemarks, setFinalRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showOrgAccountModal, setShowOrgAccountModal] = useState(false);
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPassword, setOrgPassword] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [orgData, setOrgData] = useState<{
    orgId: string;
    organization: string;
    department: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    if (userEmail) {
      setOrgData({
        orgId: "001",
        organization: "Student's Affairs Office",
        department: "All",
        email: userEmail,
      });
    }
  }, [userEmail]);

  // Fetch organizations from Firestore
  useEffect(() => {
    const fetchRSOs = async () => {
      try {
        setLoading(true);
        const orgs = await getOrganizations();
        setRsos(orgs);
      } catch (error) {
        console.error("Error loading RSOs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRSOs();
  }, []);

  // Stats
  const stats = useMemo(
    () => ({
      totalRegisteredRSOs: rsos.length,
      totalApproved: rsos.filter((r) => r.status === "approved").length,
      totalPending: rsos.filter((r) => r.status === "applied").length,
      totalMembers: rsos.reduce((sum, r) => sum + (r.members?.length || 0), 0),
      totalOfficers: rsos.reduce(
        (sum, r) => sum + (r.officers?.length || 0),
        0
      ),
    }),
    [rsos]
  );

  // Filter RSOs based on search and filters
  const filteredRSOs = rsos.filter((rso) => {
    const matchesSearch =
      rso.orgName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rso.acronym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rso.presidentName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || rso.registrationType === filterType;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "Active" && rso.status === "approved") ||
      (filterStatus === "Under Review" && rso.status === "applied") ||
      (filterStatus === "Terminated" && rso.status === "terminated") ||
      (filterStatus === "On Hold" && rso.status === "hold") ||
      (filterStatus === "Inactive" && rso.status === "rejected");
    const matchesCollege =
      filterCollege === "all" || rso.department === filterCollege;

    return matchesSearch && matchesType && matchesStatus && matchesCollege;
  });

  function getDocumentsList(org: Organization) {
    const docs = [
      {
        key: "constitutionByLaws",
        label: "Constitution & By-Laws",
        fileName: org.constitutionByLawsFileName,
        base64: org.constitutionByLawsBase64,
      },
      {
        key: "atoApplication",
        label: "ATO Application",
        fileName: org.atoApplicationFileName,
        base64: org.atoApplicationBase64,
      },
      {
        key: "officersList",
        label: "Officers List",
        fileName: org.officersListFileName,
        base64: org.officersListBase64,
      },
      {
        key: "gpoa",
        label: "GPOA Document",
        fileName: org.gpoaFileName,
        base64: org.gpoaBase64,
      },
      {
        key: "registrationForm",
        label: "Registration Form",
        fileName: org.registrationFormFileName,
        base64: org.registrationFormBase64,
      },
    ];

    return docs.filter((d) => d.base64);
  }

  const handleViewOrg = (org: Organization) => {
    setSelectedOrg(org);
    setShowModal(true);

    // Initialize document reviews using existing values if present
    const initialReviews: Record<string, string | null> = {};
    const initialRemarks: Record<string, string> = {};
    const docs = getDocumentsList(org);
    docs.forEach((d) => {
      const existing = org.documentReviews?.[
        d.key as keyof DocumentReviews
      ] as any;
      initialReviews[d.key] = existing?.status ?? null;
      initialRemarks[d.key] = existing?.remarks ?? "";
    });

    setDocumentReviews(initialReviews);
    setDocumentRemarks(initialRemarks);
    setFinalAction("");
    setFinalRemarks("");
  };

  const handleDownload = (base64String?: string, fileName?: string) => {
    if (!base64String || !fileName) return alert("File not available");
    try {
      downloadDocumentFromBase64(base64String, fileName);
    } catch (err) {
      console.error(err);
      alert("Failed to download file");
    }
  };

  const handleDocumentReview = (
    docKey: string,
    status: "approved" | "rejected" | "update" | null
  ) => {
    setDocumentReviews((prev) => ({ ...prev, [docKey]: status }));
  };

  const handleDocumentRemarkChange = (docKey: string, remark: string) => {
    setDocumentRemarks((prev) => ({ ...prev, [docKey]: remark }));
  };

  const handleFinalSubmit = async () => {
    if (!selectedOrg) return alert("Select an organization first.");
    if (!finalAction) return alert("Please select an action first.");

    setIsSubmitting(true);
    try {
      // Map all possible finalAction values to valid Firestore statuses
      let newStatus:
        | "approved"
        | "applied"
        | "rejected"
        | "terminated"
        | "hold" =
        (selectedOrg.status as
          | "approved"
          | "applied"
          | "rejected"
          | "terminated"
          | "hold") || "applied";

      if (finalAction === "approve") newStatus = "approved";
      else if (finalAction === "reject") newStatus = "rejected";
      else if (finalAction === "update") newStatus = "applied";
      else if (finalAction === "terminated") newStatus = "terminated";
      else if (finalAction === "hold") newStatus = "hold";

      // For extra actions (terminate, hold), store them in reviewNotes for reference
      const extraNote =
        finalAction === "terminated"
          ? "Organization was terminated."
          : finalAction === "hold"
          ? "Organization put on hold."
          : "";

      await submitOrganizationReview(selectedOrg.id, {
        status: newStatus,
        reviewNotes: `${finalRemarks} ${extraNote}`.trim(),
        documentReviews: {}, // ✅ Fix: required property provided
      });

      alert(
        `✅ Organization ${
          finalAction === "terminated"
            ? "terminated"
            : finalAction === "hold"
            ? "put on hold"
            : finalAction === "approve"
            ? "approved"
            : finalAction === "reject"
            ? "rejected"
            : "updated"
        } successfully.`
      );

      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit action. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRSOSelect = (rsoId: string) => {
    setSelectedRSOs((prev) =>
      prev.includes(rsoId)
        ? prev.filter((id) => id !== rsoId)
        : [...prev, rsoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRSOs.length === filteredRSOs.length) {
      setSelectedRSOs([]);
    } else {
      setSelectedRSOs(filteredRSOs.map((rso) => rso.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </span>
        );
      case "applied":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" /> Under Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" /> Inactive
          </span>
        );
      case "hold":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <XCircle className="h-3 w-3 mr-1" /> On Hold
          </span>
        );
      case "terminated":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" /> Terminated
          </span>
        );
      default:
        return null;
    }
  };

  type StatCardProps = {
    title: string;
    value: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    bgColor?: string;
  };

  const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor = "bg-red-50",
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 ${bgColor} rounded-full`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  const InfoItem: React.FC<{ label: string; value?: string | number }> = ({
    label,
    value,
  }) => {
    const displayValue =
      typeof value === "number" ? value : value ? value : "N/A";

    return (
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900">{displayValue}</p>
      </div>
    );
  };

  return (
    <div className="ml-15 min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              RSO Management
            </h1>
            <p className="text-gray-600">
              Manage Recognized Student Organizations and their activities
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Registered RSOs"
              value={stats.totalRegisteredRSOs}
              icon={Building2}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <StatCard
              title="RSOs Pending Approval"
              value={stats.totalPending}
              icon={Calendar}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <StatCard
              title="Approved RSOs"
              value={stats.totalApproved}
              icon={CheckCircle}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Total Members"
              value={stats.totalMembers}
              icon={Users}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </div>

          {/* Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search RSOs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-80"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  value={filterCollege}
                  onChange={(e) => setFilterCollege(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Colleges</option>
                  <option value="COE">COE</option>
                  <option value="CAS">CAS</option>
                  <option value="CBA">CBA</option>
                  <option value="CFAD">CFAD</option>
                </select>
              </div>

              <button
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Register RSO
              </button>

              <RegisterOrganizationModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userEmail={userEmail}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Loading RSOs...
              </div>
            ) : filteredRSOs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No RSOs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedRSOs.length === filteredRSOs.length &&
                            filteredRSOs.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RSO Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRSOs.map((rso) => (
                      <tr
                        key={rso.id}
                        onClick={() => handleViewOrg(rso)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td
                          className="px-6 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRSOs.includes(rso.id)}
                            onChange={() => handleRSOSelect(rso.id)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {rso.orgName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rso.acronym}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {rso.department}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(rso.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {rso.members?.length || 0}
                        </td>
                        <td
                          className="px-6 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-blue-600">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-600">
                              <Mail className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showOrgAccountModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowOrgAccountModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowOrgAccountModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Create Account for {selectedOrg?.orgName || "Organization"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="Enter organization email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                  value={orgPassword}
                  onChange={(e) => setOrgPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              <button
                onClick={async () => {
                  if (!orgEmail || !orgPassword)
                    return alert("Please fill all fields.");

                  if (orgPassword.length < 6)
                    return alert(
                      "Password must be at least 6 characters long."
                    );

                  setLoadingCreate(true);
                  try {
                    // ✅ Use org name and acronym instead of president’s name
                    const firstName = selectedOrg?.orgName || "Organization";
                    const lastName = selectedOrg?.acronym || "";

                    const result = await autoCreateUser(orgEmail, orgPassword, {
                      firstName,
                      lastName,
                      role: "admin",
                      organizationId: selectedOrg?.id,
                    });

                    if (result.success) {
                      alert(
                        `✅ Organization account created for ${selectedOrg?.orgName}`
                      );
                      setShowOrgAccountModal(false);
                    } else {
                      alert(`⚠️ Failed: ${result.error}`);
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Error creating account.");
                  } finally {
                    setLoadingCreate(false);
                  }
                }}
                disabled={loadingCreate}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                {loadingCreate ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modal with Document Review */}
      {showModal && selectedOrg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-red-600 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedOrg.logoBase64 && (
                  <img
                    src={selectedOrg.logoBase64}
                    alt={selectedOrg.orgName}
                    className="w-12 h-12 rounded-lg bg-white p-1.5 object-contain"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedOrg.orgName}
                  </h2>
                  <p className="text-red-100 text-sm">{selectedOrg.acronym}</p>
                </div>
              </div>
              <button
                className="text-white hover:bg-white/20 rounded-lg p-1.5 transition"
                onClick={() => setShowModal(false)}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Status Badge */}
              <div className="mb-5">{getStatusBadge(selectedOrg.status)}</div>

              {/* Description */}
              {selectedOrg.shortdesc && (
                <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedOrg.shortdesc}
                  </p>
                </div>
              )}

              {/* Information Grid */}
              <div className="space-y-5">
                {/* Organization Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-red-600" />
                    Organization Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      label="Department"
                      value={selectedOrg.department}
                    />
                    <InfoItem
                      label="Registration Type"
                      value={
                        selectedOrg.registrationType
                          ? selectedOrg.registrationType
                              .charAt(0)
                              .toUpperCase() +
                            selectedOrg.registrationType.slice(1)
                          : "N/A"
                      }
                    />
                    <InfoItem label="Location" value={selectedOrg.location} />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-red-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Email" value={selectedOrg.email} />
                    <InfoItem
                      label="Contact Number"
                      value={selectedOrg.contactNumber}
                    />
                  </div>
                </div>

                {/* Leadership */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    Leadership
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      label="President"
                      value={selectedOrg.presidentName}
                    />
                    <InfoItem
                      label="Student ID"
                      value={selectedOrg.presidentStudentId}
                    />
                    <InfoItem label="Adviser" value={selectedOrg.adviserName} />
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-600" />
                    Membership
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      label="Total Members"
                      value={selectedOrg.members?.length || 0}
                    />
                    <InfoItem
                      label="Total Officers"
                      value={selectedOrg.officers?.length || 0}
                    />
                  </div>
                </div>

                {/* Document Review Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600" />
                    Document Review
                  </h3>

                  <div className="space-y-4">
                    {getDocumentsList(selectedOrg).map((doc) => (
                      <div
                        key={doc.key}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {doc.label}
                            </p>
                            <p className="text-sm text-gray-500">
                              {doc.fileName}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleDownload(doc.base64, doc.fileName)
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleDocumentReview(doc.key, "approved")
                              }
                              className={`p-2 rounded-lg transition ${
                                documentReviews[doc.key] === "approved"
                                  ? "bg-green-100 text-green-600"
                                  : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                              }`}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleDocumentReview(doc.key, "rejected")
                              }
                              className={`p-2 rounded-lg transition ${
                                documentReviews[doc.key] === "rejected"
                                  ? "bg-red-100 text-red-600"
                                  : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                              }`}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleDocumentReview(doc.key, "update")
                              }
                              className={`p-2 rounded-lg transition ${
                                documentReviews[doc.key] === "update"
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                              }`}
                              title="Request Update"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <textarea
                          placeholder="Add remarks for this document..."
                          value={documentRemarks[doc.key] || ""}
                          onChange={(e) =>
                            handleDocumentRemarkChange(doc.key, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditional Section — depends on status */}
                {selectedOrg.status === "approved" ? (
                  // ✅ Manage Approved Organization Section
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Manage Approved Organization
                    </h3>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setFinalAction("hold")}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          finalAction === "hold"
                            ? "bg-yellow-500 text-white border-yellow-600"
                            : "border-gray-300 text-gray-700 hover:bg-yellow-50"
                        }`}
                      >
                        Hold Organization
                      </button>

                      <button
                        onClick={() => setFinalAction("terminated")}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          finalAction === "terminated"
                            ? "bg-red-600 text-white border-red-700"
                            : "border-gray-300 text-gray-700 hover:bg-red-50"
                        }`}
                      >
                        Terminate Organization
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        value={finalRemarks}
                        onChange={(e) => setFinalRemarks(e.target.value)}
                        rows={3}
                        placeholder="Enter your remarks..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <button
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting || !finalAction}
                      className={`w-full py-2 rounded-lg font-medium transition ${
                        isSubmitting || !finalAction
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Action"}
                    </button>
                  </div>
                ) : (
                  // 🧾 Original Final Decision Section for non-approved orgs
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Final Decision
                    </h3>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setFinalAction("approve")}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          finalAction === "approve"
                            ? "bg-green-600 text-white border-green-700"
                            : "border-gray-300 text-gray-700 hover:bg-green-50"
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setFinalAction("reject")}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          finalAction === "reject"
                            ? "bg-red-600 text-white border-red-700"
                            : "border-gray-300 text-gray-700 hover:bg-red-50"
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setFinalAction("update")}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          finalAction === "update"
                            ? "bg-yellow-500 text-white border-yellow-600"
                            : "border-gray-300 text-gray-700 hover:bg-yellow-50"
                        }`}
                      >
                        Request Update
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        value={finalRemarks}
                        onChange={(e) => setFinalRemarks(e.target.value)}
                        rows={3}
                        placeholder="Enter your remarks..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <button
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting || !finalAction}
                      className={`w-full py-2 rounded-lg font-medium transition ${
                        isSubmitting || !finalAction
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Decision"}
                    </button>
                  </div>
                )}

                {/* Review Notes */}
                {selectedOrg.reviewNotes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-amber-900 mb-2">
                      Review Notes
                    </h3>
                    <p className="text-amber-800 text-sm">
                      {selectedOrg.reviewNotes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                {(selectedOrg.submittedAt ||
                  selectedOrg.createdAt ||
                  selectedOrg.updatedAt) && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {selectedOrg.submittedAt && (
                        <span>
                          Submitted:{" "}
                          {new Date(
                            selectedOrg.submittedAt.seconds * 1000
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {selectedOrg.updatedAt && (
                        <>
                          <span>•</span>
                          <span>
                            Updated:{" "}
                            {new Date(
                              selectedOrg.updatedAt.seconds * 1000
                            ).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSOManagement;
